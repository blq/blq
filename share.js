/**
 * thin wrapper around navigator.share API and plain mail-to-window fallback
 */
define(['blq/email'], function(email) {

var api = {};

/**
 * ! must be triggered via user action!
 * @param {string} title
 * @param {string} text
 * @param {string} url
 * @return {!Promise} // can ignore I guess
 */
api.share = function(title, text, url) {
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
			console.log('Error sharing', error);
			throw error;
		});
	} else {

		return new Promise((res, rej) => {
			// desktop probably => at least help with a mail and the url
			var w = window.open(
				email.createEmailUrl({
					email: '', // has to fill in mail himself
					subject: title,
					body: text + ' ' + url
				})
			);
			w.onload = function() {
				res(); // return what?
			};
		});

	}
};


return api;

});