/**
 * @fileoverview
 * WebRTC stuff.
 *
 * @author Fredrik Blomqvist
 *
 */
define(['blq/assert', 'jquery'], function(assert, $) {

// namespace
var media = {};

// namespace
// todo: create a "polyfillEverything" blob?
media.polyfill = {};

// ok? or just create a helper fn and skip actual polyfill?
// @see https://github.com/addyosmani/getUserMedia.js
media.polyfill.enableGetUserMedia = function() {
	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
	window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
};


/**
 * convenience for getting MediaStreamTrack sources. splits sources by type.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack
 *
 * splits the types into three lists: cameras, microphones and other
 * @return {!jQuery.Promise} Array.<!{ cameras: !Array.<!Object>, microphones: !Array.<!Object>, other: !Array.<!Object> }>
 */
media._getMediaSources = function() {
	var d = $.Deferred();

	if (typeof MediaStreamTrack == 'undefined' || typeof MediaStreamTrack.getSources == 'undefined') {
		console.warn('MediaStreamTrack not supported');
		return d.reject().promise();
	}

	// todo: can this be slow? (could use d.notify() per source!)
	// todo: cache this?
	MediaStreamTrack.getSources(function(sources) {
		var cams = [];
		var mics = [];
		var other = [];

		sources.forEach(function(source) {
			if (source.kind == 'video') {
				// camera.facing is always "" on my laptop, but apparently can/should be "environment" or "user" (mobiles)
				// dump some debug
				if (source.facing != '')
					console.debug('video/camera facing:', source.facing);

				cams.push(source);
			} else
			if (source.kind == 'audio') {
				mics.push(source);
			} else {
				other.push(source);
			}
		});

		d.resolve({
			cameras: cams,
			microphones: mics,
			other: other
		});
	});

	return d.promise();
};


/**
 * @see blq._getMediaSources()
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Navigator/getUserMedia
 * returns only when the user actively has agreed on camera access!
 *
 * @param {string} sourceId as obtained from blq._getMediaSources()
 * @return {!jQuery.Promise} string url
 */
media._getVideoUrl = function(sourceId) {
	assert(typeof sourceId == 'string');

	// assumes navigator.getUserMedia and window.URL exists (or has been polyfilled)
	// todo: or handle polyfill/fallback here?
	assert(navigator.getUserMedia != null);
	assert(window.URL != null);

	var constraints = {
		// todo: audio?
		video: {
			optional: [{ sourceId: sourceId }]
			// width, height?
		}
	};

	var d = $.Deferred();
	navigator.getUserMedia(constraints,
		function(stream) {
			var videoUrl = window.URL.createObjectURL(stream);
			d.resolve(videoUrl);
		},
		function(error) {
			console.error('navigator.getUserMedia fail:', error);
			d.reject(error);
		}
	);
	return d.promise();
};


return media;

});
