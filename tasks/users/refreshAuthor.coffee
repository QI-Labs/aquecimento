
# users/stats.coffee
# Refresh user stats.

async = require 'async'
mongoose = require 'mongoose'

jobber = require('../jobber.js')((e) ->

	Resource = mongoose.model 'Resource'
	Post = Resource.model 'Post'
	User = Resource.model 'User'

	workUser = (user, cb) ->
		console.log "Refreshing authorship for #{user.id} aka #{user.username}"
		Post.update {'author.id':''+user.id},
			{$set: {author: User.toAuthorObject(user)}},
			{multi:true},
			(err, num) ->
				if err
					console.error(err)
				console.log "Saving posts:", err, num
				cb(err)

	targetUserId = process.argv[2]
	if targetUserId
		User.findOne {_id: targetUserId}, (err, user) ->
			workUser(user, e.quit)
	else
		console.warn "No target user id supplied."
		User.find {}, (err, users) ->
			async.map users, workUser, e.quit

).start()
