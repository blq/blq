/**
 * @author Fredrik Blomqvist
 */
define(['blq/assert', 'jquery', 'blq/util'], function(assert, $, util) {

// namespace
var jsonpi = {};

/**
 * "JSONPI"
 * @see http://www.slideshare.net/benvinegar/modern-iframe-programming-8281214
 * todo: dang, unless other site cooperates (similar to JSONP) we still get XSS reject.. :(
 * A pure "blind" POST works though, but without any error-callback.
 *
 * @param {string} url
 * @param {!Object.<string, *>} params
 * @param {=Object} [options]
 * @return {!Promise} .. seems we can't give response data, i.e we're basically limited to "blind" POSTs (unless we're on same domain) :(
 */
jsonpi.callJSONPI = function(url, params, options) {
	assert(typeof url == 'string');
	params = params || {};

	options = $.extend({
		method: 'GET', // or 'POST'
		parseResponse: JSON.parse // todo: or allow a more "brutal" eval() ?
	}, options);

	var name = '__blq_jsonpi_' + util.getUid();

	return new Promise(function(resolve, reject) {
		
		var iframe = $('<iframe>', {
			name: name,
			width: 0, height: 0,
			css: {
				display: 'none'
			}
		});

		var form = $('<form>', {
			action: url,
			target: name,
			method: options.method
			// submit: '' // ?
			// enctype: 'multipart/form-data' ? (for POST)
		});

		for (var key in params) {
			form.append($('<input>', {
				// type: 'text', // necessary?
				name: key,
				value: params[key]
			}));
		}

		form.append(iframe); // can be in anywhere in document but nice to keep local
		$('body').append(form);
		
		// todo: if always XSS block we need to change to always succeed I guess.. :(
		iframe.on('load', function() {
			try {
				// grab the (json) content
				// var msg = $(this.contentWindow.document.body).text();	// or (iframe.contentDocument || iframe.contentWindow.document)
				var msg = $(this).contents().find('body').text(); // should be more portable (see dom.getIframeDocument)
				var ret = typeof options.parseResponse == 'function' ? options.parseResponse(msg) : msg;

				resolve(ret);
			} catch(ex) {
				// invalid json or such
				reject(ex);
			}
			finally {
				form.remove(); // cleanup	
			}			
		});
		
		form.submit();
	});
};


return jsonpi;

});
