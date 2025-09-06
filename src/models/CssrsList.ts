// src/models/cssrsList.ts
import { Schema, model, Document } from "mongoose";

// 1. Interface for CSSRS list document
export interface ICSSRSList extends Document {
  userId?: string;
  thread_id?: string;
  cssrs_id?: string;
  formName?: string;
  formQuestion?: Record<string, any>[];
  result?: string;
  created_at?: Date;
  updated_at?: Date;
}

// 2. Schema definition
const cssrsListSchema = new Schema<ICSSRSList>(
  {
    userId: { type: String },
    thread_id: { type: String },
    cssrs_id: { type: String },
    formName: { type: String },
    formQuestion: { type: [Object], default: [] },
    result: { type: String },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// 3. Export the model
const CSSRSList = model<ICSSRSList>("cssrslist", cssrsListSchema);
export default CSSRSList;
