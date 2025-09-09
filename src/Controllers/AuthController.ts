// src/controllers/AuthController.ts
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";
import User, { IUser } from "../models/user";
import { Types } from "mongoose";

interface JwtPayload {
  userId: string;
  email: string;
}

export const loginOrSignUp = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    let user = (await User.findOne({ email })) as IUser | null;
    let isNewUser = false;

    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = new User({ email, password: hashedPassword });
      await user.save();
      isNewUser = true;
    } else {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
    }

    const userId =
      user._id instanceof Types.ObjectId
        ? user._id.toString()
        : String(user._id);

    const token = jwt.sign(
      { userId, email: user.email },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      message: isNewUser
        ? "User signed up successfully"
        : "User signed in successfully",
      token,
    });
  } catch (error: unknown) {
    console.error("loginOrSignUp error:", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";

    return res.status(500).json({ message, error });
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = (await User.findOne({ email })) as IUser | null;
    if (!user) return res.status(404).json({ message: "User not found" });

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetCode = resetCode;
    user.resetCodeExpiry = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Code",
      text: `Your password reset code is: ${resetCode}`,
    });

    return res.status(200).json({ message: "Reset code sent to email" });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res
        .status(400)
        .json({ message: "Email, code, and new password are required" });
    }

    // Find user by email
    const user = (await User.findOne({ email })) as IUser | null;
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if code matches and is not expired
    if (user.resetCode !== code || Date.now() > (user.resetCodeExpiry || 0)) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }

    // Hash new password
    user.password = await bcrypt.hash(newPassword, 10);

    // Clear reset code and expiry
    user.resetCode = undefined;
    user.resetCodeExpiry = undefined;

    await user.save();

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const googleSignIn = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { tokenId } = req.body;

    if (!tokenId) {
      return res.status(400).json({ message: "Google token is required" });
    }
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ message: "Invalid Google token" });
    }

    const { email, name, picture } = payload;

    // Find user in DB
    let user = (await User.findOne({ email })) as IUser | null;
    let isNewUser = false;

    if (!user) {
      // Create user if not exists
      user = new User({
        email,
        // first_name: name?.split(" ")[0] || "",
        // last_name: name?.split(" ")[1] || "",
        // profile_avtar: picture,
        password: null, // Google users won’t have password
        authProvider: "google",
      });
      await user.save();
      isNewUser = true;
    }

    // Create JWT
    const userId =
      user._id instanceof Types.ObjectId
        ? user._id.toString()
        : String(user._id);

    const token = jwt.sign(
      { email: email },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      message: isNewUser
        ? "User signed up with Google successfully"
        : "User signed in with Google successfully",
      token,
    });
  } catch (error: any) {
    console.error("Google sign-in error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
