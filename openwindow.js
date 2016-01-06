/**
 * @fileoverview
 * helper for window.open(..)
 *
 * @see https://developer.mozilla.org/en/docs/DOM/window.open
 * @see http://www.w3schools.com/jsref/met_win_open.asp
 *
 * @author Fredrik Blomqvist
 */

define(['jquery', 'MochiKit/Base'], function($) {

// namespace
var blq = {};

 /**
 * todo: onLoad/onClose/onError callbacks? (can hook to returned window of course). often you want to start writing etc to window before loaded though!
 * todo: support 'replace' flag?
 * todo: help with setting querystring args?
 * todo: fit-to-content flag?
 * todo: do we need the url with hash # fix? (Chrome (still!) can't immediately pan to a #, only after a (delayed) second "push" using win.location = win.location after win loaded..)
 * todo: helper for setting up postMessage communication with new window?
 *
 * todo: option to use dom.getScrollbarWidth() to add margin to avoid scrollbars? (options.fitToContent? noVerticalScroll? or such)
 *
 * note that same title/name will refresh/replace a previously opened win!
 *
 * @param {string=} url
 * @param {string=} title. used as Name AND title.
 		I.e Not same as the plain 2nd 'name' arg! I'd say this is more what you want in practice.
 		Also note cannot set title for cross-domain windows.
 * @param {Object=} [options] resembles 3rd arg to window.open() (todo: support more of our own custom options here? needs manual separating though..)
 * @param {Window=} [optWin=window]
 * @return {Window} null return probably means it was stopped by a popup-blocker (todo: or return a promise onload?)
 */
blq.openWindow = function(url, title, options, optWin) {
	// todo: perhaps help with transforming boolean->1/0 (or 'yes'/'no') ?
	var winSettings = $.extend({
		width: 400,
		height: 300,
		// todo: set left/right to something close to the origin control?
		// Chrome seems to ignore these (security I assume?)
		menubar: 0,
		status: 0,
		titlebar: 1//,
		//scrollbars: 0
	}, options);

	var strWinSettings = MochiKit.Base.map(
		function(item) { return item[0]+'='+item[1]; },
		MochiKit.Base.items(winSettings)
	).join(',');
	console.debug('Opening window "%s" with args: "%s"', url, strWinSettings);

	var srcWin = optWin || window;
	var win = srcWin.open(url, title, strWinSettings);
	if (win == null) {
		console.error('Open window "%s" failed. Probably popup-blocker', url);
		return null;
	}
	if (win.document) { // if no document probably cross-domain
		win.document.title = title;
	}

	// note1: this isn't fired if no content/url set.
	// note2: doesn't fire for cross-domain page (instead can throw apparently.. see below)
	// note3: if opening/updating a second window (same name) this will not trigger second time.
	try {
		$(win).one('load._blq', function() {
		 	console.debug('window loaded');
		 	// todo: optional callback/promise trigger!

			// a Chrome bug makes section hash (#) links fail.
			// seems we need both re-setting url _and_ do it after a delay for it to work.
			// similar issue here: http://stackoverflow.com/questions/10654244/chrome-bug-or-coding-error-anchor-id-links-within-destination-page-not-working
			// todo: doesn't seem to be an issue in newer Chrome 18+ (probably fixed even earlier) -> drop this?
			// no? even Chrome 32 scrolls incorrectly sometimes!
			if (win.location.hash != '') {
				setTimeout(function() {
					win.location = w.inlocation;  // don't use url-string to handle possible forwarding
					w = null;
					// todo: onLoad(win);
				}, 80);
			} else {
				// todo: onLoad(win);
			}
		});
	} catch(ex) {
		// todo: ? if opening a cross-domain window with same url/name for the _second_ time this
		// throws: "TypeError: Cannot set property 'toJSON' of undefined" ?? (in Chrome at least)
		// todo: report to jQuery? ok if it doesn't fire but shouldn't trigger low-level exception I'd say
		console.error('open window "onload" event exception:', ex);
		// todo: onError(ex);
	}

	// bind lifetime to parent window since this is almost always what we want
	// todo: optional? (almost same a the "dependent" flag. though that flag seems only for very old firefox browser and to be deprecated..)
	$(srcWin).one('unload._blq', function() {
		// don't think we need to check win.closed?
		console.debug('closing child window: "%s"', url);
		// todo: onClose(win); // hmm, perhaps allow callback to cancel close based on return val!?
		win.close();
	});

	return win;
};


return blq;

});
