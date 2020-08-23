const express = require('express');
const path = require('path')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')

//controllers
const createUserController = require("./controllers/createUser");
const storeUserController = require('./controllers/storeUser');

const Post = require('./database/models/post');

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
        console.log(req.body)
        res.redirect('/jobs')
    })
});

app.get('/auth/login', function(req, res) {
    res.render('pages/login');
});

app.get("/auth/register", createUserController);

app.listen(5000);
console.log('server started');