import { Router } from "express";

import {
  createComment,
  deleteComment,
  getComments,
} from "../controllers/comment.controller.js";
import protectAuth from "../middlewares/auth.middleware.js";

const commentRouter = Router();
commentRouter.use(protectAuth);

commentRouter.post("/:id", createComment);
commentRouter.get("/:id", getComments);
commentRouter.delete("/:id", deleteComment);

export default commentRouter;
