/**
 * @fileoverview
 * form related helpers
 *
 * @author Fredrik Blomqvist
 *
 */
 
define(['blq/assert', 'jquery', 'jquery.serialize-object'], function(assert, $) {

// namespace
var form = {};

/**
 * helper for hooking up form-submits without post and grabbing data as json.
 * if callback returns a Promise the submit-button is disabled until resolved to avoid double commits.
 *
 * Implicitly assumes the json form parser 'jquery.serialize-object.js' to be included. "jquery.serializejson.json" would also work I guess.
 * @see https://github.com/macek/jquery-serialize-object or https://github.com/marioizquierdo/jquery.serializeJSON
 *
 * Will not handle <file>!
 * todo: detach functionality? (simply "$(formSelector).off('.blq_onSubmitJSON');" )
 *
 * @param {HTMLFormElement|jQuerySelector|string} formSelector (attached as delegated event if formSelector is a string)
 * @param {function(Object, Event)} callback receives the form-data as a JSON-object, 2nd arg the submit-event. "this" will be the form. If the callback returns a Promise the form is blocked until it is resolved.
 * @param {boolean=} [block=true] block another submit, if callback returned a Promise, until resolved.
 * .. return something?
 */
form.onSubmitJSON = function(formSelector, callback, block) {
	assert(formSelector != null);
	assert(typeof callback == 'function');
	block = typeof block == 'boolean' ? block : true;

	/** @this {HTMLFormElement} */
	var _callback = function(e) {
		e.preventDefault();

		// @see https://github.com/macek/jquery-serialize-object for format description
		var data = $(this).serializeObject();
		// alternatively using other lib:
		// @see https://github.com/marioizquierdo/jquery.serializeJSON
		// var data = $(this).serializeJSON();
		// todo: sniff which lib? or just take more optional params..

		var ret = callback.call(this, data, e);
		// if callback returns a promise then we help out by disabling the
		// submit-button until it resolves. (todo: check if this is enough for enter-key-press?)
		// todo: also disable all input-fields? (as in blq.disableForm())
		if (block && ret != null && typeof ret.then == 'function') {
			var submitter = $(this).find('[type=submit]:enabled'); // if already disabled we skip
			if (submitter.length > 0) {
				console.debug('onSubmitJSON: callback returned Promise and enabled submit-button found -> disable until resolved');
				// todo: maybe also set the mouse-cursor to 'denied' or 'not-allowed'?
				submitter.prop('disabled', true);
				var enable = function() { submitter.prop('disabled', false); };
				ret.then(enable, enable);
			}
		}
	};

	// if (typeof formSelector == 'string') {
	// 	// delegated mode
	// 	// todo: option to specify root element?
	// 	$(document).on('submit.blq_onSubmitJSON', formSelector, _callback);
	// } else {
	// 	// direct mode
	// 	$(formSelector).on('submit.blq_onSubmitJSON', _callback);
	// }

	//--- alternative syntax
	// todo: can use blq.onMaybeDelegated() now
	var del = typeof formSelector == 'string';
	$(del ? document : formSelector).on('submit.blq_onSubmitJSON', del ? formSelector : null, _callback);
};

/**
 * @param {boolean=} [enable]
 */
form.toggleForm = function(form, enable) {
	// todo: handle actual toogle by reading state?
	$(form).find(':input, [type=submit]').prop('disabled', !enable);
	// todo: return form or new state?
};

form.disableForm = function(form) {
	form = $(form);
	form.find(':input, [type=submit]').prop('disabled', true);
	// test setting cursor also.
	// todo: hmm, or just use a class? (inject css)
	var btn = form.find('[type=submit]');
	btn.data('__cursor', btn.css('cursor'));
	btn.css('cursor', 'not-allowed');
	return form; // ok?
};

form.enableForm = function(form) {
	form = $(form);
	form.find(':input, [type=submit]').prop('disabled', false);
	// test setting cursor also.
	// todo: hmm, or just use a class? (inject css)
	var btn = form.find('[type=submit]');
	btn.css('cursor', btn.data('__cursor') || 'pointer');
	return form;
};


return form;

});
