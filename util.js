/**
 *
 * @author Fredrik Blomqvist
 *
 */
define(['blq/assert'], function(assert) {

var util = {};


/**
 * Factory to create Blobs. fallback to old BlobBuilder API.
 * Mostly for better Android support.
 * (this is not a polyfill. Doesn't emulate the 'slice' method etc).
 *
 * @see http://caniuse.com/#feat=blobbuilder Android 46+ (4.1+ with fallback). IE10+(not with JS content?)
 *
 * @param {Array.<string|Array|Blob|ArrayBuffer|ArrayBufferView>} parts
 * @param {string} mimeType (todo: reasonable with some default maybe?)
 * @return {Blob} null if failed
 */
util._createBlob = function(parts, mimeType) {
	parts = parts || [];

	var blob = null;
	try {
		blob = new Blob(parts, { type: mimeType });
	} catch(ex) {
		try {
			var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
			var bb = new BlobBuilder();
			parts.forEach(function(part) {
				bb.append(part);
			});
			blob = bb.getBlob(mimeType);
		} catch(ex2) {
			console.error('createBlob: Both "Blob" and "BlobBuilder" failed. Unsupported or invalid input.', ex2);
		}
	}
	return blob;
};


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
