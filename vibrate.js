/**
 * @fileoverview
 * Vibration API
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API
 * @see http://www.w3.org/TR/vibration/
 *
 * @author Fredrik Blomqvist
 */
define([], function() {

'use strict';

// namespace
var vib = {};

/**
 * @private
 * @return {?Function}
 */
vib._get_vibration = function() {
	// could polyfill also I guess
	// todo: hmm, or return a wrapped bound function?
	return navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate || null;
};

/**
 * @return {boolean}
 */
vib.supports_vibration = function() {
	return !!vib._get_vibration();
};

/**
 * use vibrate(0) to stop vibration.
 * silently fails if vibration not supported
 * and nope, can't vibrate from a hidden tab or minized browser! :(
 *
 * @see http://caniuse.com/#feat=vibration
 *
 * @param {(number|Array.<number>)=} v ms default single 1s vibration
 */
vib.vibrate = function(v) {
	if (arguments.length == 0)
		v = 1000;
	var vibrate = vib._get_vibration();
	if (vibrate) vibrate.call(navigator, v);
};


return vib;

});
