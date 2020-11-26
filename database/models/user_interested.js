const mongoose = require('mongoose');
 
const UserInterestedSchema = new mongoose.Schema({
    user_id: String,
    username: String,
    post_id: String,
    post_title: String,
    date_interested: { type: Date, default: Date.now }
});
 
const UserInterested = mongoose.model('UserInterests', UserInterestedSchema);
 
module.exports = UserInterested;