//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/editing/tools/JestFileViewEditorPainter.js loaded' );

//-------------------------
// JestFileViewEditorPainter Class
//-------------------------
// This class enhances file editor views with various painting capabilities.
class JestFileViewEditorPainter extends JestFileViewEditor {
	// Object propert(ies)

	//---------------------------------
	// Constructor
	//---------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client		- [object] Application client that this piece belongs to.
	constructor( client ) {
		super( client );		// call parent constructor
	}

	//-------------------------
	// Initialization
	//-------------------------
	// Build the element [object].
	// RETURNS: [void].
	// * name		- unique [string] value of component name in the system.
	// * classes	- [array] of classes to add to panel element.
	build( name='file-view-editor-painter', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		const defaultClasses	= [ 'file-view-editor-painter' ];
		super.build( name, defaultClasses.mergeUnique(classes) );
	}
}
