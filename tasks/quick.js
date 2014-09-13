
var async = require('async')
var _ = require('lodash')
var mongoose = require('mongoose')
var ObjectId = mongoose.Types.ObjectId

// how is migration gonna work?

jobber = require('./jobber.js')(function (e) {

	var Problem = mongoose.model('Problem')
	var User = mongoose.model('Player')
	var ProblemSet = mongoose.model('ProblemSet')

	ProblemSet.find({}, function (err, _psets) {

		var psets = _.indexBy(_psets, '_id')

		User.find({}, function (err, docs) {

			for (var i=0; i<docs.length; ++i) {
				var user = docs[i]
				console.log('%s: name: %s (%s: %s)', i, user.name, user.facebook_id, user.profile.fbName)
				user.pset_play.forEach(function (play) {
					var score = _.filter(play.moves, function (move) { return move.solved; }).length;
					console.log('    play: %s', psets[play.pset].name)
					console.log('        start,last: %s → %s', play.start, play.last_update)
					console.log('        score: %s/%s of %s', score, play.moves.length, psets[play.pset].docs.length)
				})
			}

			e.quit()
		})
	})


}).start()