import { Router } from "express";

import {
  followUser,
  getCurrentUser,
  getUser,
  syncUser,
  updateUserProfile,
} from "../controllers/user.controller.js";
import protectAuth from "../middlewares/auth.middleware.js";

const userRouter = Router();

userRouter.use(protectAuth);

// sync user up
userRouter.post("/sync", syncUser);
userRouter.get("/me", getCurrentUser);

// update profile
userRouter.put("/", upload.single("image"), updateUserProfile);

// get user
userRouter.get("/:username", getUser);

// follow others
userRouter.put("/:username/follow", followUser);

export default userRouter;
