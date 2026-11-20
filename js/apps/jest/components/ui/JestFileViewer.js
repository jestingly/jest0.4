//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/ui/JestListColumnatedItem.js loaded' );

//-----------------------------
// JestFileViewer Class
//-----------------------------
// Controller for displaying user cloud saves in columnated view.
// Hooks into JestCloud and JestListColumnated.
class JestFileViewer extends JestElement {
	// Object properties
	listView	= null;			// [JestListColumnated]
	client		= null;			// CMS client

	//---------------------------------
	// Constructor
	//---------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client		- client [object] that this piece belongs to.
	constructor( client ) {
		super( client ); // call parent constructor
	}

	//--------------------------------
	// Build UI
	//--------------------------------
	// Build the element [object].
	// RETURNS: [void].
	// * name		- unique [string] value of component name in the system.
	// * classes	- [array] of classes to add to panel element.
	build( name='file-viewer', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		super.build( "div", name, ['jest-file-viewer'].mergeUnique(classes) );

		// Create columnated list view.
		this.listView	= new JestListColumnated( this.client );
		this.listView.build(); // build list
		this.panel.append( this.listView.panel );
	}

	//--------------------------------
	// Populate List View with Saves
	//--------------------------------
	// Clear all items & repopulate.
	populate( items=[] ) {
		// Clear the list.
		this.listView.clear();
		// Iterate each saved item & add to list.
		for ( const item of items ) {
			this.listView.addItem( item, item );
		}
	}
}
