const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const bcrypt = require('bcrypt');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');

const Post = require('./database/models/post');
const User = require('./database/models/user');
const UserInterested = require('./database/models/user_interested');

const app = express();

app.set('views/pages', path.join(__dirname, 'views/pages'));
app.set('view engine', 'ejs');

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));

app.use(flash());

mongoose.connect('mongodb://localhost:27017/freelancer',
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false
    })
    .then(() => 'You are now connected to Mongo!')
    .catch(err => console.error('Something went wrong', err))
mongoose.set('useCreateIndex', true);

const mongoStore = require('connect-mongo')(session);

app.use(require("express-session")(
    {
        secret: "HeYC1ttlI0vkDHpUWtd2XxA8j1XpIlnk",
        saveUninitialized: false,
        store: new mongoStore({
            mongooseConnection: mongoose.connection
        }),
        resave: true,
        rolling: true,
        cookie: {
            expires: 60 * 1000 * 10
        }
    }
));

app.use(function (req, res, next) {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.users = req.user || null;

    if (!req.session) res.render('pages/login');
    
    // SESSION VARIABLES
    userId = req.session.userId;
    firstName = req.session.firstName;
    lastName = req.session.lastName;
    username = req.session.username;
    isLoggedIn = req.session.loggedIn;
    next();
});

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy(User.authenticate(),
    function (email, password, done) {
        User.findOne({ 'local.email': email }, function (err, user) {
            if (err)
                return done(err);
            if (!user)
                return done(null, false, { message: 'No user with this email.' });
            if (!user.validPassword(password))
                return done(null, false, { message: 'Oops! Incorrect password.' });
            return done(null, user);
        })
    }));

app.get('/', function (req, res) {
    res.render('pages/index');
});

app.get('/jobs', async (req, res) => {
    const posts = await Post.find({})
    res.render('pages/jobs', {
        posts
    });
});

app.get('/jobs/new', (req, res) => {
    res.render('pages/new-post');
});

app.get('/jobs/:id', async (req, res) => {
    const post = await Post.findById(req.params.id)
    const userInterests = await UserInterested.find({});
    
    res.render('pages/post', {
        userInterests,
        post,
        posted_by: post.posted_by,
        postID: post._id
    });
});

app.post('/jobs/delete/:id', function (req, res) {
    Post.deleteOne({ _id: req.params.id })
        .then(result => {
            res.redirect('/jobs')
        })
        .catch(error => console.error(error));
});

app.post('/jobs/interested/:id', async (req, res) => {
    const post = await Post.findById(req.params.id);
    UserInterested.create({
        user_id: userId,
        username: username,
        post_id: post._id,
        post_title: post.title
    }, (error) => {
        console.log(error);
    });
    res.redirect('/user/'+userId);
});

app.post('/jobs/save', (req, res) => {
    var title = req.body.title;
    var description = req.body.description;
    var posted_by = req.session.username;

    Post.create({
        title: title,
        description: description,
        posted_by: posted_by
    }, (error, post) => {
        res.redirect('/jobs')
    })
});

app.get('/user/:id', async (req, res) => {
    const userInterests = await UserInterested.find({});
    const posts = await Post.find({});
    res.render('pages/user', {
        userInterests,
        posts,
        email: req.session.email
    });
});

app.get('/auth/login', function (req, res) {
    res.render('pages/login');
});

app.get("/auth/register", function (req, res) {
    res.render('pages/register');
});

app.post('/auth/login', function (req, res) {
    const { username, password } = req.body;

    User.findOne({ username }, (error, user) => {
        if (user) {
            bcrypt.compare(password, user.password, (error, same) => {
                if (same) {
                    console.log('login successful')
                    req.session.loggedIn = true;
                    req.session.userId = user._id;
                    req.session.username = user.username;
                    req.session.firstName = user.firstName;
                    req.session.lastName = user.lastName;
                    req.session.email = user.email;

                    req.flash('success', 'login successful')
                    res.redirect('/jobs')
                } else {
                    console.log('login unsuccessful')
                    req.flash('error', 'email or password incorrect. please try again')
                    res.redirect('/auth/login')
                }
            })
        } else {
            console.log('user not found')
            req.flash('error', 'user not found')
            return res.redirect('/auth/login')
        }
    });
});

app.post("/auth/register", async function (req, res) {

    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;
    var firstName = req.body.firstName;
    var lastName = req.body.lastName;

    User.register(new User({
        username: username,
        password: password,
        email: email,
        firstName: firstName,
        lastName: lastName
    }), password, function (err, user) {
        if (err) {
            console.log('could not register')
            console.log(err)
            req.flash('error', 'could not register user')
            res.redirect("/auth/login");
        }
        passport.authenticate("local")(req, res, function () {
            res.redirect("/auth/login");
        });
    });
});

app.post("/user/edit/:id", async (req, res) => {
    const userInterests = await UserInterested.find({});   
    const posts = await Post.find({}); 
    let userId = req.params.id;
    const user = User.findByIdAndUpdate(userId, {
        $set: {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email
        }
    }, function (err) {
        if (err) console.log(err);
    });
    console.log(user);
    res.redirect('/user/'+userId);
    // , {
    //     userInterests: userInterests,
    //     email: req.body.email,
    //     posts
    // });
});

app.get('/auth/logout', function (req, res) {
    req.session.destroy(() => {
        res.redirect('/')
    });
});

app.get("*", (req, res) => {
    res.render('pages/404');
})

app.listen(4000, () => {
    console.log(`server started`);
});