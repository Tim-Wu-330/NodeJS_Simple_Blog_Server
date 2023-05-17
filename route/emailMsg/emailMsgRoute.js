const express = require("express");
const {
  sendEmailMsgCtrl,
} = require("../../controllers/emailMsg/sendEmailMsgCtrl");
const authMiddleware = require("../../middlewares/auth/authMiddleWare.js");

const emailMsgRoutes = express.Router();

emailMsgRoutes.post("/", authMiddleware, sendEmailMsgCtrl);

module.exports = emailMsgRoutes;
