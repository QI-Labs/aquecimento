
# app/signup
# for QiLabs.org

mongoose = require 'mongoose'
_ = require 'underscore'
winston = require 'winston'
bunyan = require 'bunyan'

required = require 'src/core/required'

module.exports = (app) ->
	router = require('express').Router()

	router.use required.login
	router.use (req, res, next) ->
		# unless req.session.signinUp
		# 	return res.redirect('/')
		next()

	router.get '/finish', (req, res) ->
		res.redirect('/signup/finish/1')

	router.route('/finish/1')
		.get (req, res) ->
			res.render('app/signup_1')
		.put (req, res) ->
			validator = require('validator')

			fields = 'nome sobrenome email school-year b-day b-month b-year'.split(' ')

			for field in fields
				if typeof req.body[field] isnt 'string'
					return res.endJSON { error: true, message: "Formulário incompleto." }

			nome = validator.trim(req.body.nome).split(' ')[0]
			sobrenome = validator.trim(req.body.sobrenome).split(' ')[0]
			email = validator.trim(req.body.email)
			serie = validator.trim(req.body['school-year'])
			birthDay = parseInt(req.body['b-day'])
			birthMonth = req.body['b-month']
			birthYear = Math.max(Math.min(2005, parseInt(req.body['b-year'])), 1950)

			if birthMonth not in 'january february march april may june july august september october november december'.split(' ')
				return res.endJSON { error: true, message: "Mês de nascimento inválido."}

			birthday = new Date(birthDay+' '+birthMonth+' '+birthYear)
			req.user.profile.birthday = birthday
			console.log birthday
			# Fill stuff
			# Name
			req.user.name = nome+' '+sobrenome
			# Email
			if validator.isEmail(email)
				req.user.email = email
			# School year
			if not serie in ['6-ef', '7-ef', '8-ef', '9-ef', '1-em', '2-em', '3-em', 'faculdade']
				return res.endJSON { error: true, message: 'Ano inválido.' }
			else
				req.user.profile.serie = serie

			req.user.save (err) ->
				if err
					console.log(err);
					return res.endJSON { error: true }
				res.endJSON { error: false }

	router.route('/finish/2')
		.get (req, res) ->
			res.render('app/signup_2')
		.put (req, res) ->
			trim = (str) -> str.replace(/(^\s+)|(\s+$)/gi, '')

			# console.log('profile received', req.body)
			# do tests 
			# sanitize
			if req.body.bio
				bio = trim(req.body.bio.replace(/^\s+|\s+$/g, '').slice(0,300))
				req.user.profile.bio = bio
			else
				return res.endJSON { error: true, message: 'Escreva uma bio.' }
			if req.body.home
				home = trim(req.body.home.replace(/^\s+|\s+$/g, '').slice(0,35))
				req.user.profile.home = home
			else
				return res.endJSON { error: true, message: 'De onde você é?' }
			if req.body.location
				location = trim(req.body.location.replace(/^\s+|\s+$/g, '').slice(0,35))
				req.user.profile.location = location
			else
				return res.endJSON { error: true, message: 'O que você faz da vida?' }

			req.user.save (err) ->
				if err
					console.log(err);
					return res.endJSON { error: true }
				req.session.signinUp = false
				res.endJSON { error: false }

	return router