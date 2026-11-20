//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/ui/JestFileMenu.js loaded' );

//-------------------------
// JestFileMenu Class
//-------------------------
// A file menu for handling events such as save, open, etc.
class JestFileMenu extends JestMenu {
	// Object properties
	title		= null;			// OSElement [object] that contains the display text.
	titleText	= null;			// [string] Value of title text (optional).

	//---------------------------------
	// Constructor
	//---------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client		- client [object] that this piece belongs to.
	constructor( client ) {
		super( client ); // call parent constructor
	}

	//---------------------------------
	// Initialization
	//---------------------------------
	// Build the element [object].
	// RETURNS: [void].
	// * name		- unique [string] value of component name in the system.
	// * classes	- [array] of classes to add to panel element.
	// * text		- [string] value of button text content.
	build( name='file-menu', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		super.build( name, ['file-menu'].mergeUnique(classes) );
		//-------------------------
		// Title Element
		//-------------------------
		// Add menu title.
		this.panel.addElements([{
			name       : 'title',
			tag        : 'span',
			classes    : [ 'menu-title', 'hidden' ],
			text       : this.titleText ?? ''
			}]);
		this.title		= this.panel.refs.title; // get [object] ref
		this.hideTitle(); // hide title by default
	}

	//---------------------------------
	// Sub-Item Handling Method(s)
	//---------------------------------
	// Rename the menu title.
	// RETURNS: [void].
	// * val	- [string] Value name of menu to change to.
	setTitle( val ) {
		// Rename the visual text of the menu title.
		this.titleText	= val;
		if ( this.title?.el )
			this.title.setHTML( val );
	}

	//--------------------------------
	// Show Title Element
	//--------------------------------
	// Makes title element visible.
	// RETURNS: [void]
	showTitle() {
		// Remove "hidden" class from title.
		if ( this.title?.el )
			this.title.removeClass( 'hidden' );
	}

	//--------------------------------
	// Hide Title Element
	//--------------------------------
	// Hides the title from display.
	// RETURNS: [void]
	hideTitle() {
		// Add "hidden" class to title.
		if ( this.title?.el )
			this.title.addClass( 'hidden' );
	}
}
