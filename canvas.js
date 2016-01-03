/**
 * canvas graphics utils - let reside globally for now!
 * todo: turn into an AMD module
 */

// define(['math'], function(math) {

// /** @const */
// var canvas = {};


function clearCanvas(ctx) { // todo: or take an optional color?
	ctx.save();
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	//ctx.clearRect(0, 0, ctx.canvas.width-1, ctx.canvas.height-1);
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.restore();
}

// clear canvas + flushes all stroke, fill setting etc
function resetCanvas(ctx) {
	ctx.canvas.width = ctx.canvas.width; // heh, apparently recommended way(!)
}

function putPixel(ctx, x, y) {
//	ctx.fillRect(x, y, 3, 3);
	ctx.fillRect(x, y, 1, 1);
}

/** @deprecated use math.radToDeg */
function degrees(radians) {
	return radians * 180 / Math.PI;
}

/** @deprecated use math.degToRad */
function radians(degrees) {
	return degrees * Math.PI / 180;
}

/** @deprecated use math.clamp */
function clamp(value, minValue, maxValue) {
	return Math.min(Math.max(minValue, value), maxValue);
}


// old-school wraparound-casts the values to 0..255 (think int/float->byte)
function cRGB(r, g, b) { // todo: alpha? call it cRGBA or count arguments? todo: allow arrays as input also?
	// could use old trick of doing a "& 255" instead (not sure it's noticeable today though..)
	// MochiKit.Color.toRGBString() does this also (but with clamping)
	return 'rgb(' + Math.round(r) % 256 + ',' + Math.round(g) % 256 + ',' + Math.round(b) % 256 + ')';
}

function cRGBA(r, g, b, a) {
	a = a || 1;
	return 'rgba(' + Math.round(r) % 256 + ',' + Math.round(g) % 256 + ',' + Math.round(b) % 256 + ',' + a + ')';
}


function circle(ctx, pos, r, color) {
	// todo: hmm, why is it implemeted like this? guess this is more specific to my IFS code experiment..
/*	var grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, r/Math.SQRT2);
	grad.addColorStop(0, color);
	grad.addColorStop(1, cRGBA(0,0,0,0));

	ctx.save();
	ctx.fillStyle = grad;

	ctx.fillRect(pos.x-r, pos.y-r, 2*r, 2*r);
	ctx.restore();
*/
	ctx.save();
	ctx.beginPath();
	ctx.arc(pos.x, pos.y, r, 0, 2 * Math.PI, false);

	// todo: expose separately instead..
//	ctx.fillStyle = color;
//	ctx.fill();
//	ctx.lineWidth = 5;
//	ctx.strokeStyle = '#003300';

	ctx.stroke();
	ctx.restore();
}

function imageToImageData(image) {
	assert(image != null);

	var canvas 		= document.createElement('canvas');
	canvas.width 	= image.width;
	canvas.height 	= image.height;

	var context = canvas.getContext('2d');
	assert(context != null);
	context.drawImage(image, 0, 0);

	return context.getImageData(0, 0, image.width, image.height);
}

/**
 * injects canvas to container. using same width etc
 * @param {string|Element} container jQuery-compatible selector (though assumes a single elem)
 * @param {string=} [id='demo-canvas'] optional id
 * @return {!HTMLCanvasElement}
 */
function _addCanvas(container, id) {
	id = id || 'demo-canvas';
	var $cont = $(container);
	$cont.empty();
	// observe that we can't use the jQuery constructor with attribs since it interprets width/height as css!
	var $canvas = $('<canvas id="' + id + '" width="' + $cont.width() + '" height="' + $cont.height() + '"></canvas>');
	$canvas.appendTo($cont);
	return $canvas.get(0);
}


/**
 * typcically feed imagedata from a canvas/image:
 * var imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height); // todo
 *
 * todo: have option to not calc all channels
 * todo: option to quantize to fewer slots?
 *
 * @param {!Array.<number>} imageData
 * @param {Object=} [options] not used yet..
 * @return {!{ r: !Array.<integer>, g: !Array.<integer>, b: !Array.<integer>, rmax: integer, gmax: integer, bmax: integer}}
 */
function _calcColorHistogram(imageData, options) {
	assert(imageData != null);
	assert(imageData.length % 4 == 0);

	// try to to use array constructor for speed(?)
	// todo: or perhaps store/cache a 0-array and clone/slice it each time?
	var histo = {
		r: new Array(256), rmax: 0,
		g: new Array(256), gmax: 0,
		b: new Array(256), bmax: 0
	};
	// 0-fill (try to use Array.map?)
	for (var i = 0; i < 256; ++i) {
		histo.r[i] = histo.g[i] = histo.b[i] = 0;
	}

	for (var i = 0; i < imageData.length; i += 4) { // rgba format
		var r = imageData[i+0];
		var g = imageData[i+1];
		var b = imageData[i+2];

		histo.r[r] += 1;
		histo.rmax = Math.max(histo.rmax, r); // todo: or leave the max calcs to client?

		histo.g[g] += 1;
		histo.gmax = Math.max(histo.gmax, g);

		histo.b[b] += 1;
		histo.bmax = Math.max(histo.bmax, b);
	}
	return histo;
};


// return canvas;

// });