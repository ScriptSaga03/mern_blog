

import express from 'express';
import { register, login, getMe, adminTest, verifyEmail } from '../controllers/auth.controller.js';
import { loginValidationRules, registerValidationRules as registerValidation } from '../validators/auth.validator.js';
import {validationMiddleware} from '../middleware/validation.middleware.js'
import { isAuthenticatedUser} from '../middleware/isAuthenticatedUser.middleware.js';
import authorizedRole from '../middleware/isAuthorizedRole.middleware.js';
import { sendVerificationEmail } from '../services/email.service.js';


// CREATE EXPRESS ROUTER
const router = express.Router();


// AUTHENTICATION ROUTES


// REGISTER
router.post("/register", registerValidation,validationMiddleware,register);


// router.post("/api/test-email", async (req, res) => {
//   try {
//     const { toEmail } = req.body;

//     if (!toEmail) {
//       return res.status(400).json({
//         success: false,
//         message: "Recipient email is required.",
//       });
//     }

//     await sendVerificationEmail(toEmail);

//     return res.status(200).json({
//       success: true,
//       message: "Test email sent successfully.",
//     });
//   } catch (error) {
//     console.error("Email sending failed:", error.message);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to send test email.",
//     });
//   }
// });



// VERIFY EMAIL
router.get("/verify-email", verifyEmail);

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