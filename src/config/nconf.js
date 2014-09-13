
// Initialize nconf for the app.

var path = require('path')
var nconf = require('nconf')

nconf.argv().env()

nconf.use('memory')

// Allow testing of production environment at home.
// Load variables from env.json, but set NODE_ENV to production.
if (nconf.get('FAKE_PROD')) {
	console.log("Fake production mode enabled.");
	nconf.file({file: __dirname+'/env.json'})
	nconf.set('NODE_ENV', 'production')
	nconf.set('fake_prod', true)
}

if (nconf.get('NODE_ENV') !== 'production') {
	nconf.file({file: __dirname+'/env.json'})
	nconf.set('env', 'development')
} else {
	nconf.set('env', 'production')
}

var srcDir = path.dirname(module.parent.filename)
nconf.set('appRoot', srcDir)
nconf.set('staticUrl', '/static/')
nconf.set('staticRoot', path.join(srcDir, '/../assets'))
nconf.set('mediaUrl', '/media/')
nconf.set('mediaRoot', path.join(srcDir, 'media'))
nconf.set('viewsRoot', path.join(srcDir, 'views'))

nconf.defaults({
	port: 3000,
})

module.exports = nconf