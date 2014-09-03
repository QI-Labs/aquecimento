
// Copyright 2014
// by @f03lipe

// Sample usage:
// notifyUser = (recpObj, agentObj, data, cb) ->
// 	please.args({$ismodel:'User'},{$ismodel:'User'},{$contains:['url','type']})

var _ = require('underscore');

var argsBuiltin = {
	$isA: {
		test: function(value, expected) {
			if (expected instanceof Function) {
				if (value instanceof expected) {
					return false;
				}
			}
			return "Argument '"+value+"'' doesn't match '$isa': "+expected;
		}
	},
	$isCb: {
		test: function(value) {
			if (value instanceof Function) {
				return false;
			}
			return "Argument '"+value+"'' doesn't match 'isCb'";
		}
	},
	$contains: {
		test: function(value, expected) {
			if (expected instanceof Array) {
				var keys = expected;
			} else if (typeof expected === 'string') {
				var keys = expected.split(' ');
			} else {
				return "Invalid expected value for assertion of type 'contains': "+expected;
			}
			for (var i=0; i<keys.length; i++) {
				var key = keys[i];
				if (!(key in value)) {
					return "Argument '"+(JSON.stringify(value).slice(0, 200)+'...')+"' doesn't match {$contains:"+expected+"}";
				}
			}
			return false;
		}
	},
	$among: {
		test: function(value, expected) {
			if (expected instanceof Array) {
				var keys = expected;
			} else if (typeof expected === 'string') {
				var keys = expected.split(' ');
			} else {
				return "Invalid expected value for assertion of type 'among': "+expected;
			}
			if (keys.indexOf(value) == -1) {
				return "Argument '"+(JSON.stringify(value).slice(0, 200)+'...')+"' doesn't match {$among:"+expected+"}";
			}
			return false;
		}
	}

};

var Args = function () {

	function assertParam (param, functionArg) {
		var builtins = Args.tests || {};

		// Support for unary tests like '$isCb'
		if (typeof param === 'string') {
			if (param[0] === '$' && param in builtins) {
				if (builtins[param].test.length === 1) {
					return builtins[param].test(functionArg);
				}
				return "Type '"+param+"' takes a non-zero number of arguments";
			}
			return "Invalid assertion of type "+param;
		}

		// Support for many tests. Eg: {$contains:['a','b'], 'a':'$isCb', 'b':{$isA:Array}}
		for (akey in param) {
			var avalue = param[akey];

			if (akey[0] === '$') {
				if (akey in builtins) {
					var err = builtins[akey].test(functionArg, avalue);
					if (err) {
						return err;
					}
				} else {
					return "Invalid assertion of type '"+akey+"' on value "+functionArg+".";
				}
			} else {
				if (functionArg.hasOwnProperty(akey)) {
					var err = assertParam(avalue, functionArg[akey]);
					if (err) {
						return ("On attribute "+akey+". ")+err;
					}
				} else {
					return "Attribute '"+akey+"' not found in "+functionArg+".";
				}
			}
		}
	};

	var args, asserts = 1 <= arguments.length ? [].slice.call(arguments, 0) : [];

	// Callee arguments might have been passed at asserts[-1]
	if (''+asserts[asserts.length - 1] === '[object Arguments]') {
		args = asserts.pop();
	} else {
		// Or gotten using arguments.callee.caller['arguments']
		try {
			args = arguments.callee.caller["arguments"];
		} catch (e) {
			throw "To use function inside strictmode, provide arguments as last parameter";
		}
	}

	for (var i=0; i<asserts.length; i++) {
		var paramAssertions = asserts[i];
		if (this.verbose) {
			console.log('Asserting arg:'+JSON.stringify(args[i])+' to conform to '+JSON.stringify(paramAssertions))
		}
		var err = assertParam(paramAssertions, args[i])
		if (err) {
			console.error("AssertLib error on index "+i+": \""+err+"\".");
			console.trace()
			throw "AssertLib error on index "+i+": \""+err+"\".";
		}
	}
}

Args.verbose = true
Args.tests = {};

Args.setVerbose = function (v) {
	this.verbose = !!v;
}
Args.extend = function (obj) {
	_.extend(Args.tests, obj)
}

Args.extend(argsBuiltin)

module.exports = Please = {
	args: Args
}