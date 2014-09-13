module.exports = function(req, res) {
	if (req.isAPICall)
		res.status(404).endJSON({ error: true, name: "Page not found." });
	else
		res.render404();
}