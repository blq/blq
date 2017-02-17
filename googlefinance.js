/**
 * @fileoverview
 * Small helper for the - now deprecated - Google Finance API.
 * still seem to works though.
 *
 * @author Fredrik Blomqvist
 */
define(['jquery'], function($) {

// todo: hmm, or store this stuff separate/hidden? (now exported)
var finance = {
	url: 'https://www.google.com/finance/info'
};

/*
 todo: the values could be "refined" to more fitting types. now always strings it seems.. -> store name + type propagator fn?
 @see https://www.quora.com/What-do-the-following-attributes-returned-in-a-JSON-array-from-the-Google-Finance-API-mean
 @see http://www.quantatrisk.com/2015/05/07/hacking-google-finance-in-pre-market-trading-python/

// example return (Alibaba stock):
{
	c: "-1.02",
	c_fix: "-1.02",
	ccol: "chr",
	cp: "-1.20",
	cp_fix: "-1.20",
	e: "NYSE",
	id: "23536317556137",
	l: "83.78",
	l_cur: "83.78",
	l_fix: "83.78",
	lt: "Dec 24, 3:27PM EST",
	lt_dts: "2015-12-24T15:27:06Z",
	ltt: "3:27PM EST",
	pcls_fix: "84.8",
	s: "0",
	t: "BABA"
}
*/
finance._keyToFullName = {
	'id'     : 'ID',
	't'      : 'StockSymbol',
	'e'      : 'Index', // 'Exchange' ?
	'l'      : 'LastTradePrice',
	'l_cur'  : 'LastTradeWithCurrency',
	'ltt'    : 'LastTradeTime',
	'lt_dts' : 'LastTradeDateTime',
	'lt'     : 'LastTradeDateTimeLong',
	'div'    : 'Dividend',
	'yld'    : 'Yield',
	// --
	't': 'Ticker'
	// todo: sit down and figure out rest..
};

/**
 * @param {string|Array.<string>} symbol
 * @return {!Promise} Array if input was an array
 */
finance.getStockQuote = function(symbol) {
	var symbols = typeof symbol == 'string' ? symbol : symbol.join(',');

	return Promise.resolve($.ajax(finance.url, {
		data: {
			client: 'ig', // ? seems to work without
			q: symbols
		}
	}))
	.then(function(ret) {
		// remove odd blocker comment prefix
		var json = ret.replace('//', '');
		return JSON.parse(json);
	})
	.then(function(res) {
		// transform to long names (in-place)
		res.forEach(function(stock) {
			// grab keys up-front since we'll modify them
			// (assuming no dups with the xfrm dict.. safest would be a clone/copy of course..)
			var keys = Object.keys(stock);
			keys.forEach(function(k) {
				var newKey = finance._keyToFullName[k];
				if (newKey != null) {
					stock[newKey] = stock[k];
					delete stock[k];
				} else {
					console.debug('unrecognized abrv key:', k);
				}
			});
		});
		// overload return on input arg style
		// todo: or transform into a dictionary? symbol->data ?
		if (res.length == 1 && typeof symbol == 'string')
			return res[0];
		return res;
	});
};


return finance;

});
