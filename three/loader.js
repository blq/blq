/**
 * Helpers for THREE js model loaders.
 *
 * ..assumes loaders follow the naming convention.. :)
 * todo: option to try to guess format? 1) via extension. 2) by loading data and sniffing!
 *
 * @author Fredrik Blomqvist
 */
define(['blq/promise' /*three.js/three*/], function(bp) {

// namespace
var api = {};

/**
 * Dynamic factory for model loaders.
 * (Does not cache the instance though)
 *
 * @param {string} type note: this is Case Sensitive! should use same case as the constructor (naming convention)
 * @param {Object=} manager optional
 * @return {!Promise}
 */
api._getLoader = function(type, manager) {
	// sniff first (if THREE baked using other than requirejs)
	var klass = THREE[type+'Loader'];
	if (typeof klass == 'function') {
		return Promise.resolve(new klass(manager));
	}
	// (requirejs will cache the script)
	// ! naming convention between constructor and js-file coming up!
	// todo: maybe also/either use a registry? (couple of libs that don't fit..)
	return bp.requirePromise('three.js/loaders/'+type+'loader').then(function() {
		return new THREE[type+'Loader'](manager);
	});
};


/**
 * todo: or assume user binds the url to the loader?
 * todo: hmm, this is very similar to all the three loaders (material, texture etc)
 * @param {string} url
 * @param {!THREE.Loader} loader
 * @param {Function=} onProgress optional
 * @return {!Promise}
 */
api.loadPromise = function(url, loader, onProgress) {
	return new Promise(function(resolve, reject) {
		loader.load(url,
			resolve,
			function() {
				if (typeof onProgress == 'function')
					onProgress.apply(this, arguments);
			},
			reject
		);
	});
};


/**
 * todo: option flags to do compute normals, BS etc
 *
 * @param {string} type the type shorthand. i.e 'PLY' etc
 * @param {string} url
 * @return {!Promise}
 */
api.loadGeom = function(type, url, options) {
	options = Object.assign({
		computeFaceNormals: false,
		computeVertexNormals: false,
		computeBoundingSphere: false,
		computeBoundingBox: false
		// ...
	}, options);

	return api._getLoader(type)
		.then(api.loadPromise.bind(null, url))
		.then(function(geometry) {
			if (options.computeFaceNormals) {
				geometry.computeFaceNormals();
			}
			if (options.computeVertexNormals) {
				geometry.computeVertexNormals();
			}
			if (options.computeBoundingSphere) {
				geometry.computeBoundingSphere();
			}
			if (options.computeBoundingBox) {
				geometry.computeBoundingBox();
			}

			return geometry;
		});
};


/**
 * @param {string} url
 * @return {!Promise}
 */
api.loadPLY = api.loadGeom.bind(null, 'PLY');

// todo: pre-setup more loaders?


return api;

});
