/**
 * @fileoverview
 * hmm, freebase is dead now.. :(
 *
 */
define(['assert', 'jquery'], function(assert, $) {

/**
 * @deprecated Freebase shuts down.. https://plus.google.com/109936836907132434202/posts/bu3z2wVqcQc
 */
var freebase = {
	// must be https
	// @see also https://www.googleapis.com/freebase/v1sandbox/search
	url: 'https://www.googleapis.com/freebase/v1/search',

	// @see https://code.google.com/apis/console
	api_key: 'AIzaSyAxdANerJkYyUy3PJzi0CN_Zu8v_Ih-Qko'
};

/**
 * @deprecated !
 * todo/note: this is not MQL (needs oauth)
 * @param {string} query
 * ..
 * @return {!Promise}
 */
freebase.query = function(query, options) {
	assert(query != null);

	return Promise.resolve($.ajax(freebase.url, {
		data: {
			query: query,
			key: freebase.api_key
		}
	}));
};


return freebase;

});
