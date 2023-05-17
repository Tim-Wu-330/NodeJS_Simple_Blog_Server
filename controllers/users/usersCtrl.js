const User = require("../../model/user/User");
const expressAsyncHandler = require("express-async-handler");
const generateToken = require("../../config/token/generateToken");
const crypto = require("crypto");
const sgMail = require("@sendgrid/mail");
const cloudinaryUploadImg = require("../../utils/cloudinary");
const fs = require("fs");
const validateMongodbId = require("../../utils/validateMongodbId");
const blockUser = require("../../utils/blockUser");
const { baseURL } = require("../../utils/baseURL");
sgMail.setApiKey(process.env.SEND_GRID_APT_KEY);

//-------------------------------------//
// Register
//-------------------------------------//

const userRegisterCtrl = expressAsyncHandler(async (req, res) => {
  // business logic
  // console.log(req.body);
  const userExist = await User.findOne({ email: req?.body?.email });

  if (userExist) throw new Error("User already exists");

  try {
    //Register new user
    const user = await User.create({
      firstName: req?.body?.firstName,
      lastName: req?.body?.lastName,
      email: req?.body?.email,
      password: req?.body?.password,
    });
    res.json(user);
  } catch (err) {
    res.json(err);
  }
});

//-------------------------------------//
// Login
//-------------------------------------//

const loginUserCtrl = expressAsyncHandler(async (req, res) => {
  // business logic
  //check if user exists
  const { email, password } = req.body;
  // check if password is match
  const userFound = await User.findOne({ email });
  blockUser(req.user);
  if (userFound && (await userFound.isPasswordMatched(password))) {
    res.json({
      _id: userFound?._id,
      firstName: userFound?.firstName,
      lastName: userFound?.lastName,
      email: userFound?.email,
      profilePhoto: userFound?.profilePhoto,
      isAdmin: userFound?.isAdmin,
      token: generateToken(userFound._id),
      isVerified: userFound?.isAccountVerified,
    });
  } else {
    res.status(401);
    throw new Error("Invalid  Login Credentials");
  }
});

//----------------------------------------------------------------
//Users
//----------------------------------------------------------------
const fetchUsersCtrl = expressAsyncHandler(async (req, res) => {
  // console.log(req.headers);
  try {
    const users = await User.find({}).populate("posts");
    res.json(users);
  } catch (error) {
    res.json(error);
  }
});

//----------------------------------------------------------------
//Delete user
//----------------------------------------------------------------
const deleteUsersCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);
  try {
    const deletedUsers = await User.findByIdAndDelete(id);
    res.json(deletedUsers);
  } catch (error) {
    res.json(error);
  }
});

//----------------------------------------------------------------
//user details
//----------------------------------------------------------------
const fetchUserDetailsCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  // check if user id is valid
  validateMongodbId(id);
  try {
    const user = await User.findById(id);
    res.json(user);
  } catch (err) {
    res.json(err);
  }
});

//----------------------------------------------------------------
// User profile
//----------------------------------------------------------------
const userProfileCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);
  //Get the login user
  const loginUserId = req?.user?._id?.toString();
  try {
    const myProfile = await User.findById(id)
      .populate("posts")
      .populate("viewedBy");
    const alreadyViewed = myProfile?.viewedBy?.find((user) => {
      return user?._id?.toString() === loginUserId;
    });
    if (alreadyViewed) {
      res.json(myProfile);
    } else {
      const profile = await User.findByIdAndUpdate(myProfile?._id, {
        $push: { viewedBy: loginUserId },
      });
      res.json(profile);
    }
  } catch (err) {
    res.json(err);
  }
});

//----------------------------------------------------------------
// Update profile
//----------------------------------------------------------------

const updateUserCtrl = expressAsyncHandler(async (req, res) => {
  const { _id } = req?.user;
  // userRoutes.put("/", authMiddleware, updateUserCtrl);
  // console.log(req);
  // req 到这已经是经过中间件解析token带上user的_id了
  //block
  blockUserCtrl(req?.user);
  validateMongodbId(_id);
  // console.log(validateMongodbId(id));
  const user = await User.findByIdAndUpdate(
    _id,
    {
      firstName: req?.body?.firstName,
      lastName: req?.body?.lastName,
      email: req?.body?.email,
      bio: req?.body?.bio,
    },
    {
      new: true,
      runValidators: true,
    },
  );
  res.json(user);
});

//----------------------------------------------------------------
// Update password
//----------------------------------------------------------------
const updateUserPasswordCtrl = expressAsyncHandler(async (req, res) => {
  //destructer the login user
  const { _id } = req.user;
  const { password } = req.body;
  // console.log(password);
  validateMongodbId(_id);
  // console.log(_id);

  //Find the user by _id
  const user = await User.findById(_id);
  if (password) {
    user.password = password;
    const updatedUser = await user.save();
    res.json(updatedUser);
  }
  res.json(user);
});

//----------------------------------------------------------------
// following
//----------------------------------------------------------------
const followingUserCtrl = expressAsyncHandler(async (req, res) => {
  // 1.Find the user you want to follow and update it's followers field
  // .2 Update the login user following field
  const { followId } = req.body;
  const loginUserId = req.user.id;
  // find the target user and check if the login id exists
  const targetUser = await User.findById(followId);
  const alreadyFollowing = targetUser?.followers?.find(
    (user) => user?.toString() === loginUserId.toString(),
  );
  if (alreadyFollowing) {
    throw new Error("You have already followed this user");
  }
  //1. Find the user you want to follow and update it's followers field
  await User.findByIdAndUpdate(
    followId,
    { $push: { followers: loginUserId } },
    { new: true },
  );

  //2. Update the login user following field
  await User.findByIdAndUpdate(
    loginUserId,
    { $push: { following: followId }, isFollowing: true },
    { new: true },
  );
  res.json("You have successfully followed this user");
});

//----------------------------------------------------------------
// unfollow
//----------------------------------------------------------------
const unfollowUserCtrl = expressAsyncHandler(async (req, res) => {
  const { unfollowId } = req.body;
  const loginUserId = req.user.id;

  await User.findByIdAndUpdate(
    unfollowId,
    { $pull: { followers: loginUserId } },
    { new: true },
  );

  //2. Update the login user following field
  await User.findByIdAndUpdate(
    loginUserId,
    { $pull: { following: unfollowId }, isFollowing: false },
    { new: true },
  );
  res.json("You have successfully unfollowed this user");
});

//----------------------------------------------------------------
//Block user
//----------------------------------------------------------------

const blockUserCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);

  const user = await User.findByIdAndUpdate(
    id,
    {
      isBlocked: true,
    },
    { new: true },
  );
  res.json(user);
});

//----------------------------------------------------------------
//UnBlock user
//----------------------------------------------------------------

const unBlockUserCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);

  const user = await User.findByIdAndUpdate(
    id,
    {
      isBlocked: false,
    },
    { new: true },
  );
  res.json(user);
});
//----------------------------------------------------------------
// Generate Email Verification Token
//----------------------------------------------------------------
const generateVerificationTokenCtrl = expressAsyncHandler(async (req, res) => {
  const loginUserId = req.user.id;
  const user = await User.findById(loginUserId);
  // console.log(user);
  try {
    // Generate token
    const verificationToken = await user.createAccountVerificationToken();
    // save the user
    await user.save();
    // console.log(verificationToken);
    // Build your message
    const resetURL = `If you were requested to verify your account, verify now within 10 minutes, otherwise ignore this message <a href="${baseURL}/verify-account/${verificationToken}">Click to verify your account</a>`;
    const msg = {
      to: user?.email,
      from: "tim.wu330702@gmail.com",
      subject: "Verify your account",
      html: resetURL,
    };
    await sgMail.send(msg);
    res.json(resetURL);
  } catch (err) {}
});

//-----------------
// Account Verification
//-----------------

const accountVerificationCtrl = expressAsyncHandler(async (req, res) => {
  const { token } = req.body;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  //find this user by token
  const userFound = await User.findOne({
    accountVerificationToken: hashedToken,
    accountVerificationTokenExpires: { $gt: new Date() },
  });
  if (!userFound) throw new Error("Token expired, try again later");
  //update the property to true
  userFound.isAccountVerified = true;
  userFound.accountVerificationToken = undefined;
  userFound.accountVerificationTokenExpires = undefined;
  await userFound.save();
  res.json(userFound);
});

//----------------------------------------------------------------
// Forget token generator
//----------------------------------------------------------------

const forgetPasswordToken = expressAsyncHandler(async (req, res, next) => {
  // find the user by their email
  const { email } = req.body;
  // console.log(email);
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");
  // console.log(baseURL);
  try {
    const token = await user.createPasswordResetToken();
    // console.log(token);
    await user.save();
    // Build your message
    const resetURL = `If you were requested to reset your password, reset now within 10 minutes, otherwise ignore this message <a href="${baseURL}/reset-password/${token}">Click to verify your account</a>`;
    const msg = {
      to: email,
      from: "tim.wu330702@gmail.com",
      subject: "Reset Password",
      html: resetURL,
    };
    await sgMail.send(msg);
    return res.json({
      msg: `A verification message is successfully sent to ${user?.email}. Reset now within 10 minutes, ${resetURL}`,
    });
  } catch (err) {
    res.json(err);
  }
});
//----------------------------------------------------------------
// Password reset
//----------------------------------------------------------------
const passwordResetCtrl = expressAsyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  //find this user by token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) throw new Error("Token Expired, try again later");
  // Update/ change the password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetxpires = undefined;
  await user.save();
  res.json(user);
});

//----------------------------------------------------------------
// Profile photo upload
//----------------------------------------------------------------
const profilePhotoUploadCtrl = expressAsyncHandler(async (req, res) => {
  //Find the login user
  const { _id } = req.user;
  //block user
  blockUserCtrl(req.user);
  //1. Get the path to img
  const localPath = `public/images/profile/${req.file.filename}`;
  //2. Upload to cloudinary
  const imgUploaded = await cloudinaryUploadImg(localPath);

  const foundUser = await User.findByIdAndUpdate(
    _id,
    {
      profilePhoto: imgUploaded.url,
    },
    { new: true },
  );
  //remove the saved img
  fs.unlinkSync(localPath);
  res.json(imgUploaded);
});

module.exports = {
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
};
