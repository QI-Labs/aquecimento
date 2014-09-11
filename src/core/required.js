
// required.js

var mongoose = require('mongoose');
var _ = require('underscore');
var nconf = require('nconf');

function extendErr (err, label) {
	return _.extend(err,{required:(err.required||[]).concat(label)});
}

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
	// problems: {
	// 	selfOwns: function (problemIdParam) {
	// 		return function (req, res, next) {
	// 			req.paramToObjectId(problemIdParam, function (problemId) {
	// 				permissions.problems.selfOwns(problemId, req, res, function (err) {
	// 					next( err ? extendErr(err, 'problems.selfOwns') : undefined);
	// 				});
	// 			});
	// 		};
	// 	},
	// }
}