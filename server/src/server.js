import dotenv from "dotenv";
import app from './app.js'
import connectDB from "./config/db.js";

// DOTENV CONFIG
dotenv.config();


// DEFINE PORT 
const PORT = process.env.PORT || 3000;

// CREATE SERVER
const server = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(
                `🚀 Express server is running on PORT: http://localhost:${PORT}`
            );
        });
    } catch (error) {
        console.error(`❌ Failed to start server: ${error.message}`);
        process.exit(1);
    }
};


// RUN SERVER
server();