/**
 * @author Fredrik Blomqvist
 *
 * todo: create a stripped-down version that can run inside a Web Worker?!
 *
 */
define(['blq/assert', 'jquery'], function(assert, $) {

// namespace
var blq = {};

/**
 * @see blq.listenForDragDrop() and blq.readFile() options
 * @see blq.readFile() options
 * @enum {string}
 */
blq.ReadFileFormat = {
	DataURL: 'dataurl',
	Base64: 'base64',
	BinaryString: 'binarystring',
	Text: 'text',
	ArrayBuffer: 'arraybuffer'
};


/**
 * todo: move elsewhere?
 * @param {string} dataUrl
 * @return {{mimeType: string, data: string}} null if error
 */
blq.parseDataUrl = function(dataUrl) {
	assert(typeof dataUrl == 'string');

	// todo: or assert starts with 'data:'?
	var idx = dataUrl.indexOf('base64,');
	if (idx == -1) {
		// error!
		return null;
	}
	var mimeType = dataUrl.substring('data:'.length, idx-1);
	var base64 = dataUrl.substr(idx + 'base64,'.length);

	return {
		data: base64,
		mimeType: mimeType
	};
};


/**
 * Used indirectly by @see blq.listenForDragDrop()
 *
 * todo: make public once tested and support for multiple files etc
 * todo: expose specifying the encoding? (utf-8 is default)
 *
 * @param {!(File|Blob)} file (typically from <file> or drag'n drop operation)
 * @param {{output: (blq.ReadFileFormat|string)}=} [options] (or just call it 'mode' or such?)
 * @return {!jQuery.Promise} will also push progress updates using notify()
 */
blq.readFile = function(file, options) {
	assert(file != null);

	options = $.extend({
		output: blq.ReadFileFormat.Base64 // ok default?
	}, options);
	assert(typeof options.output == 'string');

	var d = jQuery.Deferred();

	// @see https://developer.mozilla.org/en-US/docs/DOM/FileReader
	var reader = new FileReader();
	reader.onloadend = function(e) {
		var data = this.result; // == e.target.result

		if (options.output == 'base64') {
			var urlData = blq.parseDataUrl(data);
			if (urlData == null) {
				// error!
				console.warn('blq.readFile: empty dataUrl');
				// data = null?
				// todo: errback!
			} else {
				data = urlData.data;
			}
		}

		d.resolve({
			name: file.name, // observe that this is only the file name, Not a full url (Security issue, that's why we have to read data here..)
			mimeType: file.type,
			// todo: size also?
			// todo: lastModified?
			// todo: or just let ".file" be raw file object..
			file: file, // ..?
			data: data
		});
	};

	reader.onerror = function(error) {
		d.reject(error);
	};

	reader.onprogress = function(e) {
		d.notify(e);
	};

	reader.onabort = function(e) {
		d.reject(e);
	};

	// == blq.ReadFileFormat.*
	switch (options.output) {
		case 'text':
			reader.readAsText(file);
			break;

		case 'binarystring':
			reader.readAsBinaryString(file);
			break;

		case 'arraybuffer':
			reader.readAsArrayBuffer(file);
			break;

		default:
			console.warn('blq.readFile: invalid output format:', options.output, 'Fallback to dataUrl');
			// todo: or reject or throw? or return null?
		case 'dataurl':
		case 'base64': // convenience
			reader.readAsDataURL(file);
			break;
	}

	return d.promise();
};


return blq;

});
