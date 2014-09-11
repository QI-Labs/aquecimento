var async, jobber, _,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

async = require('async');

_ = require('underscore');

jobber = require('./jobber.js')(function(e) {
  var Activity, Group, Inbox, Notification, Post, Resource, User, mongoose, testCount, tests, wrapTest;
  mongoose = require('mongoose');
  Notification = mongoose.model('Notification');
  Inbox = mongoose.model('Inbox');
  Resource = mongoose.model('Resource');
  Activity = Resource.model('Activity');
  Post = Resource.model('Post');
  Group = Resource.model('Group');
  User = Resource.model('User');
  testCount = 0;
  tests = [
    function(next) {
      console.log("Looking for activities with obsolete actor/object/target.");
      return Activity.find({}).populate('actor object target').exec((function(_this) {
        return function(err, docs) {
          var doc, incon, _i, _len;
          if (err) {
            console.warn(err);
          }
          incon = _.filter(docs, function(i) {
            return !i.actor || !i.object || !i.object;
          });
          console.log('Found:', incon.length);
          for (_i = 0, _len = docs.length; _i < _len; _i++) {
            doc = docs[_i];
            doc.remove(function() {});
          }
          return next(err);
        };
      })(this));
    }, function(next) {
      console.log("Looking for activities with obsolete group");
      return Activity.find({
        $not: {
          group: null
        }
      }).populate('group').exec((function(_this) {
        return function(err, docs) {
          if (err) {
            console.warn(err);
          }
          console.log('Found:', docs.length);
          return next(err);
        };
      })(this));
    }, function(next) {
      console.log("Looking for posts with obsolete author");
      return Post.find({}).populate('author').exec((function(_this) {
        return function(err, docs) {
          var incon;
          if (err) {
            console.warn(err);
          }
          incon = _.filter(docs, function(i) {
            return !i.author;
          });
          console.log('Found:', docs.length);
          return next(err);
        };
      })(this));
    }, function(next) {
      console.log("Looking for posts with obsolete group");
      return Post.find({
        $not: {
          group: null
        }
      }).populate('group').exec((function(_this) {
        return function(err, docs) {
          var incon;
          if (err) {
            console.warn(err);
          }
          incon = _.filter(docs, function(i) {
            return !i.group;
          });
          console.log('Found:', docs.length);
          return next(err);
        };
      })(this));
    }, function(next) {
      console.log("Looking for notifications with obsolete recipient/agent");
      return Notification.find({}).populate('recipient agent').exec((function(_this) {
        return function(err, docs) {
          if (err) {
            console.warn(err);
          }
          console.log('Found:', docs.length);
          return next(err);
        };
      })(this));
    }, function(next) {
      console.log("Looking for inboxes with obsolete resource");
      return Inbox.find({}).populate('resource').exec((function(_this) {
        return function(err, docs) {
          var doc, incon, _i, _len;
          incon = _.filter(docs, function(i) {
            return !i.resource;
          });
          console.log('Found:', incon.length);
          for (_i = 0, _len = incon.length; _i < _len; _i++) {
            doc = incon[_i];
            doc.remove(function() {});
          }
          next(err);
          return $not;
        };
      })(this));
    }, function(next) {
      console.log("Looking for user memberships of obsolete groups");
      return Group.find({}).exec((function(_this) {
        return function(err, docs) {
          var ids, obs;
          ids = _.pluck(docs, 'id');
          obs = [];
          return User.find({}, function(err, users) {
            var g, groups, user, _i, _len;
            for (_i = 0, _len = users.length; _i < _len; _i++) {
              user = users[_i];
              groups = _.pluck(user.memberships, 'group');
              obs.push((function() {
                var _j, _len1, _results;
                _results = [];
                for (_j = 0, _len1 = groups.length; _j < _len1; _j++) {
                  g = groups[_j];
                  if (__indexOf.call(ids, g) < 0) {
                    _results.push(g);
                  }
                }
                return _results;
              })());
            }
            console.log('Found:', obs);
            return next();
          });
        };
      })(this));
    }, function(next) {
      return User.find({}).populate('memberships.group').exec((function(_this) {
        return function(err, users) {
          if (err) {
            console.warn(err);
          }
          return next(err);
        };
      })(this));
    }
  ];
  wrapTest = function(test) {
    return function() {
      console.log("Starting test " + (testCount++) + ".");
      return test.apply(this, arguments);
    };
  };
  return async.series(_.map(tests, function(i) {
    return wrapTest(i);
  }), function(err, results) {
    console.log('err', err, 'results', results);
    return e.quit();
  });
}).start();
