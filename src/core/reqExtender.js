
mongoose = require('mongoose')
_ = require('underscore')
async = require('async')

module.exports = function (req, res, next) {

	req.handleErrResult = function (callback, options) {
		var self = this;
		return function (err, result) {
			if (err) {
				return next({ type:"ErrResult", status: 400, args:_.extend({err:err},options) });
			} else if (!result) {
				return next({ type:"ObsoleteId", status: 404, args:_.extend({err:err},options) });
			} else {
				return callback.apply(self, [].splice.call(arguments,1));
			}
		}
	};
	
	req.handleErrValue = function (callback, options) {
		var self = this;
		return function (err, result) {
			if (err) {
				return next({ type:"ErrResult", status: 400, args:_.extend({err:err},options) });
			} else {
				return callback.apply(self, [].splice.call(arguments,1));
			}
		}
	};

	req.paramToObjectId = function (param, callback) {
		if (typeof req.params[param] === 'undefined') {
			console.trace();
			throw "Fatal error: parameter '"+param+"' doesn't belong to url.";
		}

		if (arguments.length === 2) { // Async call
			try {
				var id = mongoose.Types.ObjectId.createFromHexString(req.params[param]);
			} catch (e) {
				next({ type: "InvalidId", args:param, value:req.params[param]});
			}
			callback(id);
		} else { // Sync call
			try {
				return new mongoose.Types.ObjectId.createFromHexString(req.params[param])
			} catch (e) {
				return false;
			}
		}
	};

	req.logMe = function () {
		console.log.apply(console, ["<"+req.user.username+">:"].concat([].slice.call(arguments)));
	};

	req.parse = function (rules, cb) {
		function flattenObjList (list) {
			if (list.length)
				return _.reduce(list, function (a, b) { return _.extend({}, a, b); });
			return [];
		}

		function parseObj (pair, rule, cb) {
			var key = pair[0], obj = pair[1];

			if (typeof rule === 'undefined') {
				// console.warn("No rule defined for key "+key);
				cb();
				return;
			} if (rule === false) { // ignore object
				cb();
				return;
			} if (rule.$required !== false && typeof obj === 'undefined' && obj) { // default is required
				cb("Attribute '"+key+"' is required.");
				return;
			} else if (rule.$valid) {
				try {
					if (!rule.$valid(obj)) {
						cb("Attribute '"+key+"' fails validation function: "+JSON.stringify(obj));
						return;
					}
				} catch (e) { // OPS, let's say it's invalid...
					cb("Attribute '"+key+"' fails validation function: "+JSON.stringify(obj));
					return;
				}
			}

			// Test nested objects (if available)
			if (_.isObject(obj) && !_.isArray(obj)) {
				var content = {};
				for (var attr in obj) if (obj.hasOwnProperty(attr)) {
					content[attr] = obj[attr];
				}
			
				// If nested content available → digg in!
				async.map(_.pairs(content), function (pair, done) {
					if (pair[0][0] === '$') // keys starting with $ denote options
						return done();
					parseObj(pair, rule[pair[0]], done);
				}, function (err, results) {
					results = flattenObjList(results.filter(function (e) { return !!e; }));
					var a = {};
					if (results)
						a[key] = results;
					cb(err, a);
				});
				return;
			}

			// Clean-up object if possible.
			var result = {};
			if (rule.$clean) {
				result[key] = rule.$clean(obj);
				if (!result[key] && !!obj) {
					console.warn("Cleaning up '"+key+"' returned "+result)
				}
			} else
				result[key] = obj;
			cb(null, result)
		}

		async.map(_.pairs(req.body), function (pair, done) {
			parseObj(pair, rules[pair[0]], done)
		}, function (err, results) {
			results = flattenObjList(results.filter(function (e) { return !!e; }));
			if (err) {
				return res.status(400).endJSON({ error:true, message:err });
			} else {
				cb(null, results);
			}
		});
	};
	
	next();
}