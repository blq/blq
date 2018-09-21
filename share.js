/**
 * thin wrapper around navigator.share API and plain mail-to-window fallback
 *
 * todo: hooks for explict shares to Facebook, Twitter etc
 * (could even go all the way to a popup dialog? see for example Google Photos etc)
 *
 */
define(['blq/email'], function(email) {

var api = {};

/**
 * ! must be triggered via user action! (i.e a click)
 * ! can only be used on https domain
 * @param {string} title
 * @param {string} text
 * @param {string=} url
 * // todo: option to set preferred fallback?
 * @return {!Promise} // can ignore I guess
 */
api.share = function(title, text, url) {
	// https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
	// https://developers.google.com/web/updates/2016/09/navigator-share
	// http://caniuse.com/#feat=web-share (Chrome for Android now basically)
	if (navigator.share) {
		return navigator.share({
			title: title,
			text: text,
			url: url
		})
		.then((ret) => {
			console.debug('Successful share');
			return ret;
		})
		.catch((error) => {
			console.error('Error sharing:', error);
			throw error;
		});
	} else {

		return new Promise((res, rej) => {
			// desktop probably => at least help with a mail and the url

			// todo: hmm, possible to support different app-uri?
			// todo: or use service's API:s directly
			// https://www.facebook.com/sharer/sharer.php API
			// https://twitter.com/intent/tweet?text
			// https://www.pinterest.se/pin/create/button/?url
			// ...

			var w = window.open(
				email.createEmailUrl({
					email: '', // has to fill in mail himself
					subject: title,
					body: text + ' ' + url
				})
			);
			w.onload = function() {
				res(); // return what? (the share API returns empty(?))
			};
		});

	}
};


return api;

});