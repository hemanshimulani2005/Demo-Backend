// src/utils/botMessage.ts
import mongoose, { Types } from "mongoose";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";
// import cssrslists from "../../models/CssrsList";
// import phqYList from "../../models/PhqYList";
import promptText from "../../models/PromptText";

import { promptMessage, getOrCreateVectorStore } from "./PromptMassage";
// import { getAvatarInfo } from "./getAvatarInfo";

import dotenv from "dotenv";
dotenv.config();

// Types
interface IUser {
  user_type?: string;
  country?: string;
}

interface IResponseType {
  formQuestion?: any;
  result?: any;
}

interface ICategories {
  tone?: string;
  issuecategory?: string;
  emotionalstate?: string;
  urgency?: string;
  monitoringState?: string;
  notes?: string[];
}

interface IResponseData {
  scratchpad: {
    scratchpad_id: string;
    scratchpadText: string;
  };
  response: {
    mainContent: string;
    followup_questions?: any[];
  };
  // categories: ICategories;
}

// Initialize Anthropic client
const initializeAnthropicClient = (): Anthropic => {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY must be set in environment variables");
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
};

// Initialize OpenAI client
const initializeOpenAiClient = (): OpenAI => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY must be set in environment variables");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

const openai = initializeOpenAiClient();
const anthropic = initializeAnthropicClient();

let currentVectorStoreId: string | null;
(async () => {
  currentVectorStoreId = await getOrCreateVectorStore();
})();

// Determine triggered assessments
// const determineTriggeredAssessments = (
//   emotionalState: string,
//   urgency: string,
//   responseType: IResponseType
// ) => {
//   if (Object.keys(responseType).length === 0) {
//     return {
//       isCSSRSTrigger:
//         (emotionalState === "Self-Harm" || emotionalState === "Self Harm") &&
//         urgency === "Imminent",
//       isPHQYTrigger:
//         (urgency === "High" && emotionalState === "Self-Harm") ||
//         (urgency === "High" &&
//           ["Depression", "Anxiety", "Depression/Anxiety"].includes(
//             emotionalState
//           )),
//     };
//   }

//   console.error(
//     "Error in determineTriggeredAssessments: responseType is not empty"
//   );
//   return { isCSSRSTrigger: false, isPHQYTrigger: false };
// };

// Parse response data from raw string
// const parseResponseData = (rawText: string): IResponseData => {
//   const rawJSON = JSON.parse(rawText.replace("```json", "").replace("```", ""));

//   return {
//     scratchpad: {
//       scratchpad_id: uuidv4(),
//       scratchpadText: rawJSON?.scratchpadText?.trim() || "",
//     },
//     response: {
//       mainContent: rawJSON?.response?.trim() || "",
//       followup_questions: rawJSON?.followupQuestions,
//     },
//     categories: {
//       tone: rawJSON?.categories?.tone || "Neutral",
//       issuecategory: rawJSON?.categories?.issueCategory || "unknown",
//       emotionalstate: rawJSON?.categories?.emotionalState || "Others",
//       urgency: rawJSON?.categories?.urgency || "Low",
//       monitoringState: rawJSON?.categories?.monitoringState || "Low",
//     },
//   };
// };
// Parse response data from raw string
const parseResponseData = (rawText: string): IResponseData => {
  const rawJSON = JSON.parse(rawText.replace("```json", "").replace("```", ""));

  // Ensure response is always a string
  let mainContent = "";
  if (typeof rawJSON?.response === "string") {
    mainContent = rawJSON.response.trim();
  } else if (rawJSON?.response?.mainContent) {
    mainContent = String(rawJSON.response.mainContent).trim();
  }

  return {
    scratchpad: {
      scratchpad_id: uuidv4(),
      scratchpadText: (rawJSON?.scratchpadText || "").toString().trim(),
    },
    response: {
      mainContent,
      followup_questions:
        rawJSON?.response?.followupQuestions ||
        rawJSON?.followupQuestions ||
        [],
    },
    // categories: {
    //   tone: rawJSON?.categories?.tone || "Neutral",
    //   issuecategory: rawJSON?.categories?.issueCategory || "unknown",
    //   emotionalstate: rawJSON?.categories?.emotionalState || "Others",
    //   urgency: rawJSON?.categories?.urgency || "Low",
    //   monitoringState: rawJSON?.categories?.monitoringState || "Low",
    //   notes: rawJSON?.categories?.notes || [],
    // },
  };
};

// Check CSSR/PHQY triggers
// const check_CSSR_PHQY = async (
//   responseData: IResponseData,
//   responseType: IResponseType,
//   threadId: string,
//   userId: string,
//   message_id: Types.ObjectId
// ) => {
//   const { isCSSRSTrigger, isPHQYTrigger } = determineTriggeredAssessments(
//     responseData.categories.emotionalstate!,
//     responseData.categories.urgency!,
//     responseType
//   );

//   const cssrs_id = uuidv4();
//   const PHQ_Y_id = uuidv4();

//   if (isCSSRSTrigger) {
//     await cssrslists.create({
//       userId,
//       thread_id: threadId,
//       cssrs_id,
//       message_id,
//       created_at: new Date(),
//     });
//   }

//   if (isPHQYTrigger) {
//     await phqYList.create({
//       userId,
//       thread_id: threadId,
//       PHQ_Y_id,
//       message_id,
//       created_at: new Date(),
//     });
//   }

//   return {
//     CSSRS: {
//       isCSSRS: isCSSRSTrigger,
//       ...(isCSSRSTrigger && { cssrs_id }),
//     },
//     PHQ_Y: {
//       isPHQY: isPHQYTrigger,
//       ...(isPHQYTrigger && { PHQ_Y_id }),
//     },
//   };
// };

// Create bot message
// const createBotMessage = async (
//   question: string,
//   users: IUser,
//   threadId: string,
//   filteredChats: any[],
//   userId: string,
//   mode: "test" | "live",
//   responseType: IResponseType,
//   answer: string | null,
//   avatar?: string,
//   ismodel: "claude" | "gpt" = "claude"
// ) => {
//   const message_id = new mongoose.Types.ObjectId();
//   let responseData: IResponseData;

//   try {
//     if (mode === "test" || mode === "live") {
//       const promptTextDoc = await promptText.findOne();
//       if (!promptTextDoc) throw new Error("Prompt text not found in database");

//       if (avatar) {
//         const avatarInfo = getAvatarInfo(avatar);
//         if (
//           typeof avatarInfo === "string" &&
//           avatarInfo.includes("Avatar not found")
//         ) {
//           throw new Error(avatarInfo);
//         }
//         promptTextDoc.prompt += " \n" + avatarInfo;
//       }

//       const prompts = await promptMessage(
//         question,
//         answer,
//         users,
//         responseType,
//         filteredChats,
//         ismodel === "claude"
//       );
//       let responseData: IResponseData | undefined;
//       if (ismodel === "claude") {
//         const message = await anthropic.messages.create({
//           model: "claude-sonnet-4-20250514",
//           max_tokens: 8192,
//           messages: prompts,
//           system: promptTextDoc.prompt,
//         });
//         responseData = parseResponseData(message.content[0].text);
//       } else {
//         const message = await openai.responses.create({
//           model: "gpt-4.1-mini",
//           instructions: promptTextDoc.prompt,
//           input: prompts,
//           tools: [
//             {
//               type: "file_search",
//               vector_store_ids: currentVectorStoreId
//                 ? [currentVectorStoreId]
//                 : [],
//             },
//           ],
//         });
//         responseData = parseResponseData(message.output_text);
//       }
//     }

//     const { CSSRS, PHQ_Y } = await check_CSSR_PHQY(
//       responseData,
//       responseType,
//       threadId,
//       userId,
//       message_id
//     );

//     return {
//       response: responseData.response?.mainContent || "",
//       followup_questions: responseData.response?.followup_questions || [],
//       avatar,
//       type: "bot",
//       _id: message_id,
//       scratchpad: {
//         scratchpad_id: responseData.scratchpad?.scratchpad_id || "",
//         scratchpadText: responseData.scratchpad?.scratchpadText || "",
//       },
//       CSSRS,
//       PHQ_Y,
//       categories: {
//         counselor_notes: responseData.categories?.notes || [],
//         tone: responseData.categories?.tone || "",
//         urgency_level: responseData.categories?.urgency || "",
//         monitoring_state: responseData.categories?.monitoringState || "",
//         emotional_state: responseData.categories?.emotionalstate || "",
//         issueCategory: responseData.categories?.issuecategory || "unknown",
//       },
//     };
//   } catch (error) {
//     console.error("Error in createBotMessage:", error);
//     throw error;
//   }
// };

const createBotMessage = async (
  question: string,
  users: IUser,
  threadId: string,
  filteredChats: any[],
  userId: string,
  mode: "test" | "live",
  responseType: IResponseType,
  answer: string | null,
  avatar?: string,
  ismodel: "claude" | "gpt" = "claude"
) => {
  const message_id = new mongoose.Types.ObjectId();
  let responseData: IResponseData | undefined; // declare only once

  try {
    const promptTextDoc = await promptText.findOne();
    if (!promptTextDoc) throw new Error("Prompt text not found in database");

    // if (avatar) {
    //   const avatarInfo = getAvatarInfo(avatar);
    //   if (
    //     typeof avatarInfo === "string" &&
    //     avatarInfo.includes("Avatar not found")
    //   ) {
    //     throw new Error(avatarInfo);
    //   }
    //   promptTextDoc.prompt += " \n" + avatarInfo;
    // }

    const prompts = await promptMessage(
      question,
      answer,
      users,
      responseType,
      filteredChats,
      ismodel === "claude"
    );

    if (ismodel === "claude") {
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8192,
        messages: prompts,
        system: promptTextDoc.prompt,
      });
      // Use the correct property for the returned message content
      responseData = parseResponseData(
        Array.isArray(message.content)
          ? message.content
              .map((block: any) =>
                block.text || block.type === "text" ? block.text : ""
              )
              .join("")
          : (message.content as any)?.text || ""
      );
    } else {
      if (!currentVectorStoreId)
        throw new Error("Vector store ID is not ready.");
      const message = await openai.responses.create({
        model: "gpt-5",
        instructions: promptTextDoc.prompt,
        input: prompts,
        tools: [
          {
            type: "file_search",
            vector_store_ids: [currentVectorStoreId],
          },
        ],
      });
      responseData = parseResponseData(message.output_text);
    }

    // Assert non-null before using
    if (!responseData)
      throw new Error("Failed to get response data from model");

    // const { CSSRS, PHQ_Y } = await check_CSSR_PHQY(
    //   responseData,
    //   responseType,
    //   threadId,
    //   userId,
    //   message_id
    // );

    return {
      response: responseData.response.mainContent,
      followup_questions: responseData.response.followup_questions || [],
      avatar,
      type: "bot",
      _id: message_id,
      scratchpad: {
        scratchpad_id: responseData.scratchpad.scratchpad_id,
        scratchpadText: responseData.scratchpad.scratchpadText,
      },
      // CSSRS,
      // PHQ_Y,
      // categories: {
      //   counselor_notes: responseData.categories.notes || [],
      //   tone: responseData.categories.tone || "",
      //   urgency_level: responseData.categories.urgency || "",
      //   monitoring_state: responseData.categories.monitoringState || "",
      //   emotional_state: responseData.categories.emotionalstate || "",
      //   issueCategory: responseData.categories.issuecategory || "unknown",
      // },
    };
  } catch (error) {
    console.error("Error in createBotMessage:", error);
    throw error;
  }
};

export { createBotMessage, parseResponseData };
//  check_CSSR_PHQY };
