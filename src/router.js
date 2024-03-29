const router = require('express').Router();
const passport = require('passport');
const bcrypt = require('bcrypt');

const User = require('../database/models/user');
const Post = require('../database/models/post');
const UserInterested = require('../database/models/user_interested');

const utils = require('./utils');

router.get("/", async function (req, res) {
    var todos = utils.todos;
    res.render("pages/index", { todos });
});

router.get("/user/:username", async (req, res) => {
    const user = await User.findOne({ username: req.params.username });
    const userInterests = await UserInterested.find({
        username: req.params.username,
    });
    // const userInterests = await UserInterested.find({});
    const posts = await Post.find({});
    res.render("pages/user", {
        userInterests,
        posts,
        email: req.session.email,
    });
});

router.get("/auth/login", function (req, res) {
    res.render("pages/login");
});

router.get("/auth/register", function (req, res) {
    res.render("pages/register");
});

router.post("/auth/login", function (req, res) {
    const { username, password } = req.body;

    User.findOne({ username }, (error, user) => {
        if (user) {
            bcrypt.compare(password, user.password, (error, same) => {
                if (same) {
                    console.log("login successful");
                    req.session.loggedIn = true;
                    req.session.userId = user._id;
                    req.session.username = user.username;
                    req.session.firstName = user.firstName;
                    req.session.lastName = user.lastName;
                    req.session.email = user.email;

                    req.flash("success", "login successful");
                    res.redirect("/ideas");
                } else {
                    console.log("login unsuccessful");
                    req.flash("error", "email or password incorrect. please try again");
                    res.redirect("/auth/login");
                }
            });
        } else {
            console.log("user not found");
            req.flash("error", "user not found");
            return res.redirect("/auth/login");
        }
    });
});

router.post("/auth/register", async function (req, res) {
    var { username, password, firstName, lastName, email } = req.body;

    // check that no user curently has this username
    const user = await User.findOne({ username });
    if (user) {
        req.flash("error", "email or password incorrect. please try again");
        console.log("username already taken");
        return res.redirect("/auth/register");
    }

    User.register(
        new User({
            username: username,
            password: password,
            email: email,
            firstName: firstName,
            lastName: lastName,
        }),
        password,
        function (err, user) {
            if (err) {
                console.log("could not register");
                console.log(err);
                req.flash("error", "could not register user");
                res.redirect("/auth/login");
            }
            passport.authenticate("local")(req, res, function () {
                res.redirect("/auth/login");
            });
        }
    );
});

router.post("/user/edit/:id", async (req, res) => {
    let userId = req.params.id;

    const user = User.findByIdAndUpdate(
        userId,
        {
            $set: {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
            },
        },
        function (err) {
            if (err) console.log(err);
            req.session.firstName = req.body.firstName;
            req.session.lastName = req.body.lastName;
            req.session.email = req.body.email;
            res.redirect("/user/" + userId);
        }
    );
});

router.get("/auth/logout", function (req, res) {
    req.session.destroy(() => {
        res.redirect("/");
    });
});

router.get("/admin", async function (req, res) {
    console.log(isLoggedIn);
    if (isLoggedIn) {
        let user = await User.findById(req.session.userId);
        let adminAccess = await User.findById(req.session.userId).then((user) => {
            if (user.is_admin) {
                return true;
            } else {
                return false;
            }
        });

        if (adminAccess) {
            const posts = await Post.find({});
            const users = await User.find({});
            res.render("pages/admin", { posts, users });
        } else {
            res.redirect("/ideas");
        }
    } else {
        res.redirect("/auth/login");
    }
});

router.get("*", (req, res) => {
    res.render("pages/404");
});


module.exports = router;