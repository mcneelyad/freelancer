const express = require('express');
const path = require('path')
const app = express();

const router = express.router;

// set the view engine to ejs
app.set('views', path.join(__dirname, 'views')); // ../views has all your .ejs files 
app.set('view engine', 'ejs');

// use res.render to load up an ejs view file

// index page 
app.get('/', function(req, res) {
    res.render('pages/index');
});

// jobs page 
app.get('/jobs', function(req, res) {
    res.render('pages/jobs');
});

app.listen(5000);
console.log('server started');