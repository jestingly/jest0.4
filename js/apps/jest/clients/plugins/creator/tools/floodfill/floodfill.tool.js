//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/tools/floodfill/floodfill.tool.js loaded' );

//-------------------------
// JestToolFloodfill Class
//-------------------------
// Tool for traversing tilemap in contiguous or non-contiguous flood pattern.
// Usage example: tool.fill( [2d array], 10, 20 );
class JestToolFloodfill extends JestTool {
	// Object Properties
	width			= 0;			// [int] width of tilemap
	height			= 0;			// [int] height of tilemap
	contiguous		= true;			// [bool] whether to only fill adjacent tiles
	scatter			= 0;			// [int] value of randomness to the fill
	// Context propert(ies)
	target			= null;			// [object] ElementCanvas for click event.
	layerId			= null;			// [int] Z value of layer index / id.
	_targetTile		= null;			// [object|null] tile to match against during flood
	_newTile		= null;			// [object|null] tile to apply during flood
	// Tile container(s)
	//tilemap			= null;			// [array] 2D tilemap reference
	changed			= null;			// [array] of recently changed tile(s)

	//_offsetX, _offsetY, _spacingX, _spacingY, _floodOriginX,
	//_floodOriginY, _useSwatch, _pCols, _pRows

	// --------------------------------
	// Constructor
	// --------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client		- [object] Application client that this piece belongs to.
	// * name		- [string] Value of tool name.
	constructor( client, name ) {
		super( client, name ); // call parent constructor
		const changed	= []; // track sparse undo
	}

	//-------------------------
	// Initialization
	//-------------------------
	// Build the element [object].
	// RETURNS: [void].
	// * name		- unique [string] value of component name in the system.
	// * classes	- [array] of classes to add to panel element.
	build( name='tool-floodfill', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		const defaultClasses	= [ 'tool-floodfill' ];
		super.build( name, defaultClasses.mergeUnique(classes) );
		// Tool is idle by default.
		this.jot( 'mode', 'idle' );	// tool is idle to start
	}

	// --------------------------------
	// Set Target Canvas
	// --------------------------------
	// Set the canvas [object] to enable floodfill for.
	// RETURNS: [void]
	// * target		- [ElementCanvas] The target to allow selectability on.
	setTarget( target ) {
		// Mode / enableability requirement
		const enabled	= this.skim( 'enabled' );
		const mode		= this.skim( 'mode' );
		if ( enabled || mode!=='idle' ) {
			console.warn( `Floodfill cannot change target while enabled or active.` );
		}
		// Validate argument(s)
		if ( !(target instanceof ElementCanvas) ) {
			console.warn( `Argument "canvas" must be of type ElementCanvas.` );
			return false; // failed
		}
		// Continue to set the canvas.
		this.target	= target; // set clickable canvas
	}

	// --------------------------------
	// Enable & Disable
	// --------------------------------
	// Enable the floodfill tool.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	enable() {
		// Check parent constructor.
		if ( !super.enable() ) return false;
		// Add event listener(s)
		this.reset(); // reset the tool
		this.jot( 'enabled', true ); // enable floodfill
	}

	// Disable the floodfill tool.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	disable() {
		// Check parent constructor.
		if ( !super.disable() ) return false;
		// Reset the tool.
		this.reset(); // reset floodfill tool
		// Remove event listener(s)
		this.removeTargetListeners();	// remove target events
		this.removeGlobalListeners();	// remove window events
		// Mark as disabled.
		this.jot( 'enabled', false );	// disable floodfill
	}

	//-------------------------
	// Resetting Methods
	//-------------------------
	// Reset the floodfill tool.
	// RETURNS: [void].
	reset() {
		//-------------------------
		// Reset Tool
		//-------------------------
		// Update the tool's mode
		this.jot( 'mode', 'idle' );		// mode = not filling
		// Clear changed tile(s)
		this.changed	= [];
		//-------------------------
		// Remove Event Listener(s)
		//-------------------------
		// Tear down all listener(s).
		this.removeTargetListeners();	// remove target events
		this.removeGlobalListeners();	// remove window events
		//-------------------------
		// Add Event Listener(s)
		//-------------------------
		// Create the mouse click event for floodfill start.
		this.target.register( 'click', 'floodfillStart', e=>this.start(e), 'dom' );
		//-------------------------
		// Emit Reset Event
		//-------------------------
		// Trigger reset event.
		this.emit( 'reset', null, this );
	}

	//-------------------------
	// Internal: Remove Global Listeners
	//-------------------------
	// Remove target event listener(s).
	removeTargetListeners() {
		this.target.unregister( 'click', 'floodfillStart' );
	}

	// Remove window event listener(s).
	removeGlobalListeners() {
		//this.target.unregister( jsos.mouseUps, 'floodfill' );
	}

	//-------------------------
	// Start Floodfill
	//-------------------------
	// Begin the floodfill process.
	// RETURNS: [void].
	// * e		- Event [object] from mouse click.
	start( e ) {
		//--------------------------------
		// Validate Tool Availability
		//--------------------------------
		// Explain why the start operation is blocked (if it is).
		if ( this.client.alertToolBlocked(this,'begin floodfill') )
			return; // abort action

		//--------------------------------
		// Check Mode Availability
		//--------------------------------
		// Mode / enableability requirement
		const enabled	= this.skim( 'enabled' );
		const mode		= this.skim( 'mode' );
		if ( !enabled || mode!=='idle' ) return;

		//--------------------------------
		// Reset & Begin Floodill
		//--------------------------------
		// Reset the floodfill tool for new floodfill.
		this.jot( 'replacing', true );	// replace mode on by default
		this.jot( 'mode', 'starting' );	// change mode
		// Emit start event.
		this.emit( 'start', null, e ); // emit event
		this.reset(); // reset the tool
	}

	// Begin floodfill from (x, y).
	// Traverses level.tilemap using match & apply logic.
	// RETURNS: [int] number of tiles changed
	// * tilemap	- [2D array] tilemap to flood
	// * x, y		- [int] starting tile coordinates
	fill( tilemap, x, y ) {
		//--------------------------------
		// Validate Tool State
		//--------------------------------
		// Mode / enableability requirement
		const enabled	= this.skim( 'enabled' );
		const mode		= this.skim( 'mode' );
		if ( !enabled || mode!=='starting' ) return;
		// Update mode(s).
		this.jot( 'mode', 'filling' );	// change mode
		//--------------------------------
		// Validate Input
		//--------------------------------
		// Require valid argument(s)
		if ( !tilemap || !tilemap.length ) return 0;

		//--------------------------------
		// Setup
		//--------------------------------
		// Access tilemap dimension information.
		this.height		= tilemap.length;
		this.width		= tilemap[0]?.length || 0;
		// Create pathway variable(s).
		const visited	= new Set();			// prevent repeat traversal
		const queue		= [];					// BFS traversal queue

		//--------------------------------
		// Initialize Queue
		//--------------------------------
		if ( this.contiguous ) {
			queue.push( [ x, y ] ); // start at seed point
		}
		else {
			// Non-contiguous mode — check entire tilemap
			for ( let j=0; j<this.height; j++ ) {
				for ( let i=0; i<this.width; i++ ) {
					queue.push( [ i, j ] );
				}
			}
		}

		//--------------------------------
		// Traverse & Apply
		//--------------------------------
		// Begin traversal flood-filling.
		let count = 0;
		while ( queue.length>0 ) {
			// Pop next tile from queue
			const [ cx, cy ]	= queue.shift();
			const id			= `${cx},${cy}`;

			// Skip if already visited
			if ( visited.has(id) ) continue;
			visited.add( id );

			// Bounds check.
			if ( !this.inBounds(cx,cy) ) continue;

			// Grab tile at current position.
			const tile = tilemap[cy][cx];
			// By default, all tile(s) are being replaced.
			this.jot( 'replacing', true );	// replace-mode on by default
			// Allow for advanced external "replace" logic.
			// NOTE: Testing for tolerance, etc. is possible.
			this.emit( 'checkReplace', null, tile );
			if ( !this.skim('replacing') ) continue;

			// Apply handler logic to tile.
			this.emit( 'applyReplace', null, { x:cx, y:cy } );
			count++; // increment count

			// Add neighbors if in contiguous mode.
			if ( this.contiguous ) {
				queue.push( [ cx+1, cy ] ); // east
				queue.push( [ cx-1, cy ] ); // west
				queue.push( [ cx, cy+1 ] ); // south
				queue.push( [ cx, cy-1 ] ); // north
			}
		}

		// Return Total Changed
		return count; // total count of tile(s) changed
	}

	//-------------------------
	// Bounds Check
	//-------------------------
	// Check if (x,y) coordinate is inside the tilemap bounds.
	// RETURNS: [bool] true if within bounds, else false
	// * x, y	– [int] tile coordinate
	inBounds( x, y ) {
		return x>=0 && y>=0 && x<this.width && y<this.height;
	}

	//-------------------------
	// Set Option(s)
	//-------------------------
	// Set the solidity of the fill scatter value.
	// * value	– [int] value of randomness (0%=none, 100%=high)
	setScatter( value ) {
		// Set the scatter percent value.
		this.scatter	= Math.min( Math.max(0,value), 100 );
	}

	// Set the contiguous value (whether continuous fill or global).
	// * value	– [bool] value of whether contiguous is on (true) or off (false)
	setContiguous( value ) {
		// Set the contiguous value.
		this.contiguous	= Boolean( value );
	}

	//-------------------------
	// Tile Handling Method(s)
	//-------------------------
	// Set the floodfill context for tile replacement.
	// Sets internal references to the tile to match and the tile to place.
	// RETURNS: [void]
	// * targetTile	- [object] tile to match against in floodfill
	// * newTile	- [object] tile to place when match is confirmed
	setContext( targetTile, newTile ) {
		this._targetTile	= targetTile;
		this._newTile		= newTile;
	}
}
