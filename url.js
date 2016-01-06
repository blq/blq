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


return url;

});
