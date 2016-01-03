/**
 * @fileoverview
 * XirSys authentication for STUN and TURN services.
 *
 * @author Fredrik Blomqvist
 *
 todo: check out more STUN sources:
   https://gist.github.com/zziuni/3741933
   http://stackoverflow.com/questions/20068944/webrtc-stun-stun-l-google-com19302
   http://numb.viagenie.ca/
   https://gist.github.com/yetithefoot/7592580
   https://plugin.temasys.com.sg/demo/samples/web/content/peerconnection/trickle-ice/index.html

   https://github.com/coturn/rfc5766-turn-server/
   http://www.creytiv.com/restund.html
   https://github.com/otalk/restund

   http://www.html5rocks.com/en/tutorials/webrtc/infrastructure/

	// todo: check the secure method of token retrieveal.
   https://github.com/xirdev/xsdk/tree/master/examples
*/
define(['blq/assert', 'jquery'], function(assert, $) {

// namespace
var xirsys = {};

// throws if invalid
xirsys._validateXirSysParams = function(params) {
	// todo: slightly more constraints actually, only letters, numbers or hyphens ("-")
	// todo: not really correct with "ideology" here. assert sould halt/undefined, not throw. change to that..
	// try {
		assert(typeof params.identity == 'string'); // todo: can be removed in secureTokenRetrieval mode(?)
		assert(params.identity.length >= 4);

		assert(typeof params.domain == 'string');
		assert(4 <= params.domain.length && params.domain.length <= 253);
		assert(params.domain.charAt(0) != '-' && params.domain.charAt(params.domain.length-1) != '-'); // (starts- and endsWith are not standard)
		var labels = params.domain.split('.');
		for (var i = 0; i < labels.length; ++i) {
			assert(labels[i].length <= 63);
		}

		assert(typeof params.application == 'string');
		assert(4 <= params.application.length && params.application.length <= 253);

		assert(typeof params.room == 'string');
		assert(4 <= params.room.length && params.room.length <= 253);

		assert(typeof params.secret == 'string');  // todo: can be removed in secureTokenRetrieval mode(?)
		assert(params.secret.length == 36); // ok? (and split in five '-' groups?)
	// } catch (e) {
	// 	return false;
	// }
	// return true;
};

/**
 * Call XirSys ICE servers to get Ice-servers, STUN and TURN and credential tokens.
 * @see https://xirsys.com/ sign up
 *
 * @param {!{ identity: string, domain: string, secret: string, application: string=, room: string= }} params
 * @return {!jQuery.Promise} auth config data (ice-servers etc). Can be passed directly to Peer.js constructor's 'config' arg.
 */
xirsys._getXirSysIceServerAuth = function(params) {
	assert(params != null);

	params = $.extend({
		// let these fallback to the most common defaults
		application: 'default',
		room: 'default'
	}, params);

	// (XirSys is CORS (XSS) enabled)
 	// @see http://xirsys.com/peerjs/
	// todo: can we cache this? (localStorage) hmm, No! XirSys says 10 seconds(!?)
	return $.Deferred().resolve()
		.then(function() {
			xirsys._validateXirSysParams(params);
		})
		.then(function() {
			return $.ajax({
				url: 'https://service.xirsys.com/ice',
				data: {
					ident: params.identity,
					domain: params.domain,
					application: params.application,
					room: params.room,
					secret: params.secret,
					secure: 1
				}
			});
		})
		.then(function(ret) {
			return ret.d; // == itemgetter('d')
		})
		// .resolve() // start
		.promise();


	// return $.ajax({
	// 	url: 'https://service.xirsys.com/ice',
	// 	data: {
	// 		ident: params.identity,
	// 		domain: params.domain,
	// 		application: params.application,
	// 		room: params.room,
	// 		secret: params.secret,
	// 		secure: 1
	// 	}
	// }).then(function(data) {
	// 	return data.d; // fwd only the actual config stuff
	// });
};

return xirsys;

});
