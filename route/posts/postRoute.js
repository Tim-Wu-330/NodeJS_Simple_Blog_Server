const express = require("express");
const {
  createPostCtrl,
  fetchPostsCtrl,
  fetchPostCtrl,
  updatePostCtrl,
  deletePostCtrl,
  toggleAddLikeToPostCtrl,
  toggleAddDisLikeToPostCtrl,
} = require("../../controllers/posts/postCtrl");
const authMiddleware = require("../../middlewares/auth/authMiddleWare");
const {
  photoUpload,
  postImgResize,
} = require("../../middlewares/uploads/photoUpload");

const postRoutes = express.Router();

postRoutes.post(
  "/",
  authMiddleware,
  photoUpload.single("image"),
  postImgResize,
  createPostCtrl,
);

postRoutes.get("/", fetchPostsCtrl);
postRoutes.get("/:id", fetchPostCtrl);
postRoutes.put("/:id", authMiddleware, updatePostCtrl);
postRoutes.delete("/:id", authMiddleware, deletePostCtrl);
postRoutes.put("/edit/likes", authMiddleware, toggleAddLikeToPostCtrl);
postRoutes.put("/edit/dislikes", authMiddleware, toggleAddDisLikeToPostCtrl);

module.exports = postRoutes;
