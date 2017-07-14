/**
 * @author Fredrik Blomqvist
 *
 */
define([], function() {

// namespace
var ns = {};

/**
 * @see blq.listenForDragDrop() and blq.readFile() options
 * @see blq.readFile() options
 * @enum {string}
 */
ns.ReadFileFormat = {
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
ns.parseDataUrl = function(dataUrl) {
	// assert(typeof dataUrl == 'string');

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
 * @see https://developer.mozilla.org/en-US/docs/DOM/FileReader
 *
 * @param {!(File|Blob)} file (typically from <file> or drag'n drop operation)
 * @param {{output: (ReadFileFormat|string)}=} [options] (or just call it 'mode' or such?)
 * @return {!Promise} will also push progress updates using notify()
 */
ns.readFile = function(file, options) {
	// assert(file != null);

	options = options || {};
	options.output = options.output || ns.ReadFileFormat.Base64 // ok default?
	options.progress = options.progress || function() {};
	// assert(typeof options.output == 'string');

	return new Promise(function(resolve, reject) {
		var reader = new FileReader();

		reader.onloadend = function(e) {
			var data = this.result; // == e.target.result

			if (options.output == 'base64') {
				var urlData = ns.parseDataUrl(data);
				if (urlData == null) {
					// error!
					console.warn('blq.readFile: empty dataUrl');
					// data = null?
					// todo: errback!
				} else {
					data = urlData.data;
				}
			}

			resolve({
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
			reject(error);
		};

		reader.onprogress = function(e) {
			options.progress(e);
		};

		reader.onabort = function(e) {
			reject(e);
		};

		// == blq.ReadFileFormat.*
		switch (options.output) {
			case 'text':
				reader.readAsText(file); // default is 'UTF8'
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
	});
};


return ns;

});
