const express = require("express");
const dbConnect = require("./config/db/dbConnect");
const dotenv = require("dotenv");
const cors = require("cors");
dotenv.config();
const userRoutes = require("./route/users/usersRoute");
const { errorHandler, notFound } = require("./middlewares/error/errorHandler");
const postRoutes = require("./route/posts/postRoute");
const commentRoutes = require("./route/comments/commentRoute");
const emailMsgRoutes = require("./route/emailMsg/emailMsgRoute");
const categoryRoutes = require("./route/category/categoryRoute");
const app = express();

// console.log(app)
dbConnect();

// console.log(process.env)

// Middleware
app.use(express.json());
//cors
app.use(cors());
//usage of middleware
//Users route
app.use("/api/users", userRoutes);
//Post route
app.use("/api/posts", postRoutes);
//comment routes
app.use("/api/comments", commentRoutes);
//email routes
app.use("/api/email", emailMsgRoutes);
//category routes
app.use("/api/category", categoryRoutes);
// error handler
app.use(errorHandler);
app.use(notFound);

const PORT = process.env.PORT || 5000;

app.listen(5000, console.log(`Server is running ${PORT}`));
