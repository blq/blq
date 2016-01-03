/**
 * @author Fredrik Blomqvist
 * Based on C++ code in GPG1:
 *
 * -----
 *
 * Copyright (C) Thatcher Ulrich, 2000.
 * All rights reserved worldwide.
 *
 * This software is provided "as is" without express or implied
 * warranties. You may freely copy and compile this source into
 * applications you distribute provided that the copyright text
 * below is included in the resulting source code, for example:
 * "Portions Copyright (C) Thatcher Ulrich, 2000"
 */

define([
	'MochiKit/Base', 'MochiKit/Iter'
], function() {


// todo: should/must make this more instance-like so we
// can run multiple trees with different settings simultaneously!

/**
 * namespace
 * @const
 */
var LQT = {
	/** @type {number} */
	WORLD_SIZE: 1000.0, // .. root size

	/** @type {integer} */
	MAX_DEPTH: 5, // ok default?

	/**
	 * amount of overlap tuning.
	 * 1 == standard quadtree, >= 1 -> moore "looseness"
	 * 2 might be best IRL and also allows faster insertion special case
	 * @type {number}
	 */
	LooseK: 2
};

//-----


// todo: must export these!
// enum Visibility:
var NOT_VISIBLE = 1;
var SOME_CLIP = 2;
var NO_CLIP = 3; // fully visible

//------

/**
 * todo: not ready (drop, just use Nodes?)
 * todo: take a node factory obj? (tree.newNode()) so tree<->node deps can be handled
 *
 * @param {number} worldSize
 * @param {Object=} [options]
 * @constructor
 */
LQT.LooseQuadTree = function(worldSize, options) {
	this.options = MochiKit.Base.update({
		LooseK: 2, // ok default?
		MAX_DEPTH: 5
	}, options);

	/** @type {number} */
	this.WORLD_SIZE = worldSize;
	/** @type {number} */
	this.LooseK = this.options.LooseK;
	/** @type {integer} */
	this.MAX_DEPTH = this.options.MAX_DEPTH;
};


/**
 * @param {integer}
 * @return {number}
 */
LQT.getHalfSize = function(depth) {
	return LQT.LooseK * LQT.WORLD_SIZE / (2 << depth);
};

/**
 * @param {integer}
 * @param {number}
 */
LQT.getOffset = function(depth) {
	return (LQT.WORLD_SIZE / (2 << depth)) / 2;
};


//-----------


/**
 * @param {LQT.Node} p parent
 * @param {number} x
 * @param {number} y
 * @param {integer} depth
 * @constructor
 */
LQT.Node = function(p, x, y, d) {
	/** @type {LQT.Node} */
	this.parent = p;
	this.parentQ = null; // [j, i] index into parent.child[]

	/** @type {!Array.<!Array.<LQT.Node>>} */
	this.child = [
		[null, null],
		[null, null]
	]; // or just change to a 1-dim arr? (or map?)

	// center
	/** @type {number} */
	this.cx = x;
	/** @type {number} */
	this.cy = y;

	/** @type {integer} */
	this.depth = d;

	/** @type {!Array} */
	this.objects = []; // or perhaps store these externally (just reference them indirectly using this node's id)
};

/**
 * @param {!LQT.Node} qnode
 * @return {!Array.<!LQT.Node>}
 */
LQT.getChildren = function(qnode) { // getChilds?
	var children = [];
	for (var j = 0; j < 2; ++j) {
		for (var i = 0; i < 2; ++i) {
			var child = qnode.child[j][i];
			if (child !== null)
				children.push(child);
		}
	}
	return children;
};

/**
 * @param {!LQT.Node} qnode
 * @return {integer}
 */
LQT.numChildren = function(qnode) {
	return LQT.getChildren(qnode).length;
};


/**
 * @param {!LQT.Node} qnode
 * @return {!Array.<!LQT.Node>}
 */
LQT.getSiblings = function(qnode) {
	if (qnode.parent == null)
		return [];

	return MochiKit.Base.filter(
		function(q) { return q.id != qnode.id; },
		LQT.getChildren(qnode.parent)
	);
};


// todo: not ready
// returns 0..1, multiply with WORLD_SIZE to get real value
LQT.getUnitCenter = function(qnode) { // and/or getUnitBounds?
	if (qnode.parentQ == null)
		return 1;

	var j = qnode.parentQ[0];
	var i = qnode.parentQ[1];
	//...
};


// todo: not ready
LQT.getUnitBounds = function(qnode) {
	var center = LQT.getUnitCenter(qnode.depth);
	var size = LQT.getHalfSize(qnode.depth)
	// ..
};


/**
 * @param {!LQT.Node} qnode
 * @return {!{ x: number, y: number, w: number, h: number }}
 */
LQT.getBounds = function(qnode) {
	var halfSize = LQT.getHalfSize(qnode.depth);
	return {
		x: qnode.cx - halfSize, y: qnode.cy - halfSize,
		w: 2*halfSize, h: 2*halfSize
	};
};


/**
 * @param {!LQT.Node} qnode
 */
LQT.removeNode = function(qnode) {
	if (qnode.parent !== null) {
		var j = qnode.parentQ[0];
		var i = qnode.parentQ[1];
		qnode.parent.child[j][i] = null;
		qnode.parent = null;
		qnode.parentQ = null;
	}
};


LQT.visitEach = function(qnode, fn) {
	fn(qnode);

	for (var j = 0; j < 2; ++j) {
		for (var i = 0; i < 2; ++i)	{
			if (qnode.child[j][i] !== null)
				LQT.visitEach(qnode.child[j][i], fn);
		}
	}
};


/**
 * visits in child->parent order (bottom-up)
 * @param {!LQT.Node} qnode
 * @return {!Iterable}
 */
LQT.postOrderIter = function(qnode) {
	return MochiKit.Iter.treePostOrder(qnode, LQT.getChildren);
};


/**
 * parent->child order
 * @param {!LQT.Node} qnode
 * @return {!Iterable}
 */
LQT.depthFirstIter = function(qnode) {
	return MochiKit.Iter.treePreOrder(qnode, LQT.getChildren);
};

LQT.eachIterator = LQT.depthFirstIter; // alias


/**
 * level-order traversal, from the top
 * parent->siblings order
 * @param {!LQT.Node} qnode
 * @return {!Iterable}
 */
LQT.breadthFirstIter = function(qnode) {
	return MochiKit.Iter.treeLevelOrder(qnode, LQT.getChildren);
};


/**
 * descends into children only if fn returns true
 * @param {!LQT.Node} qnode
 */
LQT.visitEachIf = function(qnode, fn) {
	if (!fn(qnode))
		return;

	for (var j = 0; j < 2; ++j)	{
		for (var i = 0; i < 2; ++i)	{
			if (qnode.child[j][i] !== null)
				LQT.visitEachIf(qnode.child[j][i], fn);
		}
	}
};

/**
 * @param {!LQT.Node} qnode
 * @return {integer} number of nodes pruned
 */
LQT.pruneEmptyNodes = function(qnode) {
	var count = 0;
	forEach(LQT.postOrderIter(qnode), function(q) {
		if (LQT.numChildren(q) == 0 && q.objects.length == 0) {
			LQT.removeNode(q);
			++count;
		}
	});
	return count;
};


/**
 * Tests whether the given object can fit in the box centered at (cx, cy),
 * with side dimensions of HalfSize * 2.
 * @return {boolean}
 */
LQT.fitsInBox = function(o, cx, cy, halfSize) {
	return !(
		o.x - o.radius < cx - halfSize ||
	    o.x + o.radius > cx + halfSize ||
	    o.y - o.radius < cy - halfSize ||
	    o.y + o.radius > cy + halfSize
	);
};


/**
 * @return {boolean} true if the objects overlap.
 */
LQT.checkObjectAgainstObject = function(a, b) {
	var	dx = a.x - b.x;
	var dy = a.y - b.y;
	var r2 = dx * dx + dy * dy;

	return !(r2 > (a.radius + b.radius) * (a.radius + b.radius));
};


// in our case frustom is always a rect
// @type Visibility
LQT.checkBoxAgainstFrustum = function(cx, cy, HalfSize, f) {
	// tri-state intersects logic
	// todo: return NO_CLIP, SOME_CLIP, NOT_VISIBLE
};

// in our case frustom is always a rect
// @type Visibility
LQT.checkObjectAgainstFrustum = function(o, f) {
	// tri-state intersects logic
	// todo: return NO_CLIP, SOME_CLIP, NOT_VISIBLE
};


/**
 * Insert the given object into the tree given by qnode.
 * @param {!LQT.Node} q
 * @param {*} o
 * @return {integer} the depth of the node the object was placed in.
 */
LQT.looseQuadTreeInsert = function(q, o) {
	// Check child nodes to see if object fits in one of them.
//	if (o.radius < LQT.WORLD_SIZE / (4 << q.depth)) {
	if (q.depth + 1 < LQT.MAX_DEPTH) {
		var	quarterSize = LQT.getHalfSize(q.depth) / 2;
		var offset = LQT.getOffset(q.depth);

		// Pick child based on classification of object's center point.
		var	i = (o.x <= q.cx) ? 0 : 1;
		var	j = (o.y <= q.cy) ? 0 : 1;

		var	cx = q.cx + (i == 0 ? -offset : offset);
		var cy = q.cy + (j == 0 ? -offset : offset);

		if (LQT.fitsInBox(o, cx, cy, quarterSize)) {
			// Recurse into this node.
			if (q.child[j][i] == null) {
				var node = new LQT.Node(q, cx, cy, q.depth + 1);
				node.parentQ = [j, i];
				q.child[j][i] = node;
			}
			return LQT.looseQuadTreeInsert(q.child[j][i], o);
		}
	}

	// todo: shouldn't we check fitsInBox here also?
	q.objects.push(o);
	o.qnode = q;

	return q.depth;
};


/**
 * does the new pos make the current node not fit?
 * @param {!LQT.Node} qnode
 * @param {*} obj
 * @return {boolean}
 */
LQT.fitsInNode = function(qnode, obj) {
	return LQT.fitsInBox(obj, qnode.cx, qnode.cy, LQT.getHalfSize(qnode.depth));
};



/**
 * can the new pos allow moving further down?
 * : must run needsUpdate on each pos-change but could run this one as an optimizing "maintainance thread".
 * todo: perhaps return the i,j quadrant or null rather than just bool?
 * @param {!LQT.Node} qnode
 * @param {*} obj
 * @return {boolean}
 */
LQT.fitsInChildNode = function(qnode, obj) {
	if (qnode.depth + 1 >= LQT.MAX_DEPTH)
		return false;

	var	quarterSize = LQT.getHalfSize(qnode.depth) / 2;
	var offset = LQT.getOffset(qnode.depth);

	// Pick child based on classification of object's center point.
	var	i = (obj.x <= qnode.cx) ? 0 : 1;
	var	j = (obj.y <= qnode.cy) ? 0 : 1;

	var	cx = qnode.cx + (i == 0 ? -offset : offset);
	var cy = qnode.cy + (j == 0 ? -offset : offset);

	return LQT.fitsInBox(obj, cx, cy, quarterSize);
};


/**
 * todo: test
 * todo: generalize to a generic "flatten-1-step" iter
 * @param {!LQT.Node} qnode
 * @return {!Iterable}
 */
LQT.eachObjIter = function(qnode) {
	// forEach(qnode)
	var qiter = LQT.eachIterator(qnode);
	// forEach(object in qnode)
	var objIter = MochiKit.Iter.iter(qnode.objects);

	return {
		next: function() {
			try {
				var o = objIter.next();
				return o;
			} catch (e) {
				if (e != MochiKiter.Iter.StopIteration)
					throw e;

				objIter = MochiKit.Iter.iter(qiter.next().objects);
			}
		}
	};
};


/**
 * walk upwards from qnode to it's parents
 * @param {!LQT.Node} qnode
 * @return {!Iterable}
 */
LQT.ancestorIter = function(qnode) {
	var next = qnode;

	return {
		next: function() {
			if (next == null)
				throw MochiKit.Iter.StopIteration;

			var ret = next;
			next = next.parent;
			return ret;
		}
	};
};


/**
 * starting from qnode's parent
 * @param {!LQT.Node} qnode
 * @param {*} obj
 * @return {integer} depth at which the node was inserted
 */
LQT.insertWithHint = function(qnode, obj) {
	var depth = -1;
	forEach(LQT.ancestorIter(qnode), function(q) {
		if (LQT.fitsInChildNode(q, obj)) {
			depth = LQT.looseQuadTreeInsert(q, obj);
			throw MochiKit.Iter.StopIteration;
		}
	});
	return depth;
};


/**
 * include pruning empty? (take as param)
 * todo: err?
 * @param {!LQT.Node} qnode
 */
LQT.updateTree = function(qnode) {
	forEach(LQT.eachIterator(qnode), function(q) {
		forEach(q.objects, function(obj) {
			if (!LQT.fitsInNode(q, obj)) {
				LQT.removeObject(q, obj);

			//	LQT.looseQuadTreeInsert(qnode, obj); // insert from root
				var d = LQT.insertWithHint(q.parent || q, obj); // this should in most/all cases be more efficient than starting from root
				if (d == -1) {
					console.log('failed updating bottom-up, inserting from top'); // in our demo-example this is due to the objects that
					LQT.looseQuadTreeInsert(qnode, obj);
				}
			} else
			if (LQT.fitsInChildNode(q, obj)) {
				LQT.removeObject(q, obj);
				LQT.looseQuadTreeInsert(q, obj); // insert from current node
			}
		});
	});
};


/**
 * Returns the number of nodes in the given subtree.
 * just for statistics
 * @param {!LQT.Node} qnode
 * @return {integer}
 */
LQT.countNodes = function(qnode) {
	var count = 1; // Count ourself
	forEach(LQT.eachIterator(qnode), function() { ++count; });
	return count;
};



/**
 * Render the objects in the frustum.
 * initially called with vis == SOME_CLIP
 * todo: extract this as a more general traversal routine - treeCullingIter
 * @param {!LQT.Node} qnode
 * ..
 */
LQT.renderLoose = function(qnode, f, vis) {
	// vis = vis || SOME_CLIP;

	LQT.visitEachIf(qnode, function(q) {
		if (vis == SOME_CLIP) {
			vis = LQT.checkBoxAgainstFrustum(q.cx, q.cy, LQT.getHalfSize(q.depth), f);
			if (vis == NOT_VISIBLE)
				return false;
		}

		forEach(q.objects, function(o) {
			if (LQT.checkObjectAgainstFrustum(o, f) != NOT_VISIBLE) {
				//showObject(o);
			} else {
				//hideObject(o);
			}
		});

		return true;
	});
};


//--------

/**
 * @param {!LQT.Node} qnode
 * @param {*} obj
 */
LQT.removeObject = function(qnode, obj) {
	for (var i = 0; i < qnode.objects.length; ++i) {
		if (qnode.objects[i].id == obj.id) {
			qnode.objects.splice(i, 1);
			return true;
		}
	}
	return false;
};


//-------------

// bounding circle style
function IGeoObj() {
	this.x;
	this.y;
	this.radius;
}

//------


// export
return LQT;

});