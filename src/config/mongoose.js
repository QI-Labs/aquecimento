
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGOLAB_URI
	|| process.env.MONGOHQ_URL
	|| 'mongodb://localhost/madb');

module.exports = function () {

	var oldPath = process.env.NODE_PATH;
	// https://gist.github.com/branneman/8048520#6-the-hack
	process.env.NODE_PATH = '.';
	require('module').Module._initPaths();

	// We can't simply import all that's inside src/models, because some modules depend on the registration
	// of other models (having ran other modules).
	var models = ['player','problem'];
	for (var i=0; i<models.length; i++) {
	 	require('../models/'+models[i])();
	}

	// Re-set old NODE_PATH
	process.env.NODE_PATH = oldPath;
	require('module').Module._initPaths();

	return mongoose;
}