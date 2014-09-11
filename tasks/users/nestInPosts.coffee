
# users/nestInPosts.coffee

_ = require 'underscore'
mongoose = require 'mongoose'

jobber = require('../jobber.js')((e) ->

	Resource = mongoose.model 'Resource'
	Post = Resource.model 'Post'
	User = Resource.model 'User'

	User.find {}, (err, users) ->
		for user in users
			do (user) ->
				console.log 'user', user, ''+user.id, '\n\n'
				Post.find { 'author.id': mongoose.Types.ObjectId(user.id) }, (err, posts) ->
				# Post.find {author: mongoose.Types.ObjectId(''+user.id)}, (err, posts) ->
					if err
						console.log err
						return
					for post in posts
						if post.author.username
							console.log 'username', post.author
						else
							console.log post.author
							post.author = {
								id: ''+user.id,
								username: user.username,
								path: user.path,
								avatarUrl: user.avatarUrl,
								name: user.name,
							}
							post.save (err) ->
								console.log arguments
).start()
