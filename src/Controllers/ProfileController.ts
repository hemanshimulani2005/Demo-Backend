// src/Controllers/ProfileController.ts
import { Response } from "express";
import User, { IUser } from "../models/user";
import { updateProfileSchema } from "../Validations/ProfileValidation";
import { AuthRequest } from "../Middleware/AuthMiddleware";

export const UpdateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const updateData: Partial<IUser> = { ...value };

    if (value.areaOfInterest && !Array.isArray(value.areaOfInterest)) {
      updateData.areaOfInterest = [value.areaOfInterest];
    }

    // Handle avatar upload
    if (req.file) {
      updateData.avatar = req.file.filename; // store only filename
      updateData.avatarType = req.file.mimetype; // optional
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("UpdateProfile error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const GetProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(req.user.userId).select(
      "-password -resetCode -resetCodeExpiry"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Construct full avatar URL
    const avatarUrl = user.avatar
      ? `${req.protocol}://${req.get("host")}/uploads/${user.avatar}`
      : null;

    return res.status(200).json({
      user: {
        ...user.toObject(),
        avatar: avatarUrl,
      },
    });
  } catch (err) {
    console.error("GetProfile error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
