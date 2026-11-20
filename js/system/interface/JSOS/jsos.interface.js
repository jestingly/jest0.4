//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/system/interface/JSOS/JSOSInterface.js loaded' );

// Jest OS Interface helper class
class JSOSInterface extends JSOSUtility {
	// Declare properties
	//window		= null;			// [object] OSElement window reference.

	// Creates the class [object] with configurable components.
	// RETURNS: [object] A new instance.
	// * options		- [object] Configuration options for the class [object].
	constructor( options={} ) {
		super( options );	// call parent constructor
	}

	// Setup the window [object].
	// RETURNS: [boolean] `true` on success else `false` on fail.
	build() {
		//---------------------------------
		// Create environment
		//---------------------------------
		// Create an OSElement to reference the window.
		//this.window		= new OSElement();
		//this.window.el	= window; // set window element as window
	}
}
