/**
 * @fileoverview
 * Various detection and sniffing functions
 *
 * @author Fredrik Blomqvist
 *
 */
define([], function() {

/**
 * Detect if we are running in a browser context
 * @return {boolean}
 */
sniff.isBrowser = function() {
	return !(typeof window === 'undefined' || !window.navigator);
};


/**
 * not ideal sniff but sometimes needed...
 * Should strive to use CSS like: "@media only screen and (max-width: 760px) { ... }" styling.
 * @return {boolean}
 */
sniff.isMobileBrowser = function() {
	return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};


// todo: in android homescreen manifest add "?homescreen=true" in qs
sniff.isHomeScreenApp = function() {
	// only IOS!
	return !!navigator.standalone; // todo: check url
};

/**
 * are we running in NodeJS ?
 * @return {boolean}
 */
sniff.isNodeJS = function() {
	return typeof process != 'undefined' && !process.browser;
};


return sniff;

});
