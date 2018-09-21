/**
 * @fileoverview
 * quick *experimental test* to use WeakMap to get "free" GC of observer pattern stuff and
 * Map and Set for fast lookup
 *
 * API inspired by MochiKit.Signal http://blq.github.io/mochikit/doc/html/MochiKit/Signal.html
 *
 * todo: possible polyfills? https://github.com/polygonplanet/weakmap-polyfill
 * IE11 might need it. But not sure if possible to get GC in a PF?
 * maybe this one? https://github.com/Financial-Times/polyfill-service/tree/master/polyfills/WeakMap
 *
 * todo: support __connect__/__disconnect__ interceptors? (or use Symbols?)
 * todo: namespace support?
 * note: doesn't support the DOM-overload like MochiKit did (think should be other module)
 *
 */

define([], function() {

var api = {};

// weakmap of dictionaries of signalnames->handlers
// todo: let's hope GC is eager enough to clean up to not cause clogging anyway..
// (sometimes veery slow!?)
var store = new WeakMap();
var destStore = new WeakMap();

// setup now is:
// store:
// WeakMap->Map->Set
// obj->signal->callbacks

// destStore:
// WeakMap->Set
// obj->handles


/**
 * @param {Object} obj
 * @param {string} sig
 * @param {function} fn
 * @return {Object} handle
 */
api.connect = function(obj, sig, destOrFn, fn) {
	var dest;
	if (arguments.length == 3) {
		fn = destOrFn;
		// no need to bind fn since obj will be default call context
	} else
	if (arguments.length == 4) {
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
	var handle = {
		obj: obj,
		sig: sig,
		fn: fn,
		dest: dest
	};

	if (dest) {
		var handles = destStore.get(dest);
		if (!handles) {
			handles = new Set();
			destStore.set(dest, handles);
		}
		handles.add(handle);
	}

	return handle;
};

// Note that the whole point of this impl API is to Not have
// to call disconnect at teardowns. This is now only needed if
// you need to disconnect during use, before a teardown. (and symmetry)

api.disconnectAll = function(handle, ...signals) {
	if (signals.length > 0) {
		var m = store.get(handle.obj);
		if (!m) return;
		signals.forEach(m.delete, m);

		if (m.size == 0) {
			store.delete(handle.obj);
		}
	} else {
		store.delete(handle.obj); // todo: any benefit in doing "deep" teardown? (this should be only reference to the nested DS though)
	}
};


api.disconnect = function(handle) {
	var m = store.get(handle.obj); // Map
	if (!m) return;

	var callbacks = m.get(handle.sig); // Set
	if (!callbacks) return;

	callbacks.delete(handle.fn);
	if (callbacks.size == 0) {
		m.delete(handle.sig);
	}

	if (handle.dest) {
		var handles = destStore.get(handle.dest);
		if (!handles) return; // if handle.dest exists this should always exist..
		handles.delete(handle);

		if (handles.size == 0) {
			destStore.delete(handle.dest);
		}
	}

	if (m.size == 0) {
		store.delete(handle.obj);
	}
};


api.disconnectAllTo = function(dest) {
	var handles = destStore.get(dest);
	if (!handles) return;
	handles.forEach(api.disconnect);
	destStore.delete(dest); // disconnect does this too now
};


/**
 * @param {Object} obj
 * @param {string} sig
 * @param {*} args optional
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
			// buffering exceptions as MK does (or possible to throw and loop somehow?)
			errors.push(ex);
		}
	});

	if (errors.length == 1) {
		throw errors[0];
	} else
	if (errors.length > 1) {
        var e = new Error("Multiple errors thrown in handling 'sig', see errors property");
        e.errors = errors;
        throw e;
	}
};


return api;

});