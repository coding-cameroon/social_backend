import { Router } from "express";

import {
  createNews,
  getNews,
  deleteNews,
} from "../controllers/news.controller.js";
import protectAuth from "../middlewares/auth.middleware.js";
import upload from "../config/upload.js";

const newsRouter = Router();
newsRouter.use(protectAuth);

newsRouter.post("/", upload.array("file"), createNews);
newsRouter.get("/", getNews);
newsRouter.delete("/:id", deleteNews);

export default newsRouter;
