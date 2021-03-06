/**
 *
 * @author Fredrik Blomqvist
 *
 */
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
	return $root.find.bind($root);
	// return function(selector) {
	// 	return $root.find(selector);
	// };
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
 * @see also https://davidwalsh.name/detect-scrollbar-width
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


/**
 * document -> window
 * extracted from jQuery source (not exposed in the interface)
 * @param {Element} elem
 * @return {Window}
 */
dom.getElementWindow = function(elem) {
	return $.isWindow(elem) ?
		elem :
		elem.nodeType === 9 ?
			elem.defaultView || elem.parentWindow :
			null;
};

/**
 * @param {HTMLIFrameElement|jQuerySelector} iframe
 * @return {Document}
 */
dom.getIframeDocument = function(iframe) {
	assert(iframe != null);

	// return iframe.contentDocument || iframe.contentWindow.document;
	return $(iframe).contents()[0] || null;
};

/**
 * @param {HTMLIFrameElement|jQuerySelector} iframe
 * @return {Window}
 */
dom.getIframeWindow = function(iframe) {
	assert(iframe != null);

	var doc = dom.getIframeDocument(iframe);
	return doc ? dom.getElementWindow(doc) : null;
};


/**
 * umm, name?..
 * @return {!{ dispose: Function }} handle that can be used to disconnect
 */
dom.onMaybeDelegated = function(elemOrSel, event, fn) {
	// todo: package as a handler !
	var delegated = typeof elemOrSel == 'string';
	var root = delegated ? document : elemOrSel;
	var delsel = delegated ? elemOrSel : null;

	$(root).on(event, delsel, fn);

	return {
		dispose: function() {
			$(root).off(event, delsel, fn);
		}
	};
};


/**
 * @param {string} event
 * @param {!Object.<string, ?Function>} delegates selector->function dictionary, skips null slots
 */
dom.multiDelegate = function(event, delegates) {
	assert(event != null);
	assert(delegates != null);

	for (var del in delegates) {
		var fn = delegates[del];
		//assert(typeof fn == 'function');
		if (typeof fn == 'function') // filter out only fns for convenience (i.e allow inline code in the dict to simply set null for example)
			$(document).on(event, del, fn);
	}
};


/**
 * is object a jQuery object?
 * @param {*} obj
 * @return {boolean}
 */
dom.isjQuery = function(obj) {
	// (don't want to use "instanceof jQuery" for easier compilation)
	return obj != null && typeof obj.jquery == 'string'; // .jquery is the version nr string
};


/**
 * @param {HTMLElement} elem // todo: overload on selector also?
 * @return {boolean}
 */
dom.isEditable = function(elem) {
	return elem && (elem.tagName === 'INPUT' || elem.tagName === 'SELECT' || elem.tagName === 'TEXTAREA' || elem.isContentEditable);
};


/**
 * // todo: overload on ready(doc, onReady) also?
 * @param {function=} onReady
 * @return {!Promise} optional promise interface
 */
dom.ready = function(onReady) {
	return new Promise(function(resolve) {
		if (document.readyState === 'loading') {
			var loaded = function() {
				document.removeEventListener('DOMContentLoaded', loaded);
				resolve(); // pass document as arg?
			};
			document.addEventListener('DOMContentLoaded', loaded);
		} else {
			resolve();
		}
	})
	.then(onReady); // ok? I think should work for null and non-fns anyway
};


/**
 * useful?
 * @param {!HTMLElement} src
 * @param {!HTMLElement} dst
 * // todo: maybe an optional apply-pipe-callback function or offset/anchor?
 * @return {!{cancel: Function}}
 */
dom.followElement = function(src, dst, optApply) {
	optApply = optApply || function(xfrm) {
		return xfrm;
	};

	var raf = null;

	function follow() {
		raf = requestAnimationFrame(follow);
		dst.style.transform = optApply(src.style.transform);
	}

	follow();

	// todo: hmm, maybe full start,stop/pause,cancel methods?
	return {
		cancel: function() {
			if (raf) {
				cancelAnimationFrame(raf);
				raf = null;
			}
		}
	};
};


return dom;

});
