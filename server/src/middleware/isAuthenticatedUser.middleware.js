


import jwt from 'jsonwebtoken';
import AppError from "../utils/AppError.js";
import User from '../model/user.model.js';





export const isAuthenticatedUser = async (req, res, next) => {

    try {
        
        const authHeader = req.headers.authorization;
        // 1 MISSING HEADER GUARD
        if(!authHeader){
            return next(AppError(401, "Please login to access this resource!"))
        }
        // 2 CHECK BEARER PREFIX
        if(!authHeader.startsWith("Bearer ")){
            return next(AppError(401, "Invalid token format!"))
        }
        // 3 EXTRACT TOKEN
        const token = authHeader.split(" ")[1];
       
        if(!token || token.trim() === ""){
            return next(AppError(401, "Token Missing!"))
        }
        // 4 VERIFY TOKEN SIGNATURE
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        
        // 5 FETCH DOCUMENT
        const user = await User.findById(decoded.id).lean()
    
        // 6 EXISTENCE GUARD 
        if(!user){
            return next(AppError(401, "User no longer exists!"))
        }
        // 7 ATTACH FULL USER TO OBJ 
        req.user = user;

        // 8 MOVE TO NEXT MIDDLEWARE
        return next()
    } catch (error) {

        if (error.name === 'TokenExpiredError') {
            return next(AppError(401, "⏰ Session expired! Please login again."));
        }
        if (error.name === 'JsonWebTokenError') {
            return next(AppError(401, "❌ Invalid token! Please login again."));
        }
        
        return next(error);
    }
}
