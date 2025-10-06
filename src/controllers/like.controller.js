import { getAuth, User } from "@clerk/express";

import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import Like from "../models/like.model.js";
import Notification from "../models/notification.model.js";

// like post
export const likePost = async (req, res) => {
  const { userId } = getAuth(req);
  const { postId } = req.params;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const post = await Post.findOne({ _id: postId }).lean().session(session);
    if (!post) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        error: "Post not found",
      });
    }

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

    // like post
    const isLiked = await Like.findOne({
      $and: [{ user: user._id }, { post: post._id }],
    });

    // like post if unliked
    if (isLiked) {
      const deletedLike = await Like.findByIdAndDelete(isLiked._id, {
        session,
      }).lean();

      if (deletedLike) {
        await Notification.findOneAndDelete(
          {
            $and: [{ user: user._id }, { post: post._id }, { to: post.user }],
          },
          { session }
        );
      }

      await session.commitTransaction();
      return res.status(200).json({
        success: true,
        message: "Post unliked successfully",
      });
    }

    // create like & notif
    const likePost = await Like.create(
      [
        {
          from: user._id,
          post: post._id,
          to: post.user,
        },
      ],
      { session }
    );

    if (likePost) {
      await Notification.create(
        [{ from: user._id, to: post.user, type: "like" }],
        { session }
      );
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: "Post liked successfully",
    });
  } catch (error) {
    console.log("Unable to like post: " + error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to like post",
      error: error.message,
    });
  } finally {
    await session.endSession();
  }
};

// get likes
export const getLikes = async (req, res) => {
  const postId = req.params.id;

  try {
    const likes = await Like.countDocuments({ post: postId });

    const userLikes = await Like.find({ post: postId })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("user", "profile, username firstName lastName isAdmin");

    return res.status(200).json({
      success: true,
      message: "Likes found",
      noOfLikes: likes,
      users: userLikes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not get Likes on post",
      error: error.message,
    });
  }
};
