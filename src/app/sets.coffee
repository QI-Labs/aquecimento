
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

	# router.get '/', (req, res) ->
	# 	ProblemSet.find {}, (err, sets) ->
	# 		if err
	# 			return req.status(404).send({ error: 'Not found.' })
	# 		res.render 'panel/main', {
	# 			sets: sets
	# 		}

	router.get '/:psetId', (req, res, next) ->
		res.render 'app/simulado', {
			pset: req.pset
			play: _.findWhere(req.user.pset_play, (i) -> ''+i.pset is ''+req.pset.id)
		}

	router.get '/:psetId/start', (req, res, next) ->
		play = _.findWhere(req.user.pset_play, (i) -> ''+i.pset is ''+req.pset.id)
		if not play
			req.user.pset_play.push({
				pset: req.pset._id
				start: new Date()
			})
		req.user.save (err) ->
			console.log(err, req.user.pset_play)
			if err
				return next(err)
			res.redirect('/p/'+req.pset.id+'/0')

	router.get '/:psetId/:num', (req, res) ->
		res.render 'app/problem', {}


	return router