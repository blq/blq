/**
 * @fileoverview
 * Simple vector graphics using CSS
 *
 * @author Fredrik Blomqvist
 *
 */
define(['blq/assert', 'jquery', 'MochiKit/Iter', 'MochiKit/Iter-ext'], function(assert, $) {

// namespace
var css = {};

/**
 * load and add CSS to the current document.
 * note that it doesn't keep track of already loaded.
 * todo: support a loaded registry? (or simply memoize?)
 * todo: support custom document to append to?

 * @see https://github.com/filamentgroup/loadCSS
 * @see using requirejs to load css also!
 *
 * @param {string} url 	todo: support an array?
 * @param {string=} [id]
 * @return {!Promise} observe that this callback only specifies when the CSS is loaded by Ajax, Not when it's fully active in the document..
 */
css.loadCSS = function(url, id) {
	assert(typeof url == 'string');

	// todo: hmm, useful to do it like this? (earlier MooTools/MUI does this)
	// or just append node directly? this way we get a kindof callback and the
	// add-to-doc should be very fast because of cache. (but we can't be cross-domain either of course..)
	// todo: test the 'load' event
/*
	return $.get(url).done(function() {
		$('head').append($('<link>', {
			href: url,
			id: id,
			rel: 'stylesheet',
			type: 'text/css',
			media: 'screen' // necessary?
		}));
	});
*/

	// better? this enables cross-domain but with no real error-callback..
	return new Promise(function(resolve, reject) {
		var link = $('<link>', {
			href: url,
			id: id, // todo: generate a default id if not supplied?
			rel: 'stylesheet',
			type: 'text/css',
			media: 'screen', // necessary? or'all'?
			// event
			load: function(e) {
				resolve(this);
			}
			// todo: since no error event might need a timeout wrapper I guess? OR.. combine this event with the xhr stuff? (then we can catch 404 etc)
		});
		$('head').append(link);
	});
};

/*
 * todo: or this method? https://developers.google.com/speed/docs/insights/OptimizeCSSDelivery

 var cb = function() {
     var l = document.createElement('link'); l.rel = 'stylesheet';
     l.href = 'small.css';
     var h = document.getElementsByTagName('head')[0]; h.parentNode.insertBefore(l, h);
   };
   var raf = requestAnimationFrame || mozRequestAnimationFrame ||
       webkitRequestAnimationFrame || msRequestAnimationFrame;
   if (raf) raf(cb);
   else window.addEventListener('load', cb);
 */


/**
 * todo: support custom documents/root nodes to add to?
 * ok name? addStyleString?
 * @see css.getSheet() maybe better?
 *
 * @param {string} css
 * @return {!HTMLStyleElement} generated style node (typically ignored)
 */
css.injectCSS = function(css) {
	assert(typeof css == 'string');

    var node = document.createElement('style');
    node.innerHTML = css;
    document.body.appendChild(node); // todo: allow custom root node/document?
    return node;
};


/**
 * todo: not ready.
 * @see scenes/css/play.css
 */
css.cssGfxInit = function() {
	// todo: load the base CSS needed for vector graphics!
	// yes, we _could_ skip CSS-classes etc and just inline the styles
	// for slightly "easier" interface. But it would loose the power of CSS
	// (of course). this graphics is a tweak-hack and shouldn't really try
	// to hide that more than necessary I'd say.

	// adding other classes should simply append to this tyle
/*
	div.line {
		-webkit-transform-origin: 0 50%;
		   -moz-transform-origin: 0 50%;
		        transform-origin: 0 50%;

		height: 1px;
		background: black;
	}
*/
	// return Defered
};

/**
 * todo: add a cssInit to load custom css also
 * see http://www.monkeyandcrow.com/blog/drawing_lines_with_css3/
 * todo: make the target node default to current document? (need to move it in arg order..)
 *
 * @param {!Pos} p0
 * @param {!Pos} p1
 * @param {{ 'class': string }} [opt] additional classes (todo: support full attributes?)
 * @return {!Node} <div>
 */
css.cssLine = function(p0, p1, opt) {
	assert(p0 != null);
	assert(p1 != null);

	// todo: use new vec2.js code?
	var length = Math.sqrt((p0.x - p1.x)*(p0.x - p1.x) + (p0.y - p1.y)*(p0.y - p1.y));
	var angle  = Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180 / Math.PI;
	var transform = 'rotate('+angle+'deg)';

	var attr = $.extend(true, {
		// placeholders
		'class': '',
		css: {}
		},
		opt
	);
	attr['class'] += ' gfx line';

	var line = $('<div>', $.extend(true, attr, {
		css: {
			left: p0.x,
			top: p0.y,

			width: length, // could use height also of course. just change angle and use "height" in CSS style also

			'-webkit-transform':  transform,
			'-moz-transform':     transform,
			'transform':          transform
			// todo: IE?
		}
	}));

	return line.get(0);
};


/**
 * todo: cssPolygon also or just use a 'close' flag?
 *
 * @param {!Iterable.<!Pos>} vertices
 * @param {Object=} [opt]
 * @return {!HTMLElement} <div>
 */
css.cssPolyline = function(vertices, opt) {
	assert(vertices != null); // todo: iterable/array check

	// todo: extend attributes also
	opt = Object.assign({
		'class': '',
		css: {}
	}, opt);

	opt['class'] += ' polyline-segment'; // 'gfx' will be added by cssLine below

	var root = $('<div>', {
	//	'class': 'gfx polyline',
		'class': 'polyline-root',
		title: opt.title
	});
	delete opt.title; // otherwise this will be set on all line-segments also (works, but slightly ugly with duplicate info)

	forEach(MochiKit.Iter.pairView(vertices), function(seg) {
		$(css.cssLine(root, seg[0], seg[1], opt)).removeClass('line');
	});
	return root.get(0);
};


/**
 * todo: or implement using ellipse? This might help conceptually though
 * todo: option to decide if anchor position should be UL or centre? (now UL)
 *
 * @param {!Pos} pos
 * @param {number} r
 * @param {Object=} [opt]
 * @return {!HTMLElement} <div>
 */
css.cssCircle = function(pos, r, opt) {
	assert(pos != null);
	assert(typeof r == 'number');

	var attr = $.extend(true, {
		// placeholders
		'class': '',
		css: {}
		},
		opt
	);
	attr['class'] += ' gfx circle';

	var circle = $('<div>', $.extend(true, attr, {
		css: {
			// todo: hmm, or perhaps instead control the center?
			// using some offset/padding thingy? the other code could then
			// use plain positions to reposition but still match the center!
			// (or make this logic an option)
			// (should at least be possible if using a root elem but then styling becomes difficult)
			left: pos.x - r,
			top: pos.y - r,

			// works!
		//	'margin-top': -r,
		//	'margin-left': -r,

			width: 2*r,
			height: 2*r
		}
	}));

	return circle.get(0);
};


/**
 * todo: or create a fully generic mathematial style taking the two focal points? (to allow rotation also)
 * todo: option to decide if anchor position should be UL or centre? (now UL)
 *
 * @param {!Pos} pos
 * @param {!Size} size
 * @param {Object=} [opt]
 * @return {!HTMLElement} <div>
 */
css.cssEllipse = function(pos, size, opt) {
	assert(pos != null);
	assert(size != null);

	var attr = $.extend(true, {
		// placeholders
		'class': '',
		css: {}
		},
		opt
	);
	attr['class'] += ' gfx ellipse';

	var ellipse = $('<div>', $.extend(true, attr, {
		css: {
			// todo: see margin-offset pos idea in circle also
			left: pos.x - 0.5*size.w,
			top: pos.y - 0.5*size.h,

			width: size.w,
			height: size.h
		}
	}));

	return ellipse.get(0);
};

/**
 * @param {!Bounds} bounds pos UL + size
 * @param {Object=} [opt]
 * @return {!HTMLElement} <div>
 */
css.cssRect = function(bounds, opt) {
	assert(bounds != null);

	var attr = $.extend(true, {
		// placeholders
		'class': '',
		css: {}
		},
		opt
	);
	attr['class'] += ' gfx rectangle';

	var rect = $('<div>', $.extend(true, attr, {
		css: {
			left: bounds.x,
			top: bounds.y,

			width: bounds.w,
			height: bounds.h
		}
	}));

	return rect.get(0);
};


/**
 * todo: not ready!
 * todo: expose some of the typical common triangles as shorthand (up, down, left, right)
 *
 * @param {!Pos} p0
 * @param {!Pos} p1
 * @param {!Pos} p2
 * @param {Object=} [opt]
 * @return {!HTMLElement}
 */
css.cssTriangle = function(p0, p1, p2, opt) {
	assert(p0 != null);
	assert(p1 != null);
	assert(p2 != null);

	var attr = $.extend(true, {
		// placeholders
		'class': '',
		css: {}
		},
		opt
	);
	attr['class'] += ' gfx triangle';

	var tri = $('<div>', $.extend(true, attr, {
		css: {
			// todo: NOT READY!
			// left: bounds.x,
			// top: bounds.y,

			// width: bounds.w,
			// height: bounds.h
		}
	}));

	return tri.get(0);
};


css.circleWithText = function(pos, r, text, opt) {

// todo: @see see http://jsfiddle.net/tyt6s14z/24/
// .btn {
//     color: #64bc8a;
//
//     padding: 10px; /* should be related to the font size */
//     font-size: 23px;
//
//     border: 1px solid #64bc8a;
// }
//
// .circle {
//     border-radius: 100%; /* lower gives a rounded rect */
//     max-width: 100%;
//     text-align: center;
//     display: inline-block;
//     line-height: 1;
// }
//
// .circle:before {
//     content: '';
//     display: inline-block;
//     width: 100%;
//     height: 0;
//     padding-bottom: 100%;
//     vertical-align: middle;
//     line-height: 1;
// }
//
// .circle span {
//     display: inline-block;
//     line-height: 1;
//     max-width: 100%;
//     margin-left: -100%;
//     vertical-align: middle;
// }


	var circle = $('<div>', {
		css: {
			'border-radius': '100%',
			'max-width': '100%', // todo: pixels also?
			'text-align': 'center',
			'display': 'inline-block',
			'line-height': 1
		}
	});
	var text = $('<span>', {
		text: text,
		css: {
			'display': 'inline-block',
			'line-height': 1,
			'max-width': '100%',
			'margin-left': '-100%',
			'vertical-align': 'middle'
		}
	});
	circle.append(text);

	return circle.get(0);
};

// todo: cssPixel? cssSprite? (would be good to try out xfrm on images etc)

/**
 * forces a refresh of all CSS-links on the page.
 * useful when you're editing the CSS file and want instant update
 * without page-reload.
 *
 * Based on the "ReCSS" bookmarklet code. @see http://david.dojotoolkit.org/recss.html
 *
 * @param {jQuerySelector=} [sel='link'] optional selector, can be individual link(s), default global.
 * @return {integer} number of css-links updated (useful? remove?)
 */
css.refreshCSS = function(sel) { // rename? refreshDocumentCSS?
	var n = 0;
	$(sel || 'link').each(function(i, css) {
		var $css = $(css); // not sure really need for just the href & rel attribs?
		// don't need to check 'type' since it's not needed in HTML5
		if ($css.attr('href') && $css.attr('rel').toLowerCase().indexOf('stylesheet') >= 0) {
			var href = $css.attr('href').replace(/(&|\?)forceReload=\d+/, '');
			$css.attr('href', href + (href.indexOf('?') >= 0 ? '&' : '?') + 'forceReload=' + (new Date()).getTime());
			n += 1;
		}
	});
	return n;
};


/**
 * for example, @see https://davidwalsh.name/demo/css-filters.php
 * for browser support @see https://caniuse.com/#feat=css-filters
 * todo: expose as a jQuery plugin?
 *
 * @param {!jQuerySelector} elem
 * @param {string} name todo: or create and take an enum?
 * @param {number|string} value (unit will be chosen automatically). send null to delete! todo: ranges? normalize to 0..1? always use %? todo: allow string? (assume to include unit?)
 * @return {!HTMLElement} elem (selector chain) - ! or rather the jQuery-obj! (this fn works fine to use on multiple inputs!(?))
 */
css.setCssFilter = function(elem, name, value) {
	assert(elem != null);
	assert(typeof name == 'string');
	assert(value != null);

	name = name.toLowerCase();

	/**
	 * @param {string} name
	 * @param {string|number} value
	 * @return {string}
	 */
	var _getFilter = function(name, value) {
		value = typeof value == 'number' ? Math.round(value * 10) / 10 : value; // round to 1 decimal (hmm, was this really necessary?)

		var units = {
			blur: 'px',
			'hue-rotate': 'deg'
			// most effects use % -> hmm, can we always use 0..1? ranges if we don't supply a unit?
			// or rescale to 0..100% ?
			//
		};
		// in case value is a string we assume it already contains the unit
		var unit = typeof value == 'string' ? '' : (units[name] || ''); // no unit resembles '%'

		return name + '(' + value + unit + ')';
	};

	var $elem = $(elem);
	// handle the overloads (though only webkit actually support it now it seems)
	// todo: perhaps better to detect instead? http://www.javascriptkit.com/javatutors/setcss3properties.shtml
	// (could do it lazily once and cache)
	// for even more support could technically use a SVG-filter also but don't think it's worth it
	// for IE6(!)-IE9 we could use: filter:progid:DXImageTransform.Microsoft.Blur(PixelRadius='3'); }
	[ 'filter', '-webkit-filter', '-moz-filter', '-ms-filter' ].forEach(function(filter) {
		var filters = $elem.css(filter);
		if (filters == null)
			return; // continue
		filters = filters.split(' '); // todo: is this split safe enough?
		if (filters.length == 1 && filters[0].toLowerCase() == 'none')
			filters = [];

		// search for existing slot
		var i = 0;
		while (i < filters.length && filters[i].indexOf(name) == -1) {
			i += 1;
		}

		if (value == null) {
			// delete
			filters.splice(i, 1);
		} else {
			// replace existing or append
			filters.splice(i, 1, _getFilter(name, value));
		}

		$elem.css(filter, filters.join(' '));
	});

	return $elem;
};


/**
 * Returns a CSSStyleSheet that is attached to current document (singleton style)
 * Typically used as: getSheet().insertRule("header { float: left; opacity: 0.8; }", 1);
 * Full sheet API @see https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet
 *
 * @see https://davidwalsh.name/add-rules-stylesheets
 * @see css.injectCSS()
 * todo: support specific document?
 *
 * @return {!CSSStyleSheet}
 */
css.getSheet = function() {
	// create only one sheet and cache it
	if (css.getSheet.__sheet == null) {
		// Create the <style> tag
		var style = document.createElement('style');

		// WebKit hack :(
		style.appendChild(document.createTextNode(''));

		// Add the <style> element to the page
		document.head.appendChild(style);

		css.getSheet.__sheet = style.sheet;
	}
	return css.getSheet.__sheet;
};



return css;

});
