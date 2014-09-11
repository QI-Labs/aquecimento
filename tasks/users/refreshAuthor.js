var async, jobber, mongoose;

async = require('async');

mongoose = require('mongoose');

jobber = require('../jobber.js')(function(e) {
  var Post, Resource, User, targetUserId, workUser;
  Resource = mongoose.model('Resource');
  Post = Resource.model('Post');
  User = Resource.model('User');
  workUser = function(user, cb) {
    console.log("Refreshing authorship for " + user.id + " aka " + user.username);
    return Post.update({
      'author.id': '' + user.id
    }, {
      $set: {
        author: User.toAuthorObject(user)
      }
    }, {
      multi: true
    }, function(err, num) {
      if (err) {
        console.error(err);
      }
      console.log("Saving posts:", err, num);
      return cb(err);
    });
  };
  targetUserId = process.argv[2];
  if (targetUserId) {
    return User.findOne({
      _id: targetUserId
    }, function(err, user) {
      return workUser(user, e.quit);
    });
  } else {
    console.warn("No target user id supplied.");
    return User.find({}, function(err, users) {
      return async.map(users, workUser, e.quit);
    });
  }
}).start();
