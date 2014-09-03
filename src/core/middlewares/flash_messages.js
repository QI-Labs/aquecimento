module.exports = function(req, res, next) {
	res.locals.messages = req.flash();
	next();
}