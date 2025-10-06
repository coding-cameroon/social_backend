import fs from "fs";
import mongoose from "mongoose";
import { getAuth } from "@clerk/express";

import User from "../models/user.model.js";
import New from "../models/new.model.js";

import cloudinary from "../config/cloud.js";

// create news
export const createNews = async (req, res) => {
  const { userId } = getAuth(req);
  const files = req.files;
  const content = req.body;

  const session = await mongoose.startSession();
  let fileUrls = "";
  try {
    session.startTransaction();

    if (!content && !files) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: "Provide a file or text field to create a news",
      });
    }

    const user = await User.findOne({ clerkId: userId }).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    if (!user.isAdmin) {
      await session.abortTransaction();
      return res.status(401).json({
        success: false,
        error: "Unauthorized. Only admins are allowed to create news",
      });
    }

    if (files) {
      const uploadedImgProms = files.map((file) => {
        cloudinary.uploader.upload(file.path);
      });

      const uploadedImgs = await Promise.all(uploadedImgProms);
      if (
        !uploadedImgs ||
        uploadedImgs.some((img) => !img || img.result !== "ok")
      ) {
        await session.abortTransaction();
        return res.status(500).json({
          success: false,
          error: "Could not save user file in the database",
        });
      }

      fileUrls = uploadedImgs.map((img) => img?.secure_url);
    }

    const news = await New.create(
      [{ user: user._id, files: fileUrls, content }],
      { session }
    );

    if (!news) {
      await session.abortTransaction();
      return res.status(500).json({
        success: false,
        error: "Could not news in the database",
      });
    }

    await session.commitTransaction();
    return res
      .status(201)
      .json({ succes: true, message: "News created with success", news });
  } catch (error) {
    await session.abortTransaction();
    console.log("Error creating news: " + error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to create news",
      error: error.message,
    });
  } finally {
    await session.endSession();

    if (!files) return;

    files.forEach((file) => {
      fs.unlink(file.path, (err) => {
        console.log("Unable to unlink files");
      });
    });
  }
};

//get news
export const getNews = async (req, res) => {
  try {
    const news = await New.find();
    if (!news) {
      return res.status(404).json({
        success: false,
        error: "Could not get news",
      });
    }

    return res.status(200).json({
      success: true,
      message: "News found",
      news,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Could not get news",
      eror: error.message,
    });
  }
};

//delete news
export const deleteNews = async (req, res) => {
  const newsId = req.params.id;
  const { userId } = getAuth(req);

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const user = await New.findOne({ clerkId: userId });
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    if (!user.isAdmin) {
      await session.abortTransaction();
      return res.status(401).json({
        success: false,
        error: "Only admins can delete news",
      });
    }

    const deletedNews = await New.findByIdAndDelete(newsId).session(session);
    if (!deletedNews) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        error: "Could not get news",
      });
    }

    if (deleteNews.files) {
      const fileIds = deleteNews.files.map((file) => {
        file.split("/").pop().split(".")[0];
      });

      const deletedFileId = fileIds.map((file) => {
        cloudinary.uploader.destroy(file);
      });
      const deletedFile = await Promise.all(deletedFileId);

      const isDeleted = deletedFile.some(
        (de) => !de.result || de.result !== "ok"
      );
      if (!isDeleted)
        return res.status(500).json({
          success: false,
          message: "Could not delete file in storage",
        });
    }

    return res.status(200).json({
      success: true,
      message: "News deleted",
    });
  } catch (error) {
    console.log("Unable to delete news");
    await session.abortTransaction();
    return res.status(500).json({
      success: false,
      message: "Could not delete news",
      eror: error.message,
    });
  } finally {
    await session.endSession();
  }
};
