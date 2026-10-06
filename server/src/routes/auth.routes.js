

import express from 'express';
import { register } from '../controllers/auth.controller.js';
import { registerValidationRules as registerValidation } from '../validators/auth.validator.js';
import {validationMiddleware} from '../middleware/auth.validation.middleware.js'


const router = express.Router();



router.post("/register", registerValidation,validationMiddleware,register);

export default router