//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/JestConfiguration.js loaded' );

//-------------------------
// JestConfiguration Class
//-------------------------
class JestConfiguration extends JestSavable {
	//---------------------------------
	// Media & Web Setting(s)
	//---------------------------------
	// File(s) & resource(s)
	server			= 'ws://#.#.#.#:8080'; // server websocket (e.g. local IP to connect to)
	// Resource [string] value of path to webfiles root: images, sounds, etc.
	webfiles		= `${BASE_PATH}webfiles/files`;
	root			= BASE_PATH;
	refresh			= true;			// forces hard refresh on file downloads
	//---------------------------------
	// Game Setting(s)
	//---------------------------------
	// Definition propert(ies)
	tileGrid		= 16;			// [int] Value of tile size width/height (defaults to 16px).
	levelGrid		= 64;			// [int] Value of level width/height (defaults to 64 tiles).
	levelSpan		= null;			// [int] Value of level width/height in pixels (auto-calculated).
	// Jani measurement(s)
	janiGrid		= 3;			// [int] Value of jani width/height (defaults to 8 tiles).
	janiSpan		= null;			// [int] Value of jani width/height in pixels (auto-calculated).
	janiBleed		= 12;			// [int] Value of bleed around jani safe area (defaults to 6 tiles).
	janiFullGrid	= null;			// [int] Value of full jani area + bleeds (in tiles)
	janiFullSpan	= null;			// [int] Value of full jani area + bleeds (in pixels)

	//---------------------------------
	// Constructor
	//---------------------------------
	// Construct the [object].
	// * client		- [object] Application client creating the object.
	//   options	- [object] of custom configuration options (optional)
	//   	webfiles | [string] value of webfiles root URL for game media.
	constructor( client, options={} ) {
		// Call the parent object constructor
		super( client, "config" );	// construct the parent
		// Set base URL for game media resource file(s)
		this.webfiles		= options.webfiles ?? this.webfiles;
		// Calculate some definitions
		this.levelSpan		= this.tileGrid * this.levelGrid;		// level span in pixels
		this.janiSpan		= this.tileGrid * this.janiGrid;		// jani span in pixels
		this.janiFullGrid	= this.janiGrid + this.janiBleed*2;		// full jani width/height (in tiles)
		this.janiFullSpan	= this.janiFullGrid * this.tileGrid;	// full jani width/height (in pixels)
	}
}
