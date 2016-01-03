/**
 * @fileoverview
 * quick test to implement the PCG random number generator
 * http://www.pcg-random.org/
 *
 * specifically the basic subset:
 * @see https://github.com/imneme/pcg-c-basic/blob/master/pcg_basic.c
 *
 * for proper integration api see:
 * @see https://github.com/blq/mochikit/blob/master/MochiKit/Random.js
 * @see https://github.com/blq/mochikit/blob/master/MochiKit/_MersenneTwister19937.js
 *
 * @author Fredrik Blomqvist
 *
 */

define(['goog/math/Long'], function() {

// todo: hmm, this is a two-complement lib.. pcg assumes unsigned. might need to change!
var Long = goog.math.Long;

// tood: ? why isn't something like this alreday in the lib??
Long.copy = function(a) {
	return new Long(a.getHighBits(), a.getLowBits()); // == Long.fromBits()
};


var get_initializer = function() {
	return {
		// these numbers are "0x***uLL" in C++..
		state: Long.fromString('853c49e6748fea9b', 16),
		inc: Long.fromString('da3e39cb94b95bdb', 16)
	};
};


var global = get_initializer();


var seed_random_r = function(rng, initstate, initseq) {
	rng.state = Long.copy(Long.ZERO);
	rng.inc = initseq.shiftLeft(1).or(Long(1));
	random_r(rng);
	rng.state = rng.state.add(initstate);
	random_r(rng);
};

var seed_random = function(seed, seq) {
	seed_random_r(global, seed, seq);
};


var random_r = function(rng) {
	var oldstate = Long.copy(rng.state);
	rng.state = oldstate.multiply(Long.fromString('6364136223846793005')).add(rng.inc);
	var xorshifted = oldstate.shiftRightUnsigned(18).xor(oldstate).shiftRightUnsigned(27);
	var rot = oldstate.shiftRightUnsigned(59);
	return xorshifted.shiftRightUnsigned(rot).or(xorshifted.shiftLeft(Long.copy(rot).negate().and(31)));
};

var random = function() {
	return random_r(global);
};


var bounded_random_r = function(rng, bound) {
	// todo: ..
};

var bounded_random = function(bound) {
	// todo: ..
};


	return window.pcg = {
		random: random
		// ...
	};

});
