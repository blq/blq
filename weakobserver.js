/**
 * @fileoverview
 * Quick *experimental test* to use WeakMap to get "free" GC of observer pattern stuff and
 * Map and Set for fast lookup
 *
 * API inspired by MochiKit.Signal https://blq.github.io/mochikit/doc/html/MochiKit/Signal.html
 *
 * todo: possible polyfills? https://github.com/polygonplanet/weakmap-polyfill
 * IE11 might need it. But not sure if possible to get GC in a PF?
 * maybe this one? https://github.com/Financial-Times/polyfill-service/tree/master/polyfills/WeakMap
 *
 * todo: worth it to examine signal return values? i.e mimic Boost's combiners? https://www.boost.org/doc/libs/1_68_0/doc/html/signals/tutorial.html#id-1.3.36.4.6.3
 *
 * todo: support __connect__/__disconnect__ interceptors? (or use Symbols?)
 * todo: signal namespace support?
 * note: doesn't support the DOM-overload like MochiKit (think such stuff should be in other module)
 *
 */

define([], function() {

var api = {};

// weakmap of dictionaries of signalnames->handlers
// todo: let's hope GC is eager enough to clean up to not cause clogging anyway..
// (sometimes veery long time before cleanup!?)
var store = new WeakMap();
var destStore = new WeakMap();

// expose for debug-inspection
api.__debug = {};
api.__debug._store = store;
api.__debug._destStore = destStore;

// setup now is:
// store:
// WeakMap->Map->Set
// obj->signal->callbacks
// todo: change callbacks-Set into handles-Set?

// destStore:
// WeakMap->Set
// obj->handles

api.__connect__ = Symbol('__connect__');
// todo: hmm, disconnect requires more code changes. maybe skip (MK didn't add it until later also I think(?))
// -> most importantly it makes fast disconnectAll a O(n) instead of O(1)...
api.__disconnect__ = Symbol('__disconnect__');


/**
 * https://blq.github.io/mochikit/doc/html/MochiKit/Signal.html#fn-connect
 * @param {Object} obj
 * @param {string} sig
 * @param {Object|function} destOrFn
 * @param {function=} fn
 * @return {Object} handle
 */
api.connect = function(obj, sig, destOrFn, fn) {
	// when using new Map we can actually skip this requirement(?) useful?
    // if (typeof sig != 'string') {
    //     throw new TypeError("'sig' must be a string");
    // }

	var dest;
	if (arguments.length === 3) {
		fn = destOrFn;
		// no need to bind fn since obj will be default call context
	} else
	if (arguments.length === 4) {
		dest = destOrFn;
		fn = fn.bind(dest);
	}

	var m = store.get(obj);
	if (!m) {
		m = new Map();
		store.set(obj, m);
	}

	var callbacks = m.get(sig);
	if (!callbacks) {
		callbacks = new Set();
		m.set(sig, callbacks);
	}
	callbacks.add(fn); // only one will be allowed!

	// should be treated as a black-box by outside code
	// == MochiKit.Signal.Ident
	// guess we could hide more here? even return hash-keys or such? (but no real win I think)
	var handle = {
		obj: obj,
		sig: sig,
		dest: dest,
		fn: fn
	};

	if (dest) {
		var handles = destStore.get(dest);
		if (!handles) {
			handles = new Set();
			destStore.set(dest, handles);
		}
		handles.add(handle);
	}

	var __connect = obj[api.__connect__] || obj['__connect__']; // support old non Symbol also
	if (typeof __connect === 'function') {
		var args = Array.from(arguments);
		args[0] = handle;
		__connect.apply(obj, args);
	}

	return handle;
};

// Note that the whole point of this impl API is to Not have
// to call disconnect at teardowns. This is now only needed if
// you need to disconnect during use, before a teardown. (and symmetry)

/**
 * https://blq.github.io/mochikit/doc/html/MochiKit/Signal.html#fn-disconnectall
 * @param {Object} handle
 * @param {...string} signals
 */
api.disconnectAll = function(handle, ...signals) {
	if (signals.length > 0) {
		var m = store.get(handle.obj);
		if (!m) return;
		signals.forEach(m.delete, m);

		if (m.size === 0) {
			store.delete(handle.obj);
		}
	} else {
		store.delete(handle.obj); // todo: any benefit in doing "deep" teardown? (this should be only reference to the nested DS though)
	}
};

/**
 * https://blq.github.io/mochikit/doc/html/MochiKit/Signal.html#fn-disconnect
 * @param {Object} handle
 *
 */
api.disconnect = function(handle) {
	var m = store.get(handle.obj); // Map
	if (!m) return false;

	var callbacks = m.get(handle.sig); // Set
	if (!callbacks) return false;

	callbacks.delete(handle.fn);
	if (callbacks.size === 0) {
		m.delete(handle.sig);
	}

	if (handle.dest) {
		var handles = destStore.get(handle.dest);
		// if (!handles) return; // if handle.dest exists this should always exist..
		handles.delete(handle);

		if (handles.size === 0) { // todo: hmm, if deemed heavy we could delegate these kind of empty-DS deletes to a idle GC-task!?
			destStore.delete(handle.dest);
		}
	}

	if (m.size === 0) {
		store.delete(handle.obj);
	}

	// todo: worth it to support __disconnect__ intercept? (need to rewrite other disconnectAll etc! slower..)
	var __disconnect = handle.obj[api.__disconnect__] || handle.obj['__disconnect__'];
	if (typeof __disconnect === 'function') {
		__disconnect(handle, handle.sig, handle.dest, handle.fn);
	}
	return true;
};

/**
 * https://blq.github.io/mochikit/doc/html/MochiKit/Signal.html#fn-disconnectallto
 * @param {Object} dest
 * @param {function=} fn
 */
api.disconnectAllTo = function(dest, fn) {
	var handles = destStore.get(dest);
	if (!handles) return;
	if (typeof fn === 'function') {
		handles.forEach(function(handle) {
			// todo: bug! if fn is bound to dest these won't match! -> store original fn..
			if (handle.fn === fn) {
				api.disconnect(handle);
			}
		});
		if (handles.size === 0) {
			destStore.delete(dest); // disconnect does this too now
		}
	} else {
		handles.forEach(api.disconnect);
		destStore.delete(dest); // disconnect does this too now
	}
};


/**
 * https://blq.github.io/mochikit/doc/html/MochiKit/Signal.html#fn-signal
 * @param {Object} obj
 * @param {string} sig
 * @param {*} args optional
 * // todo: hmm, maybe return how many actually listened?
 */
api.signal = function(obj, sig, ...args) {
	var m = store.get(obj);
	if (!m) return;

	var callbacks = m.get(sig); // Set
	if (!callbacks) return;

	var errors = [];
	// no need to lock disconnects during loop since Map foreach handles removals
	callbacks.forEach(function(callback) {
		try {
			callback.call(obj, ...args); // observe that callback might have been bound to 'dest' in connect
		} catch (ex) {
			console.error('signal:', ex); // maybe not log in production..
			// buffering exceptions as MK does
			errors.push(ex);
		}
	});

	if (errors.length === 1) {
		throw errors[0];
	} else
	if (errors.length > 1) {
		var e = new Error("Multiple errors thrown in handling 'sig', see errors property");
		e.errors = errors;
		throw e;
	}
};


/**
 * test
 * todo: something like this could actually be useful in API
 * to avoid dispatching expensive signals if noone is listening (lazy trigger-thing?)
 * @param {Object} obj
 * @return {integer}
 */
api.numListeners = function(obj) {
	var m = store.get(obj);
	if (!m) return 0;

	var callbacks = m.get(sig); // Set
	if (!callbacks) return 0;

	return callbacks.size;
};


/**
 * https://blq.github.io/mochikit/doc/html/MochiKit/Signal.html#fn-disconnectallfromto
 * (this is only in blq fork)
 */
api.disconnectAllFromTo = function(src, dest) {
	var handles = destStore.get(dest);
	if (!handles) return;
	// todo: is this worth more DS to speed up?
	handles.forEach(function(handle) {
		if (handle.obj === src) {
			api.disconnect(handle);
		}
	});
};


/**
 * shorthand for a call to disconnectAll() + disconnectAllTo()
 * typically to be run during teardown in an obj's destructor
 */
api.close = function(obj) {
	// api.disconnectAll(obj);
	// api.disconnectAllTo(obj);

	// slightly more efficient (assuming no __disconnect__ intercept needed)
	destStore.delete(obj);
	store.delete(obj);
};


/**
 * memoizes (last) signal value and will trigger it
 * immediately if late listeners connects.
 * nice for init-signal: connect(app, 'oninitialized', ..) -> trigger later if app._initialized == true
 */
api.signalPersistent = function(obj, sig, ...args) {
	// todo: bug! must respect if existing connect-function of course! (api to append listeners :) ?)
	obj[api.__connect__] = function(handle, _sig, ...other) {
		if (sig === _sig)
			handle.fn(...args);
	};
	api.signal.apply(this, arguments);
};




//--------- test for actual signal instances (not just implicit), mimic QT and Boost.
// can enable combiners

/**
 * @param {function=} combiner
 * @constructor
 */
api.Signal = function(combiner) {
	this._combiner = combiner || function() {};
};

// todo: support explicit ordering as Boost also?
api.Signal.prototype.connect = function(slot) {
	// 2nd arg 'sig' could in this case essentially be a(our) guid
	var handle = api.connect(this, this, this, slot); // Boost calls return here 'connection'

	handle.connected = true; // Boost stores this too (and "old" MK)
	handle.disconnect = function() {
		if (!this.connected) return;
		api.disconnect(this);
		this.connected = false;
	};

	// todo: support block/unblock? or this https://www.boost.org/doc/libs/1_68_0/doc/html/boost/signals2/shared_connection_block.html

	return handle;
};


api.Signal.prototype.signal = function(...args) {
	var obj = this;
	var sig = this; // (!)

	var m = store.get(obj);
	if (!m) return;

	var callbacks = m.get(sig); // Set
	if (!callbacks) return;

	var results = [];
	var errors = [];
	// no need to lock disconnects during loop since Map foreach handles removals
	callbacks.forEach(function(callback) {
		try {
			var ret = callback.call(obj, ...args); // observe that callback might have been bound to 'dest' in connect
			results.push(ret); // yes, we could yield this maybe (specify combiner to take iterable)
		} catch (ex) {
			console.error('signal:', ex); // maybe not log in production..
			// buffering exceptions as MK does
			errors.push(ex);
		}
	});

	try {
		if (errors.length === 1) {
			throw errors[0];
		} else
		if (errors.length > 1) {
			var e = new Error("Multiple errors thrown in handling 'sig', see errors property");
			e.errors = errors;
			throw e;
		}
	} finally {
		return this._combiner(results);
	}
};


api.Signal.prototype.disconnect = function(slot) {
	api.disconnectAllTo(this, slot);
};


return api;

});
