/**
 * @fileoverview
 * tiny helper for YQL, Yahoo Query Language
 * @see https://developer.yahoo.com/yql/
 *
 * @author Fredrik Blomqvist
 *
 */
define(['blq/assert, jquery'], function(assert, $) {

// Yahoo Query Language
var yql = {
	// todo: api key (for non public queries)
	url: 'https://query.yahooapis.com/v1/public/yql',
	_env: 'http://datatables.org/alltables.env' // todo: https? alltableswithkeys?
};

/**
 * @param {string} query
 * @return {!jQuery.Promise}
 */
yql.query = function(query) {
	assert(query != null);

	return $.ajax(yql.url, {
		data: {
			q: query,
			format: 'json',
			diagnostics: true,
			env: yql._env
		}
	});
};


/**
 * first test. make more generic!
 *
 * @see http://www.datatables.org/
 *
 * @param {string|!Array.<string>} stocks
 * @return {!jQuery.Promise}
 */
yql.getCurrentStockQuote = function(stocks) {
	assert(stocks != null);

	stocks = Array.isArray(stocks) ? stocks : [stocks]; // todo: or rather use flatten on the input?

	var query = 'select * from yahoo.finance.quotes where symbol in ("' + stocks.join('","') + '")';

	return yql.query(query);
};


/**
 * @param {string|!Array.<string>} stocks
 * @param {!Date} startDate (or take a time-interval instead?) todo: overload on a plain iso-like (sub)string also? "2014"?
 * @param {!Date=} [endDate=now]
 * @return {!jQuery.Promise}
 */
yql.getHistoricalStockData = function(stocks, startDate, endDate) {
	assert(stocks != null);
	assert(startDate != null);

	startDate = startDate.toISOString().substr(0, 10);
	endDate = (endDate || new Date()).toISOString().substr(0, 10); // default to now

	stocks = Array.isArray(stocks) ? stocks : [stocks];

	var query = 'select * from yahoo.finance.historicaldata where symbol in ("' + stocks.join('","') + '") and startDate = "' + startDate + '" and endDate = "' + endDate + '"';

	return yql.query(query);
};


return yql;

});
