
# consistify.coffee

async = require 'async'
_ = require 'underscore'

jobber = require('./jobber.js')((e) ->
	mongoose = require 'mongoose'

	Notification = mongoose.model 'Notification'
	Inbox = mongoose.model 'Inbox'
	Resource = mongoose.model 'Resource'

	Activity = Resource.model 'Activity'
	Post = Resource.model 'Post'
	Group = Resource.model 'Group'
	User = Resource.model 'User'

	testCount = 0

	tests = [
		(next) ->
			console.log "Looking for activities with obsolete actor/object/target."
			Activity.find({}).populate('actor object target').exec (err, docs) =>
				if err then console.warn err
				incon = _.filter(docs,(i)->not i.actor or not i.object or not i.object)
				console.log('Found:', incon.length)
				for doc in docs
					doc.remove(() -> )
				next(err)
		,(next) ->
			console.log "Looking for activities with obsolete group"
			Activity.find({$not:{group:null}}).populate('group').exec (err, docs) =>
				if err then console.warn err
				console.log('Found:', docs.length)
				next(err)
		
		,(next) ->
			console.log "Looking for posts with obsolete author"
			Post.find({}).populate('author').exec (err, docs) =>
				if err then console.warn err
				incon = _.filter(docs,(i)->not i.author)
				console.log('Found:', docs.length)
				next(err)
		
		,(next) ->
			console.log "Looking for posts with obsolete group"
			Post.find({$not:{group:null}}).populate('group').exec (err, docs) =>
				if err then console.warn err
				incon = _.filter(docs,(i)->not i.group)
				console.log('Found:', docs.length)
				next(err)

		,(next) ->
			console.log "Looking for notifications with obsolete recipient/agent"
			Notification.find({}).populate('recipient agent').exec (err, docs) =>
				if err then console.warn err
				console.log('Found:', docs.length)
				next(err)

		,(next) ->
			console.log "Looking for inboxes with obsolete resource"
			Inbox.find({}).populate('resource').exec (err, docs) =>
				incon = _.filter(docs,(i)->not i.resource)
				console.log('Found:', incon.length)
				for doc in incon
					doc.remove ->
				next(err)
				$not
 
		,(next) ->
			console.log "Looking for user memberships of obsolete groups"
			Group.find({}).exec (err, docs) =>
				
				ids = _.pluck(docs, 'id')
				obs = []

				User.find {}, (err, users) ->
					for user in users
						groups = _.pluck(user.memberships, 'group')
						obs.push(g for g in groups when g not in ids)
					console.log('Found:', obs)
					next()

		,(next) ->
			User.find({}).populate('memberships.group').exec (err, users) =>
				if err then console.warn err

				# for user in users


				# console.log('Users with obsolete groups found:', incon.length)

				next(err)
		]

	wrapTest = (test) ->
		() ->
			console.log("Starting test #{testCount++}.")
			test.apply(this,arguments)

	async.series _.map(tests, (i)->wrapTest(i)),
		(err, results) ->
			console.log('err', err, 'results', results)
			e.quit()

).start()
