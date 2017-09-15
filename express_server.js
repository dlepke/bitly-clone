var express = require('express');
var app = express();
var PORT = process.env.PORT || 8080;

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ["hello"]
}));

const bcrypt = require('bcrypt');

app.set('view engine', 'ejs');

//end middle implementing

function generateRandomString() {
  var chars = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var length = 6;
  var result = '';
  for (var i = length; i > 0; i--) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

var urlDatabase = {
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

var users = {
  "hermione": {
    user_id: "hermione",
    email: "hermione@hogwarts.com",
    password: bcrypt.hashSync("ilovereading", 10)
  },
  "ron": {
    user_id: "ron",
    email: "ron@hogwarts.com",
    password: bcrypt.hashSync("scabberssucks", 10)
  }
};


app.get('/', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

app.get('/urls', (req, res) => {
  function urlsForUserLister(id) {
    var matchingUrls = {};
    for (var urlKey in urlDatabase) {
      if (urlDatabase[urlKey].urlUserId === id) {
        matchingUrls[urlKey] = urlDatabase[urlKey];
      }
    }
    return matchingUrls;
  }

  if (req.session.user_id) {
    let userId = req.session.user_id;
    var urlsForUser = urlsForUserLister(userId);
    let templateVars = {
      urls: urlsForUser,
      user: users[userId]
    };
    res.render('urls_index', templateVars);
  } else {
    let templateVars = {
      user: undefined,
      urls: undefined
    };
    res.render('urls_index', templateVars);
  }
});

app.get('/urls/new', (req, res) => {
  if (req.session.user_id) {
    let userId = req.session.user_id;
    let templateVars = { user: users[userId] };
    res.render('urls_new', templateVars);
  } else {
    let userId = req.session.user_id;
    let templateVars = {
      user: users[userId],
      fromUrlsNew: true
    };
    res.render('login', templateVars);
  }
});

app.get('/urls/:id', (req, res) => {
  let userId = req.session.user_id;
  if (!urlDatabase[req.params.id]) {
    res.redirect('/error-code-pages/fourhundred-url');
  }
  let longURL = urlDatabase[req.params.id].longURL;
  let templateVars = {
    shortURL: req.params.id,
    longURL: longURL,
    user: users[req.session.user_id],
    urlUserId: urlDatabase[req.params.id].urlUserId
  };
  res.render('urls_show', templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    let longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.redirect('/fourhundred-url');
  }
});

app.get('/register', (req, res) => {
  let userId = req.session.user_id;
  let templateVars = { user: users[userId] };

  if (req.session.user_id) {
    res.redirect('/urls');
  }

  res.render('register', templateVars);
});

app.get('/fourhundred-email', (req, res) => {
  res.render('error-code-pages/fourhundred-email');
});

app.get('/login', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  }
  let userId = req.session.user_id;
  let templateVars = {
    user: users[userId],
    fromUrlsNew: false
  };
  res.render('login', templateVars);
});

app.get('/fourhundred-url', (req, res) => {
  res.render('error-code-pages/fourhundred-url');
});




app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

app.post('/urls/:id/edit', (req, res) => {
  urlDatabase[req.params.id]["shortURL"] = req.params.id;
  urlDatabase[req.params.id]["longURL"] = req.body.longURL;
  urlDatabase[req.params.id]["user_id"] = req.session.user_id;
  res.redirect(`/urls`);
});

app.post('/urls', (req, res) => {
  const randomString = generateRandomString();
  urlDatabase[randomString] = {
    "shortURL": randomString,
    "longURL": req.body.longURL,
    "urlUserId": req.session.user_id
  };
  var templateVars = { longURL: req.body.longURL};
  res.redirect('/urls');
});



function validateUser(email, password) {
  var user = {};
  for (var userId in users) {
    if (users[userId].email === email && bcrypt.compareSync(password, users[userId].password)) {
      user = {
        email: email,
        password: password,
        user_id: userId
      };
    }
  }
  if (user) {
    return user;
  } else {
    return false;
  }
}

app.post('/login', (req, res) => {
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  var user = validateUser(req.body.email, req.body.password);
  if (user.email) {
    req.session.email = req.body.email;
    req.session.password = hashedPassword;
    req.session.user_id = user["user_id"];
    var templateVars = { user };
    res.redirect('/urls');
  } else {
    res.render('error-code-pages/fourohthree');
  }
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.post('/register', (req, res) => {
  let userEmailArray = [];
  for (var userId in users) {
    userEmailArray.push(users[userId].email);
  }
  function checkIfExisting(givenEmail, userEmail) {
    return givenEmail === userEmail;
  }
  function checkIfEmpty(givenEmail, givenPassword) {
    if (givenEmail === '' || givenPassword === '') {
      return true;
    }
    return false;
  }
  var emailIsValid = true;
  for (var i in userEmailArray) {
    if (checkIfExisting(req.body.email, userEmailArray[i])) {
      emailIsValid = false;
      break;
    }
  }
  if (checkIfEmpty(req.body.email, req.body.password)) {
    res.render('error-code-pages/fourohthree');
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
    };
    res.redirect('/urls');
  } else {
    res.redirect('/fourhundred-email');
  }
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);

});




