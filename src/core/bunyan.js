
var bunyan = require('bunyan');
var nconf = require('nconf');
var _ = require('lodash')

module.exports = function (options) {

	var options = options || {};

	var logger;

	if (nconf.get('env') === 'development') {
		logger = bunyan.createLogger(_.extend({
			name: 'QI',
			serializers: { // add serializers for req, res and err
				req: bunyan.stdSerializers.req,
				req: bunyan.stdSerializers.res,
				err: bunyan.stdSerializers.err,
			},
		}, options));
	} else {
		// function Formatter(wlog) {}
		// Formatter.prototype.write = function write(rec) {
		// 	cbunyan.stdin.write(JSON.stringify(rec)+'\n');
		// }

		// var cbunyan = require('child_process').spawn('bunyan')
		// cbunyan.stdout.on('data', function (data) {
		// 	process.stdout.write(String(data));
		// });
		// cbunyan.on('exit', function (code) {
		// 	console.log('bunyan process exited with code', code);
		// })

		// Piping through winston

		// Adapted from https://github.com/trentm/node-bunyan-winston/blob/master/restify-winston.js
		// Whatever Winston logger setup your application wants.
		var winston = require('winston');
		var log = new winston.Logger({
		    transports: [
		        new winston.transports.Console({colorize: true, json: false})
		    ]
		});

		function Bunyan2Winston(wlog) {
		    this.wlog = wlog
		}
		Bunyan2Winston.prototype.write = function write(rec) {
		    // Map to the appropriate Winston log level (by default 'info', 'warn'
		    // or 'error') and call signature: `wlog.log(level, msg, metadata)`.
		    var wlevel;
		    if (rec.level <= bunyan.INFO) {
		        wlevel = 'info';
		    } else if (rec.level <= bunyan.WARN) {
		        wlevel = 'warn';
		    } else {
		        wlevel = 'error';
		    }

		    // Note: We are *modifying* the log record here. This could be a problem
		    // if our Bunyan logger had other streams. This one doesn't.
		    var msg = rec.msg;
		    delete rec.msg;

		    // Remove internal bunyan fields that won't mean anything outside of
		    // a bunyan context.
		    delete rec.v;
		    delete rec.level;
		    // TODO: more?

		    // Note: Winston doesn't handle *objects* in the 'metadata' field well
		    // (e.g. the Bunyan record 'time' field is a Date instance, 'req' and
		    // 'res' are typically objects). With 'json: true' on a Winston transport
		    // it is a bit better, but still messes up 'date'. What exactly to do
		    // here is perhaps user-preference.
		    rec.time = String(rec.time);
		    //Object.keys(rec).forEach(function (key) {
		    //    if (typeof(rec[key]) === "object") {
		    //        rec[key] = JSON.stringify(rec[key])
		    //    }
		    //});

		    this.wlog.log(wlevel, msg, rec);
		}

		// Pass a Bunyan logger to restify that shims to our winston Logger.
		logger = bunyan.createLogger(_.extend({
		    name: 'QI',
		    streams: [{
		        type: 'raw',
		        level: 'trace',
		        stream: new Bunyan2Winston(log)
		    }]
		}, options));
	}

	return logger;
}