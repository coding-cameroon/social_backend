import mongoose from "mongoose";

import { Env } from "./env.js";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(Env.MONGODB_URI);
    console.log("MongoDB connected with host: ", conn.connection.host);
  } catch (error) {
    console.log("Error connecting to DB: " + error.message);
    process.exit(1);
  }
};
export default connectDB;
