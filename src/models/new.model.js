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
    files: {
      type: Array,
    },
    content: {
      type: String,
    },
  },
  { timestamps: true }
);

const News = mongoose.model("News", newsSchema);
export default News;
