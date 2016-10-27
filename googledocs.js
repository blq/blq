/**
 * @fileoverview
 * Google Sheets and Forms stuff
 *
 * @author Fredrik Blomqvist
 */
define(['blq/assert', 'jquery', 'blq/jsonpi'], function(assert, $, jsonpi) {

// namespace
var blq =  {};

/**
 *
 * @see blq.getGoogleSpreadsheet()
 * @param {!Object} json
 * @param {Object=} [columns]
 * @return {!Object} simplified document content
 */
blq._parseGoogleSpreadsheetJson = function(json, columns) {
	assert(json != null);

	columns = columns || {};
	var feed = json.feed;

	var doc = {
		id: feed.id.$t, // url
		title: feed.title.$t, // todo: ? this isn't the title user specifies :(
		updated: new Date(feed.updated.$t),
		// can be plural..
		author: {
			name: feed.author[0].name.$t,
			email: feed.author[0].email.$t
		}
	};

	var rows = (feed.entry || []).map(function(entry) {
		// always add a parsed date (ok?)
		var date = new Date(entry.updated.$t); // todo: hmm or 'timestamp'? (or that was only for our form?)
		var row = {	updated: date };
		// todo: check "entry.title.type" for type?
		// inject rest of columns
		for (var key in columns) {
			// todo: allow user to specify columns in readable form. ! must remove trailing ':' also! (can't find a spec..)
		//	var entryKey = 'gsx$' + key.toLowerCase().replace(/\s+/, '');
			var entryKey = 'gsx$' + key;
			var value = entry[entryKey].$t;

			var slot = columns[key];
			if (typeof slot == 'function') {
				var keyval = slot(value);
				slot = keyval[0];
				value = keyval[1];
			}
			row[slot] = value;
		}
		return row;
	});

	doc.rows = rows;

	return doc;
};


/**
 * retrieve a publicly shared Google Spreadsheet (via JSONP)
 * @see blq._parseGoogleSpreadSheetJson()
 * todo: hmm, or should take column specs here directly. a public fn shouldn't need to parse as separate step..
 * todo: overload so you can simply pass an enture spreadsheet url for simplcity?
 *
 * @param {string} docId  (this is the key you see in the url of your spreadsheet)
 * @param {string=} [wsId=1]
 * @return {!jQuery.Promise} typically feed result to blq._parseGoogleSpreadSheetJson()
 */
blq.getGoogleSpreadsheet = function(docId, wsId) {
	assert(docId != null);

	wsId = wsId || '1'; // or 'od6'??
	// @see https://developers.google.com/gdata/samples/spreadsheet_sample
	// @see https://developers.google.com/gdata/docs/json
	return $.ajax('https://spreadsheets.google.com/feeds/list/' + docId +'/'+ wsId + '/public/values', {
		data: { alt: 'json-in-script' },
		dataType: 'jsonp'
	});
};


/**
 * @param {string} formId  (this is the key you see in the url of the form - Note: Not same as the spreadsheet url key used when getting data!)
 * @param {!Object} entries json dictionary {entryId->value}
 * @return {!Promise}
 */
blq.postToGoogleFormSpreadSheet = function(formId, entries) {
	assert(typeof formId == 'string');
	assert(entries != null); // todo: or allow empty?

	// copy entries to new object (don't want to modifie input data)
	// and prefix names with "entry." for convenience (ok? always true?)
	var params = {};
	for (var name in entries) {
		params['entry.'+name] = entries[name];
	}

	return jsonpi.callJSONPI('https://docs.google.com/forms/d/' + formId + '/formResponse', params, { method: 'POST' });
};


return blq;

});
