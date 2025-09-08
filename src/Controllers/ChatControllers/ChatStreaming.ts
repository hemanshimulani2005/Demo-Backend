import { Request, Response } from "express";
import mongoose from "mongoose";
import OpenAI from "openai";

import Chat from "../../models/Chat";
import User from "../../models/user";
import promptText from "../../models/PromptText";

import { validateChatRequest } from "../../Validations/ChatValidation";
import { promptMessage, getOrCreateVectorStore } from "./PromptMassage";
import { parseResponseData } from "./CreateBotMessage";
import { AuthRequest } from "../../Middleware/AuthMiddleware"; // 👈 use extended type

import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let currentVectorStoreId: string | null;
(async () => {
  currentVectorStoreId = await getOrCreateVectorStore();
})();

interface IChatRequestBody {
  threadId: string;
  question?: string;
  answer?: string;
  regenerate?: boolean;
  responseType: Record<string, any>;
  mode?: string;
}

export const chatStreaming = async (
  req: AuthRequest, // 👈 use AuthRequest
  res: Response
) => {
  try {
    const { error } = validateChatRequest(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const {
      threadId,
      question,
      answer,
      regenerate = false,
      responseType,
      mode: rawMode,
    } = req.body;

    // const userId = req.user.userId; // 👈 take from token
    // if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const mode = rawMode?.toLowerCase();

    if (
      !responseType ||
      (Object.keys(responseType).length === 0 && !question)
    ) {
      return res.status(400).json({ error: "Question is required." });
    }

    const [users, chat] = await Promise.all([
      User.findById(req.user!.userId), // ✅ use _id
      Chat.findOne({ thread_id: threadId }),
    ]);

    if (!users || !chat)
      return res.status(400).json({ error: "Invalid user ID or thread ID." });

    const userMessage = {
      message: question,
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
      .slice(-20);

    const promptTextDoc = await promptText.findOne();
    if (!promptTextDoc) throw new Error("Prompt text not found in database");

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
          const completedText =
            (event?.response?.output[0]?.content[0]?.text as string) || "";
          const responseData = parseResponseData(completedText);

          const message_id = new mongoose.Types.ObjectId();

          const botMessage = {
            response: responseData.response?.mainContent || "",
            followup_questions: responseData.response?.followup_questions || [],
            type: "bot",
            _id: message_id,
            categories: {
              tone: responseData.categories?.tone || "",
              urgency_level: responseData.categories?.urgency || "",
              monitoring_state: responseData.categories?.monitoringState || "",
              emotional_state: responseData.categories?.emotionalstate || "",
              issueCategory:
                responseData.categories?.issuecategory || "unknown",
            },
          };

          // if (Object.keys(responseType).length !== 0 || regenerate) {
          //   chat.chats.push(botMessage as any);
          // } else {
          //   chat.chats.push(userMessage as any, botMessage as any);
          // }

          // chat.mode = mode;
          // await chat.save();
          // await User.findOneAndUpdate(
          //   { user_id: req.user!.userId },
          //   { $set: { updated_at: new Date() } }
          // );
          // if (regenerate) {
          //   // Find the last bot message in the chat and replace it
          //   for (let i = chat.chats.length - 1; i >= 0; i--) {
          //     if (chat.chats[i].type === "bot") {
          //       chat.chats[i] = botMessage as any;
          //       break;
          //     }
          //   }
          // } else if (Object.keys(responseType).length !== 0) {
          //   chat.chats.push(botMessage as any);
          // } else {
          //   chat.chats.push(userMessage as any, botMessage as any);
          // }
          if (regenerate && req.body.botId) {
            // Replace the specific bot message
            const index = chat.chats.findIndex(
              (m) => m.type === "bot" && m._id.toString() === req.body.botId
            );
            if (index !== -1) {
              chat.chats[index] = botMessage as any;
            } else {
              // fallback: append if botId not found
              chat.chats.push(botMessage as any);
            }
          } else if (Object.keys(responseType).length !== 0) {
            // Only bot message (no new user message)
            chat.chats.push(botMessage as any);
          } else {
            // New user message + bot message
            chat.chats.push(userMessage as any, botMessage as any);
          }

          chat.mode = mode;
          await chat.save();
          await User.findOneAndUpdate(
            { user_id: req.user!.userId },
            { $set: { updated_at: new Date() } }
          );

          res.write(
            `data: ${JSON.stringify({ type: "end", content: botMessage })}\n\n`
          );
          res.end();
          break;
        }

        case "response.failed": {
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
      }
    }
  } catch (error: any) {
    console.error(error);

    if (res.headersSent) {
      // already streaming → send error as SSE
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          content: error?.message || "An error occurred.",
        })}\n\n`
      );
      res.end();
    } else {
      // normal error response
      res.status(500).json({
        error: "Failed to process chat message.",
        details: error?.message || error,
      });
    }
  }

  // } catch (error: any) {
  //   res.status(500).json({
  //     error: "Failed to process chat message.",
  //     details: error?.message || error,
  //   });
  // }
};
