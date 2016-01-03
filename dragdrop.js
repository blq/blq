/**
 *
 * @author Fredrik Blomqvist
 *
 */
define(['blq/assert', 'jquery', 'blq/readfile'], function(assert, $, reader) {

var blq = {};

/**
 * Intended for drag/drop of files into the browser (Not elements inside page).
 *
 * Note that this function deliberately doesn't use a Deferred/Promise interface
 * to enable the typical(?) use as a multi-callback listener/spawner.
 *
 * @see blq.readFile() used for processing file.
 * @see blq.stoplistenForDragDrop()
 *
 * todo: support directory drop? (getAsEntry) (only Chrome? polyfill?)
 * http://updates.html5rocks.com/2012/07/Drag-and-drop-a-folder-onto-Chrome-now-available
 * http://code.flickr.net/2012/12/10/drag-n-drop/
 * http://codebits.glennjones.net/dragdrop/dropfolder.htm
 *
 * todo: create a wrapper that could integrate this with a traditional file-selector!
 * todo: perhaps join the callback/errback in a single calback(error, value)? (ala Node.js)
 * todo: expose hooks to the partial callbacks? (enter, leave, hover?)
 * todo: expose as a jQuery plugin also?
 * todo: hmm, the reading of the file can be pretty slow. perhaps expose another callback that
 * returns before file is completely loaded? (ie. a pre-callback giving a promise) then client code could
 * react and then wait? -> or read in a worker!?
 * todo: some kind of flag/wildcard/regexp to limit input mime-type also? (or a verification fn)
 * todo: guard against multiple inits/attaches
 *
 * @param {!jQuerySelector|Element|string} elem (will work for multiple elements) string will be interpreted as delegated mode
 * @param {{output: (blq.ReadFileFormat|string)}?} [options]
 * @param {function({name: string, mimeType: string, data: Object})} callback
 * @param {function(string)=} [errback]
 * @param {function(ProgressEvent)=} [progess] progress callback. todo: merge callbacks?
 * // todo: return some kind of handle? (now element)
 */
blq.listenForDragDrop = function(elem, options, callback, errback, progress) {
	assert(typeof callback == 'function');

	errback = errback || jQuery.noop;
	assert(typeof errback == 'function');
	progress = progress || jQuery.noop;
	assert(typeof progress == 'function');

	options = $.extend({
		output: reader.ReadFileFormat.Base64,
		// if true the result will always be an array.
		allowMultiple: false,
		// default in custom.css (dashed border)
		// todo: perhaps allow full css/element-styling/modification? (or expose events as callbacks?)
		// todo: might also be useful to sometimes be able to set the class on some _other_ element than target elem? even body!
		// expose as optional injector? options.setClass(elem, hoverClass) ?
		hoverClass: 'indicate_drop'
	}, options);

	//------ experimental test --
	// by default Don't allow drag drop on any element!
	// -> set cursor to indicate denied.
	// todo: ? cursor change doesn't seem to work anyway?
	$(window).on('dragover._blq_dragdrop', function(e) {
		e.preventDefault();
		$('html').addClass('nodrop');
		console.debug('prevented drag drop');
		// e.originalEvent.dataTransfer.dropEffect = 'none';
	});
	$(window).on('drop._blq_dragdrop', function(e) {
		e.preventDefault();
		console.debug('prevented drag drop');
		$('html').removeClass('nodrop');
	});
	//---------

	// decide whether to use delegated event or direct attach
	var delegated = typeof elem == 'string';
	var $elem = $(delegated ? document : elem);
	var delsel = delegated ? elem : null;

	// todo: expose more callbacks here? (so user can set classes etc)
	// todo: perhaps do a 'stopListen' ('off') first to avoid double-attach?
	$elem.on('dragenter._blq_dragdrop', delsel, function(e) {
		var oe = e.originalEvent;
		if (oe.dataTransfer == null || oe.dataTransfer.types == null || oe.dataTransfer.types.length > 1 || oe.dataTransfer.types[0] != 'Files') {
			console.log('dragDrop: only (single)file supported');
			return;
		}

		e.preventDefault();
		//e.stopPropagation();

		$(this).addClass(options.hoverClass);
		$('html').removeClass('nodrop');
	});
	// todo: hmm, if container contains other eleme, i.e a helper text, this stops!?
	$elem.on('dragover._blq_dragdrop', delsel, function(e) {
		e.preventDefault();
		//e.stopPropagation();

		// $elem.addClass(options.hoverClass);

		// seems like 'move' is the default but that might be confusing -> force a copy indicator
		e.originalEvent.dataTransfer.dropEffect = 'copy';
 	});
	$elem.on('dragleave._blq_dragdrop', delsel, function(e) {
		e.preventDefault();
		//e.stopPropagation();

		$(this).removeClass(options.hoverClass);
	});

	$elem.on('drop._blq_dragdrop', delsel, function(e) {
		e.preventDefault(); // don't want entire page to be replaced..
		//e.stopPropagation();

		$(this).removeClass(options.hoverClass);

		var oe = e.originalEvent;
		var files = oe.dataTransfer.files; // "blobs" todo: or use dataTransfer.items?
		if (files.length < 1) {
			console.log('No files in drop event.');
			// todo: should support a notify or verification callback? or just return empty array? or ignore?
			return;
		}

		// (most likely only one file though)
		// todo: or simply always use array?
		if (options.allowMultiple) {

			var deferreds = MochiKit.Base.map(function(file) {
				return reader.readFile(file, options);
			}, files);

			// todo: sigh, why doesn't jQuery have a gatherResults or similar!?
			$.when.apply($, deferreds).then(
				function() {
					// convert arguments into real list
					callback(MochiKit.Base.extend([], arguments));
				},
				errback,
				progress
			);

		} else {
			var file = files[0];
			console.log('blq.dragdrop:', file.name);

			reader.readFile(file, options).then(callback, errback, progress);
		}
	});

	// todo: or better return some kind of handle so we can for example change the drop-format dynamically?
	return $elem;
};


/**
 * @see listenForDragDrop()
 * @param {jQuerySelector=} [elem=document]
 * @return {!jQuery} selected elem chain
 */
blq.stopListenForDragDrop = function(elem) {
	elem = elem || document;
	// todo: or traverse down?
	return $(elem).off('._blq_dragdrop');
};


return blq;

});
