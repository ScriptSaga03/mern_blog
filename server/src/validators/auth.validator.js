import { body } from "express-validator";

const registerValidationRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required!")
    .bail()
    .isLength({ min: 3, max: 50 })
    .withMessage("Name must be between 3 and 50 characters!")
    .bail()
    .isAlpha("en-US", { ignore: " " })
    .withMessage("Name must contain only letters and spaces!")
    ,
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required!")
    .bail()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required!")
    .bail()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long!")
    .bail()
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage(
      "Password must be 8+ chars with uppercase, lowercase, number & symbol!",
    ),
];


// ======================= Login Validation Rules =======================
const loginValidationRules = [
  body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required!")
        .bail()
        .isEmail()
        .withMessage("Please provide a valid email address!")
        .normalizeEmail(),
  body("password")
        .notEmpty()
        .withMessage("Password is required!")
]


export {registerValidationRules, loginValidationRules}











/*
.matches(/^[a-zA-Z\s]+$/)    // .isAlpha("en-US", { ignore: " " })  "en-US" → English alphabet / { ignore: " " } → spaces ko ignore karo
*/