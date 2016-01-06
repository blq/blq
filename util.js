
define(['blq/assert'], function(assert) {

var util = {};

/**
 * Replaces "<"" etc with the corresponding "&lt;" chars to be able to display in html.
 *
 * todo: ? still couple of cases where the ng-sanitizer complains.. bug in ng??
 * todo: why is this not in jQuery? (inside most templating engines though)
 *
 * @param {string} strHtml
 * @return {string}
 */
util.escapeHtml = function(strHtml) {
	assert(typeof strHtml == 'string');

	// return $('<div>').text(strHtml).html(); // also fails in the ng-sanitizer! (same strings...)

	// @see mustache or jsrender for example
	return strHtml
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;") // _Not_ "&apos;" (not part of html standard)
		//.replace(/\x00/g, "&#0;") // ?
		.replace(/`/g, "&#96;");
};


return util;

});
