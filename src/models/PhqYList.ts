// src/models/phqYList.ts
import { Schema, model, Document } from "mongoose";

// 1. Interface for PHQ-Y list document
export interface IPHQYList extends Document {
  userId?: string;
  thread_id?: string;
  PHQ_Y_id?: string;
  formName?: string;
  formQuestion: Record<string, any>[];
  result?: string;
  created_at?: Date;
  updated_at?: Date;
}

// 2. Schema definition
const phqYListSchema = new Schema<IPHQYList>(
  {
    userId: { type: String },
    thread_id: { type: String },
    PHQ_Y_id: { type: String },
    formName: { type: String },
    formQuestion: { type: [Object], default: [] },
    result: { type: String },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// 3. Export the model
const PHQYList = model<IPHQYList>("phqYlist", phqYListSchema);
export default PHQYList;
