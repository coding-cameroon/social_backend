import dotenv from "dotenv";

dotenv.config({ path: ".env", override: true, quiet: true });

export const Env = {
  PORT: process.env.PORT,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  MONGODB_URI: process.env.MONGODB_URI,
  SMTP_SERVICE: process.env.SMTP_SERVICE,
  OAUTH_USER: process.env.OAUTH_USER,
  OAUTH_PASS: process.env.OAUTH_PASS,
};
