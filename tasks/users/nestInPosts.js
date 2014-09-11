var jobber, mongoose, _;

_ = require('underscore');

mongoose = require('mongoose');

jobber = require('../jobber.js')(function(e) {
  var Post, Resource, User;
  Resource = mongoose.model('Resource');
  Post = Resource.model('Post');
  User = Resource.model('User');
  return User.find({}, function(err, users) {
    var user, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = users.length; _i < _len; _i++) {
      user = users[_i];
      _results.push((function(user) {
        console.log('user', user, '' + user.id, '\n\n');
        return Post.find({
          'author.id': mongoose.Types.ObjectId(user.id)
        }, function(err, posts) {
          var post, _j, _len1, _results1;
          if (err) {
            console.log(err);
            return;
          }
          _results1 = [];
          for (_j = 0, _len1 = posts.length; _j < _len1; _j++) {
            post = posts[_j];
            if (post.author.username) {
              _results1.push(console.log('username', post.author));
            } else {
              console.log(post.author);
              post.author = {
                id: '' + user.id,
                username: user.username,
                path: user.path,
                avatarUrl: user.avatarUrl,
                name: user.name
              };
              _results1.push(post.save(function(err) {
                return console.log(arguments);
              }));
            }
          }
          return _results1;
        });
      })(user));
    }
    return _results;
  });
}).start();
