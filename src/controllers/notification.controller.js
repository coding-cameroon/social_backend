import mongoose from "mongoose";
import { getAuth } from "@clerk/express";

import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

// delete all notifications
export const deleteNotifs = async (req, res) => {
  const { userId } = getAuth(req);

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const notifUser = await User.findOne({ clerkId: userId }).session(session);
    if (!notifUser) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        RangeError: "Could not get user",
      });
    }

    const deletedNotifs = await Notification.deleteMany({
      to: notifUser?._id,
    }).session(session);
    if (!deletedNotifs) {
      await session.abortTransaction();
      return res.status(500).json({
        success: false,
        RangeError: "Could not delete all the notifications",
      });
    }

    await session.committTransaction();
    return res.status(200).json({
      success: true,
      message: "Notifications deleted",
    });
  } catch (error) {
    await session.abortTransaction();
    console.log("Could not delete notification: " + error.message);
    return res.status(500).json({
      success: false,
      message: "Could not delete notifications",
      error: error.message,
    });
  } finally {
    await session.endSession();
  }
};

// delete a notification
export const deleteNotif = async (req, res) => {
  const notifId = req.params.id;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const deletedNotifs = await Notification.findByIdAndDelete(notifId).session(
      session
    );
    if (!deletedNotifs) {
      await session.abortTransaction();
      return res.status(500).json({
        success: false,
        RangeError: "Could not delete notification",
      });
    }

    await session.committTransaction();
    return res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    await session.abortTransaction();
    console.log("Could not delete notification: " + error.message);
    return res.status(500).json({
      success: false,
      message: "Could not delete notification",
      error: error.message,
    });
  } finally {
    await session.endSession();
  }
};

// get all notifications
export const getNotifs = async (req, res) => {
  try {
    const { userId } = getAuth(req);

    const notifUser = await User.findOne({ clerkId: userId });
    if (!notifUser) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        error: "Could not get user",
      });
    }

    const notifications = await Notification.find({ to: notifUser._id });
    if (!notifications) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Could not get notifications",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notifications found",
      notifications,
    });
  } catch (error) {
    await session.abortTransaction();
    console.log("Could not get notifications: " + error.message);
    return res.status(500).json({
      success: false,
      message: "Could not get notifications",
      error: error.message,
    });
  }
};
