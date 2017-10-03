/**
 * @fileoverview
 * Design By Contract, DBC
 * @see https://en.wikipedia.org/wiki/Design_by_contract
 * @see http://c2.com/cgi/wiki?DesignByContract
 *
 * @author Fredrik Blomqvist
 *
 * This code adopts the conventions of cls.__invar, cls.method__pre, cls.method__post convention.
 * from http://www.nongnu.org/pydbc/
 *
 * todo: not quite ready, needs more IRL use..
 */
define(['blq/aop'], function(aop) {

// namespace
var dbc = {};

dbc.checkPrecondiation = function() {
};

dbc.checkPostcondition = function() {
};

dbc.checkinvariant = function() {

};

dbc._hasPreCond = function(cls, methodName) {
	return typeof cls.prototype[methodName + '__pre'] == 'function';
};

dbc._getPreCond = function(cls, methodName) {
	var m = cls.prototype[methodName + '__pre'];
	return typeof m == 'function' ? m : null;
};

dbc._hasPostCond = function(cls, methodName) {
	return typeof cls.prototype[methodName + '__post'] == 'function';
};

dbc._getPostCond = function(cls, methodName) {
	var m = cls.prototype[methodName + '__post'];
	return typeof m == 'function' ? m : null;
};

dbc._hasInvariant = function(cls) {
	return typeof cls.prototype['__invar'] == 'function';
};

dbc._getInvariant = function(cls) {
	var m = cls.prototype['__invar'];
	return typeof m == 'function' ? m : null;
};


// hmm, can be both class and obj
dbc.addDBC = function(cls) {

	var _isPrivate = function(methodName) {
		return methodName.indexOf('_') == 0;
	};

	//-----

	var invariant = dbc._getInvariant(cls);

	for (var k in cls) {
		var m = cls[k];

		if (typeof m == 'function') {
			if (invariant != null && !_isPrivate(k)) { // add invariant only around public methods
				cls[k] = aop.around(m, invariant);
			}

			var pre = dbc._getPreCond(cls, k);
			if (pre != null) {
				cls[k] = aop.before(m, pre);
			}

			var post = dbc._getPostCond(k);
			if (post != null) {
				cls[k] = aop.after(m, post);
			}
		}
	}
};


return dbc;

});

//-----------
//
// function Foo()
// {
// 	this._bar = 123;
// };
//
// Foo.prototype.__invariant__ = function() {
// 	assert(this._bar > 0);
// };
//
// Foo.prototype.method1 = function()
// {
// };
