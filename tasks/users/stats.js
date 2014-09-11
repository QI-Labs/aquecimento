var async, jobber, mongoose, _;

async = require('async');

_ = require('underscore');

mongoose = require('mongoose');

jobber = require('../jobber.js')(function(e) {
  var Follow, Post, Resource, User, targetUserId, workUser;
  Resource = mongoose.model('Resource');
  Post = Resource.model('Post');
  User = Resource.model('User');
  Follow = Resource.model('Follow');
  workUser = function(user, cb) {
    console.log("Refreshing status for " + user.id + " aka " + user.username);
    return Follow.count({
      follower: user,
      followee: {
        $ne: null
      }
    }, function(err, cfollowing) {
      return Follow.count({
        followee: user,
        follower: {
          $ne: null
        }
      }, function(err, cfollowers) {
        return Post.find({
          'author.id': '' + user.id,
          parent: null
        }, function(err, posts) {
          var post, votes, _i, _len;
          if (err) {
            console.error(err);
          }
          user.stats.following = cfollowing;
          user.stats.followers = cfollowers;
          user.stats.posts = posts.length;
          votes = 0;
          for (_i = 0, _len = posts.length; _i < _len; _i++) {
            post = posts[_i];
            votes += post.votes.length;
          }
          user.stats.votes = votes;
          console.log("Saving " + user.username + "'s new stats: ", user.stats);
          return user.save(function() {
            return cb();
          });
        });
      });
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
