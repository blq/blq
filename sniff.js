/**
 * @fileoverview
 * Various detection and sniffing functions
 *
 * @author Fredrik Blomqvist
 *
 */
define([], function() {

// namespace
var sniff = {};

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
	// todo: check check in webvr boilerplate?
	return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};


/**
 * todo: in Android homescreen manifest could manually add "?homescreen=true" in qs and use that as detection
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

	// todo: does this work now?
	// return document.fullscreen || document.mozFullScreen || document.webkitIsFullScreen || document.msFullscreenElement || false;
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
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Geolocation
 * @return {boolean}
 */
sniff.hasGeolocation = function() {
	// ! subtle.. @see https://github.com/Leaflet/Leaflet/issues/3404
	return 'geolocation' in navigator;
};

/**
 * todo: or change this method to tristate? maybe/pending state before user has agree or not?
 * @return {boolean}
 */
sniff.canUseGeolocation = function() {
	// todo: add permissions check also? (Permissions API is asynchronous though..)
	// secure domain is new requirement in Chrome since v50
	return sniff.hasGeolocation() && sniff.isSecureDomain();
};


/**
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols
 * @return {boolean}
 */
sniff.hasES6Iterator = function() {
	// yes, typeof Symbol.iterator == 'symbol'. But skip that to allow polyfilling and avoid possible warning/err in litners/closure.
	return typeof Symbol == 'function' && typeof Symbol.iterator != 'undefined';
};


// sniff.isPortrait = function() {
// 	return window.innerHeight > window.innerWidth;
// };

/**
 * @return {boolean} silently returns false if orientation is not available (i.e desktop)
 */
sniff.isLandscape = function() {
	// todo: or use: window.screen.orientation ?
	return typeof window.orientation != 'undefined' ? (window.orientation == 90 || window.orientation == -90) : false;
};


/**
 * basically https or localhost pass.
 * typically a prerequisite for using webrtc stuff on Chrome (geolocation, webcam etc)
 * @return {boolean}
 */
sniff.isSecureDomain = function() {
	return location.protocol == 'https:' || location.host.toLowerCase().startsWith('localhost');
};


/**
 * @return {boolean}
 */
sniff.isRetinaDisplay = function() {
	return (window.devicePixelRatio || (window.screen.deviceXDPI / window.screen.logicalXDPI)) > 1;
};


/**
 * @return {boolean}
 */
sniff.hasTouch = function() {
	return !!window.touch;
};

/**
 * @return {boolean}
 */
sniff.hasServiceWorkers = function() {
	return 'serviceWorker' in navigator;
};


return sniff;

});
