/**
 *
 * @author Fredrik Blomqvist
 *
 */
define(['blq/assert'], function(assert) {

// namespace
var url = {};

/**
 * resembles WebKit's window.location.origin but cross-browser
 * todo: ok name? option to include port-nr or not?
 * @param {Window=} [win=window]
 * @return {string}
 */
url.getLocationOrigin = function(win) {
	win = win || window;
	assert(win.location != null);

	// 'window.location.origin' works only in Chrome/WebKit
	return win.location.protocol + '//' + win.location.host; // (hostname doesn't include port number)
};

/**
 * note: assumes running in a DOM-context
 * @see http://davidwalsh.name/get-absolute-url
 *
 * @param {string} url
 * @return {string}
 */
url.getAbsoluteUrl = function(url) {
	assert(typeof url == 'string');
	// assert(blq.isBrowser()); // ok?

	// (re)use a cached <a> tag and let the browser do the job :)
	var self = arguments.callee;
	self._a = self._a || document.createElement('a');
	self._a.href = url;
	return self._a.href;
};

/**
 * "NOP image", 1x1 8-bit GIF as a data URI.
 * @see https://en.wikipedia.org/wiki/Data_URI_scheme
 * Useful to avoid the ugly "no image" icon in many browsers.
 *
 * idea "stolen" from Leaflet src, L.Util.emptyImageUrl
 * todo: ok module for this?
 *
 * @type {string}
 * @const
 */
url.emptyImageUrl = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';


/**
 * Replaces "<"" etc with the corresponding "&lt;" chars to be able to display in html.
 *
 * todo: ? still couple of cases where the ng-sanitizer complains.. bug in ng??
 * todo: why is this not in jQuery? (inside most templating engines though)
 *
 * @param {string} strHtml
 * @return {string}
 */
url.escapeHtml = function(strHtml) {
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


return url;

});
