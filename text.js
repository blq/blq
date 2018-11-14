/**
 *
 * @author Fredrik Blomqvist
 *
 */
define([], function() {

// namespace
var api = {};

/**
 * @see https://github.com/bevacqua/fuzzysearch
 * similar to, but faster, than the Levenshtein distance based algo (see MochiKit.Text-ext)
 *
 * @param {string} needle
 * @param {string} haystack
 * @param {(function(string, string): boolean)=} [cmp] BinaryPredicate, defaults to identical (===) match
 * @return {boolean}
 */
api.fuzzySearch = function(needle, haystack, cmp) {
	// assert(typeof needle == 'string');
	// assert(typeof haystack == 'string');

	cmp = cmp || function(a, b) { return a === b; }; // == MochiKit.Base.operator.seq()
	// assert(typeof cmp == 'function');

	var hlen = haystack.length;
	var nlen = needle.length;

	if (nlen > hlen) {
		return false;
	}
	if (nlen === hlen) {
		return cmp(needle, haystack);
	}

	outer: for (var i = 0, j = 0; i < nlen; i++) {
		var nch = needle.charCodeAt(i);
		while (j < hlen) {
			if (cmp(haystack.charCodeAt(j++), nch)) {
				continue outer;
			}
		}
		return false;
	}
	return true;
};


/**
 * @type {Object<string, BinaryComparator>}
 * @private @const
 */
var _humanCompareCache = {
	// .. typically probably only one per session (one locale and one case-setting)
};

/**
 * String compare helper to make sorting human friendly -> "1" < "2" < "10" !
 * Factory.
 *
 * Default is case insensitive (and also accent insensitive)
 *
 * Uses the 'Intl' API if available @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Collator
 *
 * todo: hmm, overload so this can be used directly as cmp? or expose another function also? (one factory, one direct cmp?)
 *
 * @param {{case_sensitive: boolean, locale: string}=} options locale default browser's locale(s)
 * @return {BinaryComparator}
 */
api.createHumanStringCompare = function(options) {
	options = Object.assign({
		case_sensitive: false,
		locale: navigator.language // todo: need to sniff for this too? (there's also navigator.languages array -> inline all!?)
	}, options);

	// cache based on case+locale -> function
	var cacheKey = options.locale + '|' + options.case_sensitive; // i.e "en-US|false"
	var hcmp = _humanCompareCache[cacheKey];
	if (hcmp) {
		return hcmp;
	}

	// this is basically MochiKit's compare() for string (i.e cut out the registry stuff)
	var cmp = function(a, b) {
		if (a == b) {
            return 0;
		}
		// yes, need null-stuff to be consistent
        var aIsNull = (typeof a == 'undefined' || a === null);
        var bIsNull = (typeof b == 'undefined' || b === null);
        if (aIsNull && bIsNull) {
            return 0;
        } else if (aIsNull) {
            return -1;
        } else if (bIsNull) {
            return 1;
        }
        if (a < b) {
            return -1;
        } else if (a > b) {
            return 1;
        }
	};

	// default is old impl. only case-insensitive (yes, there are algos for this but new browsers most likely have the Intl API)
	var strCmp = options.case_sensitive ? cmp : function(a, b) {
		return cmp(a.toLowerCase(), b.toLowerCase());
	};

	try {
		// sniff for support (basically only older IE fails @see https://caniuse.com/#feat=internationalization )
		var collator = null;
		if (typeof Intl != 'undefined' && typeof Intl.Collator == 'function') {
			// fallback to en-US in case the other culture fails (incompatibility with Culture Codes)
			// (yes, can do inline in localeCompare, but constructed once for performance)

			// locales are passed in priority order (allowed to fail also actually)
			var langs = Array.isArray(navigator.languages) ? navigator.languages : [navigator.language]; // Edge doesn't have it!
			collator = new Intl.Collator([options.locale].concat(langs).concat(['en-US']), {
				// case on/off, but keep accents different é != e ('variant' is default)
				// ('case' vs 'base' would ignore accents)
				sensitivity: options.case_sensitive ? 'variant' : 'accent',
				numeric: true // == locale+'-u-kn-true'
			});
		}

		if (collator != null)
			strCmp = collator.compare.bind(collator); // (bind is probably not needed but anyway)
	} catch(ex) {
		console.error('Intl detection failed:', ex);
	}

	_humanCompareCache[cacheKey] = strCmp;

	return strCmp;
};



return api;

});
