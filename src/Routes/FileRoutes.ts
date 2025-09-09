// src/routes/uploadRoutes.ts
import { Router } from "express";
import {
  uploadFiles,
  GetUserFiles,
  deleteFile,
} from "../Controllers/FileController";
import { upload } from "../utils/FileUpload";
import { authMiddleware } from "../Middleware/AuthMiddleware";

const router = Router();

// Multiple file upload
router.post(
  "/upload-file",
  upload.array("files", 10),
  authMiddleware,
  uploadFiles
);
router.get("/listfiles", authMiddleware, GetUserFiles);
router.delete("/deleteFile/:id", authMiddleware, deleteFile);

export default router;
