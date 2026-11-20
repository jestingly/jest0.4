//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/world/JestWorld.js loaded' );

//-----------------------------
// JestWorld Class
//-----------------------------
// A game world class for loading game world data.
class JestWorld extends JestSavable {
	// World propert(ies)
	tilesets		= [];			// [array] Tilesets included in the world.

	//--------------------------------
	// Constructor
	//--------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client		- client [object] that this piece belongs to.
	// * name		- [string] Name of world (e.g. 'Jest', 'Graal').
	constructor( client, name ) {
		super( client, name ); // call parent constructor
	}

	//-------------------------
	// Initialization Methods
	//-------------------------
	// Setup the [object].
	// RETURNS: [boolean] `true` on success else `false` on fail.
	async setup() {
		//---------------------------------
		// Build Level
		//---------------------------------
		this.build();					// build the object
		//---------------------------------
		// Load File(s) Data
		//---------------------------------
		await this.load();				// load the data
		return true; // success
	}

	// Build the object.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	build() {
		return true; // success
	}

	//-------------------------
	// Data Handling
	//-------------------------
	// Load the data [object].
	// RETURNS: [boolean] `true` on success else `false` on fail.
	async load() {
		super.load();		// call parent load start method
		// Try to load & set the presets
		try { await this.loadData(this.name); }	// set presets data
		catch( err ) { throw err; }
		this.complete();	// call complete method
		return true;		// success
	}

	// Complete data load.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	complete() {
		super.complete();	// call parent complete method
		//this.client.gameboard.tilesets[this.name] = this; // store reference in stack [object]
		return true;		// success
	}

	//-------------------------
	// Definition Method(s)
	//-------------------------
	// Load & set the world data .
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * stem	- [string] Value of URL filename stem to load, without extension (e.g. 'jest')
	async loadData( stem ) {
		//---------------------------------
		// Validate Argument(s)
		//---------------------------------
		if ( !jsos.prove(stem,'string') )
			throw new Error( `Argument 'stem' must be of type [string].` );
		stem	= stem ?? this.default;		// store stem (NOTE: file load handled separately)
		const filename	= `presets/worlds/${stem}.json`;
		//---------------------------------
		// Load World Presets Data
		//---------------------------------
		// Use the Secretary to download a remote file's data.
		const ok	= await this.client.loadWorldData( filename );
		if ( ok===null ) {
			console.warn( 'Game-world presets could not be downloaded!' );
			alert( 'Could not download game-world presets.' );
			return false; // failed
		}
		// Access newly downloaded data inside the secretary.
		const record	= this.client.secretary.getRecord(filename) ?? null;
		if ( !record ) { // record not found
			console.warn( 'Cannot find world data.' );
			return false; // fail
		}
		//---------------------------------
		// Process World Presets Data
		//---------------------------------
		// Load tileset(s) from data.
		console.log( 'Attempting to load all game-world tileset(s)...' );
		if ( record?.tilesets ) {
			// Iterate each tileset & add.
			for ( const item of record?.tilesets ) {
				console.log( 'Attempting to download tileset `'+item.stem+'`...' );
				this.addTileset( item.stem, item.tiledefs );
			}
		}
		return true; // success
	}

	//-------------------------
	// Tileset Method(s)
	//-------------------------
	// Load a tileset in the game world [object].
	// RETURNS: [bool] true on success, else false if fail.
	// * stem		- [string] Value of tileset filename stem without extension (e.g. 'pics1')
	// * tiledefs	- [string] Value of tiledefs filename without extension (e.g. 'pics1')
	addTileset( stem, tiledefs ) {
		// Get file info from item filename.
		if ( !stem ) { // throw error if no filename
			console.warn( `[JestWorld] addTileset(): No image supplied for tileset.` );
			return false; // fail
		}
		// Get file info from filename.
		const fileInfo	= this.client.getFileInfo( stem );
		// Get current index.
		const index		= this.tilesets.length;
		// Push tileset data into tilesets.
		this.tilesets.push( { stem: fileInfo.stem, tiledefs } );
		console.log( `[JestWorld] addTileset(): Added "${stem}" to world presets at index ${index}.` );
		return true; // success
	}
}
