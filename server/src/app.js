// IMPORT NPM FILES
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

// IMPORT MIDDLEWARE
import { centralizedErrorHandler } from "./middleware/errorHandler.js";
import { pageNotFound } from "./middleware/unmatchedRouteHandler.js";


// IMPORT FILES
import authRoutes from "./routes/auth.routes.js";

// CREATE EXPRESS APP
const app = express();

// GLOBAL LEVEL MIDDLEWARE
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// APPLICATION LEVEL MIDDLEWARE


// ROUTING
// HEALTH CHECK
app.get("/", (req, res) => {
  return res.status(200).send(`<h1> Express server is working. </h1>`);
});
// AUTH ROUTES
app.use("/api/v1/auth", authRoutes);
// BLOG ROUTES

// PAGE NOT FOUND -> UNMATCHED ROUTE HANDLER
app.use(pageNotFound);

// CENTRALIZED ERROR HANDLER
app.use(centralizedErrorHandler);



// EXPORT APP
export default app;
