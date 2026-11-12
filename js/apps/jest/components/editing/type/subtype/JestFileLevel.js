//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/editing/type/subtype/JestFileLevel.js loaded' );

//-------------------------
// JestFileLevel Class
//-------------------------
// A system file class for loading and viewing loaded level file data.
class JestFileLevel extends JestFileImage {
	// Object properties
	//modes			= null;				// [array] of possible modes.

	// --------------------------------
	// Constructor
	// --------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client		- client [object] that this piece belongs to.
	// * origin		- [string] Value of file data origin ("local", "remote", etc.).
	// * stem		- [string] Value of stem (e.g. 'level1').
	constructor( client, origin, stem ) {
		super( client, origin, stem, 'nw' ); // call parent constructor
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
		this.data		= null;
		this.context	= null;
	}

	//--------------------------------
	// Set JestLevel [object]
	//--------------------------------
	// Build the element [object].
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * context	- pre-loaded & rendered JestLevel [object].
	setContext( context ) {
		// Validate argument(s).
		if ( !(context instanceof JestLevel) ) {
			console.warn( `Argument "context" must be of type JestLevel.` );
			return false; // fail
		}
		// Set context reference.
		console.log( `Setting JestLevel [object] as "context".` );
		this.context	= context ?? null;
		return true; // success
	}

	//--------------------------------
	// Load File Data as JestLevel [object]
	//--------------------------------
	// Open a level file.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * fileInfo	- [object] { path, handle, file, data } or [null] for new.
	async openFile( fileInfo ) {
		//--------------------------------
		// Create New Level [object]
		//--------------------------------
		// Call parent to begin opening the file.
		await super.openFile( fileInfo );
		 // Render the level file.
		const data = await this.client.renderLevelData( fileInfo );

		//--------------------------------
		// Finish & Set Context
		//--------------------------------
		// Set the level context.
		this.setContext( data.level );

		//-----------------------------
		// Emit Various Event(s)
		//-----------------------------
		// Emit a load file event with data [objects].
		this.emit(
			'openFile', null,
			{
			layers: data.level.getLayers(),
			...data.regions
			});
		return true; // success
	}

	//-------------------------
	// Save to Disk
	//-------------------------
	// Save the current data to disk using File System Access API (or fallback).
	// • Try primary save method
	// 	- if success → return true
	// 	- if user canceled → return false (skip fallback!)
	// 	- if error → fallback (if allowed)
	// RETURNS: [Promise<boolean>] true on success.
	// * method		- [string] Value: "new", "overwrite", "cloud", "download"
	// * fallback	- [bool] Allow fallback forced download (default: true)
	async saveToDisk( method="overwrite", fallback=true ) {
		//--------------------------------
		// Collect Layer Data
		//--------------------------------
		// Convert level layers to .nw file [string] syntax.
		const layers =
			this.context.getLayers().map(
				layer => ({
				    id      : layer.id,
				    name    : layer.name,
				    visible : layer.visible,
				    locked  : layer.locked,
				    board   : layer.tilemap
					}));

		//--------------------------------
		// Collect Keyword Data
		//--------------------------------
		// Generate list of all dynamic keyword data.
		const keywordData = {};
		for ( const keyword of JestParserLevel.keywords ) {
			const key	= keyword.toLowerCase();
			// BOARD and LAYER are handled by the layer collection.
			if ( key==='board' || key==='layer' ) continue;
			// Check for keyword stack in the queue.
			const data	= this.dequeue( key );
			if ( data!==null ) {
				keywordData[key] = data; // add to stack for encoding
				console.log( `✔ Saving region: ${key} (${data.length} objects)` );
			}
		}

		//--------------------------------
		// Encode Level
		//--------------------------------
		// Build data to save using parsd queued data.
		this.data		=
			this.client.parsers.level.encode({
				version : 'JESTNW02',
				layers  : layers,
				...keywordData
				});
		// Get tilemap from level & convert to string.
		//this.data	= JSON.stringify( this.context.tilemap );

		//--------------------------------
		// Proceed to Write Data
		//--------------------------------
		// Save data to cloud or file on local disk.
		switch ( method ) {
			case "cloud":
				// Check for cloud handler.
				if ( this.client.cloud ) {
					// Get JestCloud [object]
					return await this.client.cloud.save( this, "manual" );
				}
				break;
			case "download":
			case "overwrite":
			case "new":
				const forceSaveAs = method==="new" ? true : false;
				return await super.saveToDisk( 'text/plain', forceSaveAs, fallback );
				break;
		}
	}
}
