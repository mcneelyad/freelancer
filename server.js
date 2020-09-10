const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const bcrypt = require('bcrypt');
const session = require('express-session');
const connectMongo = require('connect-mongo');
const flash = require('express-flash');
const passport = require('passport');

const Post = require('./database/models/post');
const User = require('./database/models/user');

const app = express();

// set the view engine to ejs
app.set('views', path.join(__dirname, 'views')); // ../views has all your .ejs files 
app.set('view engine', 'ejs');

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect('mongodb://localhost:27017/freelancer', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => 'You are now connected to Mongo!')
    .catch(err => console.error('Something went wrong', err))
mongoose.set('useCreateIndex', true);

const mongoStore = connectMongo(session);

app.use(require("express-session")({ 
    secret: "HeYC1ttlI0vkDHpUWtd2XxA8j1XpIlnk", 
    resave: false, 
    saveUninitialized: false,
    store: new mongoStore({
        mongooseConnection: mongoose.connection
    })
})); 
  
app.use(passport.initialize()); 
app.use(passport.session()); 

passport.serializeUser(User.serializeUser()); 
passport.deserializeUser(User.deserializeUser()); 

const LocalStrategy = require('passport-local').Strategy; 
passport.use(new LocalStrategy(User.authenticate())); 

app.get('/', function(req, res) {
    res.render('pages/index');
});

app.get('/jobs', async (req, res) => {
    const posts = await Post.find({})
    res.render('pages/jobs', {
        posts
    })
});

app.get('/jobs/new', (req, res) => {
    res.render('pages/new-post')
});

app.get('/jobs/:id', async (req, res) => {
    const post = await Post.findById(req.params.id)
    res.render('pages/post', {
        post
    })
});

app.post('/jobs/save', (req, res) => {
    Post.create(req.body, (error, post) => {
        res.redirect('/jobs')
    })
});

app.get('/auth/login', function(req, res) {
    res.render('pages/login')
});

app.get("/auth/register", function (req, res) {
    res.render('pages/register')
});   

app.post('/auth/login', function(req, res) { 
    const { username, password } = req.body;

    User.findOne({ username }, (error, user) => {
        if (user) {
            bcrypt.compare(password, user.password, (error, same) => {
                if (same) {
                    console.log('login successful')
                    req.session.userId = user._id
                    
                    res.redirect('/jobs')
                } else {
                    console.log('login unsuccessful')
                    res.redirect('/auth/login')
                }
            })
        } else {
            console.log('user not found')
            return res.redirect('/auth/login')
        }
    }); 
});

app.post("/auth/register", async function (req, res) {
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;
    
    User.register(new User({ 
        username: username, 
        password: password,
        email: email 
    }), password, function (err, user) { 
        if (err) { 
            console.log('could not register')
            console.log(err); 
            return res.redirect("/auth/register"); 
        } 
        passport.authenticate("local")(req, res, function () { 
            res.redirect("/jobs"); 
        }); 
    }); 
});

app.listen(5000);
console.log(`server started`);