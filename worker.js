/**
 * @fileoverview
 * Web Worker utils. Notably support for inline function workers, i.e without external file.
 * @see http://www.w3.org/TR/workers/
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
 *
 * @author Fredrik Blomqvist
 *
 */
define(['blq/util'], function(util) {

// namespace
var worker = {};

/**
 * Prerequirement for createInlineWebWorker, makeFnWorkerAsync etc
 *
 * Workers does not work in IE<9 or Android < 4.4
 * @see http://caniuse.com/#feat=webworkers
 * @see http://caniuse.com/#feat=blobbuilder
 *
 * @return {boolean}
 */
worker.isInlineWebWorkerSupported = function() {
	var Blob = window.Blob || window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder; // fallback handled in _createBlob()
	var URL = window.URL || window.webkitURL;
	var Worker = window.Worker;

	return URL != null && Blob != null && Worker != null;
};


/**
 * Typically you'll use createInlineWebWorker or makeFnWorkerAsync.
 * createInlineWebWorkerUrl( function(self) { .. worker code.. use 'self' from first arg! } );
 *
 * todo: test if features like importScript etc works? (tweak paths?)
 *
 * @param {function()|string} fnJs worker code. Must not use 'this', use 'self' instead. And of course not assume any other outside references!
 * @return {?string} can be fed directly to the Worker constructor. null if not supported
 */
worker._createInlineWebWorkerURL = function(fnJs)  {
	assert(fnJs != null); // typically a function but with a string we have full freedom. see blq.makeFnWorkerAsync for example

	if (!worker.isInlineWebWorkerSupported()) {
		console.error('Inline Web Worker not supported');
		return null;
	}

	// a function is (must be..) auto-started, and assumed to take 'self' as first/only arg (also bound as 'this')
	// string input is assumed to know about the worker message api, or already be a self-running function or unwrapped code.
	var fnstr = typeof fnJs == 'function' ? '('+fnJs.toString()+').call(self, self)' : fnJs;

	var blob = util._createBlob([fnstr], 'application/javascript');
	var URL = window.URL || window.webkitURL; // todo: put in a helper fn also? (easy polyfill)
	var url = (blob != null && URL != null) ? URL.createObjectURL(blob) : null;

	return url;
};


/**
 * Easily create an inline Web Worker context.
 * I.e a separate execution thread that communicates via messages.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API
 *
 * Example:
 *
 	var worker = createInlineWebWorker(
 		function(self) {
 			// Web Worker context. same as if in an external file!

 			self.onmessage = function(e) {
 				var msg = e.data;

 				self.postMessage('hello! ' + msg);
 			};
 		}
 	);

 	..
 	worker.onmessage = function(answer) { console.log(answer); };

 	worker.postMessage('hello?');
 	..
 	..
 	worker.terminate(); // done!
 *
 *
 *
 * Does not work in IE<9 or Android < 4.4
 * @see http://caniuse.com/#feat=webworkers Android 4.4+, IE10+
 * @see http://caniuse.com/#feat=blobbuilder Android 46+ (4.1+ with fallback). IE10+(not with JS content?)
 *
 * @see worker._createInlineWebWorkerURL
 * @see worker.makeFnWorkerAsync() for simpler run-once case.
 *
 * todo: helper to import other scripts?
 *
 * @param {function()|string} js worker code. Must not use 'this', use 'self' instead. And of course not assume any other outside references!
 * @return {Worker} null if not supported. Use 'worker.postMessage(params)' to start and send messages. Use 'worker.onmessage = callback' (or addEventListener) to receive data.
 */
worker.createInlineWebWorker = function(js) {
	var url = worker._createInlineWebWorkerURL(js);
	if (url == null)
		return null;
	var w = new Worker(url);
	URL.revokeObjectURL(url); // free resource right away (seems worse for debugging though..)
	return w;
};


/**
 * Transforms fn into an async fn that is run as a Web Worker and returns a Deferred/Promise.
 * See it as a truly async running *pure function*!
 * (Observe that this means the function can't itself be asynchronous for example). todo: hmm, we could sniff for that? See https://github.com/cdsanchez/SimpleWorker/blob/master/SimpleWorker.js
 * No need to care about Worker api. In fact, this version the fn Must Not use the worker api. Return data in one run!
 * (each call spawns a new worker)
 * The wrapped function must not use any external libraries!
 *
 * Example:
 *		var workerFn = makeFnWorkerAsync(function(a, b, c) { return a*b*c; });
 *		...
 *		workerFn(1, 2, 3).addCallback(function(result) { console.log('product is:', result); });
 *
 *
 * @see blq.createInlineWebWorker() for lower-level Worker access. (Same limitations apply).
 *
 * Arguments to the function are limited to "transferrable objects". s.c structured cloning. read-only.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
 *
 * todo: name... "wrapInWorker"?
 * todo: allow injection of the actual Promise impl? options.createDeferred(), options.resolve(d) etc? to allow MK, jQuery, Q, or ES6.
 * todo: downside here is no possible progress update. Perhaps create and inject a custom progress-posting callback the fn could use?
 *
 * @param {function()} fn Must be a Pure function. Take (read-only) input, return a result. No other external access.
 * @return {function(): !Deferred} function has same signature as input fn, but returns Deferred. Deferred will also have '.worker' property for access
 */
worker.makeFnWorkerAsync = function(fn) {
	assert(typeof fn == 'function');

	var workerJs = 'self.onmessage = function(e) { self.postMessage(('+fn.toString()+').apply(self, e.data)) }';
	// todo: better to create url once up-front, but never call revokeObjectURL. Or create once per call and use 'revokeObjectURL' directly?
	// todo: or perhaps cache these? (look up using toString-code and pool?)
	var workerUrl = worker._createInlineWebWorkerURL(workerJs);

	return function(/*args*/) {
		var d = new MochiKit.Async.Deferred(function() {
			// canceller (todo: not sure really necessary, skip? Cancellation not part of ES6 Promises..)
			if (d.worker) {
				d.worker.terminate();
				delete d.worker;
			}
		});

		// todo: possible to reuse or cache/clone this worker? content is the same always (profile if it's an issue at all of course..)
		// expose the worker as a property of the Deferred. useful? not much info is exposed on the worker anyway.. basically only terminate().
		d.worker = new Worker(workerUrl);

		d.worker.onmessage = function(e) {
			// todo: if we add a convention I guess we could detect custom commands here, i.e progress, that should Not end the promise, just push a notifier?
			d.worker.terminate();
			delete d.worker; // help GC(?)
			d.callback(e.data);
		};
		d.worker.onerror = function(err) {
			d.worker.terminate();
			delete d.worker;
			// ! 'err' will not be same error as the worker threw.
			// Workers can't return or propagate Error() objs, thus we re-wrap it.
			d.errback(new Error(err));
		};
		// can't post the 'arguments' object
		d.worker.postMessage(Array.prototype.slice.call(arguments));
		return d;
	};
};


/**
 * test using the ES6 Promise (and no fallback api)
 * otherwise same as makeFnWorkerAsync.
 *
 * @param {function()) fn
 * @return {function(): !Promise} Promise will have '.worker' as a property
 */
worker.makeFnWorkerPromise = function(fn) {
	assert(typeof fn == 'function');

	var workerJs = 'self.onmessage = function(e) { self.postMessage(('+fn.toString()+').apply(self, e.data)) }';
	// todo: or create and destroy the url also per call? this will live long now(?) (or will GC understand cleanup?)
	var workerUrl = URL.createObjectURL(new Blob([workerJs], { type: 'application/javascript' }));

	return function(/*args*/) {
		var args = Array.prototype.slice.call(arguments); // can't post the raw 'arguments' object
		return new Promise(function(resolve, reject) {
			var w = new Worker(workerUrl);
			this.worker = w; // expose to caller. ok?
			w.onmessage = function(e) {
				w.terminate();
				resolve(e.data);
			};
			w.onerror = function(err) {
				w.terminate();
				// ! 'err' will not be same error as the worker threw.
				// Workers can't return or propagate Error() objs, only get a string.
				// thus we re-wrap. ok?
				reject(new Error(err));
			};
			w.postMessage(args);
		});
	};
};


/**
 * test.
 * version of makeFnWorkerAsync that creates a worker only per function, not per call. ("serial sharing"?)
 * i.e all calls to this fn uses the same worker. will be serial in their individual execution but of course outside the main app.
 * The worker will, if not closed via fn.terminate() live for entire app after first use of this method.
 *
 * worth it or not depending on the overhead for creating/destroying workers. todo: profile!
 * todo: error handling got complex in this setup..
 * todo: name..??
 * todo: or create similar one that has a max limit on nr of pooled workers and only starts sharing serially if empty?
 * todo: could even create a version that uses a single worker for all fns.
 *
 * @param {function()} fn
 * @return {function(): !Deferred} function will have property '.worker' (! the function, Not the Deferred, contrary to makeFnWorkerAsync)
 */
worker.makeFnWorkerAsyncOnce = function(fn) {
	assert(typeof fn == 'function');

	// inject a uid each call so we can match with the corresponding event-handler
	// (since we use a single worked we have to attach multiple listeners using addEventListener)
	var w = worker.createInlineWebWorker('self.onmessage = function(e) { self.postMessage({ uid: e.data.uid, ret: ('+fn.toString()+').apply(self, e.data.args) }) }');

	var workerFn = function(/*args*/) {
		var d = new MochiKit.Async.Deferred();
		var uid = util.getUid();

		function onMessage(e) {
			if (uid != e.data.uid) // only care about our id!
				return;

			// once!
			w.removeEventListener('message', onMessage, false);
			// w.removeEventListener('error', onError, false);

			d.callback(e.data.ret);
		}

		// todo: ? howto match _this_ error handler with uid? (onMessage gets the uid but here not)
		// function onError(err) {
		// 	if (uid != ?)
		// 		return;
		// 	// ! 'err' will not be same error as the worker threw.
		// 	// Workers can't return or propagate Error() objs.

		// 	w.removeEventListener('message', onMessage, false);
		// 	w.removeEventListener('error', onError, false);

		// 	d.errback(new Error(err));
		// }

		w.addEventListener('message', onMessage, false);
		// w.addEventListener('error', onError, false);

		w.postMessage({
			uid: uid,
			args: Array.prototype.slice.call(arguments) // can't post the raw 'arguments' object
		});

		return d;
	};

	// expose the worker (basically to allow terminate)
	workerFn.worker = w;

	return workerFn;
};


return worker;

});
