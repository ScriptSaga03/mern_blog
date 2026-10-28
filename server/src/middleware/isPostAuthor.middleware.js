import Post from "../model/post.model.js";
import AppError from "../utils/AppError.js";

const isPostAuthor = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).select("author").lean();

    if (!post) {
      return next(AppError(404, "Post not found."));
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return next(AppError(403, "You are not allowed to modify this post."));
    }

    return next();
  } catch (error) {
    return next(error);   
  }
};

export { isPostAuthor };