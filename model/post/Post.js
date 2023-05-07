const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Post title is required"],
      tirm: true,
    },
    //Created by only category
    category: {
      type: String,
      required: [true, "Post category is required"],
    },
    isLiked: {
      type: Boolean,
      default: false,
    },
    isDisliked: {
      type: Boolean,
      default: false,
    },
    numViews: {
      type: Number,
      default: 0,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    disLikes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
    },
    description: {
      type: String,
      required: [true, "Post description is required"],
    },
    image: {
      type: String,
      default:
        "https://cdn.pixabay.com/photo/2023/02/05/17/25/leaves-7770035__340.jpg",
    },
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
    timestamps: true,
  },
);

//populate comments
postSchema.virtual("comments", {
  ref: "Comment", //Model type  reference the post id inside the Comment.js in comment model
  foreignField: "post", //not inside our own model in somewhere else, in Post.js of post
  localField: "_id",
});

//compile
const Post = mongoose.model("Post", postSchema);

module.exports = Post;
