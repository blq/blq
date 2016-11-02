/**
 * Web Notification.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Notification
 * http://caniuse.com/#feat=notifications
 *
 * @author Fredrik Blomqvist
 *
 */
define(['blq/assert', 'jquery'], function(assert, $) {

// namespace
var notif = {};

/**
 * Web Notification.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Notification
 * http://caniuse.com/#feat=notifications
 * Doesn't work in Android Chrome!
 *
 * Yes, you *must* bind this to an element the user *interactively* has to click!
 * callback receives string: 'granted', 'denied', 'default', 'unavailable' (last is our own!)
 *
 * todo: store-cache the result as a flag also?
 * // todo: wrap in a Promise instead/also? (can this be fired multiple times per session?)
 */
notif.enableNotifications = function(element, callback) {
	assert(element != null);
	assert(typeof callback == 'function');

	if (typeof Notification == 'undefined') // == 'function'?
		callback('unavailable');
	// todo: should be possible with other user-triggered events also. expose in options?
	$(element).on('click.blq_notification_permission', function() {
		Notification.requestPermission(callback);
	});
};


/**
 * Web Notification
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Notification
 * http://caniuse.com/#feat=notifications
 * Doesn't work in Android Chrome!
 *
 * todo: not quite ready. expose tags, callbacks etc
 * (observe that this is not an attempt at a polyfill or generic wrapper. just a thin helper)
 *
 * @param {string} title
 * @param {Object} body
 * @param {Object=} [options] specify icon etc
 * @return {!Notification}
 */
notif.showNotification = function(title, body, options) {
	assert(typeof Notification != 'undefined'); // todo: this is not enough detection..

	options = options || {};
	// todo: try-catch? wrap to a fallback?
	return new Notification(title, $.extend({
		body: body
	}, options));
};


return notif;

});
