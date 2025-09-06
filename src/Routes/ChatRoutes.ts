import { Router } from "express";
import {
  CreateTitle,
  getThreadList,
} from "../Controllers/ChatControllers/Chat";
import { authMiddleware } from "../Middleware/AuthMiddleware";

const router = Router();

router.post("/ThreadTitle", authMiddleware, CreateTitle);
router.post("/getThreadList", authMiddleware, getThreadList);
// router.post("/chatStreaming", authMiddleware, chatStreaming);

export default router;
