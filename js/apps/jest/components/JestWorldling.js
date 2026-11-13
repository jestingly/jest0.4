//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/JestWorldling.js loaded' );

//-------------------------
// JestWorldling Class
//-------------------------
// Represents an [object] inside the game world.
class JestWorldling extends JestSavable {
	// Object propert(ies)
	_remote  = false;     // [bool] Whether object is serverside (false) or local (true)
	// World data
	_status  = 0;         // Value of worldling [object] status (e.g. 0=creating, 1=idle, 2=ready, 3=dispose).
	_level   = null;      // [string] Value of level filename (e.g. level1).
	_view    = null;      // [object] AnimationView depicting visual
	_lens    = {};        // [object] of Camera report information.
	// Movement propert(ies)
	focus    = null;      // [object] Anchor used to focus the graphical visual location (x,y).

	// --------------------------------
	// Constructor
	// --------------------------------
	// Initializes the the worldling [object].
	// RETURNS: [void].
	// * client  - [object] Application client that this piece belongs to.
	// * remote  - [bool] whether object is serverside (false) or local (true)
	// * name    - [string] Value of user username (e.g. 'Antago').
	constructor( client, remote, name ) {
		// Call parent constructor
		super( client, name ); // construct the parent
		this.status  = 0;      // set default status "creating"
		// Set remote value
		this._remote = remote===true;
		// --------------------------------
		// Attach [object] to Gameboard
		// --------------------------------
		// Add the worldling object to the gameboard.
		this.client.gameboard.addWorldling( this );
	}

	//-------------------------
	// Memory Management
	//-------------------------
	// Destruct the [object]
	// RETURNS: [void].
	teardown() {
		//super.teardown(); // call parent destructor
		// Removing worldling from gameboard
		this.client.gameboard.removeWorldling( this );
	}

	// --------------------------------
	// Initialization Methods
	// --------------------------------
	// Setup the worldling [object].
	// RETURNS: [boolean] `true` if yes, else `false` if not.
	setup() {
		// --------------------------------
		// Create Anchor Point [objects]
		// --------------------------------
		// Create focal anchor [object] for animation rendering in viewport camera
		// NOTE: Focus is in 1px units because it is relative to viewport canvas, not level grid.
		const focus = new Anchor();      // create focal point
		focus.move( 0, 0 );              // move focal point to a default position
		this.focus  = focus;             // store anchor as property
		this.focus.resize( 16, 16 );     // [object] size (e.g. 32x32)
		return true; // successfully setup
	}

	// Jumpstart the worldling [object] into action.
	// RETURNS: [boolean] `true` if yes, else `false` if not.
	start() {
		return true; // successfully started
	}

	// --------------------------------
	// Central Loop
	// --------------------------------
	// Central worldling render loop.
	// RETURNS: [bool] whether render succeeded or not.
	// * elapsedTime  - how much time has passed since the ticker started.
	// * tickDelay    - how much time between each tick (ie. 60ms)
	// * tickCount    - how many ticks have occurred
	// RETURNS: [void].
	render( { elapsedTime, tickDelay, tickCount } ) {
	}

	// Central worldling timeout loop.
	// RETURNS: [bool] whether pulse rendered or not.
	// * elapsedTime  - how much time has passed since the ticker started.
	// * tickDelay    - how much time between each tick (ie. 60ms)
	// * tickCount    - how many ticks have occurred
	// RETURNS: [void].
	pulse( { elapsedTime, tickDelay, tickCount } ) {
		// Refocus the animation
		this.refocus(); // always refocus
		// Check if user is frozen
		if ( this._clocks?.freeze!==null ) {
			// Get current time
			const now	= performance.now();
			// Determine if frozen
			if ( now<this._clocks.freeze )
				return; // user frozen
			else this._clock( 'freeze' ); // unfreeze
		}
		// Update only every 33.33ms
		if ( tickCount%2!==0 ) return false; // no render
		return true; // rendered
	}

	// --------------------------------
	// Gameboard Information
	// --------------------------------
	// Determine whether [object] is remote (serverside) or local.
	// RETURNS: [bool] whether [object] is serverside or local.
	get remote() {
		return _remote; // return [bool] whether object is serverside
	}
	// Get the [object] gameboard index.
	// RETURNS: [index] on the gameboard; -1 if not added.
	get index() {
		return _index; // return [object] index on the gameboard
	}
	// Set the [object] gameboard index.
	// RETURNS: [index] on the gameboard; -1 if not added.
	// * val - [int] value of index in gameboard.worldlings [array]
	set index( val ) {
		this._index = val; // change index value
	}
	// Get the [object] gameboard status.
	// RETURNS: [int] value of worldling status.
	get status() {
		return this._status; // return [object] statusß
	}
	// Set the [object] gameboard status.
	// RETURNS: [index] on the gameboard; -1 if not added.
	// * val - [int] value of status (e.g. 0=creating, 1=idle, 2=ready, 3=dispose).
	set status( val ) {
		// Check if object is disposed
		if ( this._status===3 ) return; // already trashed
		// Validate value.
		val	= Math.max( val, 0 );  // confine to max 3
		val	= Math.min( val, 3 );  // confine to min 0
		// Change the status.
		this._status = val;        // update status
	}

	// --------------------------------
	// World Positioning
	// --------------------------------
	// Get the user's level (world tile map JestLevel [object]).
	// RETURNS: [object] JestLevel or [...] on fail.
	get level() {
		// Get the user level [string] value
		const name  = this._level ?? null; // get current value
		if ( !jsos.prove(name,'string') ) {
			console.error( `Cannot get user level using a non-[string].` );
			return false;
		}
		// Get level [object] or this._level [...] value
		const level = this.client.gameboard.levels?.[name] ?? null;
		return level; // return level value
	}

	// Set the [object] level [string] name (world tile map).
	// RETURNS: [void].
	// * name	- [string] value of user level name.
	set level( name ) {
		// Validate argument
		if ( !jsos.prove(name,'string') ) {
			console.error( `Cannot change user level using a non-[string].` );
			return; // abort
		}
		// Get level [object] or throw error
		const level = this.client.gameboard.levels?.[name] ?? null;
		if ( !(level instanceof JestLevel) ) {
			console.error( `[Worldling] Level could not be located: ${name}` );
			return; // abort
		}
		this._level = name; // change level
	}

	// Refocus the worldling focal point (animation anchor)
	// and update the worldling's position information
	refocus() {
		// Get worldling anchor definitions
		const lens = this.client.camera.getScreenPositionReport( this );
		this._lens = lens;
		//console.log( this.name );
		//console.log( lens );
		// Move focus to destination
		this.focus.move( lens.screenX, lens.screenY ); // move x & y
	}

	/*// Get the [bool] of whether the object is in screen.
	// * val	- [bool] Value whether the object is in-screen.
	get visible() {
		return _visible; // return visible value
	}
	// Set the [bool] of whether the object is in screen.
	// RETURNS: [void].
	// * val	- [bool] Value whether the object is in-screen.
	set visible( val ) {
		this._visible = val===true;
	}*/

	// --------------------------------
	// Visual Handling
	// --------------------------------
	// Get the object's AnimationView (visual [object]).
	// RETURNS: [object] AnimationView or [...] on fail.
	get view() {
		// Get the user animation view
		if ( !(this._view instanceof AnimationView) ) return null; // no view set
		return this._view; // return view
	}

	// Set the [object] AnimationView object (for visual).
	// RETURNS: [void].
	// * view	- [object] AnimationView of the object's visual.
	set view( view ) {
		// Get view [object] or throw error
		if ( view!==null && !(view instanceof AnimationView) ) {
			console.error( `AnimationView could not be set.` );
			return;
		}
		this._view = view; // change view
	}

	// --------------------------------
	// Game Methods
	// --------------------------------
	// Check if the [object] is onwall.
	// RETURNS: [boolean] `true` if yes, else `false` if not.
	// * anchor        - [object] Anchor (units must match tileGrid).
	// * testX, testY  - [int] Level (x,y) coordinates in the tileset.
	onwall( anchor, testX, testY ) {
		// Validate anchor
		const tileGrid	= this.client.config.tileGrid;
		if ( !(anchor instanceof Anchor) || anchor.units!==tileGrid ) {
			console.warn( `Anchor argument must be [object] of instance Anchor with units in: ${tileGrid}` );
			return true; // block movement
		}

		// Calculate if user is actually hitting a wall
		const width   = anchor.width;    // use anchor width
		const height  = anchor.height;   // use anchor height
		const left    = Math.floor( anchor.globalX + testX );
		const right   = Math.floor( anchor.globalX + width + testX );
		const top     = Math.floor( anchor.globalY + testY );
		const bottom  = Math.floor( anchor.globalY + height + testY );

		// Determine whether any corner of the collider overlaps a blocking tile.
		return (
			this.level.isPointType( left, top, 'BLOCK' )      ||
			this.level.isPointType( right, top, 'BLOCK' )     ||
			this.level.isPointType( left, bottom, 'BLOCK' )   ||
			this.level.isPointType( right, bottom, 'BLOCK' )
			);
	}
}
