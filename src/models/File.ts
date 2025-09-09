// src/models/File.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IFile extends Document {
  userId: mongoose.Types.ObjectId; // who uploaded the file
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  path: string;
  uploadedAt: Date;
}

const FileSchema: Schema = new Schema<IFile>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  originalName: { type: String, required: true },
  filename: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  path: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IFile>("File", FileSchema);
