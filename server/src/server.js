import dotenv from "dotenv";
// DOTENV CONFIG
dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";
import { validateEnv } from "./config/validateEnv.js";

// DEFINE PORT
const PORT = process.env.PORT || 3000;

// CREATE SERVER
const server = async () => {
  try {
    // Validate configuration before connecting to MongoDB
    validateEnv();

    await connectDB();

    app.listen(PORT, () => {
      console.log(
        `🚀 Express server is running on PORT: http://localhost:${PORT}`,
      );
    });
  } catch (error) {
    console.error(`❌ Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

// RUN SERVER
server();
