
# src/models/user
# Copyright QILabs.org
# by @f03lipe

mongoose = require 'mongoose'
_ = require 'underscore'
async = require 'async'
winston = require 'winston'

please = require 'src/lib/please.js'
please.args.extend(require 'src/models/lib/pleaseModels.js')

ObjectId = mongoose.Types.ObjectId

################################################################################
## Schema ######################################################################

PlayerSchema = new mongoose.Schema {
	name:			{ type: String, required: true }
	username:		{ type: String, required: true }
	access_token: 	{ type: String, required: true }
	facebook_id:	{ type: String, required: true }
	email:			{ type: String }
	avatar_url:		{ type: String }

	profile: {
  		isStaff: 	{ type: Boolean, default: false }
		fbName: 	{ type: String }
		location:	{ type: String, default: '' }
		bio: 		{ type: String, default: ''}
		home: 		{ type: String, default: '' }
		bgUrl: 		{ type: String, default: '/static/images/rio.jpg' }
		serie: 		{ type: String }
		avatarUrl: 	''
		birthday:	{ type: Date }
	},

	stats: {
		posts:	{ type: Number, default: 0 }
		votes:	{ type: Number, default: 0 }
		followers:	{ type: Number, default: 0 }
		following:	{ type: Number, default: 0 }
	},

	pset_play: [{
		pset: 	{ type: String, ref: 'ProblemSet' }
		start: 	{ type: Date }
		moves: 	[{
			correct: { type: Boolean }
			skipped: { type: Boolean }
		}]
	}]

	meta: {
		sessionCount: { type: Number, default: 0 }
		created_at: { type: Date, default: Date.now }
		updated_at: { type: Date, default: Date.now }
		last_access: { type: Date, default: Date.now }
	}
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

PlayerSchema.statics.APISelect = 'id name username profile avatar_url path'

################################################################################
## Virtuals ####################################################################

PlayerSchema.methods.getCacheFields = (field) ->
	switch field
		when "Following"
			return "user:#{@id}:following"
		else
			throw "Field #{field} isn't a valid cache field."


PlayerSchema.virtual('avatarUrl').get ->
	if @avatar_url
		@avatar_url+'?width=200&height=200'
	else
		'https://graph.facebook.com/'+@facebook_id+'/picture?width=200&height=200'

PlayerSchema.virtual('path').get ->
	'/@'+@username

################################################################################
## Middlewares #################################################################

PlayerSchema.statics.toAuthorObject = (user) ->
	{
		id: user.id,
		username: user.username,
		path: user.path,
		avatarUrl: user.avatarUrl,
		name: user.name,
	}

PlayerSchema.statics.fromObject = (object) ->
	new Player(undefined, undefined, true).init(object)

PlayerSchema.plugin(require('./lib/selectiveJSON'), PlayerSchema.statics.APISelect)

module.exports = Player = mongoose.model "Player", PlayerSchema