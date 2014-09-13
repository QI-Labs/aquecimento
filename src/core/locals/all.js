
var pathLib = require('path')
var _ = require('underscore')
var fsLib = require('fs')
var nconf = require('nconf')

module.exports = function (app) {
	var logger = app.get("logger");

	var urls = { // cheating, while we can't proxy express.Router() calls
		settings: '/settings',
		faq: '/faq',
		about: '/sobre',
		twitter: 'http://twitter.com/qilabsorg',
		facebook: 'http://facebook.com/qilabsorg',
		logout: '/api/me/logout',
		blog: 'http://blog.qilabs.org',
	}

	_.extend(app.locals, {
		getQILogo: function () {
			return "/static/images/logo.png";
		},
		assetUrl: function (mediaType) {
			var relPath = pathLib.join.apply(null, arguments);
			// Check file existence for these.
			switch (mediaType) {
				case "css":
				case "js": {
					var absPath = pathLib.join(nconf.get('staticRoot'), relPath);
					if (!fsLib.existsSync(absPath) && !fsLib.existsSync(absPath+'.js')) {
						if (app.get('env') !== 'production') {
							throw "Required asset "+absPath+" not found.";
						} else {
							logger.warn("Required asset "+absPath+" not found.");
						}
					}
				}
			}
			return pathLib.join(nconf.get('staticUrl'), relPath);
		},
		_: require('underscore'),
		app: {
			env: app.get('env')
		},
	});

	app.locals.nconf = nconf;
	app.locals.urls = urls;
}