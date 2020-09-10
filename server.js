const express = require('express');
const path = require('path')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')

const bcrypt = require('bcrypt')
const session = require('express-session');
const flash = require('connect-flash');

const Post = require('./database/models/post');
const User = require('./database/models/user')

const app = express();

// set the view engine to ejs
app.set('views', path.join(__dirname, 'views')); // ../views has all your .ejs files 
app.set('view engine', 'ejs');

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}));

mongoose.connect('mongodb://localhost:27017/freelancer', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => 'You are now connected to Mongo!')
    .catch(err => console.error('Something went wrong', err))

// use res.render to load up an ejs view file

// index page 
app.get('/', function(req, res) {
    res.render('pages/index');
});

// jobs page 
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

// app.post("/auth/login", function (req, res) {
//     const { email, password } = req.body;
//     console.log(req.body);
//     // try to find the user
//     User.findOne({ email }, (error, user) => {
//         if (user) {
//             // compare passwords.
//             bcrypt.compare(password, user.password, (error, same) => {
//                 if (same) {
//                     // store user session.
//                     console.log('user found')
//                     res.redirect('/jobs')
//                 } else {
//                     console.log('passwords dont match');
//                     res.redirect('/auth/login')
//                 }
//             })
//         } else {
//             console.log('user not found');
//             return res.redirect('/auth/login')
//         }
//     })
// });

// app.post("/auth/register", function (req, res) {
//     console.log(req.body);
//     User.create(req.body, (error, user) => {
//         if (error) {
//             console.log(error);
//             return res.render('pages/register')
//         }
//         res.redirect('/jobs')
//     })
// });

app.listen(5000);
console.log(`server started`);