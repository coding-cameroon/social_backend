import mongoose from "mongoose";
import { getAuth } from "@clerk/express";

import User from "../models/user.model.js";
import Post from "../models/user.model.js";
import Comment from "../models/comment.model.js";
import Notification from "../models/notification.model.js";

// create comment
export const createComment = async (req, res) => {
  const postId = req.params.id;
  const { userId } = getAuth(req);
  const content = req.body;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    if (!content) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ success: false, error: "Provide a comment to comment" });
    }

    const [post, user] = await Promise.all([
      Post.findById(postId),
      User.findOne({ clerkId: userId }),
    ]);

    if (!post) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, error: "Post not found" });
    }
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const comment = await Comment.create(
      [
        {
          user: user._id,
          post: post._id,
          content,
        },
      ],
      { session }
    );
    if (!comment) {
      await session.abortTransaction();
      return res
        .status(500)
        .json({ success: false, error: "Could not create comment" });
    }

    await session.commitTransaction();
    return res
      .status(201)
      .json({ success: true, message: "Comment created", comment });
  } catch (error) {
    await session.abortTransaction();
  } finally {
    await session.endSession();
    return res.status(500).json({
      success: false,
      message: "Could not create comment",
      error: error.message,
    });
  }
};

// get comments
export const getComments = async (req, res) => {
  const postId = req.params.id;

  try {
    const [comments, noComments] = await Promise.all([
      Comment.find({ post: postId }).lean().sort({ createdAt: -1 }).limit(30),
      Comment.countDocuments({ post: postId }),
    ]);
    if (!comments) {
      return res
        .status(500)
        .json({ success: false, error: "Could not create comment" });
    }

    return res.status(200).json({
      success: true,
      message: "Comment created",
      comments,
      noOfComments: noComments,
    });
  } catch (error) {
    console.log("Error getting comments: " + error.message);
    return res.status(500).json({
      success: false,
      message: "Error getting comments",
      error: error.message,
    });
  }
};

// delete comment
export const deleteComment = async (req, res) => {
  const commentId = req.params.id;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const deletedComment = await Comment.findByIdAndDelete(commentId).session(
      session
    );
    if (!deletedComment) {
      await session.abortTransaction();

      return res
        .status(500)
        .json({ success: false, error: "Could not delete comment" });
    }

    const deletedNotif = await Notification.deleteMany({
      from: deleteComment.user,
    });
    if (!deletedNotif) {
      await session.abortTransaction();
      return res.status(200).json({
        success: true,
        message: "Comment deleted",
      });
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: "Comment deleted",
    });
  } catch (error) {
    await session.abortTransaction();
    console.log("Error deleting comments: " + error.message);
    return res.status(500).json({
      success: false,
      message: "Error deleting comments",
      error: error.message,
    });
  } finally {
    await session.endSession();
  }
};
