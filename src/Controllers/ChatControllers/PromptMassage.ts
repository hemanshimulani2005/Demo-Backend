// src/utils/openaiUtils.ts
import OpenAI from "openai";
import fs from "fs";
import path from "path";

// OpenAI client initialization
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// List of local files to include
const filePaths = [
  "src/utils/document/Micro and Macro skills attributed to counselling.txt",
  "src/utils/document/helpline_list.txt",
  "src/utils/document/Mental_Health_FAQ.pdf",
];

// Type for document to be sent to OpenAI
interface IOpenAIDocument {
  type: "document";
  source: {
    media_type: string;
    type: "text" | "base64";
    data: string;
  };
}

// Prepare documents from local files
const prepareDocuments = (): IOpenAIDocument[] => {
  return filePaths.map((file_path) => {
    const ext = path.extname(file_path).toLowerCase();
    const isTxt = ext === ".txt";

    const fileData = fs.readFileSync(file_path, {
      encoding: isTxt ? "utf8" : "base64",
    });

    return {
      type: "document",
      source: {
        media_type: isTxt ? "text/plain" : "application/pdf",
        type: isTxt ? "text" : "base64",
        data: isTxt
          ? `${path.basename(file_path)} File content :\n ${fileData}`
          : fileData,
      },
    };
  });
};

// Create or get existing vector store
export const getOrCreateVectorStore = async (): Promise<string | null> => {
  let vectorStoreId: string | null = null;

  const vectorStores = await openai.vectorStores.list();
  const existingStore = vectorStores.data.find(
    (store) => store.name === "mental-health"
  );

  if (existingStore) {
    vectorStoreId = existingStore.id;
    console.log(`Using existing Vector Store ID: ${vectorStoreId}`);
  } else {
    const newVectorStore = await openai.vectorStores.create({
      name: "mental-health",
      expires_after: {
        anchor: "last_active_at",
        days: 365, // Vector store will expire after 1 year of inactivity
      },
    });

    vectorStoreId = newVectorStore.id;

    // Upload files to the vector store
    await Promise.all(
      filePaths.map(async (localPath) => {
        const openaiFile = await openai.files.create({
          file: fs.createReadStream(localPath),
          purpose: "assistants",
        });

        await openai.vectorStores.files.create(vectorStoreId!, {
          file_id: openaiFile.id,
        });
      })
    );

    console.log(`New Vector Store created. ID: ${vectorStoreId}`);
  }

  return vectorStoreId;
};

// Types for the prompt function
interface IUser {
  user_type?: string;
  country?: string;
}

interface IResponseType {
  formQuestion?: any;
  result?: any;
}

// Prepare prompt message for OpenAI
export const promptMessage = (
  question: string,
  answer: string | null,
  users: any,
  responseType: IResponseType,
  filteredChats: any[],
  isClaude: boolean
): any[] => {
  const user_type = users?.user_type?.toLowerCase?.() || "";

  return [
    {
      role: "user",
      content: [
        ...(isClaude ? prepareDocuments() : []),
        {
          type: isClaude ? "text" : "input_text",
          text: `Student's Country is ${users?.country}.
Detect the language of the input and respond in that same language.

${
  user_type === "student"
    ? "The response to the student should be within 1 or 2 lines only with a conclusion.\n\n"
    : ""
}

Here is the student's query:
${
  Object.keys(responseType).length > 0
    ? `ANALYSIS TASK:
Analyze the following question, answer and provide structured analysis:
Context: ${JSON.stringify(responseType.formQuestion)} and result : ${
        responseType.result
      }`
    : answer
    ? `Student follow-up question='${question}' and follow-up answer='${answer}'. Based on the student follow-up question and answer give the response.`
    : `<student_query>
${question}
</student_query>`
}

Array of student conversation history = '${JSON.stringify(filteredChats)}'.`,
        },
      ],
    },
  ];
};
