import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  createPost,
  getPublishedPosts,
  publishPosts,
  getPublishedPostById,
  updatePostsById,
  deletePostById,
} from "../services/post.service.js";

// GET POSTS
const getPublishedPostsController = asyncHandler(async (req, res) => {
  const posts = await getPublishedPosts();

  return res.status(200).json({
    success: true,
    message: "Published posts fetched successfully.",
    results: posts.length,
    data: {
      posts,
    },
  });
});

// GET PUBLISH POST BY ID
const getPublishedPostByIdController = asyncHandler(async (req, res) => {
  const post = await getPublishedPostById(req.params.id);

  return res.status(200).json({
    success: true,
    message: "Published post fetched successfully.",
    data: {
      post,
    },
  });
});



// PUBLISH POST
const publishPostController = asyncHandler(async (req, res) => {
  const post = await publishPosts(req.params.id);

  return res.status(200).json({
    success: true,
    message: "Post Publish successfully.",
    data: {
      post,
    },
  });
});



// CREATE POSTS
const createPostController = asyncHandler(async (req, res) => {
  const post = await createPost(req.body, req.user._id);

  return res.status(201).json({
    success: true,
    message: "Post created successfully.",
    data: {
      post,
    },
  });
});

// UPDATE POST CONTROLLER
const updatePostsByIdController = asyncHandler(async (req, res) => {
  const post = await updatePostsById(req.params.id, req.body);

  return res.status(200).json({
    success: true,
    message: "Post updated successfully.",
    data: {
      post,
    },
  });
});



// DELETE POST BY ID
const deletePostByIdController  = asyncHandler(async (req, res) => {
   await deletePostById(req.params.id)

  return res.status(200).json({
    success:true, 
    message:"Post delete successfully."
  })
}) 

export {
  createPostController,
  getPublishedPostsController,
  publishPostController,
  getPublishedPostByIdController,
  updatePostsByIdController,
  deletePostByIdController
};
