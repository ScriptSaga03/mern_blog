import { body, param } from "express-validator";

const createPostValidationRules = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required!")
    .bail()
    .isLength({ min: 5, max: 120 })
    .withMessage("Title must be between 5 and 120 characters."),
  body("content").trim().notEmpty().withMessage("Content is required."),
  body("excerpt")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Excerpt cannot exceed 300 characters."),
  body("coverImage")
    .optional()
    .trim()
    .isURL({ require_protocol: true })
    .withMessage("Cover image must be a valid URL."),
  body("category")
    .trim()
    .notEmpty()
    .withMessage("Category is required.")
    .bail()
    .isLength({ max: 50 })
    .withMessage("Category cannot exceed 50 characters."),
  body("tags").optional().isArray().withMessage("Tags must be an array."),
  body("tags.*")
    .optional()
    .isString()
    .withMessage("Each tag must be a string.")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Tags cannot be empty."),

  // body("status")
  //   .optional()
  //   .isIn(["draft", "published"])
  //   .withMessage("Status must be draft or published."),
];

// UPATE POST VALIDATION RULES
const updatePostValidationRules = [
  param("id")
    .notEmpty()
    .withMessage("Post Id is required.")
    .bail()
    .isMongoId()
    .withMessage("Invalid Post ID format."),

  // AT LEAST ONE FIELD
  body().custom((val, { req }) => {
    const allowedFields = [
      "title",
      "content",
      "excerpt",
      "coverImage",
      "category",
      "tags",
    ];

    const receivedFields = Object.keys(req.body);
    const unknownFields = receivedFields.filter(
      (field) => !allowedFields.includes(field),
    );

    if (unknownFields.length > 0) {
      throw new Error(
        `These fields cannot be updated: ${unknownFields.join(", ")}`,
      );
    }

    if (Object.keys(req.body).length === 0) {
      throw new Error("At least one field is required for update.");
    }

    return true;
  }),

  body("title")
    .optional()
    .trim()
    .isLength({ min: 5, max: 120 })
    .withMessage("Title must be between 5 and 120 characters."),

  body("content")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Content cannot be empty."),

  body("excerpt")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Excerpt cannot exceed 300 characters."),

  body("coverImage")
    .optional()
    .trim()
    .isURL({ require_protocol: true })
    .withMessage("Cover image must be a valid URL."),

  body("category")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Category cannot be empty.")
    .bail()
    .isLength({ max: 50 })
    .withMessage("Category cannot exceed 50 characters."),

  body("tags").optional().isArray().withMessage("Tags must be an array."),

  body("tags.*")
    .optional()
    .isString()
    .withMessage("Each tag must be a string.")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Tags cannot be empty."),
];


// POST ID VALIDATION RULES
const postIdValidationRules = [
  param("id").isMongoId().withMessage("Invalid post ID."),
];

export {
  createPostValidationRules,
  postIdValidationRules,
  updatePostValidationRules,
  deletePostValidationRules,
};
