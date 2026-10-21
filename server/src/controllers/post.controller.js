import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  bulkCreatePosts,
  createPost,
  getPublishedPosts,
  publishPosts,
  getPublishedPostById,
  updatePostsById,
  deletePostById,
} from "../services/post.service.js";

;

const bulkCreatePostsController = asyncHandler(async (req, res) => {
  const { posts } = req.body;

  if (!Array.isArray(posts) || posts.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Posts must be a non-empty array.",
    });
  }

  const createdPosts = await bulkCreatePosts(posts, req.user._id);

  return res.status(201).json({
    success: true,
    message: "Posts created successfully.",
    results: createdPosts.length,
    data: {
      posts: createdPosts,
    },
  });
});



// GET POSTS
const getPublishedPostsController = asyncHandler(async (req, res) => {
  console.log(req.query)
  const result = await getPublishedPosts(req.query);

  
  return res.status(200).json({
    success: true,
    message: "Published posts fetched successfully.",
    results: result.posts.length,
    pagination:result.pagination,
    data: {
      posts:result.posts,
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
  bulkCreatePostsController,
  createPostController,
  getPublishedPostsController,
  publishPostController,
  getPublishedPostByIdController,
  updatePostsByIdController,
  deletePostByIdController
};
