import { Router } from "express";

import {
  createPost,
  deletePost,
  getPost,
  getPosts,
} from "../controllers/post.controller.js";

import upload from "../config/upload.js";
import protectAuth from "../middlewares/auth.middleware.js";

const postRouter = Router();
postRouter.use(protectAuth);

postRouter.post("/", upload.single("image"), createPost);
postRouter.get("/", getPosts);
postRouter.get("/:id", getPost);
postRouter.delete("/:id", deletePost);

export default postRouter;
