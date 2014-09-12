
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
			id = mongoose.Types.ObjectId.createFromHexString(psetId)
		catch e
			return next({ type: "InvalidId", args:'psetId', value:psetId})
		ProblemSet.findOne { _id:id }, req.handleErr404 (pset) ->
			req.pset = pset
			next()
	)

	router.param('psetSlug', (req, res, next, slug) ->
		ProblemSet.findOne { slug:slug }, req.handleErr404 (pset) ->
			req.pset = pset
			next()
	)

	router.get '/:psetSlug', (req, res, next) ->
		play = _.findWhere(req.user.pset_play, (i) -> ''+i.pset is ''+req.pset.id)
		if not play
			res.render 'app/simulado', {
				pset: req.pset
			}
			return
		problems = _.map(req.pset.docs, (i) -> new Problem(i))
		res.render 'app/problem', {
			pset: req.pset
			problems: problems
			moves: play.moves
		}

	router.get '/:psetSlug/start', (req, res, next) ->
		play = _.findWhere(req.user.pset_play, (i) -> ''+i.pset is ''+req.pset.id)
		if not play
			# moves = []
			# for i in [0...req.pset.docs.length]
			# 	moves.push({ correct: false, tried: false })
			req.user.pset_play.push({
				pset: req.pset._id
				start: new Date()
				# moves: moves
			})
		req.user.save (err) ->
			console.log(err, req.user.pset_play)
			if err
				return next(err)
			res.redirect(req.pset.path+'/0')

	router.get '/:psetSlug/:num', (req, res) ->
		play = _.findWhere(req.user.pset_play, (i) -> ''+i.pset is ''+req.pset.id)
		if not play
			res.redirect('/')
			return
		problems = _.map(req.pset.docs, (i) -> new Problem(i))
		res.render 'app/problem', {
			pset: req.pset
			problems: problems
			moves: play.moves
		}
		# play = _.findWhere(req.user.pset_play, (i) -> ''+i.pset is ''+req.pset._id)

		# console.log play, req.user.pset_play, req.pset._id
		# if not play
		# 	return res.redirect('/p/'+req.pset._id)

		# if ''+play.moves.length isnt ''+req.params.num
		# 	return res.redirect('/p/'+req.pset._id+'/'+play.moves.length)

		# res.render 'app/problem', {
		# 	set: req.pset
		# }

	return router