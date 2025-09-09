import { Router } from "express";
import {
  CreateTitle,
  getThreadList,
  getChatHistory,
  addVote,
} from "../Controllers/ChatControllers/Chat";
import { chatStreaming } from "../Controllers/ChatControllers/ChatStreaming";
import { authMiddleware } from "../Middleware/AuthMiddleware";

const router = Router();

router.post("/ThreadTitle", authMiddleware, CreateTitle);
router.post("/getThreadList", authMiddleware, getThreadList);
router.post("/chatStreaming", authMiddleware, chatStreaming);
router.post("/getChatHistory/:threadId", authMiddleware, getChatHistory);
router.post("/addVote", authMiddleware, addVote);

export default router;
