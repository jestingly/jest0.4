//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/JestGameboard.js loaded' );

//-------------------------
// JestGameboard Class
//-------------------------
class JestGameboard extends JestSavable {
	// Object properties
	display			= null;				// [object] JestDisplay for canvases.
	// World [objects]
	sounds			= {};				// [object] of JestSound [objects] used to play specific sound effects.
	worlds			= {};				// [object] of JestWorld [objects] for connective presets.
	tilesets		= {};				// [object] of JestTileset [objects]
	overworlds		= {};				// [object] of JestOverworld [objects] used to connect levels.
	levels			= {};				// [object] of JestLevel [objects] that contain maps of tiles.
	janis			= {};				// [object] of JestPlay [objects] that handle animations.
	// Interactive [objects]
	guests			= {};				// [object] of JestGuest [objects] that contains all active guest(s).
	worldlings		= [];				// [array] Set of all gameboard worldling objects.

	//-------------------------
	// Constructor
	//-------------------------
	// Creates the object.
	// * client		- [object] Application client creating the object.
	constructor( client ) {
		// Call the parent object constructor
		super( client );				// construct the parent
		this.client		= client;		// store the client [object] reference
		// --------------------------------
		// Setup object
		// --------------------------------
		this.setup(); // setup the object
	}

	//-------------------------
	// Initialization Methods
	//-------------------------
	// Setup the object [object].
	// RETURNS: [boolean] `true` on success else `false` on fail.
	async setup() {
		// --------------------------------
		// Build Level
		// --------------------------------
		this.build();			// build the object
		// --------------------------------
		// Load File(s) Data
		// --------------------------------
		await this.load();		// load the data
		return true; // success
	}

	// Build the object.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	build() {
		// --------------------------------
		// Create Display [object]
		// --------------------------------
		// Create the display for render viewing
		const display	= new JestDisplay();
		display.build(); // build the display
		this.display	= display;
		return true; // success
	}

	//-------------------------
	// Data Handling
	//-------------------------
	// Load the data.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	async load() {
		super.load();		// call parent load start method
		// Load varying images
		await this.client.imager.loadFile( 'sprites/sprites1.png' );
		this.complete();	// call complete method
		return true;		// success
	}

	// Complete data load.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	complete() {
		super.complete();	// call parent complete method
		this.client.gameboard.levels[this.name] = this; // store reference in stack [object]
		return true;		// success
	}

	//--------------------------------
	// Level Handling in Game Board
	//--------------------------------
	// Adds a level object to the board stack.
	// RETURNS: [object] JestLevel on success else throw [error] on fail.
	// * name  - [string] Value of level name (e.g. 'level1').
	// * obj   - [object] Level to add.
	async addLevel ( name, obj ) {
		// Validate argument(s)
		if ( typeof name!=='string' || name.length===0 )
			throw new Error( `addLevel: Invalid or missing level name.` );
		if ( typeof obj!=='object' || obj===null )
			throw new Error( `addLevel: Invalid level object.` );
		// Prevent overwrite
		if ( this.levels[name] )
			throw new Error( `addLevel: Level "${name}" already exists.` );
		// Store reference in stack
		this.levels[name] = obj;
		// Return the added object
		return obj;
	}

	// Removes a JestLevel [object] from the board stack.
	// RETURNS: [boolean] true on success else false on fail.
	// * name  - [string] Value of level name (e.g. 'level1').
	removeLevel ( name ) {
		// Validate argument(s)
		if ( typeof name!=='string' || name.length===0 ) {
			console.warn( `removeLevel: Invalid or missing level name.` );
			return false; // no level removed
		}
		// Check if level exists in gameboard.
		const existing = this.levels[name];
		// Check for match
		if ( !existing ) {
			console.warn( `removeLevel: Level "${name}" not found.` );
			return false; // no level removed
		}
		// Destroy the level & its child layers before removing the reference.
		existing.destroy?.();
		// Remove level
		delete this.levels[name];
		return true; // success
	}

	//-------------------------
	// World Handling
	//-------------------------
	// Create world.
	// RETURNS: [object] JestWorld on success else throw error on fail.
	// * name		- [string] value of world name (e.g. 'jest', 'graal').
	async addWorld( name ) {
		// Check if world already exists
		const existing	= this.getWorld( name );
		if ( existing ) return existing;
		// Create new world [object]
		const world		= new JestWorld( this.client, name );
		// Setup world definition(s)
		let response;
		//try {
			// Setup the tileset data
			await world.setup();
			// Add world to worlds list
			this.worlds[world.name]	= world;
			return world;
		//}
		//catch ( err ) { throw new Error(`Failed to add world: ${err}`); }
	}

	// Get an existing loaded world presets [object].
	// RETURNS: [object] JestWorld if exists, else [null].
	// * name		- [string] Value of world name (e.g. 'jest', 'graal').
	getWorld( name ) {
		// Return existing world [object] if exists.
		return this.worlds?.[name] ?? null;
	}

	//-------------------------
	// Tileset Handling
	//-------------------------
	// Create tileset.
	// RETURNS: [object] JestTileset on success else throw error on fail.
	// * name		- [string] value of tileset name (e.g. 'pics1').
	async addTileset( name ) {
		// Check if tileset already exists
		const existing	= this.getTileset( name );
		if ( existing ) return existing;
		// Create new tileset [object]
		const tileset	= new JestTileset( this.client, name );
		// Setup tileset definition(s)
		let response;
		try {
			// Setup the tileset data
			await tileset.setup();
			// Add tileset to tilesets list
			this.tilesets[tileset.name]	= tileset;
			return tileset;
		}
		catch ( err ) { throw new Error(`Failed to add tileset: ${err}`); }
	}

	// Get an existing loaded tileset [object].
	// RETURNS: [object] JestTileset if exists, else [null].
	// * name		- [string] Value of tileset name (e.g. 'pics1').
	getTileset( name ) {
		// Return existing tileset [object] if exists.
		return this.tilesets?.[name] ?? null;
	}

	//-------------------------
	// Rendering Methods
	//-------------------------
	// Update the gameboard periodically.
	// * elapsedTime	- how much time has passed since the ticker started.
	// * tickDelay		- how much time between each tick (ie. 60ms)
	// * tickCount		- how many ticks have occurred
	// RETURNS: [void].
	/*update( { elapsedTime, tickDelay, tickCount } ) {
		this.draw(); // Call central draw method
	}*/

	//-------------------------
	// Game Object Handling
	//-------------------------
	// Add a worldling object to the gameboard.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * obj		- [int] value of worldling id to add to the gameboard.
	addWorldling( obj ) {
		// Check if object is a valid Worldling
		if ( !(obj instanceof JestWorldling) || obj.status===3 )
			return false; // not a worldling
		// Add object to gameboard pile of all worldlings
		if ( this.worldlings.indexOf(obj)==-1 ) {
			// Add to worldling [objects] list
			const index	= this.worldlings.push( obj );
		}
		return true; // Return the assigned key
	}
	// Remove a worldling object from the gameboard.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * obj		- [object] Worldling to remove.
	removeWorldling( obj ) {
		// Check if object is a valid Worldling
		if ( !(obj instanceof JestWorldling) || obj.status!==3 )
			return false; // not a worldling
		// Find and remove object from worldlings array
		const index = this.worldlings.indexOf( obj );
		if ( index!==-1 ) {
			this.worldlings.splice( index, 1 );		// remove from array
			return true; // successfully removed
		}
		return false; // not found
	}

	// Add an external guest to the gameboard.
	// RETURNS: [object] guest or [bool] false on fail.
	// * id			- [int] value of guest id to add to the gameboard.
	// * username	- [string] Value of user username (e.g. 'Antago').
	async addGuest( id, username ) {
		// --------------------------------
		// Create a guest [object]
		// --------------------------------
		if ( this.guests?.[id] ) return false;			// guest exists
		const guest		= new JestGuest( this.client ); // guest character
		await guest.setup();
			/*.catch(
				( err ) => {
					console.warn( 'user did not setup properly. Application [should quit].' );
				});*/
		// Create a new guest
		this.guests[id]	= guest;						// add guest to gameboard guest pile
		await guest.load( id, username );				// load guest data into guest
		// Move guest (temporarily) to some place
		guest.level		= 'level13.nw';
		guest.anchor.move( 10, 5 );
		return guest; // success
	}

	// Remove an external guest from the gameboard.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * id			- [int] value of guest id to add to the gameboard.
	async removeGuest( id ) {
		// Delete guest if exists
		if ( this.guests?.[id] ) {
			const guest		= this.guests[id];		// get guest [object]
			guest.status	= 3;					// set status to "dispose"
			delete this.guests[id];					// remove from gameboard guests
			guest.teardown();						// begin [object] teardown
			return true; // success
		}
		return false; // no guest removed
	}
}
