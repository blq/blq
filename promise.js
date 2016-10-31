/**
 *
 */
define(['blq/assert', 'jquery', 'polyfills/es6-promise', 'MochiKit/Async'], function(assert, $, _promise) {

// namespace
var blq = {};

var bind = MochiKit.Base.bind;

/**
 * @param {!(jQuery.Deferred|jQuery.Promise)} jd (just saying Promise is actually enough since Deferred inherits from it. but add both for clarity)
 * @return {!MochiKit.Async.Deferred}
 */
blq.jQueryDeferredToMochiKitDeferred = function(jd) {
	assert(jd != null);

	var md = new MochiKit.Async.Deferred();
	jd.then(bind(md.callback, mk), bind(md.errback, md));
	return md;
};


/**
 * @param {!MochiKit.Async.Deferred} md
 * @return {!jQuery.Promise}
 */
blq.mochiKitDeferredTojQueryPromise = function(md) {
	assert(md != null);

	var jd = jQuery.Deferred();
	md.addCallbacks(bind(jd.resolve, js), bind(jd.reject, jd));
	return jd.promise(); // could return jQuery.Deferred but no real use since MK.Deferred controls the trigger now!
};

/**
 * Experimental.
 * "hacks" MK.Deferred to also expose methods that makes its interface compatible
 * with the corresponding jQuery.Promise style (jQ 1.8 state, without methods deprecated in 1.7+)
 * I.e a user of a function that returns a MK.Deferred will be "fooled" to believe it's a jQ.Promise.
 *
 * : after this fn is called (no arg case) all new MochiKit.Async.Deferreds will also carry the jQ.Promise interface!
 * todo: would be possible to create the inverse of this function also, BUT, currently MK internals use "instanceof" couple of places.
 *
 * Everything except the error handling propagation can be mimiced (jQuery doesn't try-catch and propagate!)
 * (technically modifies the MK.Deferred.prototype)
 * Also the progress() callback is a NOP since it has not MK equivalent. Should be kindof ok since code shouldn't be desinged to fundamentally rely on it..
 *
 * Yes, would (almost) be possible to mimic entire jQuery.Deferred also but more cumbersome and not quite as useful anyway.
 * Since a *consumer* (caller) does not use/need the full Deferred-resolve interface anyway, only the Promise part. Similarily, the
 * *producer* of the Promise has all the info and shouldn't need to be "fooled"!
 *
 * todo: move to MK.Async directly?
 * todo: if this works ok move it to the Core async so users can use the RPC proxy woth this!
 *
 * @see http://blq.github.io/mochikit/doc/html/MochiKit/Async.html
 * @see http://api.jquery.com/category/deferred-object/
 * @see http://api.jquery.com/promise/
 *
 * @param {T=} [obj] default MochiKit.Async.Deferred.prototype pass in a custom obj if only single mod is required
 * @return {!(T|MochiKit.Async.Deferred.prototype)} same obj passed in constructor or default MochiKit.Async.Deferred.prototype
 * @template T
 */
blq._enableMochiKitDeferredMimicjQueryPromise = function(obj) {
	var mkdp = obj || MochiKit.Async.Deferred.prototype;

	// @see http://blq.github.io/mochikit/doc/html/MochiKit/Async.html#fn-deferred.prototype.addcallbacks
	// @see http://api.jquery.com/deferred.then/
	mkdp.then = function(done, fail, progress) {
		if (typeof progress == 'function') {
			console.warn('progress callback not yet emulated');
		}
		return this.addCallbacks(done, fail);
	};

	// @see http://blq.github.io/mochikit/doc/html/MochiKit/Async.html#fn-deferred.prototype.addcallback
	// @see http://api.jquery.com/deferred.done/
	mkdp.done = function() {
		var fns = MochiKit.Base.flattenArguments(arguments);
		var self = this;
		return this.addCallback(function() {
			var args = arguments;
			fns.forEach(function() {
				fn.apply(self, args);
			});
		});
	};

	// @see http://blq.github.io/mochikit/doc/html/MochiKit/Async.html#fn-deferred.prototype.adderrback
	// @see http://api.jquery.com/deferred.fail/
	mkdp.fail = function() {
		var fns = MochiKit.Base.flattenArguments(arguments);
		var self = this;
		return this.addErrback(function() {
			var args = arguments;
			fns.forEach(function(fn) {
				fn.apply(self, args);
			});
		});
	};

	// @see http://blq.github.io/mochikit/doc/html/MochiKit/Async.html#fn-deferred.prototype.addboth
	// @see http://api.jquery.com/deferred.always/
	mkdp.always = function() {
		var fns = MochiKit.Base.flattenArguments(arguments);
		var self = this;
		return this.addBoth(function() {
			var args = arguments;
			fns.forEach(function(fn) {
				fn.apply(self, args);
			});
		});
	};

	// @see http://api.jquery.com/deferred.progress/
	mkdp.progress = function() {
		console.warn('progress() not supported/emulated yet. no eqvivalent in MK');
		// otherwise same multi-fn signature as done/fail/always
	};

	// Dang! state has same name.. :(  skip, shouldn't be used that often?..
	// @see http://blq.github.io/mochikit/doc/html/MochiKit/Async.html#fn-deferred.prototype.state
	// @see http://api.jquery.com/deferred.state/
	// mkdp.state = function() {
	// 	switch (this.state()) { // doh!
	// 		case 'unfired':
	// 			return 'pending';
	// 		case 'success':
	// 			return 'resolved';
	// 		case 'error':
	// 			return 'rejected';
	// 	}
	// };

	// @see http://api.jquery.com/deferred.promise/
	mkdp.promise = function() {
		// identiy op (yes, part of promise interface too. also only requirement for jQuery.when())
		return this;
	};

	return mkdp;
};

// todo: similar functions for Q! (often used with node.js and Angular etc)

/**
 * @param {!Deferred} d
 * @return {!Promise} ES6 Promise
 */
blq.mochiKitDeferredToPromise = function(d) {
	assert(d != null); // could use instanceof MK.Def ?
	return new Promise(bind(d.addCallbacks, d));
};

/**
 * @param {!Promise} p ES6 Promise
 * @return {!Deferred}
 */
blq.promiseToMochiKitDeferred = function(p) {
	assert(p != null);
	var d = new MochiKit.Async.Deferred();
	p.then(bind(d.callback, d), bind(d.errback, d));
	return d;
};

/**
 * wraps an async function(that returns a Promise) in a guard that doesn't issue a new
 * call until the first/previous call is resolved/rejected, until then the
 * pending promise is returned/recycled.
 *
 * ! Assumes the input arguments are the same of course!
 * I.e best case is for a 0-arg function, "initialize()" or such.
 * todo: option to supply a "compareArgs(prev, cur)"? (at least count nr of args?) to filter?
 * (that could make another util, filterCalls?)
 *
 * hmm, this could kindof be seen as a special 1-length case of queuePromises.
 *
 * @param {function(): !Promise} fn
 * @return {function(): !Promise}
 */
blq.lockPromiseCall = function(fn) {
	var p = null;
	return function() {
		if (p == null) {
			// invoke
			p = fn.apply(this, arguments);
			// only when resolved do we allow next call
			// todo: hmm, could argue that if fn _doesn't_ return
			// a promise we should do the same? to mimic full behaviour.
			p.then(function() { p = null; }, function() { p = null; });
		}
		return p;
	};
};

/**
 * forces calls to an async function (returning a Promise) to
 * be queued until the pending Promise is resolved/rejected.
 *
 * todo: perhaps supply a gap/breathing-time?
 * todo: max-length of queue? and/or a max-number of concurent calls?
 *
 * @param {function(): !Promise} fn
 * @return {function(): !Promise}
 */
blq.queuePromises = function(fn) {
	var queue = [];

	// todo: not ready!
	// return function() {
	// 	var self = this;
	// 	var args = arguments;
	//
	// 	var p = null;
	// 	if (queue.length == 0) {
	// 		p = fn.apply(this, arguments);
	// 		queue.push(p);
	// 	} else {
	// 		var args = queue[0];
	// 		p = fn.apply(this, args).then(function() {
	// 			queue.shift();
	// 		});
	// 	}
	// 	return p;
	// };
};

/**
 * simple wrapper around requirejs call.
 * (assumes require.js is loaded)
 * @param {!Array.<string>|string} scripts
 * @return {!Promise}
 */
blq.requirePromise = function(scripts) {
	scripts = Array.isArray(scripts) ? scripts : [scripts];

	return new Promise(function(resolve, reject) {
		require(scripts, resolve, reject);
	});
};


// todo: async-memoizer etc

return blq;

});
