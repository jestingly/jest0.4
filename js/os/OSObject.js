//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/os/OSObject.js loaded' );

// Jest object base class for registering an instance as a part of the Jest system.
class OSObject extends OSCallback {
	// Declare properties
	breadcrumbs 	= [];			// breadcrumb trail of [object] creation
	// Accessibility properties
	refs			= {};			// [object] of quick-reference(s) (by keyname)
	// Personal object properties
	skey			= null;			// [string] value of [object] unique system key

	// Creates the class [object] with configurable components.
	// RETURNS: [object] A new instance.
	// * options		- [object] Configuration options for the class [object].
	constructor( options={} ) {
		super( options );	// call OSUtility parent constructor
		this.systemize();	// systemize the [object]
		// Store the creator [object] reference of the panel [object]
		let breadcrumbs		= options.breadcrumbs || [];	// parent trail of [objects] creating `this`
		this.addBreadcrumbs( ...breadcrumbs, this );		// store quick-ref
	}

	//--------------------------------
	// Initialization
	//--------------------------------
	// Setup the [object].
	// RETURNS: [boolean] `true` on success else `false` on fail.
	setup() {
		//super.setup();		// call parent setup method
		return true;			// success
	}

	// Store the [object] in list of all objects by unique key
	systemize() {
		// Do not systemize environment
		if ( this instanceof JSOSEnvironment ) return;
		// Generate random key & store in system [objects]
		let key;
		do {
			key = jsos.generateKey();		// Generate a random key
		} while ( JestEnvironment.skeys.hasOwnProperty(key) ); // Ensure the key is unique
		JestEnvironment.skeys[key] = this;		// Store the object in skeys
		this.skey	= key;						// Save system key [string] property
		return key; // Return the assigned key
	}

	//--------------------------------
	// Inheritance & Ancestry
	//--------------------------------
	// Insert environment HTML into the page
	// RETURNS: [bool] `true` on success, else `false`.
	// * ...args	- [array] of breadcrumb [objects]
	addBreadcrumbs( ...args ) {
		//console.log( 'jestAlert: Adding breadcrumb trail ...' );
		//---------------------------------
		// Push argument(s)
		//---------------------------------
		for ( const arg of args ) {
			if ( typeof arg==='object' )
				this.breadcrumbs.push( arg );
		}
		return true; // success
	}

	// Insert environment HTML into the page
	// RETURNS: [bool] `true` on success, else `false`.
	resetBreadcrumbs() {
		//console.log( 'jestAlert: Resetting breadcrumb trail ...' );
		// Reset the breadcrumbs to an empty [array]
		this.breadcrumbs = [];
		return true; // success
	}

	// Create a quick reference
	// RETURNS: [bool] `true` on success, else `false`.
	ref( key, val ) {
		//---------------------------------
		// Store item in reference(s)
		//---------------------------------
		// Determine the key
		let keyUnique	= key || jsos.generateKey();
		while ( this.refs.hasOwnProperty(keyUnique) )
			keyUnique	= jsos.generateKey(); // Regenerate until unique key is found
		// Add to the new object with the unique key
		this.refs[key]	= val; // Add to the new object with the same key
		return true;
	}
}
