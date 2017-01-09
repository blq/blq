/**
 * @fileoverview
 * time-based debouncing and throttling
 *
 * @see http://en.wikipedia.org/wiki/Debounce#Contact_bounce
 * @see http://ajaxian.com/archives/debounce-your-javascript-functions
 * @see http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
 * @see http://benalman.com/projects/jquery-throttle-debounce-plugin/
 *
 * @author Fredrik Blomqvist
 *
 */
define([], function() {

/**
 * todo: perhaps optional support for checking actual value (or rather take a predicate) of the func. would enable for example hysteresis thresholding.
 * todo: create a more "signalish" interface also? special connectDebounce(src, 'onSignal', obj, preFlankFn, postFlankFn) ?
 *
 * @see throttle() also
 *
 * @param {!Function} func
 * @param {integer=} [threshold=100] ms
 * @param {boolean=} [execAsap=false]
 * @return {!Function} returned function also has a .cancel() method to abort
 */
var debounce = function(func, threshold, execAsap) {
	threshold = threshold || 100;
	execAsap = execAsap || false;

	var timeout = null; // handle to setTimeout async task (detection period)

	// return the new debounced function which executes the original function only once
	// until the detection period expires
	var _debounced = function debounced() { // use a named fn for debuggability (todo: perhaps store reference to base fn similar to bind??)
		var obj = this; // reference to original context object
		var args = arguments; // arguments at execution time

		// this is the detection function. it will be executed if/when the threshold expires
		function delayed() {
			// if we're executing at the end of the detection period
			if (!execAsap)
				func.apply(obj, args); // execute now
			// clear timeout handle
			timeout = null;
		}

		// stop any current detection period
		if (timeout != null) {
			clearTimeout(timeout);
		} else
		// otherwise, if we're not already waiting and we're executing at the beginning of the waiting period
		if (execAsap) {
			func.apply(obj, args); // execute now
		}

		// reset the waiting period
		timeout = setTimeout(delayed, /** @type {integer} */(threshold));
	};

	// add a cancel function (cancels the current debounced function call).
	// (todo: support "odd" case of a fn attached to multiple debubonces??)
	_debounced.cancel = function() {
		if (timeout != null) {
			clearTimeout(timeout);
			timeout = null;
		}
	};

	return _debounced;
};


/**
 * @see debounce() also
 *
 * @param {!Function} fn
 * @param {integer=} [threshold=250] ms
 * // todo: flag for deciding if calling at end etc?
 * @return {!Function} returned function also has a .cancel() method to abort
 */
var throttle = function(fn, threshold) {
	threshold = threshold || 250;

	var last = null;
	var deferTimer = null;
	var _throttled = function throttled() { // use a named fn for debuggability
		var self = this;
		var args = arguments;

		var now = Date.now();
		if (last && now < last + threshold) {
			// hold on to it
			clearTimeout(deferTimer);
			deferTimer = setTimeout(function() {
				last = now;
				fn.apply(self, args);
			}, threshold);
		} else {
			last = now;
			fn.apply(self, args);
		}
	};

	_throttled.cancel = function() {
		if (deferTimer != null) {
			clearTimeout(deferTimer);
			deferTimer = null;
		}
	};

	// todo expose a fn.throttle(ms) (name? fn.threshold(ms)?) to change time?

	return _throttled;
};


return {
	debounce: debounce,
	throttle: throttle
};

});
