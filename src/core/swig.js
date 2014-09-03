
var swig = require('swig')
var extras = require('swig-extras')

// var mySwig = new swig.Swig()

extras.useTag(swig, 'switch')
extras.useTag(swig, 'case')

extras.useTag(swig, 'markdown')

// Remove html tags from text.
swig.setFilter('planify', function (input) {
	return input.replace(/(<([^>]+)>)/ig,"")
})

// You know what slice is.
swig.setFilter('slice', function (input, start, end) {
	if (!end) {
		end = start;
		start = 0;
	}
	return input.slice(start, end);
})

swig.setFilter('calcTimeFrom', function (input) {
	var now = new Date(),
		then = new Date(input),
		diff = now-then;

	if (diff < 1000*60) {
		return 'agora';
		var m = Math.floor(diff/1000);
		return 'há '+m+' segundo'+(m>1?'s':'');
	} else if (diff < 1000*60*60) {
		var m = Math.floor(diff/1000/60);
		return 'há '+m+' minuto'+(m>1?'s':'');
	} else if (diff < 1000*60*60*30) { // até 30 horas
		var m = Math.floor(diff/1000/60/60);
		return 'há '+m+' hora'+(m>1?'s':'');
	} else if (diff < 1000*60*60*24*14) {
		var m = Math.floor(diff/1000/60/60/24);
		return 'há '+m+' dia'+(m>1?'s':'');
	} else {
		var m = Math.floor(diff/1000/60/60/24/7);
		return 'há '+m+' semana'+(m>1?'s':'');
	}
})


// You also know what split is.
swig.setFilter('split', function (input, char) {
	return input.split(char);
})

// You know what index is too
swig.setFilter('index', function (input, index) {
	if (index < 0)
		return input[input.length+index];	
	return input[index];
})

module.exports = swig