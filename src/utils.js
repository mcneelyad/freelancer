const moment = require('moment');

// function to get the current date as yyyy-mm-dd hh:mm:ss
function getCurrentDate() {
    return moment().format('YYYY/MM/D hh:mm:ss');
}

var todos = [
    {
      id: 1,
      title: "search bar for ideas",
      tag: "search",
      completed: false
    },
    {
      id: 2,
      title: "tags for each idea",
      tag: "tags",
      completed: false
    },
    {
      id: 3,
      title: "admin page",
      tag: "admin",
      completed: true
    },
    {
      id: 4,
      title: "username in the address bar",
      tag: "username",
      completed: true
    },
    {
      id: 5,
      title: "'updated_at' field for each idea",
      tag: "updated_at",
      completed: true
    }
  ]

module.exports = {
    getCurrentDate,
    todos
}