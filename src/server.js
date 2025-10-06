import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";

import { Env } from "./config/env.js";

import userRouter from "./routes/user.route.js";
import postRouter from "./routes/post.route.js";
import likeRouter from "./routes/like.route.js";
import commentRouter from "./routes/comment.route.js";
import notoficationRouter from "./routes/notofication.route.js";

const app = express();

// midllewares
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

// routes
app.use("/api/health", (_, res) => {
  res.send({ success: true, message: "Server is running" });
});

app.use("/api/users", userRouter);
app.use("/api/posts", postRouter);
app.use("/api/likes", likeRouter);
app.use("/api/comments", commentRouter);
app.use("/api/notifications", notoficationRouter);

const startServer = async () => {
  try {
    app.listen(Env.PORT, () => {
      console.log(
        `Server running on port: ${Env.PORT} and host http://localhost:${Env.PORT}/api`
      );
    });
  } catch (error) {
    console.log("Server crashed. Check and debug");
    process.exit(1);
  }
};

startServer();

export default app;
