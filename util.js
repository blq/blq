/**
 *
 * @author Fredrik Blomqvist
 *
 */
define(['jquery'], function($) {

// namespace
var util = {};


/**
 * @deprecated "new Blob" should work in all relevant browsers now
 *
 * Factory to create Blobs. fallback to old BlobBuilder API.
 * Mostly for better Android support.
 * (this is not a polyfill. Doesn't emulate the 'slice' method etc).
 *
 * @see https://caniuse.com/#feat=blobbuilder Android 46+ (4.1+ with fallback). IE10+(not with JS content?)
 * @deprecated standard API works in all relevant browsers now(?)
 * @param {Array.<string|Array|Blob|ArrayBuffer|ArrayBufferView>} parts
 * @param {string} mimeType (todo: reasonable with some default maybe?)
 * @return {Blob} null if failed
 */
util._createBlob = function(parts, mimeType) {
	parts = parts || [];

	var blob = null;
	try {
		blob = new Blob(parts, { type: mimeType });
	} catch(ex) {
		try {
			var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
			var bb = new BlobBuilder();
			parts.forEach(function(part) {
				bb.append(part);
			});
			blob = bb.getBlob(mimeType);
		} catch(ex2) {
			console.error('createBlob: Both "Blob" and "BlobBuilder" failed. Unsupported or invalid input.', ex, ex2);
		}
	}
	return blob;
};


/**
 * Replaces "<"" etc with the corresponding "&lt;" chars to be able to display in html.
 *
 * todo: ? still couple of cases where the ng-sanitizer complains.. bug in ng??
 * todo: why is this not in jQuery? (inside most templating engines though)
 *
 * @param {string} strHtml
 * @return {string}
 */
util.escapeHtml = function(strHtml) {
	// assert(typeof strHtml == 'string');

	// return $('<div>').text(strHtml).html(); // also fails in the ng-sanitizer! (same strings...)

	// @see mustache or jsrender for example
	return strHtml
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;") // _Not_ "&apos;" (not part of html standard)
		//.replace(/\x00/g, "&#0;") // ?
		.replace(/`/g, "&#96;");
};

/**
 * @private
 * @type {number} // integer
 */
util._uid_count = 0;

/**
 * ok? goog/base.js has same name but requires arg to attach to.
 * @return {number} unique (per session) integer id
 */
util.getUid = function() {
	return util._uid_count++;
};

/**
 * run when your page is done
 * (assumes noone wipes out entire <body> contents..)
 * todo: opt-out if not on a Mobile browser? (Desktop case probably don't want fullscreen. also not in Cordova)
* @see https://caniuse.com/#feat=fullscreen
*/
util.enableFirstClickFullscreen = function() {
	// @see https://brad.is/coding/BigScreen/
	if (window.BigScreen == null || !BigScreen.enabled) {
		console.warn('FullScreen API not supported');
		return;
	}

	// or prepend as first elem? must try to ensure above all other elems
	// yes, plain 'document' event would work, *unless* iframe..
	$('body').append($('<div>', {
		id: 'fullscreen_helper',
		css: {
			// width: '100%', height: '100%',
			position: 'fixed',
			top: 0, left: 0,
			right: 0, bottom: 0,
			margin: 0,
		 	'z-index': 6666
		},
		on: {
			// just using "click" works of course but can confuse, specially
			// on phones were toch-drag-pan (map!) is common and which doesn't fire a click
			// causing illusion of ui being frozen.
			// todo: ! *only* use touch-event and only mobiles will get this behavior - as intended!
			'touchstart mousedown': function() {
				console.debug('first tap! -> fullscreen');
				// in case events don't fire hide this right away
				$('#fullscreen_helper').hide();
				// if (!Mobile.isFullScreen()) // not really necessary. might risk case for false negative?
					BigScreen.request();
			}
		}
	}));

	// todo: doesn't work in IE11...
	BigScreen.onenter = function() {
	    // called when the first element enters full screen
		console.debug('going fullscreen!');
		$('#fullscreen_helper').hide();
	};

	BigScreen.onexit = function() {
	    // called when all elements have exited full screen
		console.debug('exiting fullscreen mode');
		$('#fullscreen_helper').show();
	};
};


/**
 * ! only launches if called in a *user triggered* event/click!
 * todo: f-k! No cancel-event! we get stuck..
 * todo: ? didn't the case in Android of selecting the camera and snapping a shot path work previously? now it doesn't..?
 * @param {{ accept: string }=}
 * @return {!Promise}
 */
util.showOpenFileDialog = function(opt) {
	opt = Object.assign({
		multiple: false
		// todo: or just allow user to add plain arbitrary attributes/properties?
		//, accept: '*'
	}, opt);

	return new Promise(function(resolve, reject) {
		var fi = $('<input>', {
			type: 'file',
			accept: opt.accept,
			multiple: opt.multiple,
			// todo: required='required'?
			// accept: 'image/*;capture=camera,video/*;capture=camcorder',
			// accept: 'image/*',
			// capture: 'camera', // 'camcorder'
			on: {
				change: function(e) {
					// console.debug('file change event:', e);
					if (this.files && this.files.length > 0) {
						resolve(opt.multiple ? this.files : this.files[0]);
					} else {
						// todo: hmm, or simply resolve([]) ?
						reject('No file selected (cancel)');
					}
				},
				error: function(err) {
					console.log('open file dialog error:', err);
					reject(err);
				}
			}
		});

		fi.click(); // trigger open (it works only if we this fn in also a result of a real *user* click)

		// ! hack to try to detect/emulate cancel op.
		// (if this doesn't work "reliably" this entire technique might be jeopardized. *mustn't* freeze the Promise..)
		// ..-> works fine in desktop browser! ..but not on Android Chrome.. :( -> test use the "mousemove touchstart" event also, seems to work in Android (but cripples desktop..) todo: more events/triggers? set a big event-sniffer and debug??
		// $(window).one('focus mousemove touchstart', function() {
		/* $(window).one('focus', function() {
		 	setTimeout(function() {
		 		console.debug('body focus. file:', fi.val(), 'files:', fi.get(0).files);
		 		if (fi.val() == '') {
		 			reject('No file selected (cancel)');
		 		}
		 	}, 100);
		 });
		 */
	});
};


/**
 * Transform an arbitrary single-key dictionary object into a normalized { key: key, value: value } pair/tuple.
 * todo: new JS standard seems to aim for Object.items() that returns Array of Array-tuples
 *
 * @param {!Object<string, T>} keyVal assumed to contain a single key->value pair
 * @return {!{ key: string, value: T }}
 * @template T
 */
util.keyVal = function(keyVal) {
	var key;
	// or key = Object.keys(keyVal)[0] ?
	for (key in keyVal) {
		// first key found should be the only key
		break;
	}
	return { key: key, val: keyVal[key] };
	//	return [ key, keyVal[key] ]; // or Array tuple?
};


/**
 * @param {Object} obj null will return true (ok? overload on arrays also?)
 * @return {boolean}
 */
util.isEmptyObj = function(obj) {
	for (var k in obj) {
		return false;
	}
	return true;
};


/**
 * modifies the input array _in-place_, making sure
 * references (closures) to original still hold.
 * @see replaceObject
 *
 * @param {!Array<T>} org
 * @param {!Array<R>} newContent
 * @return {!Array<R>} input array with content replaced (just for in-place chaining)
 * @template T, R
 */
util.replaceArray = function(org, newContent) {
	// todo: change to isArray or isArrayLike tests I guess
	// assert(org != null);
	// assert(newContent != null);

	var args = [0, org.length].concat(newContent);
	org.splice.apply(org, args);
	return org; // chain
};

// ok?
util.emptyArray = function(arr) {
	return util.replaceArray(arr, []);
};


/**
 * modifies the input object _in-place_, making sure
 * references (closures) to original still hold.
 * @see replaceArray
 *
 * todo: overload both replaceArray and replaceObject in one function?
 * todo: a deep/tree version? (flatten)
 *
 * @param {!Object<A>} org
 * @param {!Object<B>} newContent
 * @return {!Object<B>} modified input obj (just for in-place chaining)
 * @template A, B
 */
util.replaceObject = function(org, newContent) {
	// assert(org != null);
	// assert(newContent != null);

	// empty
	for (var k in org) {
		delete org[k];
	}
	// refill
	for (var k in newContent) {
		org[k] = newContent[k];
	}
	return org; // chain
};

// ok?
util.emptyObject = function(obj) {
	return util.replaceObject(obj, {});
};


/**
 * @param {!Array<T>} arr // todo: support iterable?
 * @param {((function(T): string)|string)} getKey plain string interpreted as using property with same name
 * @return {!Object<string, T>}
 * @template T
 */
util.toDict = function(arr, getKey) {
	if (typeof getKey == 'string') {
		var prop = getKey;
		getKey = function(item) { return item[prop]; }; // == MochiKit.Base.itemgetter()
	//	getKey = item => item[prop];
	}
	var d = {};
	arr.forEach(function(item) {
		d[getKey(item)] = item;
	});
	return d;
};


/**
 * wraps 'fn' in a guard that never allows more than 'opt_numargs' arguments.
 * Useful in fn programming when the signature/meaning of calls doesn't match.
 * (common case is using the "unpure" Array.filter/map etc that also throws index and container at the callback!)
 * todo: ok name? blockArgs, freezeArgs ?
 * todo: hmm, could/is this be integrated in my MochiKit.Base.bind2() stuff? (i.e limitArgs(fn, 2) == partial2(fn, _1, _2) ? or at least use that API style?)
 *
 * @param {Function} fn
 * @param {integer=} opt_numArgs default 0
 * @return {Function}
 */
util.limitArgs = function(fn, opt_numArgs) {
	opt_numArgs = opt_numArgs || 0;
	return function() {
		var args = Array.prototype.slice.call(arguments, 0, Math.min(arguments.length, opt_numArgs));
		return fn.apply(this, args);
	};
};

/**
 * block any args to reach fn.
 * (just an alias for limiteArgs)
 * @param {Function} fn
 * @return {Function}
 */
util.blockArgs = function(fn) {
	return util.limitArgs(fn, 0);
};


/**
 * non-blocking JSON.parse() ..or?
 * @param {string} str
 * @return {!Promise<!JSON>}
 */
util.asyncJSONParse = function(str) {
	// part of the Fetch API https://developer.mozilla.org/en-US/docs/Web/API/Response
	return (new Response(str)).json();
};


/**
 * note: this most likely needs to be called via a user interaction, i.e click
 * to work (security reasons).
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand
 * todo: yes, new Clipboard API is more powerful but with more browser quirks (and is async)
 * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Interact_with_the_clipboard#Using_execCommand()
 *
 * @param {string} text
 * @return {boolean} false if failed
 */
util.copyToClipboard = function(text) {
	try {
		var el = document.createElement('textarea');
		el.value = text;

		// try to hide it to avoid flicker
		// ! note that display hidden doesn't trigger copy.
		el.style.width = el.style.height = '1px';
		el.style.position = 'absolute';
		el.style.left = '-9999px';

		document.body.appendChild(el);
		el.select(); // this wipes any other pending selects. could save and restore but should be rare case.
		document.execCommand('copy');
		document.body.removeChild(el);

		return true;
	} catch (ex) {
		console.error('Copy to clipboard failed:', ex);
	}
	return false;
};


util._globalID = null;
util._id = 0;

/**
 * make all(!) objects have a unique (lazy) '__id__' property
 * idea from https://twitter.com/dan_abramov/status/794655915769266178?lang=en
 */
util.enableGlobalDebugID = function() {
	if (!util._globalID) {
		util._globalID = new WeakMap();

		Object.defineProperty(Object.prototype, '__id__', {
			get: function() {
				var id = util._globalID.get(this);
				if (id === undefined) {
					id = util._id++;
					util._globalID.set(this, id);
				}
				return id;
			},
			writable: true,
			configurable: true
		});
	}
};


return util;

});
