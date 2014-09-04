
// server.js

require('coffee-script/register');

// Absolute imports.
// See https://gist.github.com/branneman/8048520#6-the-hack
process.env.NODE_PATH = '.';
require('module').Module._initPaths();

var nconf = require('./config/nconf')

// Nodetime stats
if (process.env.NODETIME_ACCOUNT_KEY) {
	require('nodetime').profile({
		accountKey: process.env.NODETIME_ACCOUNT_KEY,
		appName: 'QI LABS', // optional
	});
}

///////////////////////////////////////////////////////////////////////////////

// Utils
var _
, 	path 	= require('path')
, 	_ 		= require('lodash')

if (nconf.get('env') === 'production') {
	require('newrelic');
}

// Logging.
// Create before app is used as arg to modules.
var logger = require('./core/bunyan')();
logger.level(process.env.BUNYAN_LVL || "debug");

// module.exports.ga = require('universal-analytics')(nconf.get('GA_ID'));

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Server-related libraries
var __
,	express = require('express')
,	helmet 	= require('helmet')
, 	bParser	= require('body-parser')
,	passport= require('passport')
, 	http 	= require('http')
;

var app = express();

app.set('logger', logger);
app.use(function (req, res, next) {
	req.logger = logger;
	next();
});

var mongoose = require('./config/mongoose')(app);

/*
** Template engines and static files. **/
var swig = require('./core/swig')
app.engine('html', swig.renderFile);
app.set('view engine', 'html'); 			// make '.html' the default
app.set('views', nconf.get('viewsRoot')); 	// set views for error and 404 pages
app.set('view cache', false);
app.use(require('compression')());
app.use('/robots.txt', express.static(path.join(nconf.get('staticRoot'), 'robots.txt')));
app.use('/humans.txt', express.static(path.join(nconf.get('staticRoot'), 'humans.txt')));
app.use(require('serve-favicon')(path.join(nconf.get('staticRoot'), 'favicon.ico')));

if (nconf.get('env') === 'development') {
	swig.setDefaults({ cache: false });
}

/******************************************************************************/
/* BEGINNING of a DO_NOT_TOUCH_ZONE *******************************************/
app.use(helmet.defaults());
app.use(bParser.urlencoded({ extended: true }));
app.use(bParser.json());
app.use(require('method-override')());
app.use(require('express-validator')());
app.use(nconf.get('staticUrl'), express.static(nconf.get('staticRoot')));
app.use(require('cookie-parser')());
/** END of a DO_NOT_TOUCH_ZONE ----------------------------------------------**/
/**--------------------------------------------------------------------------**/


/******************************************************************************/
/** BEGINNING of a SHOULD_NOT_TOUCH_ZONE **************************************/
var session = require('express-session');
app.use(session({
	store: new (require('connect-mongo')(session))({ db: mongoose.connection.db }),
	// store: new (require('connect-redis')(session))({ url: process.env.REDISTOGO_URL || '' }),
	secret: process.env.SESSION_SECRET || 'mysecretes',
	cookie: {
		httpOnly: true,
		secure: false,
		// expires: new Date(Date.now() + 24*60*60*1000),
		maxAge: 24*60*60*1000,
	},
	rolling: true,
	resave: true,
	saveUninitialized: true,
}));
app.use(require('csurf')());
app.use(function(req, res, next){
	res.locals.token = req.csrfToken();	// Add csrf token to views's locals.
	next();
});
app.use(require('connect-flash')()); 	// Flash messages middleware
app.use(passport.initialize());
app.use(passport.session());
/** END of a SHOULD_NOT_TOUCH_ZONE ------------------------------------------**/
/**--------------------------------------------------------------------------**/

app.use(require('./core/middlewares/local_user'));
app.use(require('./core/reqExtender'));
app.use(require('./core/resExtender'));
require('./core/locals/all')(app);

/**--------------------------------------------------------------------------**/

app.use('/api', require('./api/controllers')(app));
app.use('/', require('./app/controllers')(app));

app.use(require('./core/middlewares/handle_404')); // Handle 404
app.use(require('./core/middlewares/handle_500')); // Handle 500 (and log)

var server = http.createServer(app);

process.on('exit', function() {
	logger.info('exit');
});

server.listen(nconf.get('PORT') || 3000, function () {
	logger.info('Server on port %d in mode %s', nconf.get('PORT') || 3000, nconf.get('env'));
});

module.exports = server;