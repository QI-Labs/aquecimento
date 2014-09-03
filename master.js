var forky = require('forky');
process.env.__CLUSTERING = true;
forky(__dirname + '/src/server.js');