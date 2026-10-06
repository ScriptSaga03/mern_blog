// DOTENV CONFIG
import dotenv from 'dotenv';
dotenv.config();

// IMPORT NPM FILES 
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { centralizedErrorHandler } from './middleware/errorHandler.js';
import { pageNotFound } from './middleware/unmatchedRouteHandler.js';


// IMPORT FILES


// CREATE EXPRESS APP
const app = express();

// GLOBAL LEVEL MIDDLEWARE
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(morgan("dev"));

// APPLICATION LEVEL MIDDLEWARE
// ROUTING 
// HEALTH CHECK 
app.get("/", (req, res)=>{
    return res.status(200).send(`<h1> Express server is working. </h1>`)
})
// AUTH ROUTES
// BLOG ROUTES


// PAGE NOT FOUND -> UNMATCHED ROUTE HANDLER
app.use(pageNotFound);


// CENTRALIZED ERROR HANDLER
app.use(centralizedErrorHandler)

// DEFINE PORT
const PORT = process.env.PORT || 3000;

// CREATE SERVER 
const server = async() => {
    try {
        app.listen(PORT ,() => {
            console.log(`🚀 Express server is running on PORT: http://localhost:${PORT}`,)
        })
    } catch (error) {
        console.error(`Failed to start server :${error.message}`);
        process.exit(1)
    }
}

// START SERVER
server()


