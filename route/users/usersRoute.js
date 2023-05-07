const express = require("express");
const {
  userRegisterCtrl,
  loginUserCtrl,
  fetchUsersCtrl,
  deleteUsersCtrl,
  fetchUserDetailsCtrl,
  userProfileCtrl,
  updateUserCtrl,
  updateUserPasswordCtrl,
  followingUserCtrl,
  unfollowUserCtrl,
  blockUserCtrl,
  unBlockUserCtrl,
  generateVerificationTokenCtrl,
  accountVerificationCtrl,
  forgetPasswordToken,
  passwordResetCtrl,
  profilePhotoUploadCtrl,
} = require("../../controllers/users/usersCtrl");
const authMiddleware = require("../../middlewares/auth/authMiddleWare");
const {
  photoUpload,
  profilePhotoResize,
} = require("../../middlewares/uploads/photoUpload");
const userRoutes = express.Router();

userRoutes.post("/register", userRegisterCtrl);
userRoutes.post("/login", loginUserCtrl);
userRoutes.get("/", authMiddleware, fetchUsersCtrl);
userRoutes.get("/profile/:id", authMiddleware, userProfileCtrl);
userRoutes.put("/", authMiddleware, updateUserCtrl);
// userRoutes.put("/updateUserInfo/:id", authMiddleware, updateUserCtrl);
userRoutes.put("/password", authMiddleware, updateUserPasswordCtrl);
userRoutes.put("/block-user/:id", authMiddleware, blockUserCtrl);
userRoutes.put("/unblock-user/:id", authMiddleware, unBlockUserCtrl);
userRoutes.put("/follow", authMiddleware, followingUserCtrl);
userRoutes.post(
  "/generate-verify-email-token",
  authMiddleware,
  generateVerificationTokenCtrl,
);
userRoutes.put("/verify-account", authMiddleware, accountVerificationCtrl);
userRoutes.put(
  "/profilephoto-upload",
  authMiddleware,
  photoUpload.single("image"),
  profilePhotoResize,
  profilePhotoUploadCtrl,
);

userRoutes.put("/unfollow", authMiddleware, unfollowUserCtrl);
userRoutes.delete("/:id", deleteUsersCtrl);
userRoutes.get("/:id", fetchUserDetailsCtrl);
userRoutes.post("/forget-password-token", forgetPasswordToken);
userRoutes.post("/reset-password", passwordResetCtrl);

module.exports = userRoutes;
