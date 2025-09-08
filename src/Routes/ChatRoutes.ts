import { Router } from "express";
import {
  CreateTitle,
  getThreadList,
  getChatHistory,
} from "../Controllers/ChatControllers/Chat";
import { chatStreaming } from "../Controllers/ChatControllers/ChatStreaming";
import { authMiddleware } from "../Middleware/AuthMiddleware";

const router = Router();

router.post("/ThreadTitle", authMiddleware, CreateTitle);
router.post("/getThreadList", authMiddleware, getThreadList);
router.post("/chatStreaming", authMiddleware, chatStreaming);
router.post("/getChatHistory/:threadId", authMiddleware, getChatHistory);

export default router;
