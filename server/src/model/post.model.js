
import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Post title is required."],
      trim: true,
      minLength: [5, "Title must be at least 5 characters."],
      maxLength: [120, "Title cannot exceed 120 characters."],
    },

    content: {
      type: String,
      required: [true, "Post content is required."],
      trim: true,
    },

    excerpt: {
      type: String,
      trim: true,
      maxLength: [300, "Excerpt cannot exceed 300 characters."],
      default: "",
    },

    coverImage: {
      type: String,
      trim: true,
      default: "",
    },

    category: {
      type: String,
      required: [true, "Post category is required."],
      trim: true,
      maxLength: [50, "Category cannot exceed 50 characters."],
    },

    tags: {
      type: [{ type: String, trim: true }],
      default: [],
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Post author is required."],
    },
  },
  {
    timestamps: true,
  }
);

const Post = mongoose.model("Post", postSchema);

export default Post;