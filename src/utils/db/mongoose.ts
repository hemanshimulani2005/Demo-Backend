// src/utils/db/mongoose.ts
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.LOCAL_DB;
    if (!mongoUri) {
      throw new Error("LOCAL_DB is not defined in environment variables");
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1); // optional: exit process if DB connection fails
  }
};

export default connectDB;
