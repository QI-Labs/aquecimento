
passport = require('passport')

module.exports = (app) ->
	router = require('express').Router()

	router.get('/facebook/callback',
		passport.authenticate('facebook', {
			successRedirect: '/',
			failureRedirect: '/'
		}))

	router.get('/facebook',
		passport.authenticate('facebook', {
			scope: ['email', 'user_likes']
		}))
	
	router