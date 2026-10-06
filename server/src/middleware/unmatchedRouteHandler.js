


export const pageNotFound = (req, res, next) => {
    const err = new Error(`❌ Page not found ${req.originalUrl} on this server!`);
    err.statusCode = 404;
    next(err) 
}