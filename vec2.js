/**
 * @author Fredrik Blomqvist
 *
 * @fileoverview
 * 2D vector algebra.
 * Should be able to work with any object with a .x and .y number property (integral or fp. type).
 *
 * todo: could be split in more modules
 * todo: matrix transforms (matrix.js)
 * todo: hmm, should decide on more consistent naming conventions for mutable/immutable operations.
 * 		particularly normalize, negate etc. (Normalize is currently the only mutable operation)
 * 		(or simply make everything immutable?)
 *
 */
define(['blq/math'], function(math) {

/**
 * namespace
 * @const
 */
var vec2 = {};


/**
 * for comparisons. Set to your likings.
 * see setEpsilon/getEpsilon
 * see <a href="#method_equals">equals</a>
 * @type {number}
 * @private
 */
vec2._Epsilon = 0.000001; // ok default?

/**
 * Global Epsilon used for Vec2 comparison.
 * todo: or drop this and just expose the epsilon as a public property?
 * see <a href="#method_equals">equals</a>
 *
 * @param {number} epsilon
 */
vec2.setEpsilon = function(epsilon) {
	vec2._Epsilon = epsilon;
};

/**
 * Global Epsilon used for Vec2 comparison.
 * see <a href="#method_equals">equals</a>
 *
 * @return {number}
 */
vec2.getEpsilon = function() {
	return vec2._Epsilon;
};

/**
 * You should assume this is the precondition
 * (PC, assertion) for all vector operations.
 *
 * todo: support multiple parameters to match Mochi-conventions?
 * todo: alias as isPointLike?
 *
 * @param {*} v
 * @return {boolean}
 */
vec2.isVec2Like = function(v) {
//	return (typeof v == 'object' && v !== null && typeof v.x == 'number' && typeof v.y == 'number');
	return typeof v == 'object' && v !== null && math.isNumber(v.x) && math.isNumber(v.y);
};

/**
 * note: supports multiple arguments
 *
 * @param {!Vec2} a
 * @param {!Vec2} b
 * @param {...!Vec2} [var_args]
 * @return {!Vec2} a + b
 */
vec2.add = function(a, b, var_args) {
/*	return MochiKit.Iter.reduce(
		function(a, b) {
			return { x: a.x + b.x, y: a.y + b.y };
		},
		arguments
	);
*/
	var ret = { x: arguments[0].x, y: arguments[0].y };
	for (var i = 1; i < arguments.length; ++i) {
		ret.x += arguments[i].x;
		ret.y += arguments[i].y;
	}
	return ret;
};

/**
 * note: supports multiple arguments
 *
 * @param {!Vec2} a
 * @param {!Vec2} b
 * @param {...!Vec2} [var_args] perhaps not as common to call sub with more than two arguments but still useful
 * @return {!Vec2} a - b
 */
vec2.sub = function(a, b, var_args) {
/*	return MochiKit.Iter.reduce(
		function(a, b) {
			return { x: a.x - b.x, y: a.y - b.y };
		},
		arguments
	);
*/
	var ret = { x: arguments[0].x, y: arguments[0].y };
	for (var i = 1; i < arguments.length; ++i) {
		ret.x -= arguments[i].x;
		ret.y -= arguments[i].y;
	}
	return ret;
};

/**
 * Dot product (inner-product, scalar-product, ( = |u||v|*cos(theta) )
 *
 * @param {!Vec2} u
 * @param {!Vec2} v
 * @return {number} a.b
 */
vec2.dot = function(u, v) {
	return u.x * v.x + u.y * v.y;
};

/**
 * Magnitude(length) of vector (add as alias?)
 *
 * @param {!Vec2} v
 * @return {number} Euclidian length of vector
 */
vec2.norm = function(v) {
	return Math.sqrt(vec2.dot(v, v));
};

/**
 * alias for <a href="#method_norm">norm</a>
 * todo: "dangerous" name?
 *
 * @param {!Vec2} v
 * @alias norm
 * @return {number} Euclidian length of vector
 */
vec2.length = function(v) {
	return vec2.norm(v);
};

/**
 * normalizes v (|v| = 1) and returns the old norm
 * note: this is the only mutable operation!
 *
 * @param {!Vec2} v
 * @return {number} previous norm (before normalization)
 */
vec2.normalize = function(v) {
	var norm = vec2.length(v);
	v.x /= norm;
	v.y /= norm;
	return norm;
};

/**
 * s*v (or v*s if scalar-vector arguments are reversed) or
 * element-vise multiplication(scale) if both arguments are Vec2s.
 *
 * @param {(number|!Vec2)} s
 * @param {(!Vec2|number)} v
 * @return {!Vec2} s*v
 */
vec2.scale = function(s, v) {// mul?
	if (math.isNumber(s) && vec2.isVec2Like(v)) {
		return { x: s * v.x, y: s * v.y };
	} else
	if (vec2.isVec2Like(s) && math.isNumber(v)) {
		return vec2.scale(v, s);
	} else
	if (vec2.isVec2Like(s) && vec2.isVec2Like(v)) {
		return { x: s.x * v.x, y: s.y * v.y };
	}
	return vec2.zero; // just to avoid a warning, cannot be reached using the legal combinations of args
};

/**
 * definition: add(v, negate(v))) == (0,0)
 *
 * @param {!Vec2} v
 * @return {!Vec2} -v
 */
vec2.negate = function(v) { // or invert?
	return { x: -v.x, y: -v.y }; // == scale(-1, v)
};

/**
 * todo: add a compare also? (definition? just lexic x,y?)
 *
 * @param {!Vec2} a
 * @param {!Vec2} b
 * @param {number=} [epsilon] default vec2.getEpsilon()
 * @return {boolean} a == b? (within epsilon tolerance)
 */
vec2.equals = function(a, b, epsilon) { // ok name? clash?
	epsilon = typeof epsilon == 'number' ? epsilon : vec2.getEpsilon();

	var dv = vec2.sub(a, b); // or use 'norm(sub(a, b)) <= epsilon'? (to get a circular error diff distribution instead of square)

	return Math.abs(dv.x) <= epsilon && Math.abs(dv.y) <= epsilon;
};

/**
 * definition: dot(v, ortho(v)) == 0
 * todo: provide a param (or two versions?) controlling which direction the flip should take? (CW, CCW)
 * todo: rename 'perp'?
 *
 * @param {!Vec2} v
 * @return {!Vec2} vector v rotated 90 degrees (retains magnitude)
 */
vec2.ortho = function(v) {
	return { x: v.y, y: -v.x };
};

/**
 * Equiv to the magnitude of the z-comp of the cross product of a & b in the x-y plane.
 * sin(t)|a||b| = det(a,b) = 2*area of the spanned triangle
 *
 * @param {!Vec2} a
 * @param {!Vec2} b
 * @return {number}
 */
vec2.determinant = function(a, b) { // or just det()? (alias?)
	return (a.x * b.y) - (a.y * b.x);
};

/**
 * LinEar inteRPolation
 *
 * @param {number} t (0..1) t=0 => p0, t=1 => p1
 * @param {!Vec2} p0
 * @param {!Vec2} p1
 * @return {!Vec2}
 */
vec2.lerp = function(t, p0, p1) { // or change to (p0, p1, t) order?
	return vec2.add(p0, vec2.scale(t, vec2.sub(p1, p0))); // = p0 + t*(p1 - p0)
};

/**
 * angle between two vectors in radians. (-Pi, Pi).
 *
 * @param {!Vec2} u
 * @param {!Vec2=} [v=x_axis] Note: in this case the angle is within [0, 2*Math.Pi)
 * @return {number} (-Pi, Pi)
 */
vec2.angle = function(u, v) {
	if (arguments.length == 1) {
		v = arguments[0];
		u = vec2.x_axis;

		var angle = Math.atan2(vec2.determinant(u, v), vec2.dot(u, v));
		if (angle < 0) // push angle to 0..2*pi
			angle += 2*Math.PI;
		return angle;
	} else {
		return Math.atan2(vec2.determinant(u, v), vec2.dot(u, v));
	}
};


/**
 * @param {!{ a: number, r: number }} polar
 * @return {!Vec2}
 */
vec2.fromPolar = function(polar) {
	return {
		x: polar.r*Math.cos(polar.a),
		y: polar.r*Math.sin(polar.a)
	};
};


/**
 * @param {!Vec2} v
 * @return {!{ a: number, r: number }}
 */
vec2.toPolar = function(v) {
	return {
		a: vec2.angle(v),
		r: vec2.norm(v)
	};
};


/**
 * Matrix transformation (Vec2 treated as a _column_ vector (post-multiplication)).
 * todo: move to separate package and write/specify a matrix.js or affine2d.js? (decide on matrix naming conventions etc)
 * @param {!Matrix} m (.tx/.ty = translation) (need an is2dTransformLike?)
 * @param {!Vec2} v
 * @return {!Vec2}
 */
vec2.transform = function(m, v) { // mul?
	return {
		x: m[0]*v.x + m[1]*v.y + m.tx,
		y: m[2]*v.x + m[3]*v.y + m.ty
	};
};


vec2.swap_xy = function(v) {
	return { x: v.y, y: v.x };
};


// constants, deliberately not written as "raw" constants vars to
// ease use (factory style) and of course avoid accidental modifications.

/**
 * @return {!Vec2}
 */
vec2.zero = function() { return { x: 0, y: 0 }; };
/**
 * alias for vec2.zero
 * @return {!Vec2}
 */
vec2.origo = vec2.zero;
/**
 * @return {!Vec2}
 */
vec2.x_axis = function() { return { x: 1, y: 0}; };
/**
 * @return {!Vec2}
 */
vec2.y_axis = function() { return { x: 0, y: 1 }; };

/**
 * definition is counter clockwise, starting from upper-right (positive x & y). 1-based
 * todo: or create separate named versions? (as roman numbers? :) )
 * todo: option to return a normalized (div sqrt2) vector?
 * @see vec2.getQuadrant
 *
 * @param {integer} n 1-based (todo: or change to 0-based? todo: change to enum?)
 * @return {!Vec2}
 */
vec2.quadrant = function(n) {
	switch (n) {
		case 1:
			// UR
			return { x: 1, y: 1 };
		case 2:
			// UL
			return { x: -1, y: 1 };
		case 3:
			// LL
			return { x: -1, y: -1 };
		case 4:
			// LR
			return { x: 1, y: -1 };
		default:
			// assert? return undefined/null?
			break;
	}
};

/**
 * counter clockwise from UR. 1-based
 * todo: perhaps even more generic version? octants etc (compass-rose thingy)
 * @see vec2.quadrant
 *
 * @param {!Vec2} v
 * @return {integer} (1,2,3,4)
 */
vec2.getQuadrant = function(v) {
	var x = math.sign(v.x);
	var y = math.sign(v.y);

	// Wolfram: solve {{1,1,1,1}, {-1,1,-1,1}, {-1,-1,1,1}, {1,-1,-1,1}}*{{a},{b},{c},{d}}=2*{{0},{1},{2},{3}}
	// we multiply the result with 2 to push solver result up to even integers so we can then instead
	// simply use a right-shift on the result to get the result without using any decimal calculations.
	// todo: should be possible to with only bit-stuff. XOR instead of mul etc.
/*
	var a = 0;
	var b = -2;
	var c = -1;
	var d = 3;

	return ((a*x + b*y + c*x*y + d) >> 1) + 1;
*/
	return ((3 - 2*y - x*y) >> 1) + 1;
};


// export
return vec2;

});
