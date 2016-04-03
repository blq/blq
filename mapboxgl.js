
define([], function() {

// namespace/export
var api = {};

/**
 * cached.
 * see the requirejs shim for exact urls and version nr. (todo: ? no version info available when loaded?)
 * @return {!Promise}
 */
api.loadMapBoxScript = function() { // or just loadScript() ?
	// return new Promise(require.bind(undefined, ['mapboxgl', 'css!mapboxgl'])); // works, but slightly too terse I guess..

	return new Promise(function(resolve, reject) {
		// ! must load using requirejs since mapbox recognizes it and switches to amd mode!
		require(['mapboxgl', 'css!mapboxgl'], resolve, reject);
	});
};

/**
 * todo: coolest would of course be to use mapbox _inside_ the same webgl scene!
 * todo: hook the vr-controller to rotate&pitch :)
 * @see https://www.mapbox.com/mapbox-gl-js/api/
 * @return {!Promise} map instance
 */
api.createMapBoxGL = function(container, center, opt) {
	opt = $.extend({
		accessToken: null,

		style: 'mapbox://styles/mapbox/streets-v8', // 'mapbox://styles/mapbox/dark-v8'
		zoom: 11,
		bearing: 0,
		pitch: 0,

		showMarker: false // todo: drop this
	}, opt);

	return api.loadMapBoxScript()
		.then(function(mapboxgl) {
			// todo: hmm, should we maybe force expose the 'mapboxgl' namespace? otherwise external code can't access the API..

			mapboxgl.accessToken = opt.accessToken;

			var map = new mapboxgl.Map({
				container: container, // todo: overload on jQuery input?
				style: opt.style,
				center: center,
				zoom: opt.zoom,
				//
				bearing: opt.bearing,
				pitch: opt.pitch // todo: odd that no UI or gesture exists for pitch? (todo: write our own! two-finger vertical drag)
			});

			map.addControl(new mapboxgl.Navigation({ position: 'top-left' }));

			return map;
		})
		.then(function(map) {
			return new Promise(function(resolve, reject) {
				map.on('style.load', function() {
					resolve(map);
				});
			});
		})
		.then(function(map) {
			// ehh, no easy way to add a marker yet!?.. @see https://github.com/mapbox/mapbox-gl-js/issues/656
			// todo: expose as separate fn. todo: events?
			if (opt.showMarker) {
				//  map.on('style.load', function() { // alreay done previous step (might not be totally optimal, some operations works without this(?))

					// todo: or use mapboxgl.GeoJSONSource ?
					map.addSource("markers", {
						"type": "geojson",
						"data": {
							"type": "Feature",
							"geometry": {
								"type": "Point",
								"coordinates": center
							},
							"properties": {
								"title": "You are Here!", // todo: append lat/lon?
								"marker-color": "#63b6e5",
								"marker-size": "large",
								// @see https://www.mapbox.com/maki/
								"marker-symbol": "marker"
							}
						}
					});

					map.addLayer({
						"id": "markers",
						"type": "symbol",
						"source": "markers",
						"layout": {
							"icon-image": "{marker-symbol}-15",
							"text-field": "{title}",
							"text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
							"text-offset": [0, 0.6],
							"text-anchor": "top"
						}
					});

				// });
			}

			return map;
		});
};

// // todo:
// api.addMapBoxGLMarker = function(map, marker) {
//
// };
//

return api;

});
