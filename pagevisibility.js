/**
 * @fileoverview
 * Very simple lib for pagevis detection
 * @see http://canop.org/blog/?p=379b <- dead link..
 * todo: perhaps change to use a less "clever" non-overloaded API here? ..
 *
 * usage:
 * pageVisible(function(){ .. });   // register callback
 * var visible = pageVisible(); // get current state
 *
 * turns into a NOP if feature not supported
 * @see http://caniuse.com/#feat=pagevisibility
 *
 * @author Fredrik Blomqvist
 */

define([], function() {

// namespace
var pagevis = {};

/**
 *
 * @param {Function=} callback called when browser window/tab becomes visible or hidden. If no argument returns current state (boolean)
 * @return {boolean|Function}
 */
pagevis.pageVisible = (function() {
	var stateKey, eventKey, keys = {
		hidden: 'visibilitychange',
		webkitHidden: 'webkitvisibilitychange',
		mozHidden: 'mozvisibilitychange',
		msHidden: 'msvisibilitychange'
	};

	for (stateKey in keys) {
		if (stateKey in document) {
			eventKey = keys[stateKey];
			break;
		}
	}

	// @blq edit added missing support case
	if (eventKey == null) {
		return function() {
			// NOP
			return false;
		};
	}

	return function(callback) {
		if (callback) document.addEventListener(eventKey, function() {
			callback(!document[stateKey]);
		});
		return !document[stateKey];
	};
})();


return pagevis;

});
