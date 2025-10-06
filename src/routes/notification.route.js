import { Router } from "express";

import {
  deleteNotif,
  deleteNotifs,
  getNotifs,
} from "../controllers/notification.controller.js";
import protectAuth from "../middlewares/auth.middleware.js";

const notificationRouter = Router();
notificationRouter.use(protectAuth);

notificationRouter.delete("/:id", deleteNotif);
notificationRouter.delete("/", deleteNotifs);
notificationRouter.get("/", getNotifs);

export default notificationRouter;
