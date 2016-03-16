/**
 *
 * @author Fredrik Blomqvist
 *
 */
define(['blq/assert', 'jquery', 'blq/dom', 'blq/openwindow'], function(assert, $, dom, openwin) {

// namespace
var media = {};

/**
 * @param {!(HTMLVideoElement|jQuerySelector)} video
 * @return {!HTMLCanvasElement}
 */
media._grabVideoSnapshot = function(video) {
	assert(video != null);

	var vid = $(video).get(0);

	var src = document.createElement('canvas') ;
	src.width = vid.videoWidth;
	src.height = vid.videoHeight;

	var ctx = src.getContext('2d');
	ctx.drawImage(vid, 0, 0);

	return src;
};


/**
 * @param {!(HTMLVideoElement|HTMLImageElement|HTMLCanvasElement|jQuerySelector)} source
 * @return {string}
 */
media.toDataUrl = function(source) {
	assert(source != null);

	source = $(source).get(0);
    var canvas = document.createElement('canvas');
    canvas.width = source.videoWidth || source.width;
    canvas.height = source.videoHeight || source.height;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(source, 0, 0);
    return canvas.toDataURL();
};



/**
 * based on @see http://stackoverflow.com/questions/934012/get-image-data-in-javascript
 * doesn't work for extenal images unless they have crossOrigin='' (or'Anonymous'?) set (and the site supports CORS)
 * @see canvas lib also imageToImageData()
 *
 * @param {!Image} img
 * @return {string} data URI
 */
media.getBase64Image = function(img) {
	assert(img != null);

    // create an empty canvas element
    var canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    // copy the image contents to the canvas
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // get the data-URL formatted image
    // Firefox supports PNG and JPEG. You could check img.src to
    // guess the original format, but be aware the using "image/jpg"
    // will re-encode the image.
    var dataURL = canvas.toDataURL('image/png');

    return dataURL.replace(/^data:image\/(png|jpg);base64,/, '');
};


/**
 * @param {!HTMLCanvasElement|jQuerySelector} canvas
 * @param {string=} [title]
 * @return {!Window}
 */
media._openScreenshotWindow = function(canvas, title) {
	assert(canvas != null);

	canvas = $(canvas).get(0);
	var imgUrl = canvas.toDataURL(); // basically always .png (?), only some browsers support 'image/jpeg' etc.

	// todo: could also create an img and set src to the url. test which is best!
	var margin = dom.getScrollbarWidth(); // seems we almost always have to add some extra margin to avoid scrollbars..
	return openwin.openWindow(imgUrl, title || 'toDataURL() image', {
		width: canvas.width + margin,
		height: canvas.height + margin
	});
};


/**
 * Open a save-as image download link based on the canvas or video target element
 * (Only works in Chrome?)
 * @param {HTMLCanvasElement|HTMLVideoElement|jQuerySelector} canvasOrVideo
 * @param {string=} [name]
 * @param {string=} [format='image/png'] 'image/jpeg' doesn't seem to work(?)
 * @return {!HTMLLinkElement} probably don't need this, use-case is to open immediately
 */
media.grabSnapShotLink = function(canvasOrVideo, name, format) {
	assert(canvasOrVideo != null);
	name = name || (document.title + '_screenshot'); // user can still change in save-as-window // todo: append date?
	assert(typeof name == 'string');

	var elem = $(canvasOrVideo).get(0);
	var url = elem.toDataURL(format /*| 'image/png'*/); // .png seems to be default, non changeable, in Chrome at least

	var a = document.createElement('a');
	a.href = url;
	a.download = name; // (setting this with a jQuery elem create doesn't seem to work, thus plain DOM)
	a.click(); // todo: make optional?
	return a;
};


/**
 * @see blq.grabSnapShotLink
 */
media._grabVideoSnapshotLink = function(video, name, format) {
	media.grabSnapShotLink(media._grabVideoSnapshot(video), name, format);
};


/**
 * enables preserveDrawingBuffer by default also
 * todo: add options?
 * todo: move to separate webgl.js ?
 * @param {!HTMLCanvasElement} canvas // todo: allow jQuerySelector?
 * @return {!Object} // not sure which closure type maps to (context objects doesn't seem to have a base interface either?)
 */
media.getWebGLContex = function(canvas) {
	assert(canvas != null);

	var gl = null;
	try {
		gl = canvas.getContext('webgl', { preserveDrawingBuffer: true }) || canvas.getContext('experimental-webgl', { preserveDrawingBuffer: true });
		// necessary? or optional?
	//	gl.viewportWidth = canvas.width;
	//	gl.viewportHeight = canvas.height;
	} catch(e) {
		console.error('Error getting WebGL context:', e);
	}
	if (gl == null) {
		console.error('Unable to initialize WebGL. Your browser may not support it.');
	}
	return gl;
};


return media;

});
