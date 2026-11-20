//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/draw/JestMatrix.js loaded' );

//-----------------------------
// JestMatrix Class
//-----------------------------
// A matrix class for accessing grid-based graticulated propert(ies).
class JestMatrix extends JestGamepiece {
	// Movement propert(ies)
	anchor		= null;			// [object] Anchor for matrix handling.

	//--------------------------------
	// Constructor
	//--------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client		- client [object] that this piece belongs to.
	constructor( client ) {
		super( client ); // call parent constructor
		//---------------------------------
		// Create Anchor [object]
		//---------------------------------
		// Create an anchor [object] for moving & size specifications
		const anchor	= new Anchor();		// create central anchor
		anchor.move( 0, 0 );				// move anchor to default position
		this.anchor		= anchor;			// store anchor as property
	}
}
