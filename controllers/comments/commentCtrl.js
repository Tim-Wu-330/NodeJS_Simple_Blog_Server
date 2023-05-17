const expressAsyncHandler = require("express-async-handler");
const Comment = require("../../model/comment/Comment");
const validateMongodbId = require("../../utils/validateMongodbId");
const blockUser = require("../../utils/blockUser");

const createCommentCtrl = expressAsyncHandler(async (req, res) => {
  //1.Get the user
  const user = req.user;
  //Check if user is blocked
  blockUser(user);
  //2.Get the post Id
  const { postId, description } = req.body;
  // console.log(description);
  try {
    const comment = await Comment.create({
      post: postId,
      user,
      description,
    });
    res.send(comment);
  } catch (error) {
    res.send(error);
  }
});

//----------------------------------------------------------------
//fetch all comments
//----------------------------------------------------------------
const fetchAllCommentsCtrl = expressAsyncHandler(async (req, res) => {
  try {
    const comments = await Comment.find({}).sort("-createdAt");
    res.json(comments);
  } catch (error) {
    res.json(error);
  }
});

//----------------------------------------------------------------
//comment details
//----------------------------------------------------------------
const fetchCommentCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);
  try {
    const comment = await Comment.findById(id);
    res.json(comment);
  } catch (error) {
    res.json(error);
  }
  res.json("comment details");
});

//----------------------------------------------------------------
//Update
//----------------------------------------------------------------
const updateCommentCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);
  try {
    const update = await Comment.findByIdAndUpdate(
      id,
      {
        post: req.body?.postId,
        user: req?.user,
        description: req?.body?.description,
      },
      { new: true, runValidators: true },
    );
    res.json(update);
  } catch (error) {
    res.json(error);
  }
  res.json("comment update");
});

//-----------
//delete comment
//-----------
const deleteCommentCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);
  try {
    const comment = await Comment.findByIdAndDelete(id);
    res.json(comment);
  } catch (error) {
    res.json(error);
  }
  res.json("deleteCommentCtrl");
});

module.exports = {
  createCommentCtrl,
  fetchAllCommentsCtrl,
  fetchCommentCtrl,
  updateCommentCtrl,
  deleteCommentCtrl,
};
