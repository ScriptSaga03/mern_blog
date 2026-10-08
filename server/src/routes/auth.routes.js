

import express from 'express';
import { register, login, getMe, adminTest } from '../controllers/auth.controller.js';
import { loginValidationRules, registerValidationRules as registerValidation } from '../validators/auth.validator.js';
import {validationMiddleware} from '../middleware/auth.validation.middleware.js'
import { isAuthenticatedUser} from '../middleware/isAuthenticatedUser.middleware.js';
import authorizedRole from '../middleware/isAuthorizedRole.middleware.js';

// CREATE EXPRESS ROUTER
const router = express.Router();


// AUTHENTICATION ROUTES


// REGISTER
router.post("/register", registerValidation,validationMiddleware,register);


// LOGIN
router.post("/login", loginValidationRules, validationMiddleware, login);

router.get("/me", isAuthenticatedUser, getMe);
router.get(
    "/admin-test",
    isAuthenticatedUser,
    authorizedRole("admin"),
    adminTest
);


export default router