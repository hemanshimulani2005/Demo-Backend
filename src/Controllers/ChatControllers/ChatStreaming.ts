// src/controllers/chatStreaming.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import OpenAI from "openai";

import Chat from "../../models/Chat";
import Scratchpad from "../../models/Scratchpad";
import User from "../../models/user";
import promptText from "../../models/PromptText";

import { validateChatRequest } from "../../Validations/ChatValidation";
import { getAvatarInfo } from "./getAvatarInfo";
import { promptMessage, getOrCreateVectorStore } from "./PromptMassage";
import { parseResponseData, check_CSSR_PHQY } from "./CreateBotMessage";

import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let currentVectorStoreId: string | null;
(async () => {
  currentVectorStoreId = await getOrCreateVectorStore();
})();

// Define request body type
interface IChatRequestBody {
  userId: string;
  threadId: string;
  avatar?: string;
  question?: string;
  answer?: string;
  regenerate?: boolean;
  is_scratchpad?: boolean;
  responseType: Record<string, any>;
  mode?: string;
}

export const chatStreaming = async (
  req: Request<{}, {}, IChatRequestBody>,
  res: Response
) => {
  try {
    const { error } = validateChatRequest(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const {
      userId,
      threadId,
      avatar,
      question,
      answer,
      regenerate = false,
      is_scratchpad = false,
      responseType,
      mode: rawMode,
    } = req.body;

    const mode = rawMode?.toLowerCase();

    if (
      !responseType ||
      (Object.keys(responseType).length === 0 && !question)
    ) {
      return res.status(400).json({ error: "Question is required." });
    }

    const [users, chat] = await Promise.all([
      User.findOne({ user_id: userId }),
      Chat.findOne({ thread_id: threadId }),
    ]);

    if (!users || !chat)
      return res.status(400).json({ error: "Invalid user ID or thread ID." });

    const userMessage = {
      message: question,
      avatar,
      type: "user",
      _id: new mongoose.Types.ObjectId(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    const filteredChats = chat.chats
      .flatMap((chatItem) =>
        chatItem.type === "user" || chatItem.type === "bot"
          ? {
              role: chatItem.type,
              content:
                chatItem.type === "user" ? chatItem.message : chatItem.response,
            }
          : []
      )
      .slice(-8);

    const promptTextDoc = await promptText.findOne();
    if (!promptTextDoc) throw new Error("Prompt text not found in database");

    if (avatar) {
      const avatarInfo = getAvatarInfo(avatar);
      if (avatarInfo.includes("Avatar not found")) throw new Error(avatarInfo);
      promptTextDoc.prompt += " \n" + avatarInfo;
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    const prompts = await promptMessage(
      question!,
      answer!,
      users,
      responseType,
      filteredChats,
      false
    );

    let fullResponse = "";
    let responseText = "";

    const stream = await openai.responses.create({
      model: "gpt-4.1",
      input: prompts,
      instructions: promptTextDoc.prompt,
      tools: [
        {
          type: "file_search",
          vector_store_ids: [currentVectorStoreId!],
        },
      ],
      stream: true,
    });

    for await (const event of stream as any) {
      switch (event.type) {
        case "response.output_text.delta": {
          const text = event.delta as string;
          fullResponse += text;

          const responseMatch = fullResponse.match(
            /"response"\s*:\s*"([^"]*)"/
          );
          if (responseMatch) {
            const currentResponseText = responseMatch[1];
            if (currentResponseText.length > responseText.length) {
              const newText = currentResponseText.substring(
                responseText.length
              );
              res.write(
                `data: ${JSON.stringify({
                  type: "text",
                  content: newText.replace(/\\n/g, "\n").replace(/\\"/g, '"'),
                })}\n\n`
              );
              responseText = currentResponseText;
            }
          }
          break;
        }

        case "response.completed": {
          const completedText = (event?.response?.output[0]?.content[0]?.text ||
            "") as string;
          const responseData = parseResponseData(completedText);

          const message_id = new mongoose.Types.ObjectId();
          const { CSSRS, PHQ_Y } = await check_CSSR_PHQY(
            responseData,
            responseType,
            threadId,
            userId,
            message_id
          );

          const botMessage = {
            response: responseData.response?.mainContent || "",
            followup_questions: responseData.response?.followup_questions || [],
            avatar,
            type: "bot",
            _id: message_id,
            scratchpad: {
              scratchpad_id: responseData.scratchpad?.scratchpad_id || "",
              scratchpadText: responseData.scratchpad?.scratchpadText || "",
            },
            CSSRS,
            PHQ_Y,
            categories: {
              counselor_notes: responseData.categories?.notes || [],
              tone: responseData.categories?.tone || "",
              urgency_level: responseData.categories?.urgency || "",
              monitoring_state: responseData.categories?.monitoringState || "",
              emotional_state: responseData.categories?.emotionalstate || "",
              issueCategory:
                responseData.categories?.issuecategory || "unknown",
            },
          };

          const scratchpad = {
            userId,
            thread_id: threadId,
            scratchpad_id: botMessage.scratchpad?.scratchpad_id,
            message_id: botMessage._id,
            created_at: new Date(),
          };
          await Scratchpad.create(scratchpad);

          if (Object.keys(responseType).length !== 0 || regenerate) {
            chat.chats.push(botMessage as any);
          } else {
            chat.chats.push(userMessage as any, botMessage as any);
          }

          chat.mode = mode;
          await chat.save();
          await User.findOneAndUpdate(
            { user_id: userId },
            { $set: { updated_at: new Date() } }
          );

          res.write(
            `data: ${JSON.stringify({ type: "end", content: botMessage })}\n\n`
          );
          res.end();
          console.log("Stream ended successfully.");
          break;
        }

        case "response.failed": {
          console.error("API stream error:", event.response.error.message);
          res.write(
            `data: ${JSON.stringify({
              type: "error",
              content:
                event.response.error.message ||
                "An error occurred during streaming.",
            })}\n\n`
          );
          res.end();
          break;
        }

        default:
          break;
      }
    }
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      error: "Failed to process chat message.",
      details: error?.message || error,
    });
  }
};
