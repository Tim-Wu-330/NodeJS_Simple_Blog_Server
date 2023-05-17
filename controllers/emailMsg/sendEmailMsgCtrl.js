const expressAsyncHandler = require("express-async-handler");
const sgMail = require("@sendgrid/mail");
const emailMsg = require("../../model/emailMessaging/emailMessaging.js");
const Filter = require("bad-words");

const sendEmailMsgCtrl = expressAsyncHandler(async (req, res) => {
  const { to, subject, message } = req.body;
  // console.log(req.body);
  // console.log(req.user);
  //get the message
  const emailMessage = subject + " " + message;
  //prevent profanity/bad words
  const filter = new Filter();
  const isProfane = filter.isProfane(emailMessage);
  if (isProfane) {
    throw new Error("Email sent failed, because it contains profane words.");
  }
  try {
    //build up msg
    const msg = {
      to,
      subject,
      text: message,
      from: "tim.wu330702@gmail.com",
    };
    // send msg
    await sgMail.send(msg);
    //save to our db
    await emailMsg.create({
      sentBy: req?.user?._id,
      from: req?.user?.email,
      to,
      message,
      subject,
    });
    res.json("Mail sent");
  } catch (error) {
    res.json(error);
  }
});

module.exports = { sendEmailMsgCtrl };
