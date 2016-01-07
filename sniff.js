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


/**
 * todo: in android homescreen manifest could manually add "?homescreen=true" in qs and use that as detection
 * @return {boolean}
 */
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


/**
 * todo: more tests in mobiles
 * @see also https://github.com/bdougherty/BigScreen
 *
 * @param {Window=} [win=window]
 * @return {boolean}
 */
sniff.isFullScreen = function(win) {
	win = win || window;
	// http://stackoverflow.com/questions/2863351/checking-if-browser-is-in-fullscreen
	// http://stackoverflow.com/questions/1047319/detecting-if-a-browser-is-in-full-screen-mode
	// 'window.fullScreen' only in Firefox

	// todo: does this need some 1-pixel tolerance margin or such maybe?
	return typeof win.fullScreen == 'boolean' ? win.fullScreen : (win.innerWidth == screen.width && win.innerHeight == screen.height);
};


/**
 * @see http://caniuse.com/#search=cors
 * doesn't care about IE (i.e now basically only for older Android)
 * @return {boolean}
 */
sniff.hasCORS = function() {
	return window.XMLHttpRequest && 'withCredentials' in new window.XMLHttpRequest;
};

/**
 * @return {boolean}
 */
sniff.hasGeolocation = function() {
	// ! subtle.. @see https://github.com/Leaflet/Leaflet/issues/3404
	return 'geolocation' in navigator;
};


return sniff;

});
