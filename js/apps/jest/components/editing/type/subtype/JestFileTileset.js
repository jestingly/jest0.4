//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/editing/type/subtype/JestFileTileset.js loaded' );

//-------------------------
// JestFileTileset Class
//-------------------------
// A system file class for loading and viewing loaded tileset data.
class JestFileTileset extends JestFileImage {
	// Object properties
	//modes			= null;				// [array] of possible modes.

	//---------------------------------
	// Constructor
	//---------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client		- client [object] that this piece belongs to.
	// * origin		- [string] Value of file data origin ("local", "remote", etc.).
	// * filename	- [string] Value of filename (e.g. 'pics1').
	constructor( client, origin, filename ) {
		super( client, origin, filename, 'jest' ); // call parent constructor
	}

	//-------------------------
	// Teardown Method(s)
	//-------------------------
	// Destroy the view [object]
	// RETURNS: [void].
	destroy() {
		// Call parent constructor.
		super.destroy(); // parent destroy()
		// Delete [object] references.
		//this.data		= null;
		//this.context	= null;
	}

	//--------------------------------
	// Load Tileset File
	//--------------------------------
	// Build the element [object].
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * context	- pre-loaded & rendered JestTileset [object].
	setContext( context ) {
		// Validate argument(s).
		if ( !(context instanceof JestTileset) ) {
			console.warn( `Argument "context" must be of type JestTileset.` );
			return false; // fail
		}
		// Set context reference.
		console.log( `Setting JestTileset [object] as "context".` );
		this.context	= context ?? null;
		return true; // success
	}

	//--------------------------------
	// Load File Data as ElementImage [object]
	//--------------------------------
	// Open a level file.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * url	- [string] Value of URL path to web image file.
	async openFile( url ) {
		// Validate argument(s)
		if ( !url ) return; // if no url, return
		// Get file info [object] from url & pass to parent.
		const fileInfo		= this.client.urlFileinfo( url );
		await super.openFile( fileInfo ); // pass file info to parent
		// Use the secretary to download a file.
		try {
			// Use "stem" as shorthand for filename.
			const stem		= this.stem;
			const extension	= this.extension;
			//---------------------------------
			// Load Tileset [objects]
			//---------------------------------
			console.log( `Attempting to download tileset from server...` );
			// Load a default tileset
			const tileset	=
				await this.client.gameboard.addTileset( 'pics1' )
					.catch(
						( err ) => {
							console.warn( `Tileset could not be loaded: ${err.message}` );
						});
			if ( tileset ) console.log( 'Tileset loaded:', tileset );
			else console.log( 'No tileset available.' );
			// Set tileset as this file [object] context.
			this.setContext( tileset );
			// Call parent openFile method to finish.
			super.openFile();
			return true; // success
		}
		catch ( err ) {
			console.warn( `Tileset data could not be read: ${err.message}` );
			return false; // fail
		}
	}
}
