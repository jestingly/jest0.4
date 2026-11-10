//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/ui/JestToolbar.js loaded' );

//-------------------------
// JestToolbar Class
//-------------------------
// Mode selection toolbar using Panel base
class JestToolbar extends JestMenu {
	// Object properties
	//modes			= null;				// [array] of possible modes.

	// --------------------------------
	// Constructor
	// --------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client		- client [object] that this piece belongs to.
	// * modes		- [array] of possible default modes.
	constructor( client/*, modes*/ ) {
		super( client ); // call parent constructor
		// Set default modes.
		//this.modes = modes ?? [];
	}

	// --------------------------------
	// Initialization
	// --------------------------------
	// Build the element [object].
	// RETURNS: [void].
	// * name		- unique [string] value of component name in the system.
	// * classes	- [array] of classes to add to panel element.
	build( name='toolbar', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		super.build( name, ['toolbar'].mergeUnique(classes) );
	}

	// --------------------------------
	// Button Handling
	// --------------------------------
	// Generate menu tool button.
	// RETURNS: [object] JestButton or [null] on fail.
	// * action		- [object] Value of action to create a button for.
	createButton( action ) {
		//-----------------------------
		// Sanity Check
		//-----------------------------
		// Determine if action has been previously processed.
		if ( action.name in this.buttons ) {
			console.warn( `Button with action key "${action.name}" already exists.` );
			return null; // fail
		}

		//-----------------------------
		// Create, Build & Add Button
		//-----------------------------
		// Create a new button for the action
		const button	= new JestButtonToolbar( this.client );
		button.build( action.name, null, action.text ); // build element
		this.addButton( action, button ); // add button to panel
		
		// Return success.
		return button; // success
	}

	// --------------------------------
	// Event Handling
	// --------------------------------
	// Callback when a button was clicked.
	// RETURNS: [void].
	// * e			- [object] MouseEvent event listener data.
	// * action		- [string] Value of action of button.
	// * button		- [object] JestButton serving as a clickable button.
	btnClick( e, action, button ) {
		// Call parent method.
		super.btnClick( e, action, button );
	}
}
