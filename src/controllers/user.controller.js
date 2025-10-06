import fs from "fs";
import mongoose from "mongoose";
import { clerkClient, getAuth } from "@clerk/express";

import { Env } from "../config/env.js";
import cloudinary from "../config/cloud.js";

import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

import sendMail from "../utils/sendmail.utils.js";

// sync user up
export const syncUser = async (req, res) => {
  const { userId } = getAuth(req);

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const userClerkInfo = await clerkClient.users.getUser(userId);
    if (!userClerkInfo) {
      await session.abortTransaction();
      return res
        .status(401)
        .json({ success: false, error: "User info not provided!" });
    }

    const existingUser = await User.findOne({ clerkId: userId })
      .lean()
      .session(session);
    if (existingUser) {
      await session.abortTransaction();
      return res.status(200).json({
        success: true,
        message: "User already synced",
        user: existingUser,
      });
    }

    const userData = {
      clerkId: userId,
      email: userClerkInfo.primaryEmailAddress,
      firstName: userClerkInfo.firstName,
      lastName: userClerkInfo.lastName || "",
      username: userClerkInfo.primaryEmailAddress.split("@")[0],
      profile: userClerkInfo.imageUrl,
      isAdmin: userClerkInfo.primaryEmailAddress === Env.ADMIN_EMAIL,
    };

    const user = await User.create([userData], { session });
    if (!user) {
      await session.abortTransaction();
      return res.status(500).json({
        success: false,
        error: "Unable to sync user in the database",
      });
    }
    await sendMail();

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: "User synced in the database",
      user: user[0],
    });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    await session.endSession();
  }
};

// get current user
export const getCurrentUser = async (req, res) => {
  const { userId } = getAuth(req);

  try {
    const user = await User.findOne({ clerkId: userId })
      .lean()
      .lean()
      .populate("followers", "profile username firstName lastName")
      .populate("following", "profile username firstName lastName");
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User data found",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to get currentUser",
      error: error.message,
    });
  }
};

export const updateUserProfile = async (req, res) => {
  const { userId } = getAuth(req);
  const username = req.body;
  const image = req.file;

  const session = await mongoose.startSession();
  let imgSecureUrl = "";

  try {
    session.startTransaction();

    if (image) {
      const imgUrl = await cloudinary.uploader.upload(image.path, {
        resource_type: "image",
      });

      if (!imgUrl || image.result !== "ok") {
        await session.abortTransaction();
        return res.status(500).json({
          success: false,
          error: "Could not save user profile image",
        });
      }

      imgSecureUrl = imgUrl.secure_url;
    }

    const updatedUser = await User.findOneAndUpdate(
      { clerkId: userId },
      { username, profile: imgSecureUrl },
      { session, new: true }
    );

    if (!updatedUser) {
      await session.abortTransaction();
      return res.status(500).json({
        success: false,
        error: "Could not update user profile",
      });
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: "Success updating profile",
      user: updatedUser,
    });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({
      success: false,
      message: "Error updating user profile",
      error: error.message,
    });
  } finally {
    await session.endSession();

    if (image) {
      fs.unlink(image.path, (err) => {
        if (err) throw err;
        return console.log(`${image.path} was deleted`);
      });
    }
  }
};

// get user
export const getUser = async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username })
      .lean()
      .populate("followers", "profile username firstName lastName")
      .populate("following", "profile username firstName lastName");
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "unable to get user",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User data found",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "unable to get user",
      error: error.message,
    });
  }
};

// follow others
export const followUser = async (req, res) => {
  const { userId } = getAuth(req);
  const targetUser = req.params.id;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const [currentUser, targetedUser] = await Promise.all([
      User.findOne({ clerkId: userId }).lean(),
      User.findById(targetUser).lean(),
    ]);
    if (!currentUser || !targetedUser) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        error: "User(s) not found",
      });
    }

    if (currentUser._id.toString() === targetedUser._id.toString()) {
      await session.abortTransaction();
      return res.status(401).json({
        success: false,
        error: "You can't follow or unfollow your self",
      });
    }

    const isFollowing = currentUser.following.includes(targetedUser._id);
    if (!isFollowing) {
      // follow if not follwing
      const userFollowed = await Promise.all([
        User.findByIdAndUpdate(
          currentUser._id,
          { $push: { following: targetedUser._id } },
          { new: true, session }
        ),
        User.findOneAndUpdate(
          targetedUser._id,
          { $push: { followers: currentUser._id } },
          { new: true, session }
        ),
        // sending notification
        Notification.create(
          {
            from: currentUser._id,
            to: targetedUser._id,
            type: "follow",
          },
          { session }
        ),
      ]);

      if (!userFollowed) {
        await session.abortTransaction();
        return res.status(500).json({
          success: false,
          error: "Unable to folllow user",
        });
      }

      return res.status(200).json({
        success: true,
        message: "User followed successfully",
      });
    } else {
      // unfollow if following
      const userunFollowed = await Promise.all([
        User.findByIdAndUpdate(
          currentUser._id,
          { $pull: { following: targetedUser._id } },
          { new: true, session }
        ),
        User.findOneAndUpdate(
          targetedUser._id,
          { $pull: { followers: currentUser._id } },
          { new: true, session }
        ),
      ]);

      if (!userunFollowed) {
        await session.abortTransaction();
        return res.status(500).json({
          success: false,
          error: "Unable to unfolllow user",
        });
      }

      return res.status(200).json({
        success: true,
        message: "User unfollowed successfully",
      });
    }
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({
      success: false,
      message: "Unable to follow or unfolllow user",
      error: error.message,
    });
  } finally {
    await session.endSession();
  }
};
