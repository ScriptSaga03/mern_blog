

const AppError = (statusCode = 500, msg = "Something went wrong...") => {
    const err = new Error(msg);
    err.statusCode = statusCode;
    err.status = statusCode >=400 && statusCode< 500 ? "Fail" :"Error";
    return err;
}

export default AppError;