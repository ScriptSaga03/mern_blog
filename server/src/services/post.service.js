import Post from "../model/post.model.js";
import AppError from "../utils/AppError.js";

// GET POSTS
const getPublishedPosts = async () => {
  const posts = await Post.find({ status: "published" })
    .sort({
      createdAt: -1,
    })
    .select("-__v -createdAt -updatedAt")
    .lean();

  return posts;
};

// GET SINGLE POST BY ID
const getPublishedPostById = async (postId) => {
  const post = await Post.findOne({
    _id: postId,
    status: "published",
  })
    .select("-__v -createdAt -updatedAt")
    .lean();
  if (!post) {
    throw AppError(404, "Published post not found!");
  }

  return post;
};

// PUBLISH POST
const publishPosts = async (postId) => {
  const post = await Post.findById(postId).select("-__v -createdAt -updatedAt");
  if (!post) {
    throw AppError(404, "Post not found!");
  }

  if (post.status === "published") {
    throw AppError(400, "Post is already published!");
  }

  post.status = "published";
  await post.save();
  return post;
};

// CREATE POSTS
const createPost = async (postData, authorId) => {
  const { title, content, excerpt, coverImage, category, tags } = postData;

  if (!title || !content || !category) {
    throw AppError(400, "Title, content and category are required.");
  }

  const post = await Post.create({
    title,
    content,
    excerpt,
    coverImage,
    category,
    tags,
    author: authorId,
  });

  return post;
};

// UPDATE POST
const updatePostsById = async (postId, postData) => {
  // 1. Only allow these fields to be updated
  const allowedFields = [
    "title",
    "content",
    "excerpt",
    "coverImage",
    "category",
    "tags",
  ];

  // 2. Pick only allowed fields from client input
  const updateData = {};
  for (const field of allowedFields) {
    if (Object.hasOwn(postData, field)) {
      updateData[field] = postData[field];
    }
  }

  

  // 3. Reject requests containing no allowed fields
  if (Object.keys(updateData).length === 0) {
    throw AppError(400, "No valid fields provided for update.");
  }

  // 4. Update the post with only allowed fields
  const post = await Post.findByIdAndUpdate(
    postId,
    { $set: updateData },
    {
      new: true,
      runValidators: true,
    },
  )
    .select("-__v -createdAt -updatedAt")
    .lean();

  // Handle case where post is not found
  if (!post) {
    throw AppError(404, "Post not found!");
  }

  return post;
};

// DELETE POST
const deletePostById = async (postId) => {
  const post = await Post.findByIdAndDelete(postId);

  if (!post) {
    throw AppError(404, "Post not found.");
  }

  return post;
};

export {
  createPost,
  getPublishedPosts,
  publishPosts,
  getPublishedPostById,
  updatePostsById,
  deletePostById,
};
