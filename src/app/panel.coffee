
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
	router = require('express').Router()

	router.use requireIsEditor

	router.param('psetId', (req, res, next, psetId) ->
		try
			id = mongoose.Types.ObjectId.createFromHexString(psetId);
		catch e
			return next({ type: "InvalidId", args:'psetId', value:psetId});
		ProblemSet.findOne { _id:psetId }, req.handleErr404 (pset) ->
			req.pset = pset
			next()
	)

	# router.get '/add/:problemId', requireIsEditor, (req, res) ->
	# 	console.log req.params.problemId
	# 	Problem.findOne { _id: ''+req.params.problemId }, (err, doc) ->
	# 		if err
	# 			return req.renderJSON(error:err)
	# 		if not doc
	# 			return res.redirect('/add')
	# 		Problem.find {}, (err, docs) ->
	# 			res.render 'app/panel', {
	# 				problems: docs
	# 				pproblem: doc
	# 			}

	# router.get '/add/:problemId', requireIsEditor, (req, res) ->
	# 	console.log req.params.problemId
	# 	Problem.findOne { _id: ''+req.params.problemId }, (err, doc) ->
	# 		if err
	# 			return req.renderJSON(error:err)
	# 		if not doc
	# 			return res.redirect('/add')
	# 		Problem.find {}, (err, docs) ->
	# 			res.render 'app/panel', {
	# 				problems: docs
	# 				pproblem: doc
	# 			}

	# 	Problem.findOne { _id: ''+req.params.problemId }, (err, doc) ->
	# 		if not doc
	# 			return res.redirect('/add')
	# 		Problem.find {}, (err, docs) ->
	# 			res.render 'app/panel', {
	# 				problems: docs
	# 				pproblem: doc
	# 			}

	router.get '/', (req, res) ->
		ProblemSet.find {}, (err, sets) ->
			if err
				return req.status(404).send({ error: 'Not found.' })
			res.render 'panel/main', {
				sets: sets
			}

	router.post '/novo-simulado', (req, res) ->
		p = new ProblemSet({ name: 'ProblemSet '+(new Date()).toLocaleString() })
		p.save (err) ->
			if err
				throw err
			res.endJSON({ error: err? })

	router.get '/sets/:psetId', (req, res) ->
		res.render 'panel/set', {
			set: req.pset
			set_problems: _.map(req.pset.docs, (i) -> new Problem(i))
		}


	return router