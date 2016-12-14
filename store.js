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

	// todo: detection code? (private mode browsing. fallback to in-memory emulation?)
	// store.enabled: boolean ?

	get: function(key, defaultVal) {
		var val = store.fromJSON(store.getRaw(key));
		return val === undefined ? defaultVal : val;
	},

	/**
	 * bypasses the json de-serializaton
	 */
	getRaw: function(key) {
		return localStorage.getItem(key);
	},

	set: function(key, value) {
		store.setRaw(key, store.toJSON(value));
		return value; // chain
	},

	/**
	 * bypasses the json serializaton
	 * @param {string} key
	 * @param {*} value
	 */
	setRaw: function(key, value) {
		localStorage.setItem(key, value);
		return value; // chain
	},

	/**
	 * @param {string} key
	 * @param {*=} defaultVal value Or transaction function
	 * @param {Function} transactionFn
	 * @return chained
	 */
	transact: function(key, defaultVal, transactionFn) {
		// overload on two vs three params
		if (transactionFn == null) {
			transactionFn = defaultVal;
			defaultVal = null;
		}
		if (defaultVal == null) {
			defaultVal = {};
		}
		var val = store.get(key, defaultVal);
		var ret = transactionFn(val);
		ret = ret === undefined ? val : ret;
		return store.set(key, ret);
	},

	remove: function(key) {
		localStorage.removeItem(key);
	},

	clear: function() {
		localStorage.clear();
	},

	/**
	 * cheaper than get(key) != null
	 * @param {string} key
	 * @return {boolean}
	 */
	has: function(key) {
		// as said, only checks for existence of key (I think it's ok, but store.js checks value != undefined also for example)
		return key in localStorage;
	},

	// note that callback only gets the key id. Assumed to grab the value manually if needed.
	// for performance reasons (json serialization) (ok? worth it?). (passing the index would be of little use).
	// if callback returns 'false' breaks the loop (following jQuery's each-convention).
	// todo: or split in two? each(key, value) & eachKey(key) ?
	// -> or use the new ES6 iteration instead!
	each: function(callback) {
		// ! always iterate backwards. Then both add and remove(of current elem) can be done by the callback in the loop.
		for (var i = localStorage.length - 1; i >= 0; --i) {
			var key = localStorage.key(i);
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
			all[key] = store.get(key);
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
		// todo: hmm, maybe you could argue that the index in this case
		// could/should be made to lazily initialize on the first next() call?
		var i = localStorage.length - 1;
		return {
			next: function() {
				if (i < 0) {
					throw MochiKit.Iter.StopIteration;
				}
				var key = localStorage.key(i--);
				return {
					key: key,
					value: store.get(key)
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
		// todo: hmm, maybe you could argue that the index in this case
		// could/should be made to lazily initialize on the very first next() call? (hmm, that would be case of starting from 0.. maybe need to change to that to be consistent then?)
		var i = localStorage.length - 1;
		return {
			next: function() {
				if (i < 0) {
					return { done: true };
				}
				var key = localStorage.key(i--);
				return {
					done: false,
					value: {
						key: key,
						value: store.get(key)
					}
				};
			}
		};
	};
}


return store;

});
