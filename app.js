// configure ssl in nodejs
var https = require('https');
var fs    = require('fs'); // file system module  // server will throw a

var express        = require('express'),
    bodyParser     = require('body-parser'),
    cookieParser   = require('cookie-parser'),
    expressSession = require('express-session'),
    passport       = require('passport'),
    passportLocal  = require('passport-local'),
    passportHttp   = require('passport-http'),
    app            = express();


var server = https.createServer({
  cert: fs.readFileSync( __dirname + '/my.crt' ), // ssl certificate
  key:  fs.readFileSync( __dirname + '/my.key' ), // certificate key
}, app);

app.set('view engine', 'ejs');

app.use( bodyParser.urlencoded({ extended: false }) );
app.use( cookieParser() );
app.use( expressSession({
  secret: process.env.SESSION_SECRET || 'thisiswhyimhotyouaintcuzyounot',
  resave: false,
  saveUninitialized: false
}));

app.use( passport.initialize() );
app.use( passport.session() );

passport.use( new passportLocal.Strategy( verifyCredentials ) );

passport.use( new passportHttp.BasicStrategy( verifyCredentials ) );

function verifyCredentials( username, password, done ){
  // pretend this is using a real db
  if( username === password )
    done( null, {id: username, name: username} );
  else
    done( null, null );
  // if error
    // done( new Error('ouch!') );
}

passport.serializeUser(function( user, done ){
  done( null, user.id );
});

passport.deserializeUser(function( id, done ){
  // query the database or cache here
  done( null, {id: id, name: id} );
});

app.get('/', function( req, res ){
  res.render('index', {
    isAuthenticated: req.isAuthenticated(),
    user: req.user
  });
});

app.get('/login', function( req, res ){
  res.render('login');
});

app.post('/login', passport.authenticate('local'), function( req, res ){
  res.redirect('/');
});

app.get('/logout', function( req, res ){
  req.logout();
  res.redirect('/');
});

app.use('/api', passport.authenticate('basic', {session: false}));

function ensureAuthenticated( req, res, next ){
  if( req.isAuthenticated() )
    next();
  else
    res.send(403); // returns/sends forbidden code to browser
}

app.get('/api/data', ensureAuthenticated, function( req, res ){
  res.json([
    {value: 'foo'},
    {value: 'bar'},
    {value: 'yep'}
  ]);
});

var port = process.env.PORT || 1337;

server.listen(port, function(){
  console.log("Listening here: http://localhost:"+port+'/');
});
