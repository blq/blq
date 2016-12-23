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
 * @param {string} uri
 * @return {!{url: string, protocol: string, hostname: string, port: integer, pathname: string, search: string, hash: string, host: string}}
 */
url.parseUrl = function(uri) {
	// (re)use a cached <a> tag and let the browser do the job :)
	var self = arguments.callee;
	var a = self._a = self._a || document.createElement('a');
	self._a.href = uri;

	// return a plain object
	return {
		url: a.href,
		protocol: a.protocol,
		hostname: a.hostname,
		port: parseInt(a.port || '80', 10), // even an explicit :80 in the url is ignored
		pathname: a.pathname,
		search: a.search,
		hash: a.hash,
		host: a.host // includes port
	};
};


/**
 * note: assumes running in a DOM-context
 * @see http://davidwalsh.name/get-absolute-url
 *
 * @param {string} uri
 * @return {string}
 */
url.getAbsoluteUrl = function(uri) {
	assert(typeof uri == 'string');
	// assert(blq.isBrowser()); // ok?

	return url.parseUrl(uri).url;
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
