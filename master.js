
// Using clusters in debug mode leads to "Failed to open socket on port 5858, waiting 1000 ms before retrying"

if (process.env.NODE_ENV === 'production' && !process.env.NO_CLUSTER) {
	var cluster = require('cluster');
	var numCPUs = require('os').cpus().length;
	process.env.__CLUSTERING = true;

	if (cluster.isMaster) {
		for (var i=0; i<numCPUs; ++i) {
			cluster.fork();
		}
		cluster.on('disconnect', function (worker, code, signal) {
			console.warn('Worker pid='+worker.process.pid+' died.\nForking...');
			cluster.fork();
		});
	} else {
		require('./src/server.js');
	}
} else {
	require('./src/server.js');
}