
mongoose = require 'mongoose'
_ = require 'underscore'

required = require 'src/core/required'

nconf = require 'nconf'

User = mongoose.model 'Player'
Problem = mongoose.model 'Problem'


requireIsEditor = (req, res, next) ->
	if req.user and nconf.get('editorIds') and ''+req.user.facebook_id in nconf.get('editorIds').split(',')
		return next()
	return next({permission:'isEditor'})

module.exports = (app) ->
	require('./passport')(app)

	router = require('express').Router()
	
	router.use (req, res, next) ->
		req.logger.info("<#{req.user and req.user.username or 'anonymous@'+req.connection.remoteAddress}>: HTTP #{req.method} #{req.url}");
		next()

	router.get '/add', requireIsEditor, (req, res) ->

		Problem.find {}, (err, docs) ->
			res.render 'app/form', {
				problems: docs,
			}

	router.get '/', (req, res, next) ->
		if req.user
			# if req.session.signinUp
			# 	# force redirect to sign up
			# 	return req.res.redirect('/signup/finish/1')
			res.render 'app/main'
		else
			res.render 'app/front'

	return router