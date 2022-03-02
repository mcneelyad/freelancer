const router = require('express').Router();
const passport = require('passport');
const bcrypt = require('bcrypt');

const User = require('../database/models/user');
const Post = require('../database/models/post');
const UserInterested = require('../database/models/user_interested');

const utils = require('./utils');

router.get("/", async (req, res) => {
    const posts = await Post.find({});
    res.render("pages/ideas", {
        posts,
    });
});

router.get("/new", (req, res) => {
    res.render("pages/new-idea");
});

router.get("/ideas/:id", async (req, res) => {
    const post = await Post.findById(req.params.id);
    const userInterests = await UserInterested.find({});

    res.render("pages/post", {
        userInterests,
        post,
        postID: post._id,
    });
});

router.post("/delete/:id", function (req, res) {
    Post.deleteOne({ _id: req.params.id })
        .then((result) => {
            res.redirect("/ideas");
        })
        .catch((error) => console.error(error));
});

router.post("/interested/:id", async (req, res) => {
    const post = await Post.findById(req.params.id);
    UserInterested.create(
        {
            user_id: userId,
            username: username,
            post_id: post._id,
            post_title: post.title,
        },
        (error) => {
            console.log(error);
        }
    );
    res.redirect("/user/" + userId);
});

router.post("/:id/edit", async (req, res) => {
    const post = await Post.findById(req.params.id);
    post.title = req.body.title;
    post.description = req.body.description;
    post.updated_at = utils.getCurrentDate();
    post.save();

    res.redirect("/ideas/" + req.params.id);
});

router.post("/save", (req, res) => {
    var title = req.body.title;
    var description = req.body.description;
    var posted_by = req.session.username;

    Post.create(
        {
            title: title,
            description: description,
            posted_by: posted_by,
        },
        (error, post) => {
            res.redirect("/ideas");
        }
    );
});

module.exports = router;