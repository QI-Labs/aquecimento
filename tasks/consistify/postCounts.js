
async = require('async')
_ = require('underscore')

jobber = require('../jobber.js')(function (e) {
	var mongoose = require('mongoose')
	var Post = mongoose.model('Resource').model('Post')
	Post.find({ parent: null }, function (err, docs) {
		if (err) {
			console.log("ERRO:", err);
		}
		console.log('oi?')
		async.map(docs, function (doc, done) {
			Post.count({ parent: ''+doc.id }, function (err, count) {
				console.log(doc.id, count);
				doc.update({'counts.children': count}, function (err, doc) {
					done();
				});
			});
		}, function (err, results) {
			e.quit();
		});
	});
}).start()