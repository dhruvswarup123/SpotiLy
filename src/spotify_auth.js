/*
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */
var express = require('express'); // Express web server framework
var cors = require('cors');
const fs = require("fs")
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
const path = require('path');

var LOGIN_CACHE = path.resolve(__dirname, '.login_cache');
var redirect_uri = "http://localhost:8000/callback";
var access_token;
var refresh_token;
var client_id;
var client_secret;

function set_auth_details_spotify_auth(client_id_, client_secret_){
  client_id = client_id_;
  client_secret = client_secret_;
}

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();
app.use(express.static('public'))

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-playback-state user-modify-playback-state';
  response = res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});


app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code',
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        access_token = body.access_token;
        refresh_token = body.refresh_token;
        fs.writeFileSync(LOGIN_CACHE, JSON.stringify({"access_token":access_token, "refresh_token":refresh_token}))
        set_tokens(access_token, refresh_token);
        let repeatInterval = Math.floor((0.9 * body.expires_in) * 1000);
        setTimeout(refresh_token_func, repeatInterval);
        console.log("Refreshing token in " + repeatInterval + "ms");
        res.redirect("/auth_done.html");

      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

function refresh_token_func(){
  // requesting access token from refresh token
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      access_token = body.access_token;
      let repeatInterval = Math.floor((0.9 * body.expires_in) * 1000);
      setTimeout(refresh_token_func, 2000);
      console.log("Refreshing token in " + repeatInterval + "ms");
      console.log(body)
      set_tokens(access_token, refresh_token);  
      fs.writeFileSync(LOGIN_CACHE, JSON.stringify({"access_token":access_token, "refresh_token":refresh_token}))
    }
    else{
      console.log("Error: Refresh failed. Log in again!")
      login_spotify()
    }
  });
}

app.get('/refresh_token', function(req, res) {
  refresh_token_func();
});

var server;
function start_server(){
  console.log('Listening on 8000');
  server = app.listen(8000);
}
