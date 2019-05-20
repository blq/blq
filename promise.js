/**
 * @fileoverview
 * Async helpers. For MochiKit, jQuery(2+), and ES6 Promise etc
 *
 * @see https://promisesaplus.com/
 * @see https://blq.github.io/mochikit/doc/html/MochiKit/Async.html
 * @see http://bluebirdjs.com/docs/getting-started.html
 *
 * todo: drop all jQuery stuff once we move to jQuery 3 that has real A+ Promises (hmm, but still the jQ.Deferred object stuff??)
 * todo: async-memoizer, cache etc
 * todo: rename async.js?
 * todo: async iteration stuff? (basically becomes Bluebird then..)
 * todo: ? https://github.com/tc39/proposal-promise-any
 *
 * @author Fredrik Blomqvist
 *
 */
define([
//	'blq/assert',
//	'jquery', // only for the jQuery 2 parts. -> assume user has loaded jQuery if those functions are called!
//	'polyfills/es6-promise', // todo: drop? all browser we care about has it..
	'MochiKit/Async' // (actually AMD via our shim now, though not natively)
], function(/*assert*//*, _promise*/) {

'use strict';

// namespace
var api = {};

/**
 * This is for jQuery < 3. 3+ uses real Promises
 * todo: deprecate as soon as we move to jQuery 3
 *
 * @param {!(jQuery.Deferred|jQuery.Promise)} jd (just saying Promise is actually enough since Deferred inherits from it (or Promise is a subset of it). but add both for clarity)
 * @return {!MochiKit.Async.Deferred}
 */
api.jQueryDeferredToMochiKitDeferred = function(jd) {
	// assert(jd != null);

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
api.mochiKitDeferredTojQueryPromise = function(md) {
	// assert(md != null);

	var jd = jQuery.Deferred();
	md.addCallbacks(jd.resolve.bind(jd), jd.reject.bind(jd));
	return jd.promise(); // could return jQuery.Deferred but no real use since MK.Deferred controls the trigger now!
};


/**
 * @deprecated don't really care about emulating jQuery 2 anymore.. (jQuery 3 is A+ compliant apparently)
 *
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
 * @see https://blq.github.io/mochikit/doc/html/MochiKit/Async.html
 * @see https://api.jquery.com/category/deferred-object/
 * @see https://api.jquery.com/promise/
 *
 * @param {T=} [obj] default MochiKit.Async.Deferred.prototype pass in a custom obj if only single mod is required
 * @return {!(T|MochiKit.Async.Deferred.prototype)} same obj passed in constructor or default MochiKit.Async.Deferred.prototype
 * @template T
 */
api._enableMochiKitDeferredMimicjQueryPromise = function(obj) {
	var mkdp = obj || MochiKit.Async.Deferred.prototype;

	// @see https://blq.github.io/mochikit/doc/html/MochiKit/Async.html#fn-deferred.prototype.addcallbacks
	// @see https://api.jquery.com/deferred.then/
	mkdp.then = function(done, fail, progress) {
		if (typeof progress === 'function') {
			console.warn('progress callback not yet emulated');
		}
		return this.addCallbacks(done, fail);
	};

	// @see https://blq.github.io/mochikit/doc/html/MochiKit/Async.html#fn-deferred.prototype.addcallback
	// @see https://api.jquery.com/deferred.done/
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

	// @see https://blq.github.io/mochikit/doc/html/MochiKit/Async.html#fn-deferred.prototype.adderrback
	// @see https://api.jquery.com/deferred.fail/
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

	// @see https://blq.github.io/mochikit/doc/html/MochiKit/Async.html#fn-deferred.prototype.addboth
	// @see https://api.jquery.com/deferred.always/
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

	// @see https://api.jquery.com/deferred.progress/
	mkdp.progress = function() {
		console.warn('progress() not supported/emulated yet. no eqvivalent in MK');
		// otherwise same multi-fn signature as done/fail/always
	};

	// Dang! state has same name.. :(  skip, shouldn't be used that often?..
	// @see https://blq.github.io/mochikit/doc/html/MochiKit/Async.html#fn-deferred.prototype.state
	// @see https://api.jquery.com/deferred.state/
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

	// @see https://api.jquery.com/deferred.promise/
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
api.mochiKitDeferredToPromise = function(d) {
	// assert(d != null); // could use instanceof MK.Def ?

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
api.promiseToMochiKitDeferred = function(p) {
	// assert(p != null);

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
api.lockPromiseCall = function(fn) {
	var p = null;
	return function() {
		if (p == null) {
			// invoke (todo: should we wrap call in Promise? or assume that is its own responsibility to not throw?)
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
api.singletonWrap = function(fn, id, retryOnFail) {
	// _global_ registry of pending/finished promises (yes, local memo can work if you know you only make one-spot call, but global is global..)
	api.singletonWrap._promises = api.singletonWrap._promises || {
		// id->Promise
	};

	retryOnFail = retryOnFail || false;

	return function() {
		var p = api.singletonWrap._promises[id];
		if (p == null) {
			p = api.singletonWrap._promises[id] = fn.apply(this, arguments);
			if (retryOnFail) { // todo: try-on-fail should also probably be complemented with a (progressive) delay (think ajax and server overload..)
				p.catch(function(err) {
					api.singletonWrap._promises[id] = null;
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
api.queuePromises = function(fn) {
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
api.requirePromise = function(scripts) {
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
api.requirePromiseDict = function(scriptNameDict) {
	var scripts = Object.keys(scriptNameDict);
	return api.requirePromise(scripts).then(function(amd_modules) {
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
 * @return {!MochiKit.Async.Deferred}
 */
api.createDeferred = function(executor) {
	if (typeof executor !== 'function') {
		// A+ Promise doesn't convert invalid fn to Promise, fail immediately at top-level!
		// call just to provoke native "is not a function" exception (TypeError)
		executor('Deferred/Promise Executor must be a function');
	//	return;
	}

	var d = new MochiKit.Async.Deferred();
	try {
		// (named fns for debuggability)
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
 * todo: dang! this name collides with BB and Node's "promisify"
 * @param {function} fn
 * @return {function(): !Promise}
 */
api.promisify = function(fn) { // name? bindAsync? makeAsync?
	// todo: maybe detect if already promisified? (add a tag? -> "unpromisify")
	return function() {
		var self = this;
		return Promise.all(arguments).then(function(args) {
			return fn.apply(self, args);
		});
	};
};


/**
 * Create an ES6 Promise that can be resolved externally, similar to "old" Deferred pattern
 // (See Q, MK, Dojo and pre-standard(deprecated) Promise.defer)
 * (could also create a class that inherits from Promise)
 * @see https://lea.verou.me/2016/12/resolve-promises-externally-with-this-one-weird-trick/
 * todo: ok name?
 *
 * @return {!Promise} with added resolve() and reject() methods
 */
api.deferredPromise = function() {
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
 * factory for a Promise with an external .cancel() method (i.e same as reject)
 * todo: hmm, this setup basically needs a state flag also? or simply let the silent 2nd trigger be left ignored?
 * @param {function(Function, Function)} resolver
 * @return {!Promise}
 */
api.cancelablePromise = function(resolver) {
	// similar setup as deferredPromise()
	var _reject;
	var pr = new Promise(function(resolve, reject) {
		_reject = reject;
		resolver(resolve, reject);
	});
	pr.cancel = _reject;
	return pr;
};


/**
 * todo: name? delay()?
 * @param {integer} ms
 * @return {!Promise}
 */
api.wait = function(ms) {
	return new Promise(function(resolve, reject) {
		setTimeout(resolve, ms);
	});
};

// alias
api.delay = api.wait;


/**
 * waits ms for p then turns into error
 * todo: hmm, would it be reasonable to merge(overload) wait & timeout?
 * @param {!Promise} p
 * @param {integer} ms
 * @param {*=} opt_err
 * @return {!Promise}
 */
api.timeout = function(p, ms, opt_err) {
	return new Promise(function(resolve, reject) {
		var th = setTimeout(function() {
			th = null;
			// don't disturb argument count
			opt_err !== undefined ? reject(opt_err) : reject();
		}, ms);

		p.then(
			function(ret) {
				// (ES6 Promises don't have fulfilled flag..)
				if (th != null) {
					clearTimeout(th);
					resolve(ret);
				}
			},
			function(err) {
				if (th != null)	{
					clearTimeout(th);
					reject(err);
				}
			}
		);
	});
};


/**
 * get the value of the promise but don't take part in the chain.
 * i.e any exceptions you throw will go into the global scope, not into the pipe. any return value ignored.
 * Also, compared to "tap" the chain doesn't wait for this.
 * @param {!Promise} p
 * @param {Function} callback
 * // todo: could allow third arg 'errback' directly here? (BB doesn't do that though)
 * @return {!Promise}
 */
api.tapOut = function(p, callback) {
	p.then(function(val) {
		// "lift" call outside the try-catch guard
		setTimeout(function() {
			callback(val);
		}, 0);
	});
	// ! don't do single line return p.then() since we don't want to take part in the chain
	return p;
};

/**
 * Similar to "tapOut"
 * @param {!Promise} p
 * @param {Function} errback
 * @return {!Promise}
 */
api.tapCatchOut = function(p, errback) {
	p.catch(function(err) {
		// "lift" call outside the try-catch guard
		setTimeout(function() {
			errback(err);
		}, 0);
	});
	// ! don't do single line return p.then() since we don't want to take part in the chain
	return p;
};


// this is "standards", Bluebird conforming impl. I like it other way when exceptions are visible?
// -> or change "my way" to name it ".bailout()" or something? ;)
api.tap = function(p, handler) {
	return p.then(function(value) {
		return new Promise(function(resolve) {
			resolve(handler(value));
		}).then(function() {
			return value;
		});
	});
};

api.tapCatch = function(p, handler) {
	return p.catch(function(err) {
		return new Promise(function(resolve, reject) {
			reject(handler(err));
		}).catch(function() {
			return err;
		});
	});
};

/**
 * another interesting variant that is inteded to be inserted
 * in a plain p.then(inlineTap(console.log)).then(..). see https://github.com/sindresorhus/p-tap
 * todo: maybe enable this kind of inline-API for more functions!?
 * todo: inlineTapOut()
 */
api.inlineTap = function(handler) {
	return function(value) {
		var ret = function() { return value; };
		return Promise.resolve(value)
			.then(handler)
			.then(ret);
	};
};

/**
 * similar to inlineTap()
 * todo: inlineTapCatchOut()
 */
api.inlineTapCatch = function(handler) {
	return function(err) {
		var ret = function() { return Promise.reject(err); };
		return Promise.resolve(err)
			.then(handler)
			.then(ret);
	};
};

// experiment. doesn't work for all our methods but many.
// p.then(inline(timeout, 1000)).then(..)
api.inline = function(apiFn, ...args) {
	return function(val) {
		var p = Promise.resolve(value);
		return apiFn.bind(api, p, ...args)();
	};
};

// typically intended to be a pipe-through for an immediately executed function
// p.then(pipe(console.log('I run now!'))).then(..)
// todo: hmm, Promise.then(x) actually says that if 'x' is Not a function it should be ignored. I.e get this behavior for free!
api.pipe = function(ignored) {
	// identity fn
	return function(p) {
		return p;
	};
};

/**
 * can be used to wrap a value into a chain.
 * p.then(value(123)).then(..)
 * @param {*} val
 * @return {function(): *}
 */
api.value = function(val) {
	return function() {
		return val;
	};
};


/**
 * try-catch-finally analogue
 * todo: deprecate once finally becomes part of the Promise standard (Chrome 63)
 * @see https://github.com/tc39/proposal-promise-finally
 *
 * @param {!Promise} p
 * @param {!Function} callback gets no input args.
 * @return {!Promise} same as input. Not affected by callback return/throw
 */
api.finally = function(p, callback) { // todo: rename "finallyOut" now? (if using setTimeout impl)
	var fn = function() {
		// "lift" call outside the try-catch guard
		// todo: ok? same reasoning as tap() vs tapOut() ideas above.. (seems standard keeps exceptions in the pipe anyway.. hmm)
		setTimeout(function() {
			callback(); // (can't use directly in setTimeout since many browsers pass an arg to it..)
		}, 0);
	};

	// ! don't do single line return p.then() since we don't want to take part in the chain
	p.then(fn, fn);
	return p;
};


// test. inspired by Bluebird
// todo: custom teardown method/function? (simply use/assume (goog.)IDisposable ?)
api.using = function(disposable, fn) {
	// assert(typeof disposable.promise === 'function');
	// assert(typeof disposable.dispose === 'function');

	return disposable.promise()
		.then(fn)
		.then(
			function(val) {
				// todo: or chain this? (but still return val?)
				disposable.dispose();
				return val;
				// better?
				// return disposable.dispose().then(function() {
				// 	return val;
				// });
			},
			function(err) {
				disposable.dispose();
				throw err;
			}
		);
};


// similar to bluebird but without inspection
// to be fed into using(). Does Not return a Promise
api.disposer = function(p, dispose) {
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
};

using(getConnection(), function(conn) {
	use_connection(conn);
	...
});
*/


/**
 * @deprecated MK.Async.Deferred fork is thenable by default now
 *
 * adds a .then() and .catch() method to the MK.Async.Deferred.prototype that returns a ES6 Promise. (and makes MK.Deferred "thenable" ('catch' not strictily necessary for that though))
 * (todo: maybe also/instead a .promise() method?)
 *
 * ! Subtle: ES6 Promises are stateless (each .then a new Promise), MK Deferred keeps a chain from/in the source Deferred.
 * -> deferred.then(..) spawns an new true ES6 chain, any MK Deferred addCallbacks after that will not affect it.
 * @param {(MochiKit.Async.Deferred|MochiKit.Async.Deferred.prototype)=} deferred default MochiKit.Async.Deferred.prototype
 * @return {(MochiKit.Async.Deferred|MochiKit.Async.Deferred.prototype)} chained
 */
api.injectPromiseInDeferred = function(deferred) { // name? makeDeferredThenable?
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

	// useful? will return a pure Promise
	mkdp.promise = function() {
		return Promise.resolve(this); // Promise resolve is guaranteed to cast "thenables"
	};

	return mkdp;
};


/**
 * This is basically for jQuery <= 2. jQuery 3+ has ES6 compatible promises
 * @param {!jQuery.Deferred}
 * @return {!Promise}
 */
api.jQueryPromiseToES6Promise = function(jp) {
	// simple :) (ok?)
	return Promise.resolve(jp);
};


/**
 * Promise.all() but using a dictionary for easier, order independent, lookup
 * todo: same for Promise.race() ?
 * @param {!Object<string, (Promise|Thenable|*)} dictPromises
 * @return {!Promise}
 */
api.allDict = function(dictPromises) {
	// dict -> index
	var listPromises = [];
	var indexToKey = [];
	for (var k in dictPromises) {
		listPromises.push(Promise.resolve(dictPromises[k])); // wrap to handle plain values also
		indexToKey.push(k);
	}

	return Promise.all(listPromises).then(function(result) {
		// map back to dictionary
		var ret = {};
		result.forEach(function(res, i) {
			ret[indexToKey[i]] = res;
		});
		return ret;
	});
};


/**
 * like MochiKit.Async.DeferredList in 'consumeErrors' mode
 * @see https://mochi.github.io/mochikit/doc/html/MochiKit/Async.html#fn-deferredlist
 * todo: dictionary variant? (todo: or just mimic a MK DeferredList with flags?)
 * Note that this method will always succeed. The value or error is in result tuple[1]
 *
 * @param {!ArrayLike<Promise|*>} promises (ok to allow mixed values?)
 * @return {!Promise} Array<[boolean, result]> tuples
 */
api.allConsume = function(promises) {
	if (promises.length === 0) {
		return Promise.resolve([]);
	}
	return new Promise(function(resolve, reject) {
		var results = new Array(promises.length);
		var counter = promises.length;

		var _checkEnd = function() {
			if (--counter === 0) {
				resolve(results);
			}
		};

		Array.prototype.forEach.call(promises, function(p, i) {
			Promise.resolve(p) // wrap to allow values also. ok?
				.then(
					function(res) {
						results[i] = [true, res];
					},
					function(fail) {
						results[i] = [false, fail];
					}
				)
				.then(_checkEnd, _checkEnd);
		});
	});
};


/**
 * similar to allConsume but filters out errors
 * todo: naming? onlySucces?
 * todo: same for dictionary case?
 * @param {!Array<Promise|*>} promises
 * @return {!Promise} Array of only success (can be shorter than input array of course!)
 */
api.allSuccess = function(promises) {
	return api.allConsume(promises).then(function(result) {
		return results
			.filter(function(pair) {
				return pair[0];
			})
			.map(function(pair) {
				return pair[1];
			});
	});
};


/**
 * Assuming input promise returns an array the array is "spread" into individual arguments to callback.
 * Typically used with all()-like methods
 * @param {!Promise} p
 * @return {!Thenable} ok? or use a full Promise? (multi-arg .then is not standard though..)
 */
api.spread = function(p) {
	var sp = Promise.resolve(p);
	// monkey patch
	var _then = sp.then;
	sp.then = function(callback, errback) {
		return _then.call(sp,
			function(arr) {
				// todo: could sniff for Array? (though a hard requirement is mostly better I'd say. BB does that)
				// todo: handle non-function callback? (identity wrapper)
				return callback.apply(null, arr);
			},
			errback
		);
	};
	return sp;

	/*
	return {
		then: function(callback, errback) {
			return p.then(
				function(arr) {
					return callback.apply(null, arr);
				},
				errback
			);
		}
	};
	*/
};


/**
 * Note: this is Not a multi-bind!
 * This binds *pure* functions, taking the object as first arg to become methods instead.
 *
 * todo: move this elsewhere?
 * todo: name? extension methods
 *
 * @param {!Object} obj
 * @param {!Object<string, Function>} methods
 * @return {!Object} obj with methods attached
 */
function bindTo(obj, methods) {
	for (var k in methods) {
		var fn = methods[k];
		if (typeof fn != 'function') // ignore nulls (ok?)
			continue;
		obj[k] = fn.bind(null, obj); // or obj as context also? (not style of Promise though)
	}
	return obj;
}


function makeChainable(obj, methods) {
	for (var k in methods) {
		var fn = methods[k].bind(null, obj);
		obj[k] = function(bfn) {
			// re-bind
			return makeChainable(bfn.apply(null, arguments), methods);
		}.bind(null, fn);
	}
	return obj;
}


/**
 * experimental
 * creates a wrapper Promise-like object
 * around p that also exposes the method-like
 * functions in this API as methods. allowing easier chained calls.
 * (i.e will look more like the Bluebird API for example)
 * (technically we could modify Promise.prototype, but we don't..)
 *
 * the return Promises of these methods will also be wrapped.
 *
 * todo: convention or registry for the methods to attach?
 * todo: name? "wrap"? "makeMethods?" "extendWith" ?
 * @param {!Promise} p
 * @return {!Promise} but with exposed API calls from this lib as chainable methods
 */
api.wrap = function(p) {
	// todo: what's "best"? mutate a Promise or store Promise as property in the wrapper?
	return makeChainable(p, {
		tap: api.tap,
		finally: api.finally,
		timeout: api.timeout,
		spread: api.spread,
		also: api.also, // == after
		maybeAfter: api.maybeAfter,
		try: api.try,
		tapCatch: api.tapCatch,
		tapOut: api.tapCatchOut,
		tapCatchOut: api.tapCatchOut
		// .. more?
	});
};


/**
 * code to run in the async "shadow". i.e run _immediately_ after _dispatch_ of the first step.
 * ! it's an Anti Pattern to do synchronous stuff _before_ the async!
 * typical use is to fire up load-spinner etc
 * observe that this doesn't (by definition can't) care about success/fail of input promise, it just runs.
 * -> or call it 'also'? doAjax().also(showSpinner).finally(hideSpinner).then(handleAjax); ?
 * todo: hmm, or is this enough?: doAjax().then(inlineTap(showSpinner()).then(handleAjax)
 * @param {!Promise} p
 * @param {function} after
 * @return {!Promise}
 */
api.after = function(p, after) {
	// silly simple impl :)
	// but without you'll lose the "flow" and are tempted to add
	// code *before* the async call!

	// don't let it throw.
	// call synchronously.
	try {
		after();
	} catch (e) {

	}
	return p;
};

// better name? next?
api.also = api.after;


/**
 * even more common setup? i.e show spinner if p() takes longer than
 * the delay. i.e the after() call is Not guaranteed to run at all.
 * @param {!Promise} p
 * @param {function} after
 * @param {integer=} delay ms. default 50
 * @return {!Promise}
 */
api.maybeAfter = function(p, after, delay) {
	// silly simple impl :)
	// but without it you lose the "flow" and are tempted to add
	// code *before* the async call!

	delay = typeof delay === 'number' ? delay : 50;

	var h = setTimeout(function() {
		h = null;
		after();
	}, delay);

	return api.tap(p, function() {
		if (h) clearTimeout(h);
	});
};


/**
 * Convenience for both sync and async try-semantic
 * (sync code will still run in same tick)
 * Sometimes called 'attempt' or 'when'.
 * @see https://github.com/tc39/proposal-promise-try
 *
 * @param {Function} fn
 * @return {!Promise}
 */
api.try = function(fn) {
	// (Not same as "return Promise.resolve().then(fn)" would make also sync code run in next tick)
	return new Promise(function(resolve, reject) {
		resolve(fn());
	});
};


/**
 * typical use to enable chained return (waiting) but where no data is wanted to "leak" out.
 * @param {!Promise} p
 */
api.mute = function(p) {
	return p.then(function() {
		// NOP
	});
};


/**
 * todo: variant that pipes output->input through the fn chain? (api.pipeCalls?)
 * @param {Array<function>} asyncFnQueue
 * @return {!Promise}
 */
api.chainCalls = function(asyncFnQueue) {
	// fold wrapper fn calls into a single callback
	var fn0 = asyncFnQueue.shift(); // could use a first Null/NOP-object method also I guess
	fn0 = api.try(fn0); // actually only need to wrap the first function like this, since all calls will be piped through its deferred

	return asyncFnQueue.reduce(
		function(accFn, item) {
			return function(r) {
				return accFn(r).then(
					function(res) { return item(res); } // ok? or make piping the results optional? and/or pipe only if != undefined? (as callbacks now do)
				);
			};
		},
		fn0
	);
};


/**
 * retry a fn a number of times before giving up.
 * todo: or call "retryUntil?" (let another fn decide to continue or not (and implicitly give delay?))
 * todo: could implement this using retryUntil instead I guess
 * @param {function(): !Promise} tryFn
 * @param {(integer|Object)=} opt number of retries or options with delays etc. todo:
 * @return {!Promise}
 */
api.retry = function(tryFn, opt) {
	var sleep = opt.sleep || 500; // todo: support progressively longer sleep periods?
	var numTries = opt.numTries || -1; // -1 == never stop

	return new Promise(function(resolve, reject) {

		var test = function() {
			tryFn()
				.then(resolve)
				.catch(function(err) {
					if (numTries < 0 || numTries-- > 0)
						setTimeout(test, sleep);
					else
						reject(err);
				});
		};

		test();
	});
};


/**
 * todo: overload with plain retry()? or just complicated?
 * @param {function(): Promise} tryFn
 * @param {function(Error, integer=): integer} tryAgain return nr of ms until next retry. 0 to stop (2nd arg is retry-number)
 * @return {!Promise}
 */
api.retryUntil = function(tryFn, tryAgain) {
	return new Promise(function(resolve, reject) {

		var n = 0;
		var test = function() {
			tryFn()
				.then(resolve)
				.catch(function(err) {
					var sleep = tryAgain(err, n++);
					if (sleep > 0)
						setTimeout(test, sleep);
					else
						reject(err);
				})
				.catch(reject); // if tryAgain throws
		};

		test();
	});
};


/**
 * allows a function to
 * todo: hmm, not sure this is still 100% covering a practical case I have..
 * @param {function(): boolean} fn
 * @return {function(): Promise}
 */
api.triggerOnTrue = function(fn) {
	return function() {
		return new Promise(function(resolve, reject) {
			var ret = fn.apply(this, arguments);
			if (ret)
				resolve(ret);
		});
	};
};


/**
 * does 'obj' fulfil the 'Thenable' interface?
 * i.e defined as simply having a 'then' method
 *
 * @param {*} obj
 * @return {boolean}
 */
api.isThenable = function(obj) {
	return obj && typeof obj.then === 'function';
};


/**
 * does 'obj' fulfil the Promise interface?
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/prototype
 * note: isThenable() cehck should typically be enough
 *
 * @param {*} obj
 * @return {boolean}
 */
api.isPromise = function(obj) {
	return (
		obj &&
		typeof obj.then === 'function' &&
		typeof obj.catch === 'function' &&
		typeof obj.finally === 'function'
	);
};


/**
 * does 'obj' fulfil the MochiKit.Async.Deferred interface?
 * https://blq.github.io/mochikit/doc/html/MochiKit/Async.html#fn-deferred
 *
 * @param {*} obj
 * @return {boolean}
 */
api.isDeferred = function(obj) {
	return (
		obj &&
		typeof obj.addCallbacks === 'function' &&
		typeof obj.addCallback === 'function' &&
		typeof obj.addErrback === 'function' &&
		typeof obj.addBoth === 'function' &&
		typeof obj.state === 'function' &&
		typeof obj.fired === 'number'
	);
};


/**
 * trigger when browser is in idle mode
 * https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
 * todo: cancel mechanism? (use cancelablePromise?)
 * todo: do you want to get the return from idle as result? or option to act as pipe?
 * @param {integer=} timeout ms
 * @return {!Promise}
 */
api.whenIdle = function(timeout) {
	return new Promise(function(resolve) {
		window.requestIdleCallback(resolve, timeout);
	});
};

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
 * @return {!Promise}
 */
api.RAF = function() {
	return new Promise(function(resolve) {
		window.requestAnimationFrame(resolve);
	});
};

/**
 * test inspired by Idle-until-urgent setup https://philipwalton.com/articles/idle-until-urgent/
 * returns a 'thenable' that if used triggers explicitly, otherwise queued on idle.
 * todo: this impl might have issues: https://twitter.com/snigelpaogat/status/1043935781348347907
 * @return {IThenable}
 */
api.idleUntilUrgent = function(initFn) {
	var value;
	// todo: worth it to be able to cancel the idle?
	api.whenIdle().then(function() {
		if (value === undefined)
			value = initFn();
	});

	return {
		then: function(callback) {
			if (value === undefined) {
				value = initFn();
			}
			return callback(value);
		}
	};
};


/**
 * variant2 of idleUntilUrgent
 * @param {Function} init
 * @return {IThenable}
 */
api.promiseIUU = function(init) {
	var value;
	var handle = requestIdleCallback(function() {
		if (value === undefined)
			value = init();
	});
	return {
		then: function(callback) {
			if (value === undefined) {
				cancelIdleCallback(handle);
				value = init();
			}
			return callback(value);
		}
	};
};


/**
 * plain Idle Until Urgent in Philip's original (arguable simpler) style.
 * Close to https://github.com/GoogleChromeLabs/idlize/blob/master/docs/IdleValue.md
 * (But skip need to "new" it)
 * todo: maybe also add his "queue" version?
 * @param {Function} callback assumed to return a value (synchronously)
 * @return {{getValue: *, setValue(*)}}
 */
api.idleValue = function(callback) {
	var done = false; // use a separate flag instead of using undefined value check
	var val = undefined;

	var handle = requestIdleCallback(function() {
		done = true;
		handle = null;
		val = callback();
	});

	return {
		getValue: function() {
			if (handle) {
				cancelIdleCallback(handle);
				handle = null;
			}
			if (done) {
				return val;
			}
			val = callback();
			return val;
		},
		// note that this is Not considered a new Idle, but a plain value.
		// Simply re-assign entire Idle if new cycle is needed.
		setValue: function(newVal) {
			if (handle) {
				cancelIdleCallback(handle);
				handle = null;
			}
			val = newVal;
			// todo: could chain the value?
		}
	};
};

/**
 * promisifies a node.js API style function with a last arg as 'callback(err, data)'
 * into a Promise (err=>catch, data=>then)
 * todo: name...? we want to be able to use name 'promisify' also (for same conversion, but not node.js-callback-style)
 *
 * http://bluebirdjs.com/docs/api/promise.promisify.html
 * https://nodejs.org/dist/latest-v8.x/docs/api/util.html#util_util_promisify_original
 *
 * @param {Function} nodeFn
 * @retrun {function(): !Promise}
 */
api.promisifyNodeJsAPI = function(nodeFn) {
	return function() {
		var self = this;
		var args = arguments;
		return new Promise(function(resolve, reject) {
			nodeFn.call(self, ...args, function(err, data) {
				if (err) {
					reject(err);
				} else {
					resolve(data);
				}
			});
		});
	};
};

/**
 * test.
 * todo: name clash? see "old" 'promisify' above, that is intended to handle *input* promises
 * 	and maybe 'promisifyNodeJsAPI' should have this name?
 *
 * todo: hmm, now treats all (no throw) returns from fn as 'resolve'. maybe flags or such to
 * translate "null", "-1", "false" or such => catch ? (add second optional arg "isError(ret)" or even a false-value!?)
 *
 * @param {Function} fn
 * @return {function(): !Promise}
 */
api.promisifyFn = function(fn) {
	return function() {
		var self = this;
		var args = arguments;
		return new Promise(function(resolve, reject) {
			resolve(fn.apply(self, args)); // throw -> reject automatically
		});
	};
};


/**
 * Delays running the executor until the
 * first "then" is attached. useful?
 *
 * @param {Function} executor
 * @return {IThenable} // todo: or try inherit/patch a real Promise?
 */
api.lazyPromise = function(executor) {
	// fake using a thenable-ish-object. hmm, or monkey patch a real Promise?
	return {
		then: function(callback, errback) {
			return new Promise(executor).then(callback, errback);
		},
		catch: function(errback) {
			return this.then(null, errback);
		}
	};
};

/**
 * shows the (blocking) window.confirm as a Promise
 * todo: can be inline api!
 * @param {string} msg
 * @return {!Promise} "error" for false
 */
api.confirmDialog = function(msg) {
	return new Promise((resolve, reject) => {
		if (window.confirm(msg))
			resolve();
		else
			reject();
	});
};

/**
 * shwos the (blocking) window.alert as a Promise
 * will always result in success.
 * todo: can be inline api!
 * @param {string} msg
 * @return {!Promise}
 */
api.alertDialog = function(msg) {
	return new Promise(resolve => {
		window.alert(msg);
		resolve();
	});
};


/**
 * todo: DANG! path is from *this* file's location => Makes this almost unusable from other files..
 * (unless we process paths to start at project root or such?..)
 *
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import
 * https://developers.google.com/web/updates/2017/11/dynamic-import
 *
 * @param {string} module ES6 module path
 * @return {!Promise}
 */
api.import = function(mod) {
	'use strict'; // a must for import statement
	// yes, dynamic import returns a Promise but it can
	// throw on top-level so need to wrap!
	return new Promise((resolve, reject) => {
		// todo: !? failed module error can't be caught??
		import(mod).then(resolve, reject);
	});
};


return api;

});
