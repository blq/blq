/**
 * @fileoverview
 * Aspect Oriented Programming, AOP
 * @see https://en.wikipedia.org/wiki/Aspect-oriented_programming
 *
 * @author Fredrik Blomqvist
 *
 * todo: not quite ready, needs more IRL time..
 * todo: should make these easy to _remove_ also -> store a tag string, similar to MK.bind
 * todo: multiple 'before' etc could maybe store in array, not deeper nests..
 * todo: or/also API taking _object_ (or class) + method-name.
 */
define([], function() {

// namespace
var aop = {};

aop.before = function(fn, before) {
	return function() {
		before.apply(this, arguments);
		return fn.apply(this, arguments);
	};
};


aop.after = function(fn, after) {
	return function() {
		var ret = fn.apply(this, arguments);
		after.apply(this, arguments); // or call via a try-finally?
		return ret;
	};
};


aop.around = function(fn, beforeAndAfter) { // or aop.wrap?
	return function() {
		beforeAndAfter();
		var ret = fn.apply(this, arguments);
		beforeAndAfter();
		return ret;
	};
	//-- alt ?--
	// return function() {
	// 	beforeAndAfter();
	// 	try {
	// 		return fn.apply(this, arguments);
	// 	} finally {
	// 		beforeAndAfter.apply(this, arguments);
	// 	}
	// };
};

// this is a
aop.beforeAfter = function(fn, before, after) {
	return function() {
		before.apply(this, arguments);
		var ret = fn.apply(this, arguments);
		after.apply(this, arguments); // todo: pass ret?
	};
};


aop.afterThrow = function(fn, after) {
	return function() {
		try {
			return fn.apply(this, arguments);
		} catch (e) {
			after.apply(this, arguments);
		}
	};
};


aop.afterFinally = function(fn, after) {
	return function() {
		try {
			return fn.apply(this, arguments);
		} finally {
			after.apply(this, arguments);
		}
	};
};


//---examples-----------

foo.addTraceCall = function(fn) {
	return aop.around(fn, function() {
		console.trace();
	});
};

// todo: foo.cache/memoize

// foo.lazy = function(fn) {
// // todo: err, this fn should condiationally call fn.
// 	aop.beforeAfter(fn,
// 		function() {
// 			if (fn._instance) {
// 				return fn._instance;
// 			}
// 		},
// 		function(ret) {
// 			fn._instance = ret;
// 		}
// 	);
// };


return aop;

});
