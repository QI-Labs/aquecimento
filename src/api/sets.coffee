
mongoose = require 'mongoose'
_ = require 'lodash'
validator = require 'validator'
nconf = require 'nconf'

required = require 'src/core/required.js'
please = require 'src/lib/please.js'
please.args.extend(require 'src/models/lib/pleaseModels.js')

User = mongoose.model 'Player'
Problem = mongoose.model 'Problem'
ProblemSet = mongoose.model 'ProblemSet'

logger = null

addProblemToSet = (self, pset, data, cb) ->
	please.args({$isModel:'Player'},{$isModel:ProblemSet})

	_problem = pset.docs.create({
		author: User.toAuthorObject(self)
		topic: data.topic
		level: data.level
		pset: pset._id
		content: {
			body: data.content.body
			source: data.content.source
			image: data.content.image
			solution: data.content.solution
			answer: data.content.answer
		}
	})
	problem = new Problem(_problem)
	logger.debug('addProblemToSet with pset=%s', pset._id)
	pset.docs.push(_problem)
	pset.save (err) ->
		if err
			logger.error('Failed to push problem to ProblemSet', err)
			return cb(err)
		cb(null, problem)


requireIsEditor = (req, res, next) ->
	if req.user and ''+req.user.facebook_id in nconf.get('editorIds').split(',')
		return next()
	return next({permission:'isEditor'})

module.exports = (app) ->
	router = require('express').Router()

	logger = app.get('logger').child({child:'API',dir:'posts'})

	if nconf.get('ICE_AGE') # not in aquecimento, require users to be editors
		router.use requireIsEditor

	##########################################################################################################
	##########################################################################################################

	router.param('psetId', (req, res, next, psetId) ->
		try
			id = mongoose.Types.ObjectId.createFromHexString(psetId)
		catch e
			return next({ type: "InvalidId", args:'psetId', value:psetId})
		ProblemSet.findOne { _id:id }, req.handleErr404 (doc) ->
			req.pset = doc
			next()
	)

	router.param('problemId', (req, res, next, problemId) ->
		try
			id = mongoose.Types.ObjectId.createFromHexString(problemId)
		catch e
			return next({ type: "InvalidId", args:'problemId', value:problemId})

		if not 'psetId' of req.params
			throw "Fetching commentId in url with no reference to its pset (no psetId parameter)."
		if not 'pset' of req
			throw "Fetching commentId in url without pset object in request (no req.pset, as expected)."
		
		req.problem = new Problem(req.pset.docs.id(id))
		if not req.problem
			return next({ type: "ObsoleteId", status: 404, args: {commentId: id, psetId: req.param.psetId} })
		next()
	)

	##########################################################################################################
	##########################################################################################################

	router.post '/:psetId', requireIsEditor, (req, res) ->
		# console.log('name', req.body)
		if req.body.name
			req.pset.name = validator.trim(req.body.name)
		req.pset.save (err, pset) ->
			res.endJSON(err: err?)

	router.post '/:psetId/problems', requireIsEditor, (req, res) ->
		req.parse Problem.ParseRules, (err, data) ->
			addProblemToSet req.user, req.pset, data, (err, problem) ->
				res.endJSON({ err: err, data: problem })

	router.route '/:psetId/:pnum'
		.get (req, res) ->
			if isNaN(parseInt(req.params.pnum))
				return res.status(402).endJSON({ err: true })
			res.endJSON({ err: false, data: new Problem(req.pset.docs[parseInt(req.params.pnum)]) })

	router.route '/:psetId/problems/:problemId'
		.get (req, res) ->
			res.endJSON({ err: false, data: req.problem.toJSON({select:'',virtuals:true}) })
		.put requireIsEditor, (req, res) ->
			req.parse Problem.ParseRules, (err, data) ->
				ProblemSet.findOneAndUpdate {
						_id: req.params.psetId,
						'docs._id': req.params.problemId,
					},
					{
						$set: {
							'docs.$.content.body': data.content.body,
							'docs.$.meta.updated_at': Date.now()
							'docs.$.topic': data.topic
							'docs.$.content.body': data.content.body.replace(/&#x2F;/g,'/').replace(/\/;/g,'/')
							'docs.$.content.source': data.content.source
							'docs.$.content.image': data.content.image
							'docs.$.content.solution': data.content.solution.replace(/&#x2F;/g,'/').replace(/\/;/g,'/')
							'docs.$.content.answer': data.content.answer
						}
					}, (err, pset) ->
						if err
							throw err
						if not pset
							return res.status(404).endJSON({ error: true, message: 'Problema não encontrado. '})
						problem = new Problem(pset.docs.id(req.params.problemId2))
						res.endJSON(problem)

	router.post '/:psetId/delete', requireIsEditor, (req, res) ->
		req.pset.remove (err, num) ->
			res.endJSON(err:err, success: !err, num:num)

	router.post '/:pslug/:num', (req, res) ->
		res.end()

	router.post '/:psetId/problems/:problemId/delete', requireIsEditor, (req, res) ->
		req.pset.docs.pull(req.params.problemId)
		req.pset.save (err, num) ->
			res.endJSON(err:err)

	router.post '/:psetId2/:num/try', (req, res) ->
		play = _.findWhere(req.user.pset_play, (i) -> ''+i.pset is ''+req.params.psetId2)
		# console.log(play, req.user.pset_play, req.user.pset_play.length, req.params.psetId2)
		# Test if user's plays to this specific pset exists.
		if not play
			req.logger.warn("problem set not found in user's plays.")
			return res.endJSON({ error: true })
		# See if trying to find valid problem.
		if not validator.isNumeric(req.params.num)
			return res.endJSON({ error: true, message: "Número inexistente." })
		index = parseInt(req.params.num)
		if not validator.isNumeric(req.body.try)
			req.logger.warn("attempted invalid answer type: %s", req.body.try)
			return res.endJSON({ error: true, message: "Resposta inválida." })
		# Finally, fetch pset object
		try
			id = mongoose.Types.ObjectId.createFromHexString(req.params.psetId2)
		catch e
			return next({ type: "InvalidId", args:'psetId', value:req.params.psetId2})
		ProblemSet.findOne { _id: id }, req.handleErr404 (pset) ->
			if index >= pset.docs.length
				req.logger.warn("wrong length for user's plays. trying to access %s in max %s",
					index, play.moves.length)
				return res.endJSON({ error: true })
			# Test if user's already tried it.
			move = _.findWhere(play.moves, (i) -> i.index is index)
			if move
				return res.endJSON({ error: true, message: "Tentativas excedidas." })
			trying = parseInt(req.body.try)
			num = parseInt(req.params.num)
			console.log("Trying #{trying} for answer #{pset.docs[num].content.answer}")
			if trying is pset.docs[num].content.answer
				console.log('certo')
				play.moves.push({ index: index, solved: true })
				req.user.save (err) ->
					if err
						throw err
				return res.endJSON({
					error: false,
					correct: true,
					data: { index: index, solved: true },
					redirect: "/p/#{pset._id}/#{play.moves.length+1}"
				})
			console.log(JSON.stringify(trying), JSON.stringify(pset.docs[num].content.answer))
			# Wrong answer.
			play.last_update = new Date()
			play.moves.push({ index: index, solved: false })
			req.user.save (err) ->
				if err
					throw err
			return res.endJSON({
				error: false,
				correct: false,
				data: { index: index, solved: false },
			})

	return router
