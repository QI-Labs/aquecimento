
// required.js

var mongoose = require('mongoose');
var _ = require('underscore');
var nconf = require('nconf');

function extendErr (err, label) {
	return _.extend(err,{required:(err.required||[]).concat(label)});
}

var permissions = {
	resources: {
		selfOwns: function (docId, req, res, callback) {
			if (''+req.user.facebook_id === nconf.get('facebook_me')) {
				callback();
				return;
			}
			Resource.findById(docId, req.handleErrResult(function (doc) {
				if (''+doc.author.id === ''+req.user.id) {
					callback();
				} else {
					callback({ required: 'resource.selfOwns' });
				}
			}));
		},
		selfDoesntOwn: function (docId, req, res, callback) {
			Resource.findById(docId, req.handleErrResult(function (doc) {
				if (''+doc.author.id === req.user.id) {
					callback({ required: 'resource.selfDoesntOwn' });
				} else {
					callback();
				}
			}));
		},
	},
};

module.exports = required = {
	logout: function (req, res, next) {
		if (req.user)
			next({permission:'logout'});
		else next();
	},
	login: function (req, res, next) {
		if (req.user) {
			next();
		} else {
			next({permission:'login'});
		}
	},
	isStaff: function (req, res, next) {
		// if (nconf.get('env') === "production" && (!req.user || !req.user.profile.isStaff))
		if (req.user && req.user.profile && req.user.profile.isStaff)
			next();
		else
			next({permission:'isStaff', args:[req.user && req.user.profile.isStaff]});
	},
	// Require user to be me. :D
	isMe: function (req, res, next) {
		console.log(nconf.get('facebook_me'))
		if (nconf.get('env') === "production" && (!req.user || req.user.facebook_id !== nconf.get('facebook_me')))
			next({permission:'isMe', args:[nconf.get('facebook_me'), req.user && req.user.facebook_id]});
		else
			next();
	},
	problems: {
		selfOwns: function (problemIdParam) {
			return function (req, res, next) {
				req.paramToObjectId(problemIdParam, function (problemId) {
					permissions.problems.selfOwns(problemId, req, res, function (err) {
						next( err ? extendErr(err, 'problems.selfOwns') : undefined);
					});
				});
			};
		},
	}
}