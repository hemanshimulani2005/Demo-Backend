import { Response } from "express";
import OpenAI from "openai";
import mongoose from "mongoose";
import Chat from "../../models/Chat";
import User from "../../models/user";
import { validateCreateTitle } from "../../Validations/ChatValidation";
import { AuthRequest } from "../../Middleware/AuthMiddleware";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const CreateTitle = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { error } = validateCreateTitle(req.body);
  if (error) {
    res.status(400).json({ error: error.details[0].message });
    return;
  }

  const { title, category, mode } = req.body;
  const userId = req.user?.userId; // take from token

  if (!userId) {
    res.status(401).json({ error: "Unauthorized. User not found in token." });
    return;
  }

  try {
    // Create new OpenAI thread
    const thread = await openai.beta.threads.create();

    const newChat = new Chat({
      userId,
      category,
      thread_id: thread.id,
      title,
      chats: [],
      mode,
    });

    await newChat.save();

    res.status(200).json({
      message: "Thread created successfully.",
      userId,
      category,
      threadId: newChat.thread_id,
      created_at: newChat.created_at,
      updated_at: newChat.updated_at,
      title,
      mode,
    });
  } catch (err) {
    console.error("Error creating thread:", err);
    res.status(500).json({
      error: "Failed to create chat thread.",
    });
  }
};

export const getThreadList = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { page = 1, limit = 10, mode } = req.body;
  const userId = req.user?.userId;
  if (!mode) {
    res.status(400).json({ error: "Mode is required." });
    return;
  }
  if (!userId) {
    res.status(400).json({ error: "User ID is required." });
    return;
  }

  try {
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);

    if (isNaN(pageNumber) || pageNumber <= 0) {
      res.status(400).json({ error: "Invalid page number." });
      return;
    }
    if (isNaN(pageSize) || pageSize <= 0) {
      res.status(400).json({ error: "Invalid limit value." });
      return;
    }

    const skip = (pageNumber - 1) * pageSize;

    const userExists = await User.findById(userId);
    if (!userExists) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const threads = await Chat.aggregate([
      { $match: { userId: userId } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
      {
        $match: {
          $expr: {
            $or: [
              { $eq: ["$category", "$userDetails.mode"] },
              { $not: { $ifNull: ["$userDetails.mode", false] } },
            ],
          },
        },
      },
      { $sort: { created_at: -1 } },
      { $skip: skip },
      { $limit: pageSize },
      {
        $project: {
          threadId: "$thread_id",
          title: { $ifNull: ["$title", "Untitled"] },
          category: 1,
          created_at: 1,
          updated_at: 1,
        },
      },
    ]);

    const totalThreads = await Chat.countDocuments({ userId: userId });

    if (!threads.length) {
      res.status(200).json({
        threads: [],
        totalPages: 0,
        currentPage: pageNumber,
        pageSize,
        totalThreads: 0,
        message: "No threads found for this user.",
      });
      return;
    }
    const totalPages = Math.ceil(totalThreads / pageSize);

    if (pageNumber > totalPages) {
      res.status(404).json({
        error: "Page not found. Please check the page number.",
      });
      return;
    }

    res.status(200).json({
      threads,
      totalPages,
      currentPage: pageNumber,
      pageSize,
      totalThreads,
      message: "Fetched all threads successfully.",
    });
  } catch (err) {
    console.error("Failed to retrieve thread list:", err);
    res.status(500).json({
      error: "Failed to retrieve thread list.",
    });
  }
};
