import { Schema, model, Document, Types } from "mongoose";

// ------------------- Comment SubSchema -------------------
interface IComment {
  comment_user_id: string | Types.ObjectId;
  comment: string;
  created_at?: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    comment_user_id: {
      type: String,
      required: true,
      ref: "User",
    },
    comment: {
      type: String,
      required: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// ------------------- Chat Subdocument -------------------
interface IScratchpad {
  scratchpad_id?: string;
  scratchpadText?: string;
}

interface ICategories {
  counselor_notes: string[];
  tone?: string;
  urgency_level?: string;
  monitoring_state?: string;
  emotional_state?: string;
  issueCategory?: string;
}

interface IUpvote {
  userId: string | Types.ObjectId;
  createdAt?: Date;
  action?: string;
}

interface IDownvote {
  userId: string | Types.ObjectId;
  createdAt?: Date;
  action?: string;
}

interface IFeedback {
  userId: string | Types.ObjectId;
  feedback?: string;
  reason?: string;
  mode?: string;
  createdAt?: Date;
}

// interface ICSSRS {
//   isCSSRS: boolean;
//   cssrs_id?: string;
// }

// interface IPHQY {
//   isPHQY: boolean;
//   PHQ_Y_id?: string;
// }

export interface IChatMessage {
  _id: Types.ObjectId;
  message?: string;
  avatar?: string | null;
  type: string;
  overview?: string;
  comments: IComment[];
  new_thread: boolean;
  category?: string;
  response?: string;
  followup_questions: string[];
  scratchpad?: IScratchpad;
  categories?: ICategories;
  upvotes: IUpvote[];
  downvotes: IDownvote[];
  feedback: IFeedback[];
  created_at?: Date;
  updated_at?: Date;

  // CSSRS?: ICSSRS;
  // PHQ_Y?: IPHQY;
}

// ------------------- Chat Schema -------------------
export interface IChat extends Document {
  userId: string | Types.ObjectId;
  category?: string;
  title?: string;
  thread_id?: string;
  phq_count: number;
  risk_type?: string;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  cssrs_count: number;
  mode?: string;
  chats: IChatMessage[];
  depression_severity?: string;
  created_at?: Date;
  updated_at?: Date;
}

const ChatSchema = new Schema<IChat>(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    // category: { type: String },
    title: { type: String },
    thread_id: { type: String },
    // phq_count: { type: Number, default: 0 },
    // risk_type: { type: String },
    // positive_count: { type: Number, default: 0 },
    // negative_count: { type: Number, default: 0 },
    // neutral_count: { type: Number, default: 0 },
    // cssrs_count: { type: Number, default: 0 },
    mode: { type: String },
    chats: [
      {
        message: { type: String },
        // avatar: { type: String, default: null },
        type: { type: String, required: true },
        overview: { type: String },
        comments: [CommentSchema],
        new_thread: { type: Boolean, default: false },
        // category: { type: String },
        response: { type: String },
        followup_questions: { type: [String], default: [] },
        scratchpad: {
          scratchpad_id: { type: String },
          scratchpadText: { type: String },
        },
        // categories: {
        //   counselor_notes: { type: [String], default: [] },
        //   tone: { type: String },
        //   urgency_level: { type: String },
        //   monitoring_state: { type: String },
        //   emotional_state: { type: String },
        //   issueCategory: { type: String },
        // },
        upvotes: [
          {
            userId: { type: String, ref: "User" },
            createdAt: { type: Date, default: Date.now },
            action: { type: String },
          },
        ],
        downvotes: [
          {
            userId: { type: String, ref: "User" },
            createdAt: { type: Date, default: Date.now },
            action: { type: String },
          },
        ],
        feedback: [
          {
            userId: { type: String, ref: "User" },
            feedback: { type: String },
            reason: { type: String },
            mode: { type: String },
            createdAt: { type: Date, default: Date.now },
          },
        ],
        action: {
          type: String,
          enum: ["upvote", "downvote"],
        },
        created_at: { type: Date, default: Date.now },
        updated_at: { type: Date, default: Date.now },
        // CSSRS: {
        //   isCSSRS: { type: Boolean, default: false },
        //   cssrs_id: { type: String },
        // },
        // PHQ_Y: {
        //   isPHQY: { type: Boolean, default: false },
        //   PHQ_Y_id: { type: String },
        // },
      },
    ],
    depression_severity: { type: String },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export default model<IChat>("Chat", ChatSchema);
