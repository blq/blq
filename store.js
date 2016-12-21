/**
 * @fileoverview
 * Initially used store.js https://github.com/marcuswestin/store.js/ but since we don't care about IE and
 * we just go for native now, the API is inspired, though some twists, mainly iterators.
 *
 * JSON encoding used by default, use the '*Raw' fns otherwise.
 *
 * Exposes an ES6 iterator and MochiKit.Iterator if available.
 *
 * todo: set/getCompressed? (using the LZ lib)
 * todo: namespaces? store.getNamespace(namespace) -> a store.get/set API but behind a namespace?!
 *
 * @author Fredrik Blomqvist
 *
 */
define([], function() {

// namespace
// @const
var store = {
	// replace if needed (typically if you need a reviver/replacer)
	toJSON: JSON.stringify,
	fromJSON: JSON.parse,

	// todo: expose swapping store so we
	// can also use sessionStorage? https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage
	_storage: localStorage,

	// todo: detection code? (private mode browsing. fallback to in-memory emulation?)
	// store.enabled: boolean ?

	// low-level get but without any default or checks
	_get: function(key) {
		return store.fromJSON(store.getRaw(key));
	},

	get: function(key, defaultVal) {
		// use has() to handle undefined case, but still let invalid JSON throw
		// (neither localStorage.getItem nor JSON.parse returns undefined, only null)
		var val = store.has(key) ? store._get(key) : undefined;
		return val === undefined ? defaultVal : val;

		// easier? or more subtle anyway?
//		if (store.has(key)) {
//			return store._get(key);
//		}
//		return defaultVal;
	},

	/**
	 * bypasses JSON parsing
	 */
	getRaw: function(key) {
		return store._storage.getItem(key);
	},

	set: function(key, value) {
		if (value === undefined) {
			// not so much as a shortcut for remove but
			// to avoid 'undefined' entering LS at all.
			// It's not consistent:
			// localStorage.getItem(undefined) returns _null_.
			// localStorage.setItem(undefined) stores a _string_ "undefined".
			// JSON.parse("undefined") is invalid JSON.. => we never allow undefined!
			store.remove(key);
			return;
		}
		store.setRaw(key, store.toJSON(value));
		return value; // chain
	},

	/**
	 * bypasses JSON serialization
	 * @param {string} key
	 * @param {*} value
	 */
	setRaw: function(key, value) {
		store._storage.setItem(key, value);
		return value; // chain
	},

	/**
	 * @param {string} key
	 * @param {*=} defaultVal value Or transaction function
	 * @param {Function} transactionFn
	 * @return chained
	 */
	transact: function(key, defaultVal, transactionFn) {
		if (arguments.length == 2) {
			transactionFn = arguments[1];
			defaultVal = undefined;
		}
		var val = store.get(key, defaultVal);
		var ret = transactionFn(val);
		ret = ret === undefined ? val : ret;
		return store.set(key, ret);
	},

	remove: function(key) {
		store._storage.removeItem(key);
	},

	clear: function() {
		store._storage.clear();
	},

	/**
	 * cheaper than get(key) !== undefined
	 * @param {string} key
	 * @return {boolean}
	 */
	has: function(key) {
		// as said, only checks for existence of key (I think it's ok, but store.js checks value != undefined also for example)
		return key in store._storage;
	},

	// note that callback only gets the key id. Assumed to grab the value manually if needed.
	// for performance reasons (json serialization) (ok? worth it?). (passing the index would be of little use).
	// if callback returns 'false' breaks the loop (following jQuery's each-convention).
	// todo: or split in two? each(key, value) & eachKey(key) ?
	// -> or use the new ES6 iteration instead!
	each: function(callback) {
		// ! always iterate backwards. Then both add and remove(of current elem) can be done by the callback in the loop.
		for (var i = store._storage.length - 1; i >= 0; --i) {
			var key = store._storage.key(i);
			// todo: value? do callback(key, val)
			var ret = callback(key);
			if (ret === false)
				break;
		}
		return callback; // kindof useful in case the callback accumulates "something" during the run (FP idiom)
	},

	/**
	 * @return {!Object}
	 */
	getAll: function() {
		var all = {};
		store.each(function(key) {
			// todo: make this a lazy property?
			all[key] = store._get(key); // use low-level _get since we know keys exist
		});
		return all;
	}
};


// sniff for MochiKit.Iter
if (typeof MochiKit != 'undefined' && typeof MochiKit.Iter != 'undefined') {
	// expose a MochiKit.Iterator
	// (assumes noone messes too much with the storage during iteration (goes backwards similar to .each()) )
	// iterator returns: { key, value }
	// enables: MochiKit.Iter.forEach(store, function(elem) { .. });
	// @see http://blq.github.io/mochikit/doc/html/MochiKit/Iter.html#fn-iter
	// todo: hmm, or expose this as a store.enableMochKitIter? then a user can enable even if MK is loaded after this file.
	// (maybe try something like this to set a "soft" dependency? http://stackoverflow.com/questions/14164610/requirejs-optional-dependency/27422370#27422370  hmm, still not quite. we want only opt-in if someone _else_ requires MK..)
	store['__iterator__'] = function() {
		// use lazy init of the index on the very first next() call to match the behavior of a standard 0..N iterator.
		// i.e we can grab an iterator (say empty collection), modify the collection, and still get consistent loop afterwards
		var i = -1;
		var first = true;
		return {
			next: function() {
				if (first) {
					i = store._storage.length - 1;
					first = false;
				}
				if (i < 0) {
					throw MochiKit.Iter.StopIteration;
				}
				var key = store._storage.key(i--);
				// todo: or just return key as value? (similar to store.each)
				return {
					key: key,
					// use a property getter for lazy eval
					get value() {
						delete this.value;
						return this.value = store._get(key);
					}
					// todo: expose setter? or too subtle?
				};
			}
		};
	};
}


// sniff for ES6 iterator support
// (typeof Symbol.iterator == 'symbol'. But skip that to allow polyfilling and avoid possible warning/err in linters/closure)
if (typeof Symbol == 'function' && typeof Symbol.iterator != 'undefined') {

	// enables for example: for (let elem of store) { .. }
	// @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols
	store[Symbol.iterator] = function() {
		// use lazy init of the index on the very first next() call to match behavior of a standard 0..N iterator.
		// i.e we can grab an iterator (say empty collection), modify the collection, and still get consistent loop afterwards
		var i = -1;
		var first = true;
		return {
			next: function() {
				if (first) {
					i = store._storage.length - 1;
					first = false;
				}
				if (i < 0) {
					return { done: true };
				}
				var key = store._storage.key(i--);
				return {
					done: false,
					value: {
						key: key,
						// use a property getter for lazy eval
						get value() {
							delete this.value;
							return this.value = store._get(key);
						}
						// todo: expose setter? or too subtle?
					}
				};
			}
		};
	};
}


return store;

});
