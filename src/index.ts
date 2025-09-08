// src/server.ts
import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors, { CorsOptions } from "cors";
import connectDB from "./utils/db/mongoose";
import AuthRoute from "./Routes/AuthRoutes";
import ProfileRoute from "./Routes/ProfileRoutes";
import ChatRoute from "./Routes/ChatRoutes";
import path from "path";

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware to parse JSON
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// CORS setup
const origins = process.env.origin?.split(",") || [];
const corsOptions: CorsOptions = {
  origin: origins,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));

// Routes
app.use("/auth", AuthRoute);
app.use("/profile", ProfileRoute);
app.use("/chat", ChatRoute);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
