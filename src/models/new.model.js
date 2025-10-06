import mongoose from "mongoose";

const newsSchema = new mongoose.Schema(
  {
    user: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    image: {
      type: String,
    },
    content: {
      type: String,
    },
  },
  { timestamps: true }
);

const News = mongoose.model("News", newsSchema);
export default News;
