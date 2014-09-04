
// Initialize nconf for the app.

var path = require('path')
var nconf = require('nconf')

nconf.argv().env()

if (nconf.get('NODE_ENV') !== 'production') {
	nconf.file({file: __dirname+'/env.json'})
	nconf.set('env', 'development')
	Error.stackTraceLimit = 10
} else {
	nconf.set('env', 'production')
}

nconf.use('memory');

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