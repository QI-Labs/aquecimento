
mongoose = require 'mongoose'
required = require 'src/core/required.js'
_ = require 'underscore'
validator = require 'validator'

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

nconf = require 'nconf'

requireIsEditor = (req, res, next) ->
	if req.user and ''+req.user.facebook_id in nconf.get('editorIds').split(',')
		return next()
	return next({permission:'isEditor'})

module.exports = (app) ->
	router = require('express').Router()

	logger = app.get('logger').child({child:'API',dir:'posts'})

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
			console.log('porra', e)
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
		console.log('name', req.body)
		if req.body.name
			req.pset.name = validator.trim(req.body.name)
		req.pset.save (err, pset) ->
			res.endJSON(err: err?)

	router.post '/:psetId/problems', requireIsEditor, (req, res) ->
		req.parse Problem.ParseRules, (err, data) ->
			addProblemToSet req.user, req.pset, data, (err, problem) ->
				res.endJSON({ err: err, data: problem })

	router.route '/:psetId/problems/:problemId'
		.get (req, res) ->
			res.endJSON({ err: false, data: req.problem })
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
							'docs.$.content.body': data.content.body
							'docs.$.content.source': data.content.source
							'docs.$.content.image': data.content.image
							'docs.$.content.solution': data.content.solution
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

	router.post '/:psetId/problems/:problemId/delete', requireIsEditor, (req, res) ->
		req.pset.docs.pull(req.params.problemId)
		req.pset.save (err, num) ->
			res.endJSON(err:err)

	router.post '/:problemId/try', (req, res) ->
		Is this nuclear enough?
		doc = req.problem
		correct = req.body.test is '0'
		userTries = _.findWhere(doc.userTries, { user: ''+req.user.id })
		console.log typeof req.body.test, correct, req.body.test
		if userTries?
			if userTries.tries >= 3 # No. of tried exceeded
				return res.status(403).endJSON({ error: true, message: "Número de tentativas excedido."})
		else # First try from user
			userTries = { user: req.user.id, tries: 0 }
			doc.userTries.push(userTries)

		if correct
			# User is correct
			doc.hasAnswered.push(req.user.id)
			doc.save()
			doc.getFilledAnswers (err, answers) ->
				if err
					console.error "error", err
					res.endJSON({ error: true })
				else
					res.endJSON({ result: true, answers: answers })
			return
		else
			Problem.findOneAndUpdate { _id: ''+doc.id, 'userTries.user': ''+req.user.id}, {$inc:{'userTries.$.tries': 1}}, (err, docs) ->
				console.log arguments
			res.endJSON({ result: false })

	# router.route('/:problemId')
	# 	.get (req, res) ->
	# 		jsonDoc = _.extend(req.problem.toJSON(), _meta:{})
	# 		if err
	# 			console.error("PQP1", err)
	# 		if req.problem.hasAnswered.indexOf(''+req.user.id) is -1
	# 			jsonDoc._meta.userAnswered = false
	# 			res.endJSON({data:jsonDoc})
	# 		else
	# 			jsonDoc._meta.userAnswered = true
	# 			req.problem.getFilledAnswers (err, children) ->
	# 				if err
	# 					console.error("PQP2", err, children)
	# 				jsonDoc._meta.children = children
	# 				res.endJSON({data:jsonDoc})

	# 	.delete requireIsEditor, (req, res) ->
	# 		doc = req.doc
	# 		doc.remove (err) ->
	# 			console.log('err?', err)
	# 			res.endJSON(doc, error: err)

	# router.post '/:problemId/answers', requireIsEditor, (req, res) ->
	# 	doc = req.problem
	# 	userTries = _.findWhere(doc.userTries, { user: ''+req.user.id })

	# 	if doc.hasAnswered.indexOf(''+req.user.id) is -1
	# 		return res.status(403).endJSON({ error: true, message: "Responta já enviada." })

	# 	Answer.findOne { 'author.id': ''+req.user.id }, (err, doc) ->
	# 		if doc
	# 			return res.status(400).endJSON({ error: true, message: 'Resposta já enviada. '})
	# 		ans = new Answer {
	# 			author: {},
	# 			content: {
	# 				body: req.body.content.body
	# 			}
	# 		}

	return router
