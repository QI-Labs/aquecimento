
mongoose = require 'mongoose'
_ = require 'underscore'
winston = require 'winston'
bunyan = require 'bunyan'

required = require 'src/core/required'

User = mongoose.model 'Player'

module.exports = (app) ->
	require('./passport')(app)

	router = require('express').Router()
	
	router.use (req, res, next) ->
		req.logger.info("<#{req.user and req.user.username or 'anonymous@'+req.connection.remoteAddress}>: HTTP #{req.method} #{req.url}");
		next()

	router.get '/', (req, res, next) ->
		if req.user
			# if req.session.signinUp
			# 	# force redirect to sign up
			# 	return req.res.redirect('/signup/finish/1')
			res.render 'app/main'
		else
			res.render 'app/front'

	return router