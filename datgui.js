/**
 * @see https://github.com/dataarts/dat.gui
 *
 * todo: cool to create some kind of direct binders to Vue or Angular maybe?
 *
 * @author Fredrik Blomqvist
 *
 */
define(['blq/assert', 'jquery', 'dat/dat.gui'], function(assert, $, GUI) {

/**
 * sets up a DAT GUI using a declarative json style config
 * @see https://github.com/dataarts/dat.gui
 *
 * example:
 	[
		{
			id: 'p1',

			value: 42,

			min: 0,
			max: 100,

			step: 0.01,

			// -- events --
			onChange: function(v) {
				console.debug('p1 arg changing:', v);
			},
			onFinishChange: function(v) {
				console.debug('p1 arg finished change:', v);
			}
		},

		{
			id: 'b',
			value: true,
			onFinishChange: function(v) {
				console.debug('b arg finished change:', v);
			}
		},

		{
			id: 'list_select',
			value: ['one', 'two', 'three', 123],
			onFinishChange: function(v) {
				console.debug('list value changed:', v);
			}
		},

		{
			id: 'dict_select',
			value: { one: 1, two: 2, three: 3, crazy: function() { return 'XXXX'; } },
			onFinishChange: function(v) {
				console.debug('dict value changed:', v);
			}
		},

		{
			id: 'click',
			value: function() {
				alert('clicked');
			}
		}
	];
 *
 * todo: document format..
 * todo: support folders.
 * todo: flag for "listen" to indicate watching outside change?
 * todo: support presets
 *
 * @param {!DAT.GUI} gui
 * @param {!Array<Object>} decl describes the values, constraints etc. (null is ignored)
 * @param {!Object} params storage dictionary for the actual values
 */
blq._bindDatGUI = function(gui, decl, params) {
	assert(gui != null);
	assert(decl != null);
	assert(params != null);

	decl.forEach(function(p) {
		if (p == null)
			return; // == continue
		var val = p.value;
		var ctrl = null;
		if (Array.isArray(val)) {
			params[p.id] = p.value[0]; // grab first
			ctrl = gui.add(params, p.id, p.value);
		} else
		if (typeof val == 'object') {
			var first;
			for (var x in p.value) {
				first = p.value[x];
				break;
			}
			params[p.id] = first;
			ctrl = gui.add(params, p.id, p.value);
		} else {
			params[p.id] = p.value; // push initial value
			ctrl = gui.add(params, p.id);
		}

		// todo: detect color controllers

		if (typeof p.min == 'number')
			ctrl.min(p.min);
		if (typeof p.max == 'number')
			ctrl.max(p.max);

		if (typeof p.step == 'number')
			ctrl.step(p.step);

		if (typeof p.onChange == 'function')
			ctrl.onChange(p.onChange);
		if (typeof p.onFinishChange == 'function')
			ctrl.onFinishChange(p.onFinishChange);
	});
};


/**
 * syncs DAT gui's controllers to the actual values of the params.
 * useful if programatically modifying the values or resetting.
 *
 * note that you could use DAT's gui.listen() method also, depending on use-case
 * http://workshop.chromeexperiments.com/examples/gui/#9--Updating-the-Display-Automatically
 *
 * todo: name?
 */
blq._refreshDatGUI = function(gui) {
	assert(gui != null);
	assert(Array.isArray(gui.__controllers));
	assert(typeof gui.__folders == 'object');

	// @see http://workshop.chromeexperiments.com/examples/gui/#10--Updating-the-Display-Manually
	// but also take folders (recursive) into account

	for (var i = 0; i < gui.__controllers.length; ++i) {
		gui.__controllers[i].updateDisplay();
	}
	for (var f in gui.__folders) { // dictionary
		arguments.callee(gui.__folders[f]); // recurse
	}
};


/**
 * removes extra margins and possible close button from the dat GUI to
 * make it smaller.
 * todo: rename? trimDatGUISize?
 * todo: verify if still applicable in latest dat.GUI release (old code..)
 * @param {!Object} GUI class/namespace for the dat GUI
 * @param {!Object} gui instance of a dat GUI
 */
blq._trimGUISize = function(GUI, gui) {
	assert(GUI != null);
	assert(gui != null);

	$(gui.domElement).find('.' + GUI.CLASS_CLOSE_BUTTON).remove();
	$(gui.domElement).css('margin-right', 0);
	$(gui.domElement).find('.save-row').addClass('float-right');
};

return blq;

});
