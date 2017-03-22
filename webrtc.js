/**
 * @fileoverview
 * WebRTC stuff.
 *
 * @author Fredrik Blomqvist
 *
 */
define(['blq/assert'], function(assert) {

// namespace
var media = {};

// namespace
// todo: create a "polyfillEverything" blob?
media.polyfill = {};

// ok? or just create a helper fn and skip actual polyfill?
// @see https://github.com/addyosmani/getUserMedia.js
media.polyfill.enableGetUserMedia = function() {
	// todo: is this deprecated? see MediaDevices.getUserMedia()
	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
	window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
};


/**
 * convenience for getting MediaStreamTrack sources. splits sources by type.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack
 *
 * splits the types into three lists: cameras, microphones and other
 * @return {!Promise} Array.<!{ cameras: !Array.<!Object>, microphones: !Array.<!Object>, other: !Array.<!Object> }>
 */
media._getMediaSources = function() {
	return new Promise(function(resolve, reject) {
		if (typeof MediaStreamTrack == 'undefined' || typeof MediaStreamTrack.getSources == 'undefined') {
			var msg = 'MediaStreamTrack not supported';
			console.warn(msg);
			reject(msg);
			return;
		}

		// todo: can this be slow? (could use d.notify() per source!)
		// todo: cache this?
		// todo: Chrome says this is deprecated? use: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices
		/*
		navigator.mediaDevices.enumerateDevices()
		.then(function(devices) {
		  devices.forEach(function(device) {
			console.log(device.kind + ": " + device.label +
						" id = " + device.deviceId);
		  });
		})
		.catch(function(err) {
		  console.log(err.name + ": " + error.message);
		});
		*/

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

			resolve({
				cameras: cams,
				microphones: mics,
				other: other
			});
		});
	});
};


/**
 * @see blq._getMediaSources()
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Navigator/getUserMedia
 * returns only when the user actively has agreed on camera access!
 *
 * observe that after use it's recommended to dipose the url using: URL.revokeObjectURL(url);
 *
 * todo: hmm, maybe blob url isn't necessary all the time?
 * can maybe assign stream directly to <video>.srcObject ! @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/srcObject
 *
 * @param {string} sourceId as obtained from blq._getMediaSources()
 * @return {!Promise} string url
 */
media._getVideoUrl = function(sourceId) {
	assert(typeof sourceId == 'string');

	// assumes navigator.getUserMedia and window.URL exists (or has been polyfilled)
	// todo: or handle polyfill/fallback here?
	// assert(navigator.getUserMedia != null);
	// assert(window.URL != null);

	var constraints = {
		// todo: audio?
		video: {
			optional: [{ sourceId: sourceId }]
			// width, height?
		}
	};

	return new Promise(function(resolve, reject) {
		navigator.getUserMedia(constraints,
		// MediaDevices.getUserMedia(constraints, // ?
			function(stream) {
				// todo: ? or use video.srcObject = stream directly?!
				var videoUrl = window.URL.createObjectURL(stream);
				resolve(videoUrl);
			},
			function(error) {
				console.error('navigator.getUserMedia fail:', error);
				reject(error);
			}
		);
	});
};


return media;

});
