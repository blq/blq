/**
 * @fileoverview
 * Dynamic loader and simple wrapper for Mapbox GL
 *
 * @see https://www.mapbox.com/mapbox-gl-js/api/
 * @see https://github.com/mapbox/mapbox-gl-js
 * At time of writing v0.34.0
 *
 * @author Fredrik Blomqvist
 *
 */
define([], function() {

// namespace/export
var api = {};

/**
 * dynamic loading of script and CSS.
 * cached.
 * see the requirejs shim for exact urls and version nr. (todo: ? no version info available when loaded?)
 * @return {!Promise}
 */
api.loadMapBoxScript = function() { // or just loadScript() ?
	return new Promise(function(resolve, reject) {
		// ! must load using requirejs since mapbox recognizes it and switches to amd mode anyway
		require(['mapboxgl', 'css!mapboxgl'],
			function(mapboxgl) {
				console.log('Mapbox GL version:', mapboxgl.version);
				// ! expose namespace globally (as if not using require).
				// (not practical to use the API if only pass-around access I'd say)
				window.mapboxgl = mapboxgl;
				resolve(mapboxgl);
			},
			reject
		);
	});
};

/**
 * todo: coolest would of course be to use mapbox _inside_ the same webgl scene!
 * todo: hook the vr-controller to rotate&pitch :)
 *
 * @see https://www.mapbox.com/mapbox-gl-js/api/
 *
 * @return {!Promise} map instance
 */
api.createMapBoxGL = function(container, center, opt) {
	opt = Object.assign({
		accessToken: null,

		style: 'mapbox://styles/mapbox/streets-v9', // 'mapbox://styles/mapbox/dark-v9' // todo: can append "&optimize=true"
		zoom: 11,
		bearing: 0,
		pitch: 0,
		keyboard: false,

		showNavigation: true,
		showGeolocation: true, // needs https domain
		showScale: true,
		showFullscreen: false
	}, opt);

	return api.loadMapBoxScript()
		.then(function(mapboxgl) {
			mapboxgl.accessToken = opt.accessToken;

			return new mapboxgl.Map({
				container: container, // todo: overload on jQuery input?
				style: opt.style,
				center: center,
				zoom: opt.zoom,
				keyboard: opt.keyboard,
				//
				bearing: opt.bearing,
				pitch: opt.pitch // todo: odd that gesture exists for pitch? (todo: write our own! two-finger vertical drag)
			});
		})
		.then(function(map) {

			if (opt.showNavigation) {
				map.addControl(new mapboxgl.NavigationControl(), 'top-left');
			}
			// todo: also use: sniff.hasGeolocation() && sniff.isSecureDomain()
			if (opt.showGeolocation) {
				// note that geolocation button apparently resets the pitch
				map.addControl(new mapboxgl.GeolocateControl(), 'top-right');
			}
			if (opt.showScale) {
				map.addControl(new mapboxgl.ScaleControl(), 'bottom-left');
			}
			if (opt.showFullscreen) {
				map.addControl(new mapboxgl.FullscreenControl(), 'bottom-right');
			}

			return map;
		})
		.then(function(map) {
			return new Promise(function(resolve, reject) {
				// necessary?
				map.on('style.load', function() {
					resolve(map);
				});
				// todo: timeout/error -> reject()
			});
		});
};


return api;

});
