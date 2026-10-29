import express from "express";

import {
  createPostController,
  deletePostByIdController,
  getPublishedPostByIdController,
  getPublishedPostsController,
  publishPostController,
  bulkCreatePostsController,
  updatePostsByIdController,
} from "../controllers/post.controller.js";
import { isAuthenticatedUser } from "../middleware/isAuthenticatedUser.middleware.js";
import { validationMiddleware } from "../middleware/validation.middleware.js";
import {
  createPostValidationRules,
  postIdValidationRules,
  updatePostValidationRules,
} from "../validators/post.validator.js";
import { isPostAuthor } from "../middleware/isPostAuthor.middleware.js";
import { getProductLimiter } from "../middleware/rateLimitter.middleware.js";

const router = express.Router();

// GET
router.get("/", getProductLimiter,getPublishedPostsController);

// GET POST BY ID
router.get(
  "/:id",
  postIdValidationRules,
  validationMiddleware,
  getPublishedPostByIdController,
);



router.post(
  "/bulk-creation",
  isAuthenticatedUser,
  bulkCreatePostsController
);



// POST
router.post(
  "/",
  isAuthenticatedUser,
  createPostValidationRules,
  validationMiddleware,
  createPostController,
);

// PATCH - UPDATE
router.patch(
  "/:id/publish",
  isAuthenticatedUser,
  postIdValidationRules,
  validationMiddleware,
  isPostAuthor,
  publishPostController,
);

// UPDATE POST
router.patch(
  "/:id",
  isAuthenticatedUser,
  postIdValidationRules,
  updatePostValidationRules,
  validationMiddleware,
  isPostAuthor,
  updatePostsByIdController,
);

router.delete(
  "/:id",
  isAuthenticatedUser,
  postIdValidationRules,
  validationMiddleware,
  isPostAuthor,
  deletePostByIdController,
);

export default router;
