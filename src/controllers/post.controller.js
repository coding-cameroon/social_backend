import fs from "fs/promises";
import mongoose from "mongoose";
import { getAuth } from "@clerk/express";

import cloudinary from "../config/cloud.js";

import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Comment from "../models/comment.model.js";

// create post
export const createPost = async (req, res) => {
  const { userId } = getAuth(req);
  const content = req.body;
  const image = req.file;

  const session = await mongoose.startSession();
  let imgSecureUrl = "";

  try {
    session.startTransaction();

    if (!content && !image) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        error: "Provide an image or text to create a post.",
      });
    }

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        error: "User not found.",
      });
    }

    if (image) {
      const imgUrl = await cloudinary.uploader.upload(image.path, {
        resource_type: "image",
      });

      if (!imgUrl) {
        await session.abortTransaction();
        return res.status(500).json({
          success: false,
          error: "Could not save user image.",
        });
      }

      imgSecureUrl = imgUrl.secure_url;
    }

    const post = await Post.create(
      {
        user: user._id,
        image: imgSecureUrl,
        content,
      },
      { session }
    );

    if (!post) {
      await session.abortTransaction();
      return res.status(500).json({
        success: false,
        message: "Unable to create post.",
      });
    }

    await session.commitTransaction();
    return res.status(201).json({
      success: true,
      message: "Post created.",
      post,
    });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({
      success: false,
      message: "Unable to create post.",
      error: error.message,
    });
  } finally {
    await session.endSession();
    try {
      if (image) {
        await fs.unlink(image.path);
      }
      console.log(`Image: ${image.path} deleted`);
    } catch (error) {
      console.log(`Image: ${image.path} not deleted`, error.message);
    }
  }
};

// get posts
export const getPosts = async (req, res) => {
  const { nextPost } = req.query;
  try {
    // pagination
    const limit = 10;
    const query = nextPost ? { _id: { $lt: nextPost } } : {};

    const rawPosts = await Post.find(query)
      .limit(limit + 1)
      .sort({ _id: -1 })
      .lean()
      .populate("user", "-__v -email");

    // ! understand this code
    const hasNext = rawPosts.length === limit + 1;
    const posts = hasNext ? rawPosts.slice(0, limit) : rawPosts;
    const nextPostStartId =
      posts.length > 0 && hasNext ? posts[posts.length - 1]._id : null;

    if (rawPosts.length === 0 && nextPost) {
      return res.status(404).json({
        success: false,
        error: "Posts not found",
      });
    }

    return res.status(200).json({
      posts,
      hasNext,
      success: true,
      nextPostStartId,
      message: "Post found",
    });
  } catch (error) {
    console.log("Unable to get posts: " + error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to get posts",
      error: error.message,
    });
  }
};

// get post
export const getPost = async (req, res) => {
  const { id } = req.params;
  try {
    const post = await Post.findOne({ _id: id })
      .lean()
      .populate("user", "-__v -email");
    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
      });
    }

    return res.status(200).json({
      post,
      success: true,
      message: "Post found",
    });
  } catch (error) {
    console.log("Unable to get post: " + error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to get post",
      error: error.message,
    });
  }
};

// delete post
export const deletePost = async (req, res) => {
  const { userId } = getAuth(req);
  const { id } = req.params;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const user = await User.findOne({ clerkId: userId })
      .lean()
      .session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const post = await Post.findOne({ _id: id }).lean().session(session);
    if (!post) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        error: "Post not found",
      });
    }

    if (post.user.toString() !== user._id.toString() || !user.isAdmin) {
      await session.abortTransaction();
      return res.status(401).json({
        success: false,
        message: "Only the user or delegate can delete this post.",
      });
    }

    const deletedPost = await Post.findByIdAndDelete(post._id).session(session);
    if (!deletedPost) {
      await session.abortTransaction();
      return res.status(500).json({
        success: false,
        error: "Could not delete post",
      });
    }

    // delete comments on the post
    const deletedComment = await Comment.deleteMany({ post: post._id }).session(
      session
    );
    if (!deletedComment) {
      await session.abortTransaction();
      return res.status(500).json({
        success: false,
        message: "Could not delete comments on post",
      });
    }

    if (post?.image) {
      const imgId = post.image.split("/").pop().split(".")[0];
      const deletedImg = await cloudinary.uploader.destroy(imgId, {
        resource_type: "image",
      });

      if (!deletedImg || deletedImg.result !== "ok") {
        await session.abortTransaction();
        return res.status(500).json({
          success: false,
          message: "Could not delete image on post",
        });
      }
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.log("Unable to get post: " + error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to get post",
      error: error.message,
    });
  } finally {
    await session.endSession();
  }
};
