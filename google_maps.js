/**
 * @fileoverview
 * Google Maps API utils
 * @see https://developers.google.com/maps/documentation/javascript/
 *
 * @author Fredrik Blomqvist
 */
define([], function() {

var api = {};

/**
 * @param {string} key (yes, you Must use a key now) @see https://developers.google.com/maps/documentation/javascript/get-api-key
 * todo: support a premium 'client' key also
 * todo: expose more args
 * @return {!Promise} receives the 'google.maps' api/namespace
 */
api.loadGoogleMaps = function(key) {
	return new Promise(function(resolve, reject) {
		// must sniff also since we're using the API-ready callback and not the requirejs log.
		// todo: ..still not 100%. calling this during pending (i.e before the API-ready is a race)
		// -> must basically keep our own registry of pending and loaded google urls..
		if (typeof google != 'undefined' && typeof google.maps != 'undefined') {
			resolve(google.maps);
			return;
		}

		// todo: generate a UID? (or not? don't want to load twice even if race?)
		window._blq_googleMapsReady = function() {
			delete window._blq_googleMapsReady;
			console.log('Google Maps v:', google.maps.version, 'loaded');
			resolve(google.maps);
		};
		// todo: not sure we can use the global "gm_authFailure"? If it fires, it fires loong _after_ API-"success"..
		// todo: expose version nr, language etc (-> use a url builder)
		require(['https://maps.googleapis.com/maps/api/js?key=' + key + '&callback=_blq_googleMapsReady'],
			function() {
				console.debug('Google Maps base script loaded. Waiting for the API-ready callback..');
			},
			reject
		);
	});
};


/**
 * Create a layer from Google MyMaps, https://mymaps.google.com
 * You find the 'myMapId' as the '?mid=MyMapID' in the url of your MyMap.
 * (todo: maybe also allow the full url and extract ID here for convenience?)
 *
 * ! this URL/API is AFAIK not documented by Google. must assume it can fail or be shut down...
 *
 * @see http://stackoverflow.com/questions/29603652/google-maps-api-google-maps-engine-my-maps
 * @see https://productforums.google.com/forum/#!topic/maps/dXPmdgM4XwA
 * @see https://developers.google.com/maps/documentation/javascript/reference#KmlLayer
 *
 * example:
 *		var myMap = createGoogleMyMapsKMLLayer('1YglU7IxTI_xdJtGCPwljGoFWn-8');
 * 		myMap.setMap(my_google_map);
 *
 * @param {string} myMapId
 * @param {{forceKML: boolean=, preserveViewport: boolean=}=} options KMZ can include more icons etc but seems to fail on lines
 * @return {!google.maps.KmlLayer}
 */
api.createGoogleMyMapsKMLLayer = function(myMapId, options) {
	options = Object.assign({
		preserveViewport: true, // odd that this is false by default
		forceKML: true // KMZ is default (can show more icons etc but fails on lines that work in KML!)
	}, options);
	// extract flag since not part of KMLLayer options
	var forceKML = options.forceKML; delete options.forceKML;

	// (can't fetch these urls ourselves, Google uses an internal helper-proxy to grab them)
	// ** beware! this URL/API is AFAIK not documented by Google! must assume it can fail or be shut down.. **
	var url = 'https://www.google.com/maps/d/kml?mid=' + myMapId + (forceKML ? '&forcekml=1' : '');
	return new google.maps.KmlLayer(url, options); // seems you can set url either as first arg or as 'url' property
};


return api;

});
