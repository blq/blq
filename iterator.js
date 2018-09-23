/**
 * Itertools for ES6
 *
 * Inspired by Python Itertools and Boost C++ Iterator
 * @see https://docs.python.org/3/library/itertools.html
 * @see https://www.boost.org/doc/libs/1_68_0/libs/iterator/doc/index.html
 *
 * From JS point of view basically a port of MochiKit Iter
 * @see https://blq.github.io/mochikit/doc/html/MochiKit/Iter.html
 * and my MochiKit fork's Iterator Extensions
 * @see https://blq.github.io/mochikit/doc/html/MochiKit/Iter-ext.html
 *
 * .. Lodash, Underscore bla bla
 *
 * @author Fredrik Blomqvist
 *
 */
define(['MochiKit/Iter'], function(_iter) {

var api = {};


/**
 * todo: hmm, well, this gives true also for MK.Iters ...
 * @param {*} obj
 * @return {boolean}
 */
api.isES6Iterable = function(obj) {
	if (obj != null && typeof Symbol == 'function' && typeof Symbol.iterator != 'undefined') {
		return typeof obj[Symbol.iterator] == 'function' || typeof obj.next == 'function';
	}
	return false;
};

/**
 * returns an ES6 Iterator either an ES6 Iterable or input if already an ES6 Iterator.
 * todo: name?
 * @see MochiKit.Iter.iter()
 * @return {!ES6Iterable} throws if not compatibile or not an iterable
 */
api.es6Iter = function(es6iterable) {
	// in ES6 typeof Symbol.iter == 'symbol'. but we use simpler test to allow polyfills and avoid lint warning.
	// todo: overload on MK.Iter also?! MK.Iterable concept could simply wrap in a toES6Iterator() and go (pure Mk.Iterator bigger problem since same signature.. :( or sniff for 'repr' method for example? )
	if (typeof Symbol == 'function' && typeof Symbol.iterator != 'undefined') {
		if (typeof es6iterable[Symbol.iterator] == 'function') {
			return es6iterable[Symbol.iterator]();
		} else if (typeof es6iterable.next == 'function') {
			return es6iterable;
		}
		throw new TypeError(es6iterable + ": is not iterable");
	}
	throw new Error("ES6 Iterators not supported");
	return null; // silence warning
};


/**
 * Convert a ES6 iterator style into a MochKit.Iterable
 * todo: ok name?
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols
 * @see MochiKit.Iter.toES6Iterator
 * @param {!ES6Iterator} es6iterable overloads on both Iterable and Iterator
 * @return {!Iterable}
 */
api.fromES6Iterator = function(es6iterator) {
	var it = api.es6Iter(es6iterator);
	return {
		next: function() {
			var step = it.next();
			if (step.done) {
				throw MochiKit.Iter.StopIteration;
			}
			return step.value;
		}
	};
};


/**
 * Convert a MochKit.Iterable into a ES6 Iterator.
 * todo: todo: ok name?
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols
 * @see MochiKit.Iter.fromES6Iterator
 * @param {!Iterable} iterable
 * @return {!ES6Iterator} // todo: check exact type
 */
api.toES6Iterator = function(iterable) {
	var it = MochiKit.Iter.iter(iterable);
	return {
		next: function() {
			try {
				var val = it.next();
				return {
					done: false,
					value: val
				};
			} catch (e) {
				if (e != MochiKit.Iter.StopIteration)
					throw e;
			}
			return { done: true };
		}
	};
};


return api;

});
