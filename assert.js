/**
 * @fileoverview
 * plain and simple assert that logs and breaks into the debugger if available
 *
 * @author Fredrik Blomqvist
 *
 * todo: flags to opt-out of the 'debugger' statement? and control if just log and/or throw?
 * todo: hmm, or just use goog.asserts? (unneccesarily big with string lib deps etc though..)
 *
 */

define([/*'polyfills/console'*/], function(/*console polyfill is not AMD*/) {

	var assert = function(cond, optMsg) {
		if (!cond) {
			// todo: see if we could perhaps support adding more var_args and
			// just fwd to consoles multi-args (including the string-formatting!)
			console.error('ASSERT:', optMsg || '');

			if (!assert._disableBreak) {
				try {
					debugger;
				} catch(e) {
					throw e;
				}
			} else {
				// todo: option to throw?
			}
		}
	};

	assert._disableBreak = false;

	// expose globally also
	return window['assert'] = assert;
});
