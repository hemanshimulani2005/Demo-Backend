import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof Error && err.message === "Unsupported file type!") {
    return res.status(400).json({ error: err.message });
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "File size too large!" });
  }

  return res.status(500).json({ error: "Something went wrong" });
};
