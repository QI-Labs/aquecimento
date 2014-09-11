
var async = require('async')
var mongoose = require('mongoose')
var ObjectId = mongoose.Types.ObjectId

// how is migration gonna work?

jobber = require('./jobber.js')(function (e) {

	var Problem = mongoose.model('Problem')
	var ProblemSet = mongoose.model('ProblemSet')

	ProblemSet.findOne({ _id: '54116b358b53a2020002515b' }, function (err, pset) {

		Problem.find({}, function (err, docs) {

			for (var i=0; i<docs.length; i++) {
				console.log("Pushing doc: "+docs[i].id+" "+docs[i].content.body.slice(0,100))
				pset.docs.push(docs[i])
			}
			pset.save(function (err, set) {
				console.log("Save?", err)
				e.quit();
			})
		});
	});


}).start()