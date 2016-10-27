/**
 *
 */
define(['blq/assert', 'jquery', 'MochiKit/Text'], function(assert, $) {

// namespace
var street = {};

/**
 * Grabs a Google Streetview scene as a six faced image cubemap.
 *
 * todo: support for map key (needed?)
 * todo: support custom angle? (fov, pitch)?
 *
 * @param {!LatLng} latlng
 * @param {Object=} [options]
 * @return {!{ left: string, front: string, right: string, back: string, top: string, down: string }} cubemap image urls
 */
street.getStreetviewImageCubeUrls = function(latlng, options) {
	assert(blq.isLatLngLike(latlng));

	// todo: more options, map key, initial angle etc
	options = $.extend({
		size: 256 // supports {w, h} also
	}, options);

	// overload on single value (most common to be square)
	// (todo: hmm, if we support rectangular we should support different fov and angle increments also..?)
	if (typeof options.size == 'number') {
		var d = options.size;
		options.size = { w: d, h: d };
	}

	// todo: force decimal point formatting?
	// todo: append this root url to result somehow?
	var fmt = 'https://maps.googleapis.com/maps/api/streetview?size={size.w}x{size.h}&location={pos.lat},{pos.lng}&heading={heading}&fov={fov}&pitch={pitch}&sensor=false';

	// todo: check conventions that other tools use (or allow to specify ordering? flips?)
	// todo: or rename north, west etc?
	var dirs = {
		left: { h: -90 },
		front: { h: 0 },
		right: { h: 90 },
		back: { h: 180 },
		top: { h: 0, p: -90 },
		bottom: { h: 0, p: 90 }
	};

	for (var side in dirs) {
		var url = format(fmt, {
			size: options.size,
			pos: latlng,
			heading: dirs[side].h,
			pitch: 0 || dirs[side].p,
			fov: 90
		});

		dirs[side] = url;
	}

	return dirs;
};

/**
 * @see getStreetviewImageCubeUrls
 * @param {!LatLng} latlng
 * @param {Object=} [options]
 * todo: (have to figure out if/when images are completely loaded some other way. i.e we don't return a promise!) onload event-hook.
 * @return {!{ left: !Image, front: !Image, right: !Image, back: !Image, top: !Image, down: !Image }} cubemap images
 */
street.getStreetviewImageCube = function(latlng, options) {
	var urls = street.getStreetviewImageCubeUrls(latlng, options);

	var images = {};
	for (var side in urls) {
		var img = new Image();
		img.src = urls[side];
		images[side] = img;
	}
	return images;
};


return street;

});
