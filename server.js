const express = require("express");
const path = require("path");
require("dotenv").config();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const bcrypt = require("bcrypt");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");

const utils = require("./src/utils");
const fs = require("fs");

const router = require("./src/router");
const ideaRouter = require("./src/ideaRouter");

const Post = require("./database/models/post");
const User = require("./database/models/user");
const UserInterested = require("./database/models/user_interested");

const axios = require("axios");

const app = express();

app.set("views/pages", path.join(__dirname, "views/pages"));
app.set("view engine", "ejs");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(flash());

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => console.log("database connected"))
  .catch((err) => console.error("Something went wrong", err));
mongoose.set("useCreateIndex", true);

const mongoStore = require("connect-mongo")(session);

app.use(
  require("express-session")({
    secret: process.env.SECRET_KEY,
    saveUninitialized: false,
    store: new mongoStore({
      mongooseConnection: mongoose.connection,
    }),
    resave: true,
    rolling: true,
    cookie: {
      expires: 60 * 1000 * 10,
    },
  })
);

app.use(function (req, res, next) {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.users = req.user || null;

  if (!req.session) res.render("pages/login");

  // SESSION VARIABLES
  userId = req.session.userId;
  firstName = req.session.firstName;
  lastName = req.session.lastName;
  username = req.session.username;
  isLoggedIn = req.session.loggedIn;
  next();
});

app.use(function middleware(req, res, next) {
  let user = req.session.username ? req.session.username : req.ip;
  var string =
    utils.getCurrentDate() + " " + user + " " + req.method + " " + req.path;
  // write to log.txt file
  fs.appendFile("log.txt", string + "\n", function (err) {
    if (err) throw err;
  });
  next();
});

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const LocalStrategy = require("passport-local").Strategy;
passport.use(
  new LocalStrategy(User.authenticate(), function (email, password, done) {
    User.findOne({ "local.email": email }, function (err, user) {
      if (err) return done(err);
      if (!user)
        return done(null, false, { message: "No user with this email." });
      if (!user.validPassword(password))
        return done(null, false, { message: "Oops! Incorrect password." });
      return done(null, user);
    });
  })
);

app.use("/ideas", ideaRouter);
app.use("/", router);

app.listen(4000, () => {
  console.log(`server started`);
});
