
var async = require('async')
var mongoose = require('mongoose')
var ObjectId = mongoose.Types.ObjectId

// how is migration gonna work?

jobber = require('../jobber.js')(function (e) {
	var Resource = mongoose.model('Resource')
	var CommentTree = mongoose.model('CommentTree')
	var User = Resource.model('User')
	var Follow = Resource.model('Follow')
	var Post = Resource.model('Post')
	var Comment = Resource.model('Comment')

	Post.find({}, function (err, docs) {
		if (err)
			throw err;

		async.map(docs, function (doc, done) {
			if (doc.comment_tree) {
				CommentTree.findOne({_id:''+doc.comment_tree}, function (err, tree) {
					if (err)
						throw err;
					if (!doc) {
						console.log("Tree not found")
						return done();
					}

					console.log('tree:', tree._id, tree.docs.length);
					for (var i=0; i<tree.docs.length; i++) {
						console.log('\tcomment:', tree.docs[i]._id, tree.docs[i].parent);
						tree.docs[i].parent = tree.parent;
						tree.docs[i].tree = tree._id;
					}
					tree.save(function (err) {
						console.log("error saving tree?", err);
						done();
					})
				});
			} else {
				console.log("No comment_tree found for post(id=%s): \"%s\"", doc.id, doc.content.title)
				done();
			}
		}, function (err, results) {
			e.quit();			
		})
	});

}).start()