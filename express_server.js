var express = require('express');
var app = express();
var PORT = process.env.PORT || 8080;


const bodyParser = require('body-parser');    //this is the middleware
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.set('view engine', 'ejs');

function generateRandomString() {
  var chars = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var length = 6;
  var result = '';
  for (var i = length; i > 0; i--) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

//this approach might produce duplicates of existing strings in use,
//so the same url -> different possible sources -> conflict

//could check for existing urls then if the one generated is already in use,
//go through and generate a new one for the same request

//console.log(generateRandomString()); --> it works!!

var urlDatabase = { //this is the database in use
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

var users = {
  "hermione": {
    id: "hermione",
    email: "hermione@hogwarts.com",
    password: "ilovereading"
  },
  "ron": {
    id: "ron",
    email: "ron@hogwarts.com",
    password: "scabberssucks"
  }
};




app.get('/', (req, res) => { //homepage currently just says 'Hello!'
  res.end("Hello!");
});

app.get('/urls.json', (req, res) => { //this just shows you the contents of the returned json object
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => { //this is just a random page
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get('/urls', (req, res) => {             //this is the list of urls and short urls (homepage-ish)
  let user_id = req.cookies["user_id"];
  let templateVars = { urls: urlDatabase,
                       user: users[user_id] };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {        //this is where you enter a new url to shorten
  let user_id = req.cookies["user_id"];
  let templateVars = { user: users[user_id] };
  res.render('urls_new', templateVars);
});

app.get('/urls/:id', (req, res) => { // this is where you view a specific url/short url pair
  let user_id = req.cookies["user_id"];
  let templateVars = { shortURL: req.params.id,
                       longURL: urlDatabase[req.params.id.toString()],
                       user: users[user_id] };
  res.render('urls_show', templateVars);
});

app.get("/u/:shortURL", (req, res) => { // this is what redirects when you click a short url
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get('/register', (req, res) => {
  let user_id = req.cookies["user_id"];
  let templateVars = { user: users[user_id] };
  res.render('register', templateVars);
})

app.get('/fourhundred', (req, res) => {
  res.render('fourhundred')
})

app.get('/login', (req, res) => {
  let user_id = req.cookies["user_id"];
  let templateVars = { user: users[user_id] };
  res.render('login', templateVars);
})




app.post('/urls/:id/delete', (req, res) => { //this handles delete requests
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
})

app.post('/urls/:id/edit', (req, res) => {
  let shortURL = req.params.id;
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls`);
})

app.post('/urls', (req, res) => { // this is what adds the new url/short url pair to the database object
  var randomString = generateRandomString();
  urlDatabase[randomString] = req.body.longURL;
  res.redirect(`/urls/${randomString}`);
});

app.post('/login', (req, res) => {
  for (var userId in users) {
    if (users[userId].email === req.body.email && users[userId].password === req.body.password) {
      res.cookie('email', req.body.email);
      res.cookie('password', req.body.password);
      res.cookie('user_id', userId);
      res.redirect('/urls');
      break;
    }
  }
  res.render('fourohthree')
})

app.post('/logout', (req, res) => {
  res.clearCookie('email');
  res.clearCookie('password');
  res.clearCookie('user_id');
  res.redirect('/urls');
})

app.post('/register', (req, res) => {
  let userEmailArray = [];
  for (var userId in users) {
    userEmailArray.push(users[userId].email);
  }

  function checkIfExisting(givenEmail, userEmail) {
    return givenEmail === userEmail;
  }

  var emailIsValid = true;
  for (var i in userEmailArray) {
    if (checkIfExisting(req.body.email, userEmailArray[i])) {
      emailIsValid = false;
      break;
    }
  }
  if (emailIsValid) {
    var randomID = generateRandomString();
    res.cookie('email', req.body.email);
    res.cookie('password', req.body.password);
    res.cookie('user_id', randomID);
    users[randomID] = {
      user_id: randomID,
      email: req.body.email,
      password: req.body.password
    }
    res.redirect('/urls');
  } else {
    res.redirect('/fourhundred')
  }
})


app.listen(PORT, () => {        //this is how the server 'listens' for requests
  console.log(`Example app listening on port ${PORT}!`);

});




//do we need to make it so added urls are only accessible by the user who created them

