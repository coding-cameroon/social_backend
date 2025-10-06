import { Router } from "express";

import { likePost, getLikes } from "../controllers/like.controller.js";

import protectAuth from "../middlewares/auth.middleware.js";

const likeRouter = Router();
likeRouter.use(protectAuth);

// like post
likeRouter.post("/:id", likePost);

// get likes on post
likeRouter.get("/:id", getLikes);

export default likeRouter;
