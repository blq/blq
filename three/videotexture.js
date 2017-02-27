/**
 * very similar to THREE's, but better teardown - the update runs forever otherwise!
 * todo: *still* some case when webgl claims "no video" _after_ teardown...
 *
 * @author Fredrik Blomqvist
 */

define(['three.js/three'], function(THREE) {

var api = {};

/**
 * @constructor
 */
api.VideoTexture = function ( video, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy ) {

	THREE.Texture.call( this, video, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy );

	this.generateMipmaps = false;

	// must set filters to nearest or linear (bug in THREE.VideoTexture?)
	if (this.magFilter != THREE.LinearFilter && this.magFilter != THREE.NearestFilter) {
		// this.magFilter = THREE.LinearFilter;
		this.magFilter = THREE.NearestFilter;
	}
	// ! THREE.Texture sets this to LinearMipMapLinearFilter -> error
	if (this.minFilter != THREE.LinearFilter && this.minFilter != THREE.NearestFilter) {
		// this.minFilter = THREE.LinearFilter;
		this.minFilter = THREE.NearestFilter;
	}

	// // ?
	// this.wrapS = THREE.ClampToEdgeWrapping;
	// this.wrapT = THREE.ClampToEdgeWrapping;

	var scope = this;

	var req = null;

	function update() {

		req = requestAnimationFrame( update );

	//	if ( video.readyState === video.HAVE_ENOUGH_DATA ) {
		if ( video.readyState >= video.HAVE_CURRENT_DATA ) {

			scope.needsUpdate = true;

		}

	}

	function teardown(e) {
		cancelAnimationFrame(req);
		scope.removeEventListener(teardown); // listen once
		// todo: make this opt-out? (maybe if you like to keep video)
		video.pause();
		video.src = ''; // help GC?
		// video.load() ?
		// delete scope.image; // ?
		console.debug('blq.VideoTexture disposed:', e);
	}

	this.addEventListener('dispose', teardown); // == arks.listenOnce()

	// todo: expose .pause() and .play() methods?

	update();

};

api.VideoTexture.prototype = Object.create( THREE.Texture.prototype );
api.VideoTexture.prototype.constructor = api.VideoTexture;


/**
 * factory for url
 * todo: support fallback formats?
 * @return {!Promise}
 */
api.createVideoTexture = function(url, options) {
	options = Object.assign({
		autoplay: true,
		loop: true,
		muted: false,
		skipDispose: false, // if you want to handle teardown yourself (or reuse probably)

		width: 640,
		height: 480
	}, options);

	// todo: extract this as a separate factory?
	return new Promise(function(resolve, reject) {
		var video = document.createElement('video');

		video.width	= options.width;
		video.height = options.height;

		video.loop = options.loop;
		video.autoplay = options.autoplay; // todo: double-check this is correct. If not applied video can be extreemely slow in Chrome(!) (bug??)
		video.muted = options.muted;

		video.onloadeddata = function(e) {
			// todo: check if dim are ok? (see webcamtexture) -> onloadedmetadata event!
			video.onloadeddata = video.onerror = null;
			resolve(video);
		};
		video.onerror = function(err) {
			console.error('Create VideoTexture failed:', err);
			video.onerror = video.onloadeddata = null;
			reject(err);
		};

		video.src = url;
		video.play(); // ! needed on Chrome Android (autoplay + muted=true should autplay though)

	}).then(function(video) {
		// var texture = new THREE.VideoTexture(video);
		var texture = new api.VideoTexture(video); // our own!

		// done in api.VideoTexture now
		// if (!options.skipDispose) {
		// 	arks.listenOnce(texture, 'dispose', function() {
		// 		video.pause();
		// 		video.src = '';
		// 		// video.load(); // ! (?)
		// 	});
		// }

		return texture;
	});
};

return api;

});
