// src/routes/AuthRoutes.ts
import { Router } from "express";
import { UpdateProfile, GetProfile } from "../Controllers/ProfileController";
import { upload } from "../utils/AvatarUpload";
import { authMiddleware } from "../Middleware/AuthMiddleware";

const router = Router();

// Protected routes
router.post(
  "/update-profile",
  authMiddleware,
  upload.single("avatar"),
  UpdateProfile
);
router.get("/get-profile", authMiddleware, GetProfile);

export default router;
