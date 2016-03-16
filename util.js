/**
 *
 * @author Fredrik Blomqvist
 *
 */
define(['blq/assert'], function(assert) {

// namespace
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

/**
 * @private
 * @type {number} // integer
 */
util._uid_count = 0;

/**
 * ok? goog/base.js has same name but requires arg to attach to.
 * @return {number} unique (per session) integer id
 */
util.getUid = function() {
	return util._uid_count++;
};


//////////
	// run when your page is done
	// (assumes noone wipes out entire <body> contents..)
	// todo: opt-out if not on a Mobile browser? (Desktop case probably don't want fullscreen. also not in Cordova)
	// @see http://caniuse.com/#feat=fullscreen
	function enableFirstClickFullscreen() {
		// @see https://brad.is/coding/BigScreen/
		if (window.BigScreen == null || !BigScreen.enabled) {
			console.warn('FullScreen API not supported');
			return;
		}

		// or prepend as first elem? must try to ensure above all other elems
		// yes, plain 'document' event would work, *unless* iframe..
		$('body').append($('<div>', {
			id: 'fullscreen_helper',
			css: {
				// width: '100%', height: '100%',
				position: 'fixed',
				top: 0, left: 0,
				right: 0, bottom: 0,
				margin: 0,
			 	'z-index': 6666
			},
			on: {
				// just using "click" works of course but can confuse, specially
				// on phones were toch-drag-pan (map!) is common and which doesn't fire a click
				// causing illusion of ui being frozen.
				// todo: ! *only* use touch-event and only mobiles will get this behavior - as intended!
				'touchstart mousedown': function() {
					console.debug('first tap! -> fullscreen');
					// in case events don't fire hide this right away
					$('#fullscreen_helper').hide();
					// if (!Mobile.isFullScreen()) // not really necessary. might risk case for false negative?
						BigScreen.request();

				}
			}
		}));

		// todo: doesn't work in IE11...
		BigScreen.onenter = function() {
		    // called when the first element enters full screen
			console.debug('going fullscreen!');
			$('#fullscreen_helper').hide();
		};

		BigScreen.onexit = function() {
		    // called when all elements have exited full screen
			console.debug('exiting fullscreen mode');
			$('#fullscreen_helper').show();
		};
	}
////////////////


return util;

});
