
var async = require('async')

jobber = require('../jobber.js')(function (e) {
	var mongoose = require('mongoose')
	var Resource = mongoose.model('Resource')
	var Comment = Resource.model('Comment')
	var CommentTree = Resource.model('CommentTree')
	var Post = Resource.model('Post')

	Post.find({}, function (err, docs) {

		async.map(docs, function (post, done) {
			Comment.find({parent:post.id}, function (err, comments) {
				if (!comments.length) {
					return done(null, 0);
				}

				var tree = new CommentTree({
					parent: post.id,
				});

				console.log('post:', post.id, post.content.title)
				post.comment_tree = tree._id;
				post.counts.children = comments.length;

				post.save(function (err) {
					if (err)
						console.log('post save', err)
				})

				console.log('comments:', comments.length)
				for (var i=0; i<comments.length; i++) {
					var doc = comments[i].toJSON();
					var c = new Comment({
						author: doc.author,
						content: doc.content,
						votes: doc.votes,
						meta: doc.meta,
						tree: tree._id,
					});
					tree.docs.push(c);
				}

				tree.save(function (err) {
					if (err)
						console.log('tree save', err)
				})

				done(null, comments.length)
			});
		}, function (err, results) {
			if (err)
				console.warn("err!!", err);
			// console.log(results);
			e.quit();
		});
	});
}).start()