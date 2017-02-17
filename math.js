/**
 * @fileoverview
 * Math functions
 * todo: use ES6 Math @see https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Math
 *
 * @author Fredrik Blomqvist
 *
 */

define([], function() {

'use strict';

/**
 * exported api
 * @const
 */
var math = {};

/**
 * todo: rename isValidNumber?
 * todo: support multiple parameters to match Mochi-conventions?
 *
 * @param {*} v
 * @return {boolean}
 */
math.isNumber = function(v) { // rename isValidNumber?
	return typeof v == 'number' && v !== null && isFinite(v); // or use isNaN?
};

/**
 * converts radians to degrees
 *
 * @param {number} rad radians
 * @return {number} decimal degrees
 */
math.radToDeg = function(rad) { // or simply degrees()? (as Python)
	return rad * 180 / Math.PI;
};

/**
 * converts degress to radians
 *
 * @param {number} deg degrees
 * @return {number} radians
 */
math.degToRad = function(deg) { // or simply radians()? (as Python)
	return deg * Math.PI / 180;
};

/**
 * forces value to be within min- and maxValue. i.e: minValue <= value <= maxValue
 * todo: take an optional cmp-func also? (or use MochiKit.Base.objMax/Min (MochiKit.Base.compare))
 *
 * @param {number} value
 * @param {number} minValue  (hmm, default to 0?)
 * @param {number} maxValue  (hmm, default to MAXVALUE?)
 * @return {number}
 */
math.clamp = function(value, minValue, maxValue) {
	return Math.min(Math.max(minValue, value), maxValue);
};


/**
 * Rounds a number to a specific number of decimal places
 * see also <a href="http://mochikit.com/doc/html/MochiKit/Format.html#fn-roundtofixed">MochiKit.Format.roundToFixed()</a> and <a href="#method_roundToMaxFixed">Franson.Util.roundToMaxFixed()</a>
 *
 * @param {number} value
 * @param {integer=} [numDecimals=3]
 * @return {number}
 */
math.roundToNDecimals = function(value, numDecimals) {
	numDecimals = typeof numDecimals == 'number' ? numDecimals : 3;

	var scale = Math.pow(10, numDecimals);

	return Math.round(value * scale) / scale;
};


/**
 * PC: rangeStart <= rangeEnd
 * uses half-open range. i.e random(0, 10) => values within [0..9] (i.e [0,10) in range-notation)
 * @deprecated use MochiKit.Random (supports seeding etc)
 *
 * @param {integer=} [rangeStart=0]
 * @param {integer=} [rangeEnd=rangeStart] if not set method returns [0..rangeStart-1]
 * @return {integer} number in range [rangeStart..rangeEnd-1]
 */
math.random = function(rangeStart, rangeEnd) {
	// handle single param overload
	if (typeof rangeEnd != 'number') {
		rangeEnd = rangeStart;
		rangeStart = 0;
	}

	var range = rangeEnd - rangeStart;

	return Math.floor(Math.random() * range) + rangeStart;
};


/**
 * example: <code>var xlog10 = math.logN(x, 10);</code>
 *
 * @param {number} val
 * @param {number=} [base=10]
 * @return {number} val to the base-logarithm
 */
math.logN = function(val, base) { // or swap param order?  (logb, logB?)
	base = base || 10;
	return Math.log(val) / Math.log(base);
};

/**
 * @deprecated use Math.log2()
 * @param {number} val
 * @return {number}
 */
math.log2 = Math.log2 || function(val) {
	return Math.log(val) / Math.LN2;
};

/**
 * @deprecated use Math.log10()
 * alias base 10, just for readability.
 * @param {number} val
 * @return {number}
 */
math.log10 = Math.log10 || function(val) {
	return math.logN(val, 10);
};

/**
 * lerp, LinEar inteRPolation
 *
 * @param {number} a
 * @param {number} b
 * @param {number} t (0..1) t=0 => a, t=1 => b (< 0 and > 1 works too of course, giving extrapolation)
 *
 * @return {number}
 */
math.lerp = function(a, b, t) {
	return a + t*(b - a);
};


/**
 * @deprecated use Math.sign()
 * @param {number} v
 * @return {integer} -1, +1
 */
math.sign = Math.sign || function(v) {
	return v < 0 ? -1 : 1;
};


/**
 * similar to Math.ceil() but will ceil the value based on magnitude (i.e away from zero).
 * i.e ceilMag(-0.7) == -1 instead of 0.
 * def: abs(ceilMag(v))) == abs(ceilMag(-v)) (symmetric around 0)
 * (or simply: floor if v < 0, ceil if v > 0)
 * todo: I'm quite sure this operation has a better/official name? roundAwayFromZero? ("stretch"??)
 * @see http://msdn.microsoft.com/en-us/library/system.midpointrounding.aspx
 *
 * Please note that floating point doesn't behave "perfectly". you *will* get minor differences..
 *
 * @see math.trunc() but towards zero.
 *
 * @param {number} v
 * @return {integer}
 */
math.ceilMag = function(v) {
//	return math.sign(v) * Math.ceil(Math.abs(v));
	return v < 0 ? Math.floor(v) : Math.ceil(v);
};

/**
 * @deprecated use Math.trun()
 * rounds towards zero, regardless of sign (based on magnitude).
 *
 * @see math.ceilMag for rounding away fom zero.
 *
 * Please note that floating point doesn't behave "perfectly". you *will* get minor differences..
 *
 * @param {number} v
 * @return {number}
 */
math.trunc = Math.trunc || function(v) {
	return v < 0 ? Math.ceil(v) : Math.floor(v);
};

/**
 * returns the fractional part of value.
 * ex: frac(3.1415) == 0.1415
 * todo: name? fractional?
 *
 * Please note that floating point doesn't behave "perfectly". you *will* get minor differences..
 * -> frac(0.123) != frac(10.123) !! (0.12299999)
 * (yes, there's emulation tricks for this (also via strings!) but we don't use them!)
 *
 * @param {number} v
 * @return {number} >= 0
 */
math.frac = function(v) {
	return Math.abs(v - math.trunc(v));
};

/**
 * unnormalized Sinc
 * @see https://en.wikipedia.org/wiki/Sinc_function
 * @param {number} x (0 is undefined)
 * @return {number}
 */
math.sinc = function(x) {
	// todo: 0-epsilon check?
	return Math.sin(x) / x;
};

/**
 * todo: use precomputed array?
 * @param {number} num
 * @return {number} == num!
 */
math.factorial = function(num) {
    var rval = 1;
    for (var i = 2; i <= num; ++i)
        rval = rval * i;
    return rval;
};

// debug export
// window._math = math;

// export
return math;

});
