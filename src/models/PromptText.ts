// src/models/PromptText.ts
import { Schema, model, Document } from "mongoose";

// 1. Define an interface representing a document in MongoDB
export interface IPromptText extends Document {
  prompt?: string;
  created_at?: Date;
  updated_at?: Date;
}

// 2. Create the schema
const promptTextSchema = new Schema<IPromptText>(
  {
    prompt: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// 3. Export the model
const PromptText = model<IPromptText>("PromptText", promptTextSchema);
export default PromptText;
