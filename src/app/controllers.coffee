
mongoose = require 'mongoose'
User = mongoose.model 'Player'
Problem = mongoose.model 'Problem'
ProblemSet = mongoose.model 'ProblemSet'

requireIsEditor = (req, res, next) ->
	nconf = require 'nconf'
	if req.user and nconf.get('editorIds') and ''+req.user.facebook_id in nconf.get('editorIds').split(',')
		return next()
	return next({permission:'isEditor'})

module.exports = (app) ->
	require('./passport')(app)

	router = require('express').Router()
	
	router.use (req, res, next) ->
		req.logger.info("<#{req.user and req.user.username or 'anonymous@'+req.connection.remoteAddress}>: HTTP #{req.method} #{req.url}");
		next()

	router.use '/panel', require('./panel')(app)

	router.get '/add', requireIsEditor, (req, res) ->
		Problem.find {}, (err, docs) ->
			res.render 'app/panel', {
				problems: docs
			}

	for n in ['/problems/:problemId']
		router.get n, required.login, (req, res, next) -> res.render('app/problem')

	router.get '/', (req, res, next) ->
		if req.user
			res.render 'app/main'
		else
			res.render 'app/front'

	router.get '/simulados/obmep2014', (req, res, next) ->
		# ProblemSet.find { _id: }
		res.render 'app/simulado', {
			pset: null # pset
		}

	router.get '/logout', (req, res, next) ->
		req.logout()

	return router