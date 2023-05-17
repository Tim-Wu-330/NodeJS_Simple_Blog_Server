const expressAsyncHandler = require("express-async-handler");
const Post = require("../../model/post/Post");
const validateMongodbId = require("../../utils/validateMongodbId");
const Filter = require("bad-words");
const User = require("../../model/user/User");
const cloudinaryUploadImg = require("../../utils/cloudinary");
const fs = require("fs");
const blockUser = require("../../utils/blockUser");
//----------------------------------------------------------------
//Create post
//----------------------------------------------------------------
const createPostCtrl = expressAsyncHandler(async (req, res) => {
  //   console.log(req.file);
  const { _id } = req.user;
  //Display message if user is blocked
  blockUser(_id);
  // validateMongodbId(req.body.user);

  //Check for bad words
  const filter = new Filter();
  const isProfane =
    filter.isProfane(req.body.title) || filter.isProfane(req.body.description);
  //   console.log(isProfane);
  //Display message if user is blocked
  if (isProfane) {
    await User.findByIdAndUpdate(_id, {
      isBlocked: true,
    });
    throw new Error(
      "Creating Failed because it contains bad words and you have been blocked",
    );
  }

  //Prevent user f his account is a starter account
  // if (
  //   req?.user?.accountType === "Starter Account" &&
  //   req?.user?.postCount >= 2
  // ) {
  //   throw new Error(
  //     "Starter account can only create two posts. Get more followers!",
  //   );
  // }

  //1. Get the path to img
  const localPath = `public/images/post/${req.file.filename}`;
  //2. Upload to cloudinary
  const imgUploaded = await cloudinaryUploadImg(localPath);
  // res.json(imgUploaded);
  try {
    const post = await Post.create({
      ...req.body,
      image: imgUploaded?.url,
      user: _id,
    });
    //update the user post count
    await User.findByIdAndUpdate(
      _id,
      { $inc: { postCount: 1 } },
      { new: true },
    );

    //remove the saved img
    fs.unlinkSync(localPath);
    res.json(post);
  } catch (error) {
    res.json(error);
  }
});

//----------------------------------------------------------------
//Fetch all posts
//----------------------------------------------------------------
const fetchPostsCtrl = expressAsyncHandler(async (req, res) => {
  const hasCategory = req.query.category;
  try {
    //Check if it has a category
    if (hasCategory) {
      const posts = await Post.find({ category: hasCategory })
        .populate("user")
        .populate("comments")
        .sort("-createdAt");
      res.json(posts);
    } else {
      const posts = await Post.find({})
        .populate("user")
        .populate("comments")
        .sort("-createdAt");
      res.json(posts);
    }
  } catch (error) {
    if (!error?.response) throw error;
    return rejectWithValue(error?.response?.data);
  }
});

//----------------------------------------------------------------
//Fetch a single post
//----------------------------------------------------------------
const fetchPostCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);
  try {
    const post = await Post.findById(id)
      .populate("user")
      .populate("disLikes")
      .populate("likes")
      .populate("comments");
    //update number of views
    await Post.findByIdAndUpdate(
      id,
      {
        $inc: { numViews: 1 },
      },
      {
        new: true,
      },
    );
    res.json(post);
  } catch (error) {
    res.json(error);
  }
});

//----------------------------------------------------------------
// Update post
//----------------------------------------------------------------
const updatePostCtrl = expressAsyncHandler(async (req, res) => {
  // console.log(req.user);
  const { id } = req.params;
  // validateMongodbId(id);   Cannot set headers after they are sent to the client
  try {
    const post = await Post.findByIdAndUpdate(
      id,
      {
        ...req.body,
        user: req.user?._id,
      },
      {
        new: true,
      },
    );
    res.json(post);
  } catch (error) {
    res.json(error);
  }
});

//----------------------------------------------------------------
//Delete post
//----------------------------------------------------------------

const deletePostCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);
  try {
    const post = await Post.findOneAndDelete(id);
    res.json(post);
  } catch (error) {
    res.json(error);
  }
});

//----------------------------------------------------------------
//Likes
//----------------------------------------------------------------

const toggleAddLikeToPostCtrl = expressAsyncHandler(async (req, res) => {
  //1.Find the post to be liked
  // console.log(req.user);
  const { postId } = req.body;
  const post = await Post.findById(postId);
  //2. Find the login user to be liked
  const loginUserId = req?.user?._id;
  //3. Find is this user has liked this post?
  const isLiked = post?.isLiked;
  //4. Check if this user has dislike this post
  const alreadyDisliked = post?.disLikes?.find(
    (userId) => userId?.toString() === loginUserId?.toString(),
  );
  //5. remove the user from the dislikes array if exists
  // console.log(alreadyDisliked);
  if (alreadyDisliked) {
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { disLikes: loginUserId },
        isDisliked: false,
      },
      { new: true },
    );
  }
  //Toggle
  //Remove the user if he has likes the post
  if (isLiked) {
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { likes: loginUserId },
        isLiked: false,
      },
      { new: true },
    );
    res.json(post);
  } else {
    //add to dislikes
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $push: { likes: loginUserId },
        isLiked: true,
      },
      { new: true },
    );
    res.json(post);
  }
});

//----------------------------------------------------------------
//disLikes
//----------------------------------------------------------------
const toggleAddDisLikeToPostCtrl = expressAsyncHandler(async (req, res) => {
  //1.Find the post to be disLiked
  const { postId } = req.body;
  const post = await Post.findById(postId);
  //2.Find the login user
  const loginUserId = req?.user?._id;
  //3.Check if this user has already disLikes
  const isDisliked = post?.isDisliked;
  //4.Check if already like this post
  const alreadyLiked = post?.likes?.find(
    (userId) => userId.toString() === loginUserId?.toString(),
  );
  //5. remove the user from the likes array if exists
  if (alreadyLiked) {
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { likes: loginUserId },
        isLiked: false,
      },
      { new: true },
    );
  }
  //Toggle
  //Remove the user if he has likes the post
  if (isDisliked) {
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { disLikes: loginUserId },
        isDisliked: false,
      },
      { new: true },
    );
    res.json(post);
  } else {
    //add to likes
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $push: { disLikes: loginUserId },
        isDisliked: true,
      },
      { new: true },
    );
    res.json(post);
  }
});

module.exports = {
  createPostCtrl,
  fetchPostsCtrl,
  fetchPostCtrl,
  updatePostCtrl,
  deletePostCtrl,
  toggleAddLikeToPostCtrl,
  toggleAddDisLikeToPostCtrl,
};
