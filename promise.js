/**
 * @fileoverview
 * Async helpers. For MochiKit, jQuery(2), and ES6 Promise etc
 *
 * @see https://promisesaplus.com/
 * @see http://blq.github.io/mochikit/doc/html/MochiKit/Async.html
 * @see
 *
 * todo: drop the Promise-polyfill? all relevant platforms support it ok now
 * todo: drop all jQuery stuff once we move to jQuery 3 that has real A+ Promises (hmm, but still the jQ.Deferred object stuff??)
 * todo: Bluebird and Q stuff?
 * todo: async-memoizer etc
 * todo: rename async.js?
 *
 * @author Fredrik Blomqvist
 *
 */
define([
	'blq/assert',
//	'jquery', // only for the jQuery 2 parts. -> assume user has loaded jQuery if those functions are called!
//	'polyfills/es6-promise', // todo: drop? all browser we care about has it..
	'MochiKit/Async' // (actually AMD via our shim now, though not natively)
], function(assert/*, _promise*/) {

'use strict';

// namespace
var blq = {};

/**
 * This is for jQuery < 3. 3+ uses real Promises
 * todo: deprecate as soon as we move to jQuery 3
 *
 * @param {!(jQuery.Deferred|jQuery.Promise)} jd (just saying Promise is actually enough since Deferred inherits from it (or Promise is a subset of it). but add both for clarity)
 * @return {!MochiKit.Async.Deferred}
 */
blq.jQueryDeferredToMochiKitDeferred = function(jd) {
	assert(jd != null);

	var md = new MochiKit.Async.Deferred();
	jd.then(md.callback.bind(md), md.errback.bind(md));
	return md;
};


/**
 * This is for jQuery < 3. 3+ uses real Promises!
 * todo: deprecate as soon as we move to jQuery 3
 *
 * @param {!MochiKit.Async.Deferred} md
 * @return {!jQuery.Promise}
 */
blq.mochiKitDeferredTojQueryPromise = function(md) {
	assert(md != null);

	var jd = jQuery.Deferred();
	md.addCallbacks(jd.resolve.bind(jd), jd.reject.bind(jd));
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
 * todo: should basically deprecate this path. The Promises in jQuery < 3 are not A+ compatible anyway (and has major flaws with exceptions and err->ok path)
 * -> Create a new similar one but for A+ Promies
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
		// identity op (yes, part of promise interface too. also only requirement for jQuery.when() (sniff))
		return this;
	};

	return mkdp;
};


/**
 * @see promiseToMochiKitDeferred
 * @param {!Deferred} d
 * @return {!Promise} ES6 Promise
 */
blq.mochiKitDeferredToPromise = function(d) {
	assert(d != null); // could use instanceof MK.Def ?

	return new Promise(function(resolve, reject) {
		// handle first addCallbacks(), then user is assumed to use only the MK.Deferred API/conventions
		d.addCallbacks(resolve, function(err) {
			// MK errback wraps errors in Error() object. Promise doesn't do that
			// todo: double check instanceof Error? (can't happen?)
			err = err.message;
			reject(err);
		});
	});
};


/**
 * @see mochiKitDeferredToPromise
 * @param {!Promise} p ES6 Promise todo: actually compatible with jQuery etc also ("thenable"). change name?
 * @return {!Deferred}
 */
blq.promiseToMochiKitDeferred = function(p) {
	assert(p != null);

	var d = new MochiKit.Async.Deferred();
	p.then(d.callback.bind(d), d.errback.bind(d));
	return d;
};


/**
 * wraps an async function(that returns a Promise) in a guard that doesn't issue a new
 * call until the first/previous call is resolved/rejected, until then the
 * pending promise is returned/recycled.
 *
 * Wrap functions that have pending-race logic with this one.
 *
 * ! Assumes the input arguments are the same of course!
 * I.e typical/best case is for a 0-arg function, "initialize()" or such.
 * todo: option to supply a "compareArgs(prev, cur)"? (at least count nr of args?) to filter?
 * (that could make another util, filterCalls?)
 *
 * hmm, this could kindof be seen as a special 1-length case of queuePromises.
 *
 * todo: another (special) case might be to save the value of first resolve/reject
 * and use that for all subsequent calls? i.e would do the cache part too (now assumes fn does any caching)
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
			// only when resolved/rejected do we allow next call
			// todo: hmm, could argue that if fn _doesn't_ return
			// a promise we should do the same? to mimic full behaviour.
			p.then(
				function(ret) { p = null; return ret; },
				function(err) { p = null; throw err; }
			);
		}
		// todo: hmm, or return a _new_ Promise?  return Promise.resolve(p) ?
		return p;
	};
};


/**
 * kindof special case for a generic async memoization. (todo: promiseMemoize would take timeouts and such)
 * @param {function(): !Promise} fn
 * @param {string} id todo: hmm, could maybe make ID implicit by sniffing the passed in args?.. (args->hash) (memoization style. but same problem with object args..)
 * @param {boolean} retryOnFail default false
 * @return {function(): !Promise}
 */
blq.singletonWrap = function(fn, id, retryOnFail) {
	// _global_ registry of pending/finished promises (yes, local memo can work if you know you only make one-spot call, but global is global..)
	blq.singletonWrap._promises = blq.singletonWrap._promises || {
		// id->Promise
	};

	retryOnFail = retryOnFail || false;

	return function() {
		var p = blq.singletonWrap._promises[id];
		if (p == null) {
			p = blq.singletonWrap._promises[id] = fn.apply(this, arguments);
			if (retryOnFail) { // todo: try-on-fail should also probably be complemented with a (progressive) delay (think ajax and server overload..)
				p.catch(function(err) {
					blq.singletonWrap._promises[id] = null;
					throw err;
				});
			}
			return p;
		}
		return p;
		// ! here ES6 Promises differ from MK.Deferred.
		// MK.Deferred will mutate the origin of .addCallback and
		// extend then 'then-chain'. A Promise will not.
		// I.e MK.Deferred would need to create a new Deferred for same effect.
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
 * simple wrapper around requirejs (AMD loader) call.
 * (assumes require.js is loaded)
 *
 * todo: seems later require.js might actually return a Promise.
 * But still not in official release (2.3.2 at time of writing)
 * @see https://github.com/requirejs/alameda/issues/8
 *
 * @param {!Array.<string>|string} scripts todo: allow iterable?
 * @return {!Promise}
 */
blq.requirePromise = function(scripts) {
	scripts = Array.isArray(scripts) ? scripts : [scripts];

	return new Promise(function(resolve, reject) {
		require(scripts,
			function(/*var_arg amd_modules*/) {
				// promise chain must only pass a single argument -> array
				// (same overload as on calling side)
				// todo: hmm, or "gamble" that a multi-arg call works? Then user can name
				// args, with an array not... -> maybe simply prefer the requirePromiseDict() variant?
				resolve(arguments.length > 1 ? Array.prototype.slice.call(arguments) : arguments[0]);
			},
			reject
		);
	});
};


/**
 * loads a bundle of scripts and returns them in a dictionary
 * @param {!Object<string, string>} scriptNameDict scriptName->Name (todo: maybe also allow an Array of Array or pairs?)
 * @return {!Promise<!Object<string, !Object>>} // Name->Module
 */
blq.requirePromiseDict = function(scriptNameDict) {
	var scripts = Object.keys(scriptNameDict);
	return blq.requirePromise(scripts).then(function(amd_modules) {
		// map loaded modules back to keyname
		var ret = {};
		scripts.forEach(function(key, i) {
			ret[scriptNameDict[key]] = amd_modules[i];
		});
		return ret;
	});
};


/**
 * Same kind of constructor (well, in this case factory) for MK.Deferred as ES6 Promise.
 * Might look odd, but actually good since it (almost) forces stuff to be
 * done inside the Promise avoiding accidental stalls due to orphaned Deferreds.
 *
 * example: createDeferred(function(resolve, reject) { .. if (ok) resolve(value); else reject(error); });
 *
 * @param {function(function, function)} executor
 * @return {!Deferred}
 */
blq.createDeferred = function(executor) {
	if (typeof executor != 'function') {
		// A+ Promise doesn't convert invalid fn to Promise, fail immediately at top-level!
		// call just to provoke native "is not a function" exception (TypeError)
		executor('Deferred/Promise Executor must be a function');
	//	return;
	}

	var d = new MochiKit.Async.Deferred();
	try {
		// (named fns just for debuggability)
		executor(
			function resolve(ret) {
				d.callback(ret);
			},
			function reject(err) {
				d.errback(err);
			}
		);
	} catch (ex) {
		d.errback(ex);
	}
	// todo: hmm, could delete the callback/errback methods? (!)
	return d;
};


/**
 * wrap function to overload on Promise arguments
 * (will of course always return a Promise now)
 * @param {function} fn
 * @return {function(): !Promise}
 */
blq.promisify = function(fn) { // name? makeAsync?
	// todo: maybe detect if already promisified? (add a tag?)
	return function() {
		return Promise.all(arguments).then(function(rets) {
			return fn.apply(null, rets);
		});
	};
};


/**
 * Create an ES6 Promise that can be resolved externally, similar to "old" Deferred pattern
 // (See Q, MK, Dojo and pre-standard(deprecated) Promise.defer)
 * (could also create a class that inherits from Promise)
 * @see http://lea.verou.me/2016/12/resolve-promises-externally-with-this-one-weird-trick/
 * todo: ok name?
 *
 * @return {!Promise} with added resolve() and reject() methods
 */
blq.deferredPromise = function() {
	var _resolve, _reject;

	var dp = new Promise(function(resolve, reject) {
		_resolve = resolve;
		_reject = reject;
	});

	// expose
	// todo: hmm, could even maybe delete the methods after trig?!
	// (todo:) don't think have to bind the methods, resolve is specified to run context-less.
	dp.resolve = _resolve;
	dp.reject = _reject;

//	// useful? or just complicates/confuses?
//	dp.promise = function() {
//		// todo: for strictness clone this and delete resolve/reject?
//		return this;
//	};

	return dp;
};


/**
 * todo: name? delay()?
 * @param {integer} ms
 * @return {!Promise}
 */
blq.wait = function(ms) {
	return new Promise(function(resolve, reject) {
		// have to wrap resolve() once to guard against
		// the (non standard..) args to setTimeout some browsers send.
		setTimeout(function() { resolve(); }, ms);
	});
};


/**
 * waits ms for p then turns into error
 * @param {!Promise} p
 * @param {integer} ms
 * @param {*=} opt_err
 * @return {!Promise}
 */
blq.timeout = function(p, ms, opt_err) {
	return new Promise(function(resolve, reject) {
		var th = setTimeout(function() {
			th = null;
			// don't disturb argument count
			opt_err !== 'undefined' ? reject(opt_err) : reject();
		}, ms);

		p.then(
			function(ret) {
				// (ES6 Promises don't have fulfilled flag..)
				if (th != null) {
					clearTimeout(th);
					resolve(ret);
				}
			}, function(err) {
				if (th != null)	{
					clearTimeout(th);
					reject(err);
				}
			}
		);
	});
};


/**
 * get the value of the prmise but don't take part in the chain
 * i.e any exceptions you throw will go into the global scope, not into the pipe. any return value ignored.
 * todo: this for one, would be nice to be a Promise method I guess..
 * @param {!Promise} p
 * @param {Function} callback
 * @return {!Promise}
 */
blq.tap = function(p, callback) {
	p.then(function(val) {
		// "lift" call outside the try-catch guard
		// todo: hmm, could also only move an actual error-throw outside? (i.e re-throw in settimeout)
		setTimeout(function() {
			callback(val);
		}, 0);
	});
	// ! don't do single line return p.then() since we don't want to take part in the chain
	return p;
};


blq.finally = function(p, callback) {
	var fn = function() {
		// "lift" call outside the try-catch guard
		setTimeout(function() {
			callback();
		}, 0);
	};

	p.then(fn, fn);

	// ! don't do single line return p.then() since we don't want to take part in the chain
	return p;
};


// test. inspired by Bluebird
// todo: custom teardown method/function? (simply use/assume (goog.)IDisposable ?)
blq.using = function(disposable, fn) {
	 return disposable.promise()
		.then(fn)
		.then(
			function(val) {
				// todo: or chain this? (but still return val?)
				disposable.dispose();
				return val;
			},
			function(err) {
				disposable.dispose();
				throw err;
			}
		);
};


// similar to bluebird but witout inspection
// to be fed into using(). Does Not return a Promise
blq.disposer = function(p, dispose) {
	return {
		// this method is basically only intended
		// to be used by using(), "protected"
		promise: function() {
			return p;
		},
		dispose: function() {
			// this is asumed to be called on a factory basically
			// thus, no catch-path
			return p.then(dispose);
		}
	};
};

/*
getConnection = function() {
	return disposer(createConnection, function(conn) {
		// use custom code to close/dispose
		conn.close();
	});
}

using(getConnection(), function(conn) {
	use_connection(conn);
	...
});
*/


/**
 * adds a .then() and .catch() method to the MK.Async.Deferred.prototype that returns a ES6 Promise. (and makes MK.Deferred "thenable" ('catch' not strictily necessary for that though))
 * (todo: maybe also/instead a .promise() method?)
 *
 * ! Subtle: ES6 Promises are stateless (each .then a new Promise), MK Deferred keeps a chain from/in the source Deferred.
 * -> deferred.then(..) spawns an new true ES6 chain, any MK Deferred addCallbacks after that will not affect it.
 */
blq.injectPromiseInDeferred = function(deferred) { // name? makeDeferredThenable?
	var mkdp = deferred || MochiKit.Async.Deferred.prototype;

	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then
	mkdp.then = function(onFulfilled, onRejected) {
		var self = this;
		return new Promise(function(resolve, reject) {
			// tap the MK Deferred
			// https://mochi.github.io/mochikit/doc/html/MochiKit/Async.html#fn-deferred.prototype.addcallbacks
			self.addCallbacks(
				function(res) {
					resolve(res);
					return res;
				},
				function(err) {
					reject(err.message); // MK wraps errors (shouldn't even need to sniff for Error instance)
					return err;
				}
			);
		})
		.then(onFulfilled, onRejected);
	};

	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch
	mkdp.catch = function(onRejected) {
		return this.then(null, onRejected);
	};

	return mkdp;
};


/**
 * This is basically for jQuery <= 2. jQuery 3+ has ES6 compatible promises
 * @param {!jQuery.Deferred}
 * @return {!Promise}
 */
blq.jQueryPromiseToES6Promise = function(jp) {
	// simple :) (ok?)
	return Promise.resolve(jp);
};



return blq;

});
