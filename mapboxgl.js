/**
 * @fileoverview
 * Dynamic loader and simple wrapper for Mapbox GL
 *
 * @see https://www.mapbox.com/mapbox-gl-js/api/
 * @see https://github.com/mapbox/mapbox-gl-js
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
 * see the requirejs shim for exact urls and version nr.
 * @return {!Promise}
 */
api.loadMapBoxScript = function() { // or just loadScript() ?
	return new Promise(function(resolve, reject) {
		// ! must load using requirejs since mapbox recognizes it and switches to AMD mode anyway
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

		style: 'mapbox://styles/mapbox/streets-v11', // 'mapbox://styles/mapbox/dark-v9' // todo: can append "&optimize=true"
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
				// https://www.mapbox.com/mapbox-gl-js/api/#navigationcontrol
				map.addControl(new mapboxgl.NavigationControl({
					showZoom: true,
					showCompass: true
				}), 'top-left');
			}

			// todo: also use: sniff.hasGeolocation() && sniff.isSecureDomain()
			if (opt.showGeolocation) {
				// https://www.mapbox.com/mapbox-gl-js/api/#geolocatecontrol
				// note that geolocation button apparently resets the pitch
				var geolocateControl = new mapboxgl.GeolocateControl({
					showUserLocation: true,
					trackUserLocation: true,
					positionOptions: {
						enableHighAccuracy: true
					}
				});
				// todo: in tracking mode we can watch this one too so can move with it for example
				geolocateControl.on('error', function(pe) {
					alert('Geolocation error: ' + JSON.stringify(pe));
				});
				map.addControl(geolocateControl, 'top-right');
			}

			if (opt.showScale) {
				// https://www.mapbox.com/mapbox-gl-js/api/#scalecontrol
				map.addControl(new mapboxgl.ScaleControl({
					unit: 'metric' // 'imperial', 'nautical'
				}), 'bottom-left');
			}

			if (opt.showFullscreen) {
				// https://www.mapbox.com/mapbox-gl-js/api/#fullscreencontrol
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
