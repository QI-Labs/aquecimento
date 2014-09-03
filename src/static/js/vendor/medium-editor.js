
var $ = require('jquery')
window.$ = $;
var MediumEditor = require('./addons/medium-editor.min.js')
window.MediumEditor = MediumEditor

require('./addons/medium-editor-insert-plugin.min.js')
require('./addons/medium-editor-insert-images-modified.js')

module.exports = MediumEditor