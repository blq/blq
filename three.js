/**
 * Three.js utils
 */

define([
	// assumes three.js is loaded
], function() {

// namespace/export
var api = {};


//(wrap in factory to avoid load-time dep on THREE)
api.getDummyTexture = function() {
	/**
	 * minimal black texture, typically to be used as a intermittent placeholder during swaps.
	 * todo: make static, singleton?
	 * @constructor
	 */
	var DummyTexture = function() {
		var img = new Image();
		img.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='; // 1x1 black gif
		// todo: could also simply set this as default at startup?
		// THREE.Texture.DEFAULT_IMAGE = img;

		THREE.Texture.call(this, img);
		this.name = '_dummy_texture';

		// set to "cheapest"
		this.generateMipmaps = false;
		this.magFilter = this.minFilter = THREE.NearestFilter;
		this.format = THREE.RGBFormat;
		// this.flipY = false;
	};
	// inherit
	DummyTexture.prototype = Object.create(THREE.Texture.prototype);
	DummyTexture.prototype.constructor = DummyTexture;

	return new DummyTexture();
};


/**
 * for use when you want the real load/err confirmation
 * todo: hmm, or use dummy-texture-pattern instead? (and by synchronous)
 * @param {string} url
 * @return {!Promise}
 */
api.loadTexture = function(url) {
	var loader = new THREE.TextureLoader(); // todo: should we bother caching this?
	return new Promise(function(resolve, reject) {
		var texture = loader.load(url,
			function onload() {
				resolve(texture);
			},
			function onprogress_nop() {},
			function onerror(err) {
				reject(err);
			}
		);
	});
};



return api;

});
