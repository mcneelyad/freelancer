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

const app = express();

// set the view engine to ejs
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

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        req.isLogged = true
        return next();
    }
    res.redirect('/');
}

app.get('/', function (req, res) {
    res.render('pages/index', {
        userId: req.session.userId,
        firstName: req.session.firstName,
        username: req.session.username,
        isLoggedIn: req.session.loggedIn,
    });
});

app.get('/jobs', async (req, res) => {
    const posts = await Post.find({})
    res.render('pages/jobs', {
        posts,
        userId: req.session.userId,
        firstName: req.session.firstName,
        username: req.session.username,
        isLoggedIn: req.session.loggedIn,
    });
});

app.get('/jobs/new', (req, res) => {
    res.render('pages/new-post', {
        userId: req.session.userId,
        firstName: req.session.firstName,
        username: req.session.username,
        isLoggedIn: req.session.loggedIn,
    });
});

app.get('/jobs/:id', async (req, res) => {
    const post = await Post.findById(req.params.id)
    res.render('pages/post', {
        post,
        posted_by: post.posted_by,
        userId: req.session.userId,
        firstName: req.session.firstName,
        username: req.session.username,
        isLoggedIn: req.session.loggedIn,
    });
});

app.post('/jobs/delete/:id', function (req, res) {
    Post.deleteOne({ _id: req.params.id })
        .then(result => {
            res.redirect('/jobs')
        })
        .catch(error => console.error(error))

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

app.get('/user/:id', (req, res) => {
    res.render('pages/user', {
        userId: req.session.userId,
        firstName: req.session.firstName,
        lastName: req.session.lastName,
        email: req.session.email,
        username: req.session.username,
        isLoggedIn: req.session.loggedIn,
    });
});

app.get('/auth/login', function (req, res) {
    res.render('pages/login', {
        userId: req.session.userId,
        firstName: req.session.firstName,
        username: req.session.username,
        isLoggedIn: req.session.loggedIn
    });
});

app.get("/auth/register", function (req, res) {
    res.render('pages/register', {
        userId: req.session.userId,
        firstName: req.session.firstName,
        username: req.session.username,
        isLoggedIn: req.session.loggedIn
    });
});

app.post('/auth/login', function (req, res) {
    let errors = [];
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
                    req.flash('error', 'login unsuccessful')
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
            return res.redirect("/auth/register");
        }
        passport.authenticate("local")(req, res, function () {
            res.redirect("/auth/login");
        });
    });
});

app.post("/user/edit/:id", async (req, res) => {
    // console.log(req.body);
    let userId = req.params.id;
    const user = User.findByIdAndUpdate(userId, {
        $set: {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email
        }
    }, function (err) {
        if (err) console.log(err);
        res.render('pages/user', {
            userId: req.session.userId,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            username: req.session.username,
            email: req.body.email,
            isLoggedIn: req.session.loggedIn
        });
    });
});

app.get('/auth/logout', function (req, res) {
    req.session.destroy(() => {
        res.redirect('/')
    });
});

app.get("*", (req, res) => {
    res.render('pages/404');
})

app.listen(5000, () => {
    console.log(`server started`);
});
