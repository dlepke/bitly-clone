const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

const methodOverride = require('method-override');
app.use(methodOverride('_method'));

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ["hello"]
}));

const bcrypt = require('bcrypt');

app.set('view engine', 'ejs');

//end middleware implementing

let urlDatabase = {
  "b2xVn2": {
    "shortURL": "b2xVn2",
    "longURL": "http://www.lighthouselabs.ca",
    "owner": "hermione",
    "clicks": 0
  },
  "9sm5xK": {
    "shortURL": "9sm5xK",
    "longURL": "http://www.google.com",
    "owner": "ron",
    "clicks": 0
  }
};

let users = {
  "hermione": {
    userId: "hermione",
    email: "hermione@hogwarts.com",
    password: bcrypt.hashSync("ilovereading", 10)
  },
  "ron": {
    userId: "ron",
    email: "ron@hogwarts.com",
    password: bcrypt.hashSync("scabberssucks", 10)
  }
};


function generateRandomString() {
  const chars = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const length = 6;
  let result = '';
  for (let i = length; i > 0; i--) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}


app.get('/', (req, res) => {
  if (req.session.userId) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

app.get('/urls', (req, res) => {

  function urlsForUserLister(userIdHere) {
    let matchingUrls = {};
    for (let urlKey in urlDatabase) {
      if (urlDatabase[urlKey].owner === userIdHere) {
        matchingUrls[urlKey] = urlDatabase[urlKey];
      }
    }
    return matchingUrls;
  }

  if (req.session) {
    const currentUserId = req.session.userId;
    const urlsForUser = urlsForUserLister(currentUserId);
    const templateVars = {
      urls: urlsForUser,
      user: users[currentUserId]
    };
    res.render('urls_index', templateVars);
  } else {
    const templateVars = {
      user: undefined,
      urls: undefined
    };
    res.render('urls_index', templateVars);
  }
});

app.get('/urls/new', (req, res) => {
  if (req.session.userId) {
    const currentUserId = req.session.userId;
    const templateVars = { user: users[currentUserId] };
    res.render('urls_new', templateVars);
  } else {
    const currentUserId = req.session.userId;
    const templateVars = {
      user: users[currentUserId],
      fromUrlsNew: true
    };
    res.render('login', templateVars);
  }
});

app.get('/urls/:id', (req, res) => {
  const currentUserId = req.session.userId;
  if (!urlDatabase[req.params.id]) {
    res.render('error-code-pages/fourhundred-url');
  }
  const longURL = urlDatabase[req.params.id].longURL;
  const templateVars = {
    shortURL: req.params.id,
    longURL: longURL,
    user: users[currentUserId],
    owner: urlDatabase[req.params.id].owner,
    clicks: urlDatabase[req.params.id].clicks
  };
  res.render('urls_show', templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    let longURL = urlDatabase[req.params.shortURL]["longURL"];
    urlDatabase[req.params.shortURL].clicks += 1;
    res.redirect(longURL);
    return;
  } else {
    res.redirect('/fourhundred-url');
    return;
  }
});

app.get('/register', (req, res) => {
  const currentUserId = req.session.userId;
  const templateVars = { user: users[currentUserId] };

  if (req.session.userId) {
    res.redirect('/urls');
  }

  res.render('register', templateVars);
});

app.get('/fourhundred-email', (req, res) => {
  res.render('error-code-pages/fourhundred-email');
});

app.get('/login', (req, res) => {
  if (req.session.userId) {
    res.redirect('/urls');
  }
  const userId = req.session.userId;
  const templateVars = {
    user: users[userId],
    fromUrlsNew: false
  };
  res.render('login', templateVars);
});

app.get('/fourhundred-url', (req, res) => {
  res.render('error-code-pages/fourhundred-url');
});




app.delete('/urls/:id', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});




app.put('/urls/:id/edit', (req, res) => {
  urlDatabase[req.params.id]["shortURL"] = req.params.id;
  urlDatabase[req.params.id]["longURL"] = req.body.longURL;
  urlDatabase[req.params.id]["owner"] = req.session.userId;
  res.redirect(`/urls`);
});

app.post('/urls', (req, res) => {
  const randomString = generateRandomString();
  urlDatabase[randomString] = {
    "shortURL": randomString,
    "longURL": req.body.longURL,
    "owner": req.session.userId,
    "clicks": 0
  };
  //const templateVars = { longURL: req.body.longURL };
  res.redirect('/urls');
});

function validateUser(email, password) {
  let user = {};
  for (let userId in users) {
    if (users[userId].email === email && bcrypt.compareSync(password, users[userId].password)) {
      user = {
        email: email,
        password: password,
        userId: userId
      };
    }
  }
  if (user) {
    return user;
  } else {
    return false;
  }
}
app.put('/login', (req, res) => {
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  const user = validateUser(req.body.email, req.body.password);
  if (user.email) {
    req.session.email = req.body.email;
    req.session.password = hashedPassword;
    req.session.userId = user.userId;
    const templateVars = { user };
    res.redirect('/urls');
  } else {
    res.render('error-code-pages/fourohthree');
  }
});

app.put('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});




app.post('/register', (req, res) => {
  let userEmailArray = [];
  for (let userId in users) {
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
  let emailIsValid = true;
  for (let i in userEmailArray) {
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
    const randomID = generateRandomString();
    req.session.email = req.body.email;
    req.session.password = hashedPassword;
    req.session.userId = randomID;
    users[randomID] = {
      userId: randomID,
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




