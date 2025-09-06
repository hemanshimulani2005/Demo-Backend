// src/models/user.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: string;
  industry?: string;
  areaOfInterest?: string[];
  avatar?: string;
  avatarType?: string; // URL or path to profile picture
  resetCode?: string;
  resetCodeExpiry?: number;
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  phone: { type: String },
  role: { type: String },
  industry: { type: String },
  areaOfInterest: { type: [String] },
  // avatar: { type: Buffer },
  avatar: { type: String },
  avatarType: { type: String },
  resetCode: { type: String },
  resetCodeExpiry: { type: Number },
});

const User = mongoose.model<IUser>("User", userSchema);
export default User;
