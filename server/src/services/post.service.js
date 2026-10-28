import Post from "../model/post.model.js";
import AppError from "../utils/AppError.js";


// BULK CREATE POSTS
const bulkCreatePosts = async (postsData, authorId) => {
  const postsWithAuthor = postsData.map((post) => ({
    ...post,
    author: authorId,
  }));

  const posts = await Post.insertMany(postsWithAuthor);

  return posts;
};

// GET POSTS
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const getPublishedPosts = async (query = {}) => {
  const {
    page = 1,
    limit = 10,
    category,
    search,
    author,
    tag,
    sortBy = "createdAt",
    order = "desc",
  } = query;

  // CONVERT STRING INTO NUMBER
  const parsedPage = Number(page);
  const parsedLimit = Number(limit);

  // PAGE VALIDATE
  const pageNumber =
    Number.isFinite(parsedPage) && parsedPage >= 1 ? Math.floor(parsedPage) : 1;

  // LIMIT VALIDATE
  const limitNumber =
    Number.isFinite(parsedLimit) && parsedLimit >= 1
      ? Math.min(Math.floor(parsedLimit), 50)
      : 10;

  const skip = (pageNumber - 1) * limitNumber;

  const filter = { status: "published" };

  // SEARCH
  const searchTerms = typeof search === "string" ? escapeRegex(search.trim()) : null;
  if (searchTerms) {
    filter.$or = [
      { title: new RegExp(searchTerms, "i") },
      { excerpt: new RegExp(searchTerms, "i") },
      { content: new RegExp(searchTerms, "i") },
    ];
  }

  // CATEGORY
  const categoryQuery = typeof category === "string" ? escapeRegex(category.trim()) : "";
  if (categoryQuery) {
    filter.category = { $regex: categoryQuery, $options: "i" };
  }

  // TAG
  const tagQuery = typeof tag === "string" ? escapeRegex(tag.trim()) : "";
  if (tagQuery) {
    filter.tags = new RegExp(`^${tagQuery}$`, "i");
  }

  // author
  if (author && typeof author === "string" && author.trim() !== "") {
    filter.author = author;
  }

  // SORT SETUP
  const allowedFields = ["createdAt", "title", "category"];

  if (!allowedFields.includes(sortBy)) {
    throw AppError(400, "Invalid sortBy parameter.");
  }

  const normalizedOrder = order.toLowerCase();
  let sortOrder;

  switch (normalizedOrder) {
    case "asc":
      sortOrder = 1;
      break;
    case "desc":
      sortOrder = -1;
      break;
    default:
      throw AppError(400, "Invalid order parameter. Use 'asc' or 'desc'.");
  }


  const [posts, totalPosts] = await Promise.all([
    Post.find(filter)
      .sort({
        [sortBy]: sortOrder,
      })
      .skip(skip)
      .limit(limitNumber)
      .select("-__v")
      .populate("author", "name")
      .lean(),

    Post.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalPosts / limitNumber);
  return {
    posts,
    pagination: {
      currentPage: pageNumber,
      limit: limitNumber,
      totalPosts,
      totalPages,
      hasNextPage: pageNumber < totalPages,
      hasPrevPage: pageNumber > 1,
    },
  };
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
  bulkCreatePosts,
  createPost,
  getPublishedPosts,
  publishPosts,
  getPublishedPostById,
  updatePostsById,
  deletePostById,
};

/*


If you want to validate the pagination parameters more strictly, you can create a utility function to handle this. Here's an example of how you might implement such a function:

const parsePaginationParam = (value, field, defaultValue, max) => {
  // 1. Parameter nahi diya gaya toh default use karo
  if (value === undefined) {
    return defaultValue;
  }

  // 2. Sirf digits accept karo
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw AppError(400, `${field} must be a valid positive integer.`);
  }

  const parsedValue = Number(value);

  // 3. Number aur allowed range validate karo
  if (
    !Number.isSafeInteger(parsedValue) ||
    parsedValue < 1 ||
    parsedValue > max
  ) {
    throw AppError(400, `${field} must be between 1 and ${max}.`);
  }

  return parsedValue;
};

// const pageNumber = parsePaginationParam(
  //   query.page,
  //   "page",
  //   1,
  //   Number.MAX_SAFE_INTEGER,
  // );

  // const limitNumber = parsePaginationParam(query.limit, "limit", 10, 50);






/*




*/
