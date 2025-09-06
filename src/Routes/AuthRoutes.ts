// src/routes/AuthRoutes.ts
import { Router } from "express";
import {
  loginOrSignUp,
  forgotPassword,
  resetPassword,
} from "../Controllers/AuthController";

const router = Router();

router.post("/loginOrSignUp", loginOrSignUp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
