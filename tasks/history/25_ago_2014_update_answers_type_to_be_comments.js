
var async = require('async')

function dryText (str) {
	return str.replace(/(\s{1})[\s]*/gi, '$1');
}
function pureText (str) {
	return str.replace(/(<([^>]+)>)/ig,"");
}

jobber = require('../jobber.js')(function (e) {
	var mongoose = require('mongoose')
	var Post = mongoose.model('Resource').model('Post')

	Post.find({ type: "Answer" }, function (err, docs) {
		if (err) {
			console.log("ERRO:", err);
		}

		async.map(docs, function (doc, done) {
			console.log(doc.id, dryText(pureText(doc.content.body)))
			doc.type = 'Comment';
			// doc.content.body = pureText(doc.content.body)
			doc.save(function () {

				done();
			});
		}, function (err, results) {
			e.quit();
		})
	});
}).start()