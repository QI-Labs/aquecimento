
mongoose = require 'mongoose'
required = require 'src/core/required.js'
_ = require 'underscore'

please = require 'src/lib/please.js'
please.args.extend(require 'src/models/lib/pleaseModels.js')

User = mongoose.model 'Player'
Problem = mongoose.model 'Problem'

createProblem = (self, data, cb) ->
	please.args({$isModel:'Player'},
		{$contains:['content'],content:{$contains:['body','answer']}}, '$isCb')
	problem = new Problem {
		author: User.toAuthorObject(self)
		topic: data.topic,
		level: data.level,
		content: {
			solution: data.content.solution
			image: data.content.image
			source: data.content.source
			body: data.content.body
			answer: data.content.answer
		}
		tags: data.tags
	}
	problem.save (err, doc) =>
		console.log('doc save:', err, doc)
		# use asunc.parallel to run a job
		# Callback now, what happens later doesn't concern the user.
		cb(err, doc)
		if err then return

nconf = require 'nconf'

requireIsEditor = (req, res, next) ->
	if req.user and ''+req.user.facebook_id in nconf.get('editorIds').split(',')
		return next()
	return next({permission:'isEditor'})

module.exports = (app) ->
	router = require('express').Router()
	router.use required.login
	router.param('problemId', (req, res, next, problemId) ->
		try
			id = mongoose.Types.ObjectId.createFromHexString(problemId);
		catch e
			return next({ type: "InvalidId", args:'problemId', value:problemId});
		Problem.findOne { _id:problemId }, req.handleErr404 (problem) ->
			req.problem = problem
			next()
	)

	router.post '/add', requireIsEditor, (req, res) ->
		createProblem req.user, {
			topic: req.body.topic,
			level: req.body.level,
			content: {
				solution: req.body.solution
				body: req.body.body
				source: req.body.source
				image: req.body.image
				answer: {
					options: [
						req.body.opcao_0,
						req.body.opcao_1,
						req.body.opcao_2,
						req.body.opcao_3,
						req.body.opcao_4,
					]
				}
			}
		}, req.handleErrResult (doc) ->
			res.endJSON doc

	router.get '/:problemId/delete', requireIsEditor, (req, res) ->
		req.problem.remove (err, num) ->
			res.endJSON(err:err, num:num)

	router.post '/:problemId', requireIsEditor, (req, res) ->
		req.problem.topic = req.body.topic
		req.problem.level = req.body.level
		req.problem.content = {
			solution: req.body.solution
			body: req.body.body
			source: req.body.source
			image: req.body.image
			answer: {
				options: [
					req.body.opcao_0
					req.body.opcao_1
					req.body.opcao_2
					req.body.opcao_3
					req.body.opcao_4
				]
			}
		}
		req.problem.save (err, doc) ->
			res.endJSON(errror:err, doc:doc)

	router.get '/:problemId', requireIsEditor, (req, res) ->
		res.endJSON(errror:false, data:req.problem)

	router.route('/:problemId')
		.get (req, res) ->
			jsonDoc = _.extend(req.problem.toJSON(), _meta:{})
			if err
				console.error("PQP1", err)
			if req.problem.hasAnswered.indexOf(''+req.user.id) is -1
				jsonDoc._meta.userAnswered = false
				res.endJSON({data:jsonDoc})
			else
				jsonDoc._meta.userAnswered = true
				req.problem.getFilledAnswers (err, children) ->
					if err
						console.error("PQP2", err, children)
					jsonDoc._meta.children = children
					res.endJSON({data:jsonDoc})

		.delete requireIsEditor, (req, res) ->
			doc = req.doc
			doc.remove (err) ->
				console.log('err?', err)
				res.endJSON(doc, error: err)

	router.post '/:problemId/answers', requireIsEditor, (req, res) ->
		doc = req.problem
		userTries = _.findWhere(doc.userTries, { user: ''+req.user.id })

		if doc.hasAnswered.indexOf(''+req.user.id) is -1
			return res.status(403).endJSON({ error: true, message: "Responta já enviada." })

		Answer.findOne { 'author.id': ''+req.user.id }, (err, doc) ->
			if doc
				return res.status(400).endJSON({ error: true, message: 'Resposta já enviada. '})
			ans = new Answer {
				author: {},
				content: {
					body: req.body.content.body
				}
			}

	router.post '/:problemId/try', requireIsEditor, (req, res) ->
		# Is this nuclear enough?
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

	return router
