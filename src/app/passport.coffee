
passport = require 'passport'
nconf = require 'nconf'


genUsername = (profile) ->
	names = []
	if profile.name.givenName
		names.push(profile.name.givenName)
	if profile.name.middleName
		names.push(profile.name.middleName)
	if profile.name.familyName
		names.push(profile.name.familyName)
	return names.join('.').toLowerCase()

module.exports = (app) ->
	logger = app.get("logger")

	app.get('/auth/facebook/callback',
		passport.authenticate('facebook', {
			successRedirect: '/',
			failureRedirect: '/'
		}))
	
	app.get('/auth/facebook',
		passport.authenticate('facebook', {
			scope: ['email', 'user_likes', 'publish_actions']
		}))

	passport.use new (require("passport-facebook").Strategy)({
		clientID: nconf.get('facebook_app_id')
		clientSecret: nconf.get('facebook_secret')
		callbackURL: "/auth/facebook/callback"
		passReqToCallback: true
	}, (req, accessToken, refreshToken, profile, done) ->
		User = require("mongoose").model("Player")

		User.findOne(facebook_id: profile.id).exec (err, user) ->
			if err
				logger.warn "Error finding user with profile.id " + profile.id
				return done(err)
			if user # old user
				logger.info "Logging in: ", profile.username
				fbName = profile.displayName
				nome1 = fbName.split(" ")[0]
				nome2 = fbName.split(" ")[fbName.split(" ").length - 1]
				user.name = nome1 + " " + nome2
				user.profile.fbName = fbName
				user.access_token = accessToken  if accessToken
				user.avatar_url = "https://graph.facebook.com/" + profile.id + "/picture"  unless user.avatar_url
				user.email = profile.emails[0].value
				user.lastAccess = new Date()
				user.meta.sessionCount = user.meta.sessionCount + 1 or 1
				user.save()
				done null, user
			else # new user
				username = profile.username or genUsername(profile)
				logger.info "New user: ", profile.username, profile.id, profile.displayName
				fbName = profile.displayName
				nome1 = fbName.split(" ")[0]
				nome2 = fbName.split(" ")[profile.displayName.split(" ").length - 1]
				user = new User(
					access_token: accessToken
					facebook_id: profile.id
					avatar_url: "https://graph.facebook.com/" + profile.id + "/picture"
					name: nome1 + " " + nome2
					profile:
						fbName: fbName
					email: profile.emails[0].value
					username: username
				)
				user.save (err, user) ->
					if err
						done err
					else
						done null, user
					return
	)

	passport.serializeUser (user, done) ->
		done null, user._id

	passport.deserializeUser (id, done) ->
		User = require("mongoose").model("Player")
		User.findOne
			_id: id
		, (err, user) ->
			done err, user