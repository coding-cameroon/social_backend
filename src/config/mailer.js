import nodemailer from "nodemailer";

import { Env } from "./env.js";

const transpoter = nodemailer.createTransport({
  service: Env.SMTP_SERVICE,
  auth: {
    user: Env.OAUTH_USER,
    pass: Env.OAUTH_PASS,
  },
});

export default transpoter;
