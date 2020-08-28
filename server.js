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

app.post("/auth/register", function (req, res) {
    const { username, email, password } = req.body;

    let errors = [];

    console.log('Name: ' + username+ ' , Email: ' + email+ ' , Password: ' + password);

    if(!username || !email || !password) {
        errors.push({msg : "Please fill in all required fields."})
    }

    if(password.length < 6 ) {
        errors.push({msg : 'Password must be at least 6 characters long.'})
    }
    if(errors.length > 0 ) {
        res.render('pages/register', {
            errors : errors,
            username : username,
            email : email,
            password : password
        })
    } else {
        //if it passes validation
        User.findOne({email : email}).exec((err,user) => {
            if(user) {
                errors.push({msg: 'Email is already registered'});
                render(res,errors,username,email,password);
            } else {
                const newUser = new User({ 
                    username : username, 
                    email : email, 
                    password : password
                });
                bcrypt.genSalt(10,(err,salt)=> 
                bcrypt.hash(newUser.password,salt, (err,hash) => {
                    if(err) throw err;
                    
                    //save pass to hash
                    newUser.password = hash;
                    
                    //save user
                    newUser.save().then((value) => {
                        res.redirect('/auth/login');
                    }).catch(value => console.log(value));
                      
                }));
            };
        }
    )};
});    
    

app.listen(5000);
console.log('server started');