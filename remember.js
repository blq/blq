/**
 * @fileoverview
 * Generic input field state remembering helper.
 *
 * stores states on elems with "data-blq-remember" tags in local storage.
 * Use 'data-blq-remember="uid"' or if not "uid" is passed tries to use elems's DOM #id.
 *
 * @author Fredrik Blomqvist
 *
 */
define(['jquery', 'blq/store'], function($, store) {

/**
 * todo: support all stateful html elements!
 * (in that case maybe have to handle change of elem type since saved..)
 * todo: hmm, maybe even case of supporting text-node child?
 * todo: performance of LS? maybe first cache in memory then, on idle, batch write to LS?
 *
 * namespace
 * @const
 */
var remember = {};

/**
 * Enables state saving of <input>, <select>, <textarea> elements between page loads.
 * Simply add the data.tag "data-blq-remember" to the element.
 * For a static page/form calling this methods once at startup should be enough.
 *
 * Impl. uses Local Storage.
 * todo: maybe optional tag if the setting should trigger event also? (but then needs circular handling)
 *
 * @param {jQuerySelector=} [root=document]
 */
remember.enable = function(root) {
	root = root || document;

	var _saveElem = function(elem) {
		elem = $(elem);
		// if fallback to 'name' we assume it's unique in the root(document)-scope (basically for <select> now)
		var id = elem.data('blq-remember') || elem.attr('id') || elem.attr('name');
		if (!id) {
			console.warn('blq.remember/enable: no valid uid found on element.', elem);
			return;
		}

		var type = elem.prop('nodeName') + '.' + (elem.attr('type') || '_');
		// var key = 'blq.remember/' + type + ':' + id; // todo: store the type in key also?
		// ! no, updating values would then need to extract the type each time onchange, before it can check if
		// any value exist at all - slower! (worth it?).
		// todo: do we need even more unique key? can same subdomain collide? include the url?
		var key = 'blq.remember:' + id;

		// todo: extract this separately? getGenericValue?
		// hmm.. this is similar to jQuery's ":input" filter selector?
		switch (type) {
			case 'INPUT.color':
			case 'INPUT.date':
			case 'INPUT.datetime':
			case 'INPUT.datetime-local':
			case 'INPUT.email':
			case 'INPUT.month':
			case 'INPUT.number':
			case 'INPUT.password':
			case 'INPUT.range':
			case 'INPUT.search':
			case 'INPUT.tel':
			case 'INPUT.text':
			case 'INPUT.time':
			case 'INPUT.url':
			case 'INPUT.week':
			case 'TEXTAREA._':
				store.set(key, { type: type, value: elem.val() });
				break;

			case 'INPUT.checkbox':
				store.set(key, { type: type, value: elem.prop('checked') });
				break;

			case 'SELECT._':
				// todo: ok with index? or match the <option>'s value?
				store.set(key, { type: type, value: elem.prop('selectedIndex') });
				break;

			case 'INPUT.radio':
				// todo: radio needs "name" group and 'value' and possibly containing form!
				// this method requires an explicit id for each button. Cumbersome, but maybe ok?
				store.set(key, { type: type, value: elem.prop('checked') });
				break;

			default:
				console.warn('blq.remember.enable/save: unsupported element type:', type);
				break;
		}
	};

	// push last stored values on startup
	$(document).ready(function() {
		remember.update(root);
	});

	// listen for change and save values
	// todo: debounce? (or even delay until "idle"?) (would need to store and batch though)
	$(root).on('change.blq-remember', '[data-blq-remember]', function(e) {
		_saveElem(this);
	});

	// also listen for window close. then we can save values that didn't trigger a change
	$(window).on('beforeunload.blq-remember', function(e) {
		// console.debug('blq.remember: unload, last save');
		$(root).find('[data-blq-remember]').each(function(i, elem) {
			_saveElem(elem);
		});
	});
};


remember.disable = function(root) {
	root = root || document;
	$(root).off('.blq-remember');
};


remember.reset = function() {
	store.each(function(key) {
		if (key.indexOf('blq.remember') == 0) {
			store.remove(key);
		}
	});
};


/**
 * Indirectly called by blq.remember.enable on document load.
 *
 * typically only need to call explicitly on dynamically added content.
 * todo: name? "refresh"?
 *
 * @param {jQuerySelector=} [root=document]
 */
remember.update = function(root) {
	root = root || document;

	// push stored values to elements
	$(root).find('[data-blq-remember]').each(function(i, elem) {
		elem = $(elem);
		// if fallback to 'name' we assume it's unique in the root(document)-scope. (basically for <select> now)
		var id = elem.data('blq-remember') || elem.attr('id') || elem.attr('name');
		if (!id) {
			console.warn('blq.remember.update: no valid uid found on element.', elem);
			return;
		}
		var key = 'blq.remember:' + id; // todo: store elem type in key? no! -> now in val.type instead
		if (!store.has(key)) {
			return;
		}

		var val = store.get(key);
		// todo: extract this separately? setGenericValue?
		var type = elem.prop('nodeName') + '.' + (elem.attr('type') || '_');
		if (type == val.type) switch (type) {
			case 'INPUT.color':
			case 'INPUT.date':
			case 'INPUT.datetime':
			case 'INPUT.datetime-local':
			case 'INPUT.email':
			case 'INPUT.month':
			case 'INPUT.number':
			case 'INPUT.password':
			case 'INPUT.range':
			case 'INPUT.search':
			case 'INPUT.tel':
			case 'INPUT.text':
			case 'INPUT.time':
			case 'INPUT.url':
			case 'INPUT.week':
			case 'TEXTAREA._':
				elem.val(val.value);
				break;

			case 'INPUT.checkbox':
				elem.prop('checked', val.value);
				break;

			case 'SELECT._':
				// todo: ok with just index? or match value of <option>?
				elem.prop('selectedIndex', val.value);
				break;

			case 'INPUT.radio':
				// todo: actually complicated(!)
				// this method requires an explicit id for each button. Cumbersome, but maybe ok?
				elem.prop('checked', val.value);
				break;

			default:
				console.warn('blq.remember.update/set: unsupported element type:', type);
				break;
		} else {
			console.warn('blq.remember update/set: trying to set value on an element type different from the stored.', elem, ':', val);
		}
	});
};


return remember;

});
