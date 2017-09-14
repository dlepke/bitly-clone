var express = require('express');
var app = express();
var PORT = process.env.PORT || 8080;


const bodyParser = require('body-parser');    //this is the middleware
app.use(bodyParser.urlencoded({extended: true}));

const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ["hello"]
}));

const bcrypt = require('bcrypt');

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


var urlDatabase = { //this is the url database in use
  "b2xVn2": {
    "shortURL": "b2xVn2",
    "longURL": "http://www.lighthouselabs.ca",
    "urlUserId": "hermione"
  },
  "9sm5xK": {
    "shortURL": "9sm5xK",
    "longURL": "http://www.google.com",
    "urlUserId": "ron"
  }
};

var users = {   //this is where users are held, and new users sent
  "hermione": {
    id: "hermione",
    email: "hermione@hogwarts.com",
    password: bcrypt.hashSync("ilovereading", 10)
  },
  "ron": {
    id: "ron",
    email: "ron@hogwarts.com",
    password: bcrypt.hashSync("scabberssucks", 10)
  }
};


// function urlsForUser(id) {
//   var matchingUrls = {};
//   for (var urlKey in urlDatabase) {
//     if (urlDatabase[urlKey].urlUserId === id) {
//       matchingUrls[urlKey] = urlDatabase[urlKey];
//     }
//   }
//   return matchingUrls;
// }



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

  function urlsForUser(id) {
    var matchingUrls = {};
    for (var urlKey in urlDatabase) {
      if (urlDatabase[urlKey].urlUserId === id) {
        matchingUrls[urlKey] = urlDatabase[urlKey];
      }
    }
  return matchingUrls;
  }

  if (req.session.user_id) {
    let user_id = req.session.user_id;
    var urlsForUser = urlsForUser(user_id);
    let templateVars = { urls: urlsForUser,
                         user: users[user_id] };
    res.render('urls_index', templateVars);
  } else {
    let templateVars = { user: undefined,
                         urls: undefined };
    res.render('urls_index', templateVars);
  }
});

app.get('/urls/new', (req, res) => {        //this is where you enter a new url to shorten
  if (req.session.user_id) {
    let user_id = req.session.user_id;
    let templateVars = { user: users[user_id] };
    res.render('urls_new', templateVars);
  } else {
    let user_id = req.session.user_id;
    let templateVars = { user: users[user_id],
                         fromUrlsNew: true };
    res.render('login', templateVars);
  }
});

app.get('/urls/:id', (req, res) => { // this is where you view a specific url/short url pair
  let user_id = req.session.user_id;
  let longURL = urlDatabase[req.params.id].longURL
  let templateVars = { shortURL: req.params.id,
                       longURL: longURL, //toString() fixes weird problem where it was trying to convert id to a number
                       user: users[user_id] };
  res.render('urls_show', templateVars);
});

app.get("/u/:shortURL", (req, res) => { // this is what redirects when you click a short url
  let longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get('/register', (req, res) => {
  let user_id = req.session.user_id;
  let templateVars = { user: users[user_id] };
  res.render('register', templateVars);
})

app.get('/fourhundred', (req, res) => {
  res.render('fourhundred')
})

app.get('/login', (req, res) => {
  let user_id = req.session.user_id;
  let templateVars = { user: users[user_id],
                       fromUrlsNew: false };
  res.render('login', templateVars);
})




app.post('/urls/:id/delete', (req, res) => { //this handles delete requests
  if (req.session.user_id === urlDatabase[req.params.id].user_id) {
    delete urlDatabase[req.params.id];
    res.redirect('/urls');
  }
})

app.post('/urls/:id/edit', (req, res) => {
  urlDatabase[req.params.id]["shortURL"] = req.params.id;
  urlDatabase[req.params.id]["longURL"] = req.body.longURL;
  urlDatabase[req.params.id]["user_id"] = req.session.user_id;
  res.redirect(`/urls`);
})

app.post('/urls', (req, res) => { // this is what adds the new url/short url pair to the database object
  const randomString = generateRandomString();
  urlDatabase[randomString] = {
    "shortURL": randomString,
    "longURL": req.body.longURL,
    "urlUserId": req.session.user_id
  }
  var templateVars = { longURL: req.body.longURL}
  res.redirect(`/urls/${randomString}`);
});



function validateUser(email, password) {
  var user = {};
  for (var userId in users) {
    if (users[userId].email === email && bcrypt.compareSync(password, users[userId].password)) {
      user = {
        email: email,
        password: password,
        user_id: userId
      }
    }
  }
  return user;
}

app.post('/login', (req, res) => {
  const hashedPassword = bcrypt.hashSync(req.body.password, 10)
  var user = validateUser(req.body.email, req.body.password);
  if (user) {
    req.session.email = req.body.email;
    req.session.password = hashedPassword;
    req.session.user_id = user["user_id"];
    var templateVars = { user };
    res.redirect('/urls');
  } else {
    res.render('fourohthree');
  }
})

app.post('/logout', (req, res) => {
  req.session = null;
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
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  if (emailIsValid) {
    var randomID = generateRandomString();
    req.session.email = req.body.email;
    req.session.password = hashedPassword;
    req.session.user_id = randomID;
    users[randomID] = {
      user_id: randomID,
      email: req.body.email,
      password: hashedPassword
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

