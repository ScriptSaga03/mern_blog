import express from "express";

import {
  createPostController,
  getPublishedPostByIdController,
  getPublishedPostsController,
  publishPostController,
  updatePostsByIdController,
} from "../controllers/post.controller.js";
import { isAuthenticatedUser } from "../middleware/isAuthenticatedUser.middleware.js";
import { validationMiddleware } from "../middleware/validation.middleware.js";
import {
  createPostValidationRules,
  postIdValidationRules,
  updatePostValidationRules,
} from "../validators/post.validator.js";

const router = express.Router();

// GET
router.get("/", getPublishedPostsController);

// GET POST BY ID
router.get(
  "/:id",
  postIdValidationRules,
  validationMiddleware,
  getPublishedPostByIdController,
);

// POST
router.post(
  "/",
  isAuthenticatedUser,
  createPostValidationRules,
  validationMiddleware,
  createPostController,
);

// UPDATE POST
router.patch(
  "/:id",
  isAuthenticatedUser,
  updatePostValidationRules,
  postIdValidationRules,
  validationMiddleware,
  updatePostsByIdController,
);

// PATCH - UPDATE
router.patch(
  "/:id/publish",
  isAuthenticatedUser,
  postIdValidationRules,
  validationMiddleware,
  publishPostController,
);

export default router;
