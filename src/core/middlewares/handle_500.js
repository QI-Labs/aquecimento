
var winston = require('winston');
var nconf = require('nconf');
var expressWinston = require('express-winston');
var cluster = require('cluster');

permissions = {
	'not_on_list': 'Você não está autorizado a continuar. Se você faz parte do mentoriado NOIC 2014, é provável que você não tenha preenchido o formulário de inscrição no QI Labs.',
	'isMe': 'Você não está autorizado a continuar.',
	'selfOwns': 'Ação não autorizada.',
	'selfDoesntOwn': 'Ação não autorizada.',
	'login': 'Ação não autorizada.',
	'isEditor': 'Ação não autorizada.',
}

Error.stackTraceLimit = 60

module.exports = function(err, req, res, next) {
	// Don't handle ObsoleteId, for it's sign of a 404.
	if (err.type === 'ObsoleteId' || err.type === 'InvalidId') {
		// TODO: find way to detect while model type we couldn't find and customize 404 message.
		return res.render404(); // 'Esse usuário não existe.');
	}

	// Test permissions and don't trace/log them.
	if (err.permission) {
		res.status(401);
		if (err.permission === 'login') {
			if (~(req.headers.accept || '').indexOf('html')) {
				res.redirect('/');
			} else {
				// Don't use middleware.
				res.endJSON({ error: true, message: 'Unauthenticated user.' });
			}
			// Keep track of unauthorized access (lots of they may indicate a problem).
			req.logger.debug('IP '+req.connection.remoteAddress+' can\'t '+req.method+' path '+req.url);
		}

		if (err.permission in permissions) {
			res.renderError({msg: permissions[err.permission]})
			return;
		}
		req.logger.warn("Permission "+err.permission+" not found in list.");
		res.renderError({msg: "Proibido continuar."});
	}

	if (err.name === 'InternalOAuthError') {
		res.renderError({status: 401, msg: 'Não conseguimos te autenciar. Tente novamente.'})
		return;
	}

	// Set status.
	if (err.status)
		res.status(err.status);
	else if (res.statusCode < 400)
		res.status(500);
	
	if (req.app.get('env') === 'production') {
		try {
			var newrelic = require('newrelic');
			newrelic.noticeError(err);
		} catch (e) {
			req.logger.warn('Failed to call newrelic.noticeError.', e);
		}
	}	

	req.logger.fatal('Error detected:', err, err.args && JSON.stringify(err.args.err && err.args.err.errors));
	Error.stackTraceLimit = 60
	if (err.stack)
		req.logger.info(err.stack)
	console.trace();

	// from http://nodejs.org/api/domain.html#domain_warning_don_t_ignore_errors
	try {
		// Close server and force exit after 10 if CLUSTERING.
		if (nconf.get('env') === 'production' && process.env.__CLUSTERING) {
			req.app.preKill(10*1000);
		}

		// try to send error callback
		res.renderError({
			error_code: res.statusCode,
			error_msg: err.msg,
			error_stack: (err.stack || '').split('\n').slice(1).join('<br>'),
			msg: err.human_message,
		});
	} catch (e) {
		// oh well, not much we can do at this point.
		res.end();
		req.logger.fatal("Failed to renderError. Empty response returned.", e);
		console.trace();
	}
}