import Post from "../model/post.model.js";
import AppError from "../utils/AppError.js";

// GET POSTS
const getPublishedPosts = async () => {
  const posts = await Post.find({ status: "published" })
    .sort({
      createdAt: -1,
    })
    .select("-__v")
    .lean();

  return posts;
};

  // GET SINGLE POST BY ID
  const getPublishedPostById = async (postId) => {
    const post = await Post.findOne({
      _id: postId,
      status: "published",
    })
      .select("-__v -status -createdAt -updatedAt")
      .lean();
    if (!post) {
      throw AppError(404, "Published post not found!");
    }

    return post;
  };

// PUBLISH POST
const publishPosts = async (postId, userId) => {
  const post = await Post.findOne({ _id: postId, author: userId });
  if (!post) {
    throw AppError(404, "Post not found!");
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
const updatePostsById = async (postId, userId, postData) => {
  const post = await Post.findOneAndUpdate(
    { _id: postId, author: userId },
    postData,
    {
      new: true,
      runValidators: true,
      returnDocument:"after"
    },
  )
    .select("-__v")
    .lean();

  if (!post) {
    throw AppError(404, "Post not found!");
  }

  return post;
};

export {
  createPost,
  getPublishedPosts,
  publishPosts,
  getPublishedPostById,
  updatePostsById,
};
