
// only purpose of this is to force THREE (R80+) into the global namespace as "THREE"
// so that non AMD code can reach it (just like in R79 and earlier)
// (others have suggested same solution here: https://github.com/mrdoob/three.js/issues/9602 )
define(['three.js/three'], function(THREE) {
	console.log('global namespace THREE helper');
	return window.THREE = window.THREE || THREE;
});
