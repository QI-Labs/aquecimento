
var mongoose = require('mongoose')

module.exports = {
  $isModel: {
    test: function(value, expected) {
      var model;
      if (expected.schema && expected.schema instanceof mongoose.Schema) {
        model = expected;
      } else if (typeof expected === 'string') {
        model = mongoose.model(expected);
      } else {
        return "Invalid expected value for assertion of type '$ismodel': "+expected;
      }
      if (value instanceof model) {
        return false;
      } else if (value instanceof mongoose.model('Resource') && value.__t === expected) {
        return false;
      }
      return "The following argument doesn't match {ismodel:"+expected+"}: '"+(JSON.stringify(value))+"'";
    }
  },
}