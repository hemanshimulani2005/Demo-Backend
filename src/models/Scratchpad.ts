// src/models/Scratchpad.ts
import { Schema, model, Document, Types } from "mongoose";

// 1. Comment interface
export interface IComment {
  comment_user_id: string;
  comment: string;
  created_at?: Date;
}

// 2. Vote interface for upvotes/downvotes
export interface IVote {
  userId: string;
  createdAt?: Date;
  action?: string;
}

// 3. Scratchpad document interface
export interface IScratchpad extends Document {
  userId?: string;
  scratchpad_id?: string;
  message_id?: string;
  thread_id?: string;
  comments: IComment[];
  upvotes: IVote[];
  downvotes: IVote[];
  created_at?: Date;
  updated_at?: Date;
}

// 4. Comment schema
const CommentSchema = new Schema<IComment>(
  {
    comment_user_id: { type: String, required: true, ref: "User" },
    comment: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

// 5. Vote schema
const VoteSchema = new Schema<IVote>(
  {
    userId: { type: String, ref: "User" },
    createdAt: { type: Date, default: Date.now },
    action: { type: String },
  },
  { _id: false }
);

// 6. Scratchpad schema
const ScratchpadSchema = new Schema<IScratchpad>({
  userId: { type: String },
  scratchpad_id: { type: String },
  message_id: { type: String },
  thread_id: { type: String },
  comments: [CommentSchema],
  upvotes: [VoteSchema],
  downvotes: [VoteSchema],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// 7. Export model
const Scratchpad = model<IScratchpad>("Scratchpad", ScratchpadSchema);
export default Scratchpad;
