/**
 * @fileoverview
 * Very simple lib for pagevis detection
 * @see https://canop.org/blog/?p=379b <- dead link..
 * todo: perhaps change to use a less "clever" non-overloaded API here? .. (isVisible, subscribe, unsubscribe ?)
 *
 * usage:
 * pageVisible(function(isVisible){ .. });   // register callback
 * var visible = pageVisible(); // get current state
 *
 * turns into a NOP if feature not supported
 * @see https://caniuse.com/#feat=pagevisibility
 * todo: seems like we could drop basically all polyfills now?
 *
 * @author Fredrik Blomqvist
 */

define([], function() {

// namespace
var api = {};

/**
 * @param {function(boolean)=} callback called when browser window/tab becomes visible or hidden. If no argument returns current state
 * @return {boolean}
 */
api.pageVisible = (function() {
	var stateKey, eventKey, keys = {
		hidden: 'visibilitychange',
		// todo: all modern browser should support official name by now?
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
		console.warn('Page Visibility not supported -> always return True');
		return function(callback) {
			if (callback) {
				callback(true); // or after a tiny setTimeout?
			}
			return true;
		};
	}

	return function(callback) {
		if (callback) {
			// todo: or return the bound fn (wrapper) here (treat it as a token/handle) so we could provide an removeEventListener?
			document.addEventListener(eventKey, function() {
				callback(!document[stateKey]);
			});
		}
		return !document[stateKey];
	};
})();


return api;

});
