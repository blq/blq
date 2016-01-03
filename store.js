/**
 * @fileoverview
 * Initially used store.js but since we don't care about IE we just go for native now.
 * JSON by default.
 * Exposes a MochiKit.Iterator, but then assumes the caller includes MK.
 * todo: set/getCompressed? (using the LZ lib)
 *
 * @author Fredrik Blomqvist
 */
define([], function() {

// namespace
// @const
var store = {
	// todo: detection code? (private mode browsing. fallback to in-memory emulation?)

	get: function(key) {
		return JSON.parse(store.getRaw(key));
	},

	getRaw: function(key) {
		return localStorage.getItem(key);
	},

	set: function(key, value) {
		store.setRaw(key, JSON.stringify(value));
		return value; // chain
	},

	setRaw: function(key, value) {
		localStorage.setItem(key, value);
		return value; // chain
	},

	remove: function(key) {
		localStorage.removeItem(key);
	},

	clear: function() {
		localStorage.clear();
	},

	// cheaper than get(key) != null
	has: function(key) {
		// as said, only checks for key (I think it's ok, but store.js checks value != undefined for example)
		return key in localStorage;
	},

	// note that callback only gets the key id. Assumed to grab the value manually if needed.
	// for performance reasons (json serialization) (ok? worth it?). (passing the index would be of little use).
	// if callback returns 'false' breaks the loop (as jQuery's example)
	// todo: or split in two? each(key, value) & eachKey(key) ?
	each: function(callback) {
		// ! always iterate backwards. Then both add and remove(of current elem) can be done by the callback in the loop.
		for (var i = localStorage.length - 1; i >= 0; --i) {
			var key = localStorage.key(i);
			var ret = callback(key);
			if (ret === false)
				break;
		}
		return callback; // kindof useful in case the callback accumulates "something" during the run (FP idiom)
	},

	// expose a MochiKit.Iterator (todo: ES6!?)
	// (assumes noone messes with too much with the storage during iteration (goes backwards similar to .each()) )
	// iterator returns: { key, value }
	__iterator__: function() {
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
	},

	getAll: function() {
		var all = {};
		store.each(function(key) {
			all[key] = store.get(key);
		});
		return all;
	}
};

return store;

});
