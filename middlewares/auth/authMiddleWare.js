const expressAsyncHandler = require("express-async-handler");

const jwt = require("jsonwebtoken");
const User = require("../../model/user/User");

const authMiddleware = expressAsyncHandler(async (req, res, next) => {
  let token;
  //use token to get the user info
  if (req.headers?.authorization?.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        //find the user by id using the same encoded string to decode
        const user = await User.findById(decoded?.id).select("-password");
        //attach the user to the request object and delete the password from the response, we don't want pass password to the user
        req.user = user;
        next(); //go to the next middleware
      }
    } catch (error) {
      throw new Error("Not authorized token expired, login again");
    }
  } else {
    throw new Error("There is no token attached to the header");
  }
});

module.exports = authMiddleware;
