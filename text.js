
define(['blq/assert'], function(assert) {

// namespace
var text = {};

/**
 * @see https://github.com/bevacqua/fuzzysearch
 * similar to, but faster, than the Levenshtein distance based algo (see MochikIt.Text-ext)
 *
 * @param {string} needle
 * @param {string} haystack
 * @param {(function(string, string): boolean)=} [cmp] BinaryPredicate, defaults to identical (===) match
 * @return {boolean}
 */
text.fuzzySearch = function(needle, haystack, cmp) {
	assert(typeof needle == 'string');
	assert(typeof haystack == 'string');

	cmp = cmp || function(a, b) { return a === b; }; // == MochiKit.Base.operator.seq()
	assert(typeof cmp == 'function');

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

return text;

});
