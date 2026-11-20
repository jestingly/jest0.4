//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/ui/JestButtonToolbar.js loaded' );

//-------------------------
// JestButtonToolbar Class
//-------------------------
// Button class for activating & managing a tool within the program.
class JestButtonToolbar extends JestButton {
	// Object properties

	//---------------------------------
	// Constructor
	//---------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client		- client [object] that this piece belongs to.
	constructor( client ) {
		super( client );
	}

	//---------------------------------
	// Initialization
	//---------------------------------
	// Build the element [object].
	// RETURNS: [void].
	// * name		- unique [string] value of component name in the system.
	// * classes	- [array] of classes to add to panel element.
	// * text		- [string] value of button text content.
	build( name='button-toolbar', classes=[], text ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		super.build( name, ['button-toolbar'].mergeUnique(classes), text );
	}
}
