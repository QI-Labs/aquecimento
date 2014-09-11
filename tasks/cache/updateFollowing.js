var async, jobber, mongoose, _;

async = require('async');

_ = require('underscore');

mongoose = require('mongoose');

jobber = require('../jobber.js')(function(e) {
  var Follow, Resource, User, redis;
  redis = require('../../src/config/redis.js');
  Resource = mongoose.model('Resource');
  User = Resource.model('User');
  Follow = Resource.model('Follow');
  return User.find({}, function(err, users) {
    if (err) {
      return console.error(err);
    }
    return async.mapSeries(users, (function(user, next) {
      var ffield;
      console.log("Updating following cache for user " + user.username + " (id=" + user.id + ")");
      ffield = user.getCacheFields("Following");
      return redis.smembers(ffield, function(err, num) {
        return user.getFollowingIds(function(err, following) {
          if (err) {
            return next(err);
          }
          if (following.length === 0) {
            return next(null, 0);
          }
          return redis.del(ffield, function(err, num) {
            if (err) {
              return next(err);
            }
            return redis.sadd(ffield, following, function(err, doc) {
              if (err) {
                return next(err);
              }
              return next(null, doc);
            });
          });
        });
      });
    }), function(err, results) {
      console.log('pastel', arguments);
      return e.quit();
    });
  });
}).start();
