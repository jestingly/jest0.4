//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/includes/prototype/expressions.prototype.js loaded' );

//----------------------------------------------------------
// fornest( root, pathArray, handler )
//----------------------------------------------------------
// Iterates a nested iterable by following a chain of
// string keys inside an object. When the final nested
// container is reached, iterate its entries and call handler.
//----------------------------------------------------------
// * root			[object] Root object container.
// * pathArray		[array]  Array of string keys representing
//							the nested lookup path.
// * handler		[func]   Function receiving (key, val).
//----------------------------------------------------------
function fornest( root, pathArray, handler ) {
	//-----------------------------------------------------
	// Validate input
	//-----------------------------------------------------
	if ( !root || typeof root!=='object' ) return;
	if ( !Array.isArray(pathArray) || pathArray.length===0 ) return;
	if ( typeof handler!=='function' ) return;

	//-----------------------------------------------------
	// Traverse through provided key path
	//-----------------------------------------------------
	let current = root;

	for ( let i=0; i<pathArray.length; i++ ) {
		const key = pathArray[i];

		// If missing, abort silently (brutal truth: data invalid)
		if ( !current || typeof current!=='object' || !(key in current) ) return;

		current = current[key];
	}

	//-----------------------------------------------------
	// Final object must be iterable
	//-----------------------------------------------------
	// Accepts: Arrays, Maps, plain objects.
	//-----------------------------------------------------
	if ( Array.isArray(current) ) {
		for ( let i=0; i<current.length; i++ ) {
			handler( i, current[i] );
		}
		return;
	}

	// Map
	if ( current instanceof Map ) {
		for ( const [key,val] of current ) {
			handler( key, val );
		}
		return;
	}

	// Plain object
	if ( typeof current==='object' ) {
		for ( const key in current ) {
			handler( key, current[key] );
		}
		return;
	}
}
