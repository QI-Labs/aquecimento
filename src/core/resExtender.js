
var _ = require('lodash');
var nconf = require('nconf');

var options = {
	404: {
		status: 404,
		title: "Quem apagou a luz?",
		h1: "Quem apagou a luz?",
		msg: "Não encontramos a página que você estava tentando visualizar...",
		action: "Voltar para o site",
	},
	500: {
		status: 500,
		title: "500 · Alguém vai ser mandado embora...",
		h1: "Ops! <span>:(</span>",
		h2: "Tivemos problemas técnicos.",
		action: "Tente voltar para o site",
	}
};

module.exports = function (req, res, next) {
	// source: https://github.com/HabitRPG/habitrpg/blob/develop/src/middleware.js
	res.locals.IS_MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(req.header('User-Agent'));

	res.endJSON = function (data) {
		res.json(data);
	};

	res.render404 = function (obj) {
		res.status(404);
		if (req.accepts('html') && !req.isAPICall) { // respond with html page;
			var data = _.clone(options[404]);
			if (obj && obj.msg)
				data.msg = obj.msg;
			res.render('app/error', data);
		} else {
			res.send({
				error: true,
				message: (obj && obj.msg) || 'Not found.'
			});
		}
	};

	res.renderError = function (obj) {
		res.status(obj && obj.status || 500);
		if (req.accepts('html') && !req.isAPICall) { // respond with html page;
			var data = _.extend(options[500], {
				msg: (obj && obj.msg) || undefined,
			});
			if (nconf.get('env') === 'development') {
				_.extend(data, obj);
			}
			res.render('app/error', data);
		} else {
			var data = {
				error: true,
				message: (obj && obj.msg) || undefined,
			};
			if (nconf.get('env') === 'development') {
				_.extend(data, obj);
			}
			res.send(data);
		}
	};

	next();
}