
var $ = require('jquery')
window.$ = window.jQuery = $;

require('backbone')

var common = require('../common.js')
var router = require('../components/router.js')
router.initialize()
alert('oi')

$(".teste-latex").on('submit', function (e) {
	e.preventDefault();
	$(this).find('.latex-test-output').html($(this).find('textarea').val());
	MathJax.Hub.Queue(['Typeset',MathJax.Hub]);
});