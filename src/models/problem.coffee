
# src/models/problem

mongoose = require 'mongoose'
assert = require 'assert'
_ = require 'underscore'
async = require 'async'
validator = require 'validator'

please = require 'src/lib/please.js'
please.args.extend(require('./lib/pleaseModels.js'))

################################################################################
## Schema ######################################################################

ObjectId = mongoose.Schema.ObjectId

TranslatedTopics = {
	'combinatorics': 'Combinatória'
	'number-theory': 'Teoria dos Números'
	'algebra': 'Álgebra'
	'geometry': 'Geometria'
}

ProblemSchema = new mongoose.Schema {
	author: {
		id: String
		username: String
		path: String
		avatarUrl: String
		name: String
	}

	pset: 		{ type: String }
	topic:		{ type: String }
	
	updated_at:	{ type: Date }
	created_at:	{ type: Date, indexed: 1, default: Date.now }

	content: {
		body:	{ type: String, required: true }
		source:	{ type: String }
		image:  { type: String }
		solution: { type: String }
		solimg: { type: String }

		answer: { type: Number }
	}

	hasAnswered: [],
	hasSeenAnswers: [],
	userTries: [],
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

ProblemSchema.statics.APISelect = '-hasAnswered -canSeeAnswers -hasSeenAnswers -watching -userTries'

ProblemSetSchema = new mongoose.Schema {
	name: 		{ type: String, required: true }
	updated_at:	{ type: Date }
	created_at:	{ type: Date, indexed: 1, default: Date.now }

	level: 		{ type: Number, enum: [1,2,3] }

	docs: [ProblemSchema]

	contributors: [{
		id: String
		username: String
		path: String
		avatarUrl: String
		name: String
	}]
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

ProblemSchema.statics.ParseRules = {
	topic:
		$valid: (str) ->
			console.log(''+str)
			str in ['combinatorics', 'algebra', 'number-theory', 'geometry']

	content:
		body:
			$valid: (str) -> validator.isLength(str, 10, 1000)
			$clean: (str) -> _.escape(validator.trim(str))
		solution:
			$valid: (str) -> validator.isLength(str, 10, 1000)
			$clean: (str) -> _.escape(validator.trim(str))
		source:
			$valid: (str) -> validator.isLength(str, 10, 1000)
			$clean: (str) -> _.escape(validator.trim(str))
		answer: 
			$valid: (str) -> true
			$clean: (str) -> parseInt(str)
		image:
			$valid: (str) -> true
			$clean: (str) -> validator.trim(str)
		solimg:
			$valid: (str) -> true
			$clean: (str) -> validator.trim(str)
}

################################################################################
## Virtuals ####################################################################

# ProblemSchema.virtual('path').get ->
# 	"/problems/{id}".replace(/{id}/, @id)

ProblemSchema.virtual('translated_topic').get ->
	TranslatedTopics[@topic]

ProblemSchema.virtual('apiPath').get ->
	"/api/sets/{pset}/problems/{id}"
		.replace(/{pset}/, @pset)
		.replace(/{id}/, @id)

ProblemSchema.virtual('editorPath').get ->
	"/panel/sets/{pset}/problems/{id}"
		.replace(/{pset}/, @pset)
		.replace(/{id}/, @id)

ProblemSetSchema.virtual('apiPath').get ->
	"/api/sets/{id}".replace(/{id}/, @id)

ProblemSetSchema.virtual('path').get ->
	"/panel/sets/{id}".replace(/{id}/, @id)

ProblemSetSchema.virtual('editorPath').get ->
	"/panel/sets/{id}".replace(/{id}/, @id)

################################################################################
## Middlewares #################################################################

# ProblemSchema.pre 'remove', (next) ->
# 	next()
# 	@addToGarbage (err) ->
# 		console.log "#{err} - moving Problem #{@id} to garbage"

################################################################################
## Methods #####################################################################

ProblemSchema.methods.getAnswers = (cb) ->
	Answer.find { problem: @_id }, cb

ProblemSchema.methods.getFilledAnswers = (cb) ->
	self = @
	self.getAnswers (err, docs) ->
		return cb(err) if err
		async.map docs, ((ans, done) ->
			ans.getComments (err, docs) ->
				done(err, _.extend(ans.toJSON(), { comments: docs}))
		), cb

################################################################################
## Statics #####################################################################

ProblemSchema.statics.fromObject = (object) ->
	new Problem(undefined, undefined, true).init(object)

ProblemSchema.plugin(require('./lib/selectiveJSON'), ProblemSchema.statics.APISelect)

Problem = mongoose.model('Problem', ProblemSchema)
ProblemSet = mongoose.model('ProblemSet', ProblemSetSchema)

module.exports = () ->