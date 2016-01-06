
define(['blq/assert', 'jquery', 'MochiKit/DOM'], function(assert, $) {

// namespace
var dom = {};

/**
 * returns a jQuery selector fn scoped to the root element.
 * Resembles a bound jQuery(root).find(selector)
 * (similar to how for ex Backbone does).
 *
 * todo: hmm, possible to make this return a "real" jQuery object?
 *
 * @param {!jQuerySelector} root
 * @return {function(jQuerySelector|jQuery|Element): !jQuery} (resembles $.find(). Not a top-level jQuery)
 */
dom.getScopedjQuerySelector = function(root) {
	assert(root != null);

	// Yes, could also lookup root each time, for a slightly different 'lazy' style, deferred.
	// This should be faster and stricter in the sense we want here.
	// == return MochiKit.Base.method($root, 'find')
	var $root = $(root);
	return function(selector) {
		return $root.find(selector);
	};
};


/**
 *! Copyright (c) 2008 Brandon Aaron (brandon.aaron@gmail.com || http://brandonaaron.net)
 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
 *
 * Gets the width of the OS scrollbar
 * note that this only seems to work if a scrollbar is actually visible on the screen..
 *
 * @see https://github.com/brandonaaron/jquery-getscrollbarwidth
 * @see also http://davidwalsh.name/detect-scrollbar-width
 *
 * @return {number} (can we assume an integer?)
 */
dom.getScrollbarWidth = function() {
	var self = arguments.callee;
	var scrollbarWidth = self._scrollbarWidth || 0; // cached value

	if (!scrollbarWidth) {
		var $div = $('<div />')
			.css({ width: 100, height: 100, overflow: 'auto', position: 'absolute', top: -1000, left: -1000 })
			.prependTo('body').append('<div />').find('div')
				.css({ width: '100%', height: 200 });
		self._scrollbarWidth = 100 - $div.width(); // cache
		$div.parent().remove();
	}
	return self._scrollbarWidth;
};


/**
 * iframe adapted to fill parent element without borders etc
 *
 * @param {Object=} [options] attributes for the iframe
 * @return {!HTMLIFrameElement}
 */
dom._createIframe = function(options) {
	options = options || {};
	return DOM.IFRAME({ // todo: use jQuery?
		src: options.src || '',
		id: options.id || '',
		width: '100%',
		height: '100%',
		// remove any margins etc
		frameborder: 0 // seems enough in Chrome at least (other browsers might need more resets)
	});
};


/**
 * mini-helper for SVG
 * ! note that you can't use jQuery or such to append nodes! Must use DOM-api
 * todo: move to a separate svg.js
 *
 * @param {string} tag
 * @param {Object=} [attrs]
 * @return {!SVGElement}
 */
dom.createSVG = function(tag, attrs) {
	assert(typeof tag == 'string');

	var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
	for (var k in attrs) {
		el.setAttribute(k, attrs[k]);
	}
	return el;
};


return dom;

});
