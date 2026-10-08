import AppError from "../utils/AppError.js";



const authorizedRole = (...allowedRoles) => (req, res, next) => {

        // 1 AUTHENTICATION CHECK 
        if(!req.user){
            return next(AppError(401, "❌ Authentication required! Please login first."));
        }

        // 2 ROLE AUTHORIZATION CHECK
        if(!allowedRoles.includes(req.user.role)){
            return next(AppError(403, "🚫 Access denied! You don't have permission for this action."));
        }
        return next();
}

export default authorizedRole; 