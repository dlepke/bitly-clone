var express = require('express');
var app = express();
var PORT = process.env.PORT || 8080;


const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

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

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};



app.get('/', (req, res) => {
  res.end("Hello!");
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase,
                       longURL: urlDatabase[req.params.id] };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});

app.get('/urls/:id', (req, res) => {
  let templateVars = { shortURL: req.params.id,
                       urls: urlDatabase[req.params.id] };
  res.render('urls_show', templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});


app.post('/urls', (req, res) => {
  var randomString = generateRandomString();
  urlDatabase[randomString] = req.body.longURL;
  res.redirect(`/urls/${randomString}`);
  //res.send("Ok");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);

});





