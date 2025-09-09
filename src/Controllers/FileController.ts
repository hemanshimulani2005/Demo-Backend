import { Response } from "express";
import { AuthRequest } from "../Middleware/AuthMiddleware";
import File from "../models/File";
import fs from "fs";
import mongoose from "mongoose";

export const uploadFiles = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const uploadedFiles = [];

    for (const file of req.files as Express.Multer.File[]) {
      // Check if file already exists for this user
      const existingFile = await File.findOne({
        userId: req.user.userId,
        originalName: file.originalname,
        size: file.size,
      });

      if (existingFile) {
        // Delete the new file from disk since it's a duplicate
        fs.unlinkSync(file.path);
        return res.status(400).json({
          message: `File "${file.originalname}" already exists.`,
        });
      }

      const newFile = new File({
        userId: req.user.userId,
        originalName: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
      });

      await newFile.save();

      uploadedFiles.push({
        ...newFile.toObject(),
        url: `${req.protocol}://${req.get("host")}/fileupload/${file.filename}`,
      });
    }

    return res.status(201).json({
      message: "Files uploaded successfully",
      files: uploadedFiles,
    });
  } catch (err) {
    console.error("UploadFiles error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const GetUserFiles = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const files = await File.find({ userId: req.user.userId }).sort({
      uploadedAt: -1,
    });

    const filesWithUrls = files.map((file) => ({
      ...file.toObject(),
      url: `${req.protocol}://${req.get("host")}/fileuploads/${file.filename}`,
    }));

    return res.status(200).json({ files: filesWithUrls });
  } catch (err) {
    console.error("GetUserFiles error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// src/Controllers/FileController.ts
export const deleteFile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    // console.log("Received file ID:", id);
    // console.log("ID length:", id.length);
    // console.log("User ID:", req.user.userId);

    // More lenient approach - let MongoDB handle the ObjectId validation
    try {
      const file = await File.findOne({
        _id: id,
        userId: req.user.userId,
      });

      if (!file) {
        // Try to find the file without userId restriction for debugging
        const fileWithoutUser = await File.findById(id);
        if (fileWithoutUser) {
          // console.log("File exists but belongs to different user");
          // console.log("File userId:", fileWithoutUser.userId);
          // console.log("Request userId:", req.user.userId);
          return res.status(403).json({
            message: "Access denied - file belongs to different user",
          });
        }
        return res.status(404).json({ message: "File not found" });
      }

      // Delete file from disk if it exists
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      // Delete from DB
      await File.findByIdAndDelete(id);

      return res.status(200).json({ message: "File deleted successfully" });
    } catch (mongoError: any) {
      if (mongoError.name === "CastError") {
        return res.status(400).json({ message: "Invalid file ID format" });
      }
      throw mongoError;
    }
  } catch (err) {
    console.error("DeleteFile error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
