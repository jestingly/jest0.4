//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/editing/type/JestFileImage.js loaded' );

//-------------------------
// JestFileImage Class
//-------------------------
// A sidebar menu for graphical user interfaces.
class JestFileImage extends JestFile {
	// Object properties

	//---------------------------------
	// Constructor
	//---------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client		- client [object] that this piece belongs to.
	// * origin		- [string] Value of file data origin ("local", "remote", etc.).
	// * stem		- [string] Value of filename "stem" (e.g. 'level1').
	// * extension	- [string] Value of filetype extension.
	constructor( client, origin, stem, extension ) {
		super( client, origin, stem, extension ); // call parent constructor
	}

	// Build the element [object].
	// RETURNS: [void].
	// * name		- unique [string] value of component name in the system.
	// * classes	- [array] of classes to add to panel element.
	//build( name='sidebar', classes=[] ) { }
}
