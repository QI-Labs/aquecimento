
# cache/updateFollowing.coffee

async = require 'async'
_ = require 'underscore'
mongoose = require 'mongoose'

jobber = require('../jobber.js')((e) ->
	redis = require('../../src/config/redis.js')

	Resource = mongoose.model 'Resource'
	User = Resource.model 'User'
	Follow = Resource.model 'Follow'

	User.find {}, (err, users) ->
		return console.error(err) if err

		async.mapSeries users, ((user, next) ->
			console.log "Updating following cache for user #{user.username} (id=#{user.id})"
			ffield = user.getCacheFields("Following")

			redis.smembers ffield, (err, num) ->
				user.getFollowingIds (err, following) ->
					return next(err) if err
					if following.length is 0
						return next(null, 0)
					# Delete following set
					redis.del ffield, (err, num) ->
						return next(err) if err
						# Add following elements
						redis.sadd ffield, following, (err, doc) ->
							return next(err) if err
							next(null, doc)
		), (err, results) ->
			console.log('pastel', arguments)
			e.quit()

).start()
