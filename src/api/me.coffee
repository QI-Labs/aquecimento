
mongoose = require 'mongoose'

required = require 'src/core/required.js'

# Resource = mongoose.model 'Resource'
# Activity = mongoose.model 'Activity'
# Inbox = mongoose.model 'Inbox'
# Notification = mongoose.model 'Notification'
# User = Resource.model 'User'
# Post = Resource.model 'Post'

module.exports = (app) ->
	router = require('express').Router()
	router.use required.login
	logger = app.get('logger')

	router.post '/logout', (req, res) ->
		req.logout()
		res.redirect('/')

	return router