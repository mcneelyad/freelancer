const bcrypt = require('bcrypt')
const mongoose = require('mongoose')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema  = new mongoose.Schema({
    firstName: {
        type: String,
        required : true
    },
    lastName: {
        type: String,
        required : true
    },
    username: {
        type: String,
        required : true,
        unique: true
    },
    email: {
        type: String,
        required : true,
    },
    password: {
        type: String,
        required : true
    },
    date: {
        type: Date,
        default : Date.now
    }
});

UserSchema.pre('save', function (next) {
    const user = this;
 
    bcrypt.hash(user.password, 10, function (error, encrypted) {
        user.password = encrypted;
        next()
    })
})

// plugin for passport-local-mongoose 
UserSchema.plugin(passportLocalMongoose); 
 
module.exports = mongoose.model('User', UserSchema)