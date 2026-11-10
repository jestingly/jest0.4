//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/tools/marquee/marquee.tool.js loaded' );

//-------------------------
// JestToolMarquee Class
//-------------------------
// This class frames an [object] that serves as a base usable tool.
class JestToolMarquee extends JestTool {
	// Object propert(ies)
	target		= null;			// [object] ElementCanvas for drawing.
	tracer		= null;			// [object] Anchor used for active tracing.
	// New Selection Region Stack
	multiselect	= true;			// [bool] Whether multiselection is possible (add/subtract).
	rects 		= [];			// List of all additive and subtractive selections
	bounds		= null;			// [object] of total rect(s) boundaries.
	mask		= null;			// 2d [array] of mask using add/subtract rect(s).
	// Miscellaneous variables
	contents	= null;			// [...] Contents of the marquee
	// Measurement propert(ies)
	clickX		= null;			// [number] Click start x location of selection.
	clickY		= null;			// [number] Click start y location of selection.
	originX		= null;			// [number] Far left x location of active selection.
	originY		= null;			// [number] Far top y location of active selection.
	dragStartX	= null;			// [number] Far left x origin of a new drag.
	dragStartY	= null;			// [number] Far top y origin of a new drag selection.
	grabOffsetX	= 0;			// [number] Grab x offset from selection top-left while dragging.
	grabOffsetY	= 0;			// [number] Grab y offset from selection top-left while dragging.
	layerId		= null;			// [int] Z value of layer index / id.
	// Boolean flags
	moved		= false;		// [bool] Whether the marquee has been moved during selection.
	lastState	= null;			// history save state

	// --------------------------------
	// Constructor
	// --------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client		- [object] Application client that this piece belongs to.
	// * name		- [string] Value of tool name.
	constructor( client, name ) {
		super( client, name ); // call parent constructor
	}

	//-------------------------
	// Initialization
	//-------------------------
	// Build the element [object].
	// RETURNS: [void].
	// * name		- unique [string] value of component name in the system.
	// * classes	- [array] of classes to add to panel element.
	build( name='tool-marquee', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		const defaultClasses	= [ 'tool-marquee' ];
		super.build( name, defaultClasses.mergeUnique(classes) );

		// Tool is empty by default.
		this.jot( 'mode', 'empty' );	// tool is idle to start

		// Create tracer anchor [object].
		this.tracer	= new Anchor(); // second anchor
		// Force tracer to match grid of anchor.
		this.anchor.register( 'graticulate', 'retrace', s=>this.tracer.graticulate(s) );
		this.tracer.graticulate( this.anchor.units ); // match
	}

	// --------------------------------
	// Set Marquee Drawing Target
	// --------------------------------
	// Set the canvas [object] to make selectable.
	// RETURNS: [void]
	// * target		- [ElementCanvas] The target to allow selectability on.
	setTarget( target ) {
		// If no selection is made, return null.
		const enabled	= this.skim( 'enabled' );
		const mode		= this.skim( 'mode' );
		if ( enabled || mode!=='empty' ) {
			console.warn( `Marquee cannot change target while enabled or active.` );
		}
		// Validate argument(s)
		if ( !(target instanceof ElementCanvas) ) {
			console.warn( `Argument "canvas" must be of type ElementCanvas.` );
			return false; // failed
		}
		// Continue to set the canvas.
		this.target	= target;
	}

	// --------------------------------
	// Enable & Disable
	// --------------------------------
	// Enable the marquee tool.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	enable() {
		// Check parent constructor.
		if ( !super.enable() ) return false;
		// Add event listener(s)
		//this.reset(); // reset the tool
		this.jot( 'enabled', true ); // enable selectability
		// Restore the marquee selection state.
		this.restoreSelectionState( this.getSelectionState() );
	}

	//--------------------------------
	// Disable Marquee Tool
	//--------------------------------
	// Disable marquee interactions and clear its selection.
	// Floating selections are dropped before switching tools.
	// RETURNS: [boolean].
	disable() {
		//--------------------------------
		// Validate Disable
		//--------------------------------
		if ( !super.disable() ) return false;

		//--------------------------------
		// Clear Marquee Selection
		//--------------------------------
		// Drop any floating tiles and clear the selection.
		// Preserve the existing history/event behavior.
		//this.reset();

		//--------------------------------
		// Remove Event Listeners
		//--------------------------------
		// Remove mouse interaction listeners.
		this.removeTargetListeners();
		this.removeGlobalListeners();

		//--------------------------------
		// Mark Tool Disabled
		//--------------------------------
		this.jot( 'enabled', false );

		return true;
	}

	// --------------------------------
	// Set Option(s)
	// --------------------------------
	// Set the multiselectability of the marquee.
	// RETURNS: [void]
	// * enable	- [bool] Whether to allow multiselectability (true) or not (false).
	setMultiselect( enable=true ) {
		// Set multi-select.
		this.multiselect	= enable ? true : false;
	}

	//-------------------------
	// Resetting Methods
	//-------------------------
	// Reset the marquee tool.
	// RETURNS: [void].
	// * drop - [bool] Whether to drop the selection (true, else false).
	reset( drop=true, recordHistory=true ) {
		//-------------------------
		// Clear Selection
		//-------------------------
		const previous	= this.getSelectionState();
		this.deselect( drop );			// deselect if selected
		//-------------------------
		// Reset Selection
		//-------------------------
		// Update the marquee
		this.jot( 'mode', 'empty' );	// mode = no selection
		this.anchor.move( 0, 0 );		// move anchor to origin
		this.anchor.resize( 0, 0 );		// set anchor size to 0x0
		this.tracer.move( 0, 0 );		// move tracer to origin
		this.tracer.resize( 0, 0 );		// set tracer size to 0x0
		// Empty contents.
		this.rects		= [];			// reset selections
		this.bounds		= null;			// reset selection boundaries
		this.layerId	= null;			// capture layer id
		this.mask		= null;			// reset mask
		this.contents	= null;			// reset contents to [null]
		//-------------------------
		// Remove Event Listener(s)
		//-------------------------
		// Tear down all listener(s).
		this.removeTargetListeners();	// remove target events
		this.removeGlobalListeners();	// remove window events
		//-------------------------
		// Add Event Listener(s)
		//-------------------------
		// Create the mouse click event for selection start.
		this.target.register( 'mousedown', 'selectStart', e=>this.checkClick(e), 'dom' );
		//-------------------------
		// Emit Reset Event
		//-------------------------
		// Trigger reset event.
		this.emit( 'reset', null, this );
		if ( recordHistory && ['selected','floating'].includes(previous.mode) )
			this.emit( 'selectionCleared', null, previous );
	}

	//-------------------------
	// Get Bounds
	//-------------------------
	// Get the bounds of the anchor in pixels.
	// RETURNS: [object] { x, y, w, h } in pixel units or [null] for deselect.
	getBounds() {
		// If no selection is made, return null.
		const enabled	= this.skim( 'enabled' );
		const mode		= this.skim( 'mode' );
		if ( !enabled || mode==='empty' ) return null;
		// Get anchor's logical (grid) values
		const x	= this.anchor.x * this.anchor.units;
		const y	= this.anchor.y * this.anchor.units;
		const w	= this.anchor.width * this.anchor.units;
		const h	= this.anchor.height * this.anchor.units;
		// Return as bounding [object]
		return { x, y, w, h };
	}

	// Handle the click event based upon mode, i/o key(s), & location.
	// RETURNS: [void].
	// * e - Event [object] from mouse click.
	checkClick( e ) {
		//--------------------------------
		// Validate Marquee Availability
		//--------------------------------
		// Automatically explain why the paste operation is blocked.
		// The helper returns true when the operation must be canceled.
		if ( this.client.alertToolBlocked(this,'begin marquee selection') )
			return; // tool unavailable

		//-------------------------
		// Calibrate Mode
		//-------------------------
		// Mode / enableability requirement
		const enabled  = this.skim( 'enabled' );
		let mode       = this.skim( 'mode' );
		if ( !enabled ) return;

		//-------------------------
		// Check Keyboard Action
		//-------------------------
		// Get keyboard modifiers.
		const mod      = this.getModifiers( e );
		// Determine if shift key is pressed.
		const add      = mod.shift;
		// Check for alt/option key.
		const sub      = mod.alt;

		//-------------------------
		// Check Click Context
		//-------------------------
		// Determine if adding or subtracting.
		const restart  = !( add || sub );
		// Check if click is inside an active selection.
		let inside     = this.isClickInsideSelection( e );

		//-------------------------
		// Capture Existing State
		//-------------------------
		// Save current selection state data for history.
		this.lastState = this.getSelectionState();

		//-------------------------
		// Handle Mode Change
		//-------------------------
		// Determine next -> mode based upon calibration & input.
		switch ( mode ) {
			case 'empty': // no selection made
				this.reset(); // reset selection (safety-check)
				this.jot( 'mode', 'selecting' ); // begin 'selecting'
				break;
			case 'selected': // selection already exists
			case 'floating': // selection is floating
				// If multiselecting, simply continue selecting.
				if ( this.multiselect && mode==='selected' && (add||sub) )
					this.jot( 'mode', 'selecting' ); // add/subtract 'selecting'
				// If not adding or subtracting, check for drag or restart.
				else {
					// If clicking inside selection rects, begin dragging.
					if ( inside ) { // clicked existing marque
						// Check if selection has been floated yet (clicked / dragged).
						if ( mode==='selected' ) { // check if lifting embedded
							this.jot( 'mode', 'floating' );		// marquee is floating
							this.emit( 'floated', null, this );	// embedded selection lifted
						}
					}
					// Outside selection, restart a new selection
					else {
						// Reset the tool.
						this.reset( true, false ); // new selection
						// A floating selection was dropped as a separate history action.
					    // The next selection must therefore begin from an empty state.
						if ( mode==='floating' )
					        this.lastState = this.getSelectionState();
						// Change the marquee tool mode.
						this.jot( 'mode', 'selecting' ); // new 'selecting'
					}
				}
				break;
			default: break;
		}

		// Return helper data.
		mode		= this.skim( 'mode' ); // update mode
		const info	= { enabled, mode, add, sub, restart, inside }; // return info

		//-------------------------
		// Calculate Coordinates
		//-------------------------
		// Convert mouse event to tile‐coordinates
		const mouse	= this.target.mousePos( e );
		const tileX	= Math.floor( mouse.x/this.anchor.units );
		const tileY	= Math.floor( mouse.y/this.anchor.units );

		//-------------------------
		// Delegate to Task
		//-------------------------
		// Determine start method.
		switch ( mode ) {
			case 'selecting':
				return this.startDrawSelection( e, info, tileX, tileY ); // begin selecting
			case 'floating':
				return this.startDragSelection( e, info, tileX, tileY ); // begin dragging
		}
	}

	//-----------------------------
	// Check If Click Is Inside Selection
	//-----------------------------
	// Determines whether the current mouse event lands inside the active marquee.
	// RETURNS: [bool] true if click is inside selection mask.
	// * e		– [MouseEvent] object to compute against.
	isClickInsideSelection( e ) {
		// Early exit if invalid mask or bounds
		if ( !this.bounds || !this.mask || !this.mask.length ) return false;

		// Get mouse click position in pixel space
		const click = this.target.mousePos( e );

		// Convert pixel to grid coordinate
		const gx = Math.floor( click.x / this.anchor.units );
		const gy = Math.floor( click.y / this.anchor.units );

		// Check if inside bounding box
		if ( !this.client.grapher.isPointInBounds(gx,gy,this.bounds) )
			return false; // not inside selection

		// Convert to mask-local space
		const mx = gx - this.bounds.x;
		const my = gy - this.bounds.y;

		// Verify that the mask contains the cell and is active
		return !!( this.mask[my] && this.mask[my][mx] );
	}

	//-----------------------------
	// Marquee Rect Handling Method(s)
	//-----------------------------
	// Create a select rect.
	// * x,y	- [int] Coordinates (in tile units) of rect top-left location.
	// * w,h	- [int] Dimensions (in tile units) of rect width x height.
	// action	- [string] Value of action name: 'add', 'sub', 'replace'
	createRect( x, y, w, h, type='add' ) {
		// Validate argument(S).
		if ( !['add','sub','replace'].includes(type) ) {
			console.warn( `Unknown argument for marquee rect type ${type}` );
			return false;
		}
		// Compute rectangle
		const rect = { x, y, w, h, type };
		// Return rect data.
		return rect; // return rect [object]
	}

	//-----------------------------
	// Drawing Selection Method(s)
	//-----------------------------
	// Begin the marquee drawing.
	// RETURNS: [void].
	// * e     - Event [object] from mouse click.
	// * info  - [object] Calculated initial click information.
	// * tx,ty - [int] Value of tile x,y coordaintes.
	startDrawSelection( e, info, tx, ty ) {
		//--------------------------------
		// Validate Marquee Availability
		//--------------------------------
		// Explain why the pendown operation is blocked (if it is).
		if ( this.client.alertToolBlocked(this,'begin marquee selection') )
			return; // abort action

		//-------------------------
		// Check Availability
		//-------------------------
		// Require the tool to be available.
		if ( !this.usable() )
			return this.cancel(); // tool unavailable

		//-------------------------
		// Check Tool Modifier
		//-------------------------
		// If subtracting with no previous marquees, cancel.
		if ( this.rects.length===0 && info.sub===true )
			return this.cancel();

		//-------------------------
		// Clamp Boundaries
		//-------------------------
		// Don't go below 0
		tx	= Math.max( 0, tx );
		ty	= Math.max( 0, ty );
		// Get target width/height (in tile units)
		const tw	= this.target.width  / this.anchor.units;
		const th	= this.target.height / this.anchor.units;
		// Don't go beyond the matrix
		this.clickX	= Math.min( tx, tw ),
		this.clickY	= Math.min( ty, th );
		// Begin tracing the new selection.
		this.tracer.move( this.clickX, this.clickY ); // move anchor to new location
		this.tracer.resize( 0, 0 ); // resize the anchor
		//console.log( this.clickX, this.clickY );

		//-------------------------
		// Emit Event(s)
		//-------------------------
		// Emit event listener signaling .
		const action = { permit: true };
		this.emit( 'pendown', null, action );

		//-------------------------
		// Add Event Listener(s)
		//-------------------------
		// Check if action is permitted.
		if ( action.permit===true ) {
			// Add mouse listener for dragging & creating.
			this.target.register( 'mousemove', 'selecting', e=>this.drawSelection(e), 'window' );
			// Add window listener(s) for relase.
			this.target.register( jsos.mouseUps, 'selected', e=>this.endDrawSelection(e), 'window' );
		}
	}

	// Track the expansion or contraction (or neither) of the marquee.
	// RETURNS: [void].
	// * e - Event [object] from mouse click.
	drawSelection( e ) {
		//-------------------------
		// Check Availability
		//-------------------------
		// Require the tool to be available.
		if ( !this.usable() ) return; // tool unavailable
		// Mode / enableability requirement
		const enabled	= this.skim( 'enabled' );
		const mode		= this.skim( 'mode' );
		if ( !enabled || mode!=='selecting' ) return;

		//-------------------------
		// Calculate Size & Location
		//-------------------------
		// Use helper method to calculate.
		const mod		= this.getModifiers( e );
		const click		= this.target.mousePos( e );
		const tw		= this.target.width  / this.anchor.units;
		const th		= this.target.height / this.anchor.units;
		const tileX		= Math.floor( click.x / this.anchor.units );
		const tileY		= Math.floor( click.y / this.anchor.units );
		const { startX, startY, width, height } =
			this.applyModifiersToRect( mod, this.clickX, this.clickY, tileX, tileY, tw, th );

		// -----------------------------
		// Update & Emit Event(s)
		// -----------------------------
		// Move and resize the anchor
		this.tracer.move( startX, startY );
		this.tracer.resize( width, height );
		// Emit event listener if selection exists.
		if ( width>0 && height>0 )
			this.emit( 'selecting', null, this );
	}

	// Finish drawing the marquee selection.
	// RETURNS: [void].
	// * e - Event [object] from mouse click.
	endDrawSelection( e ) {
		//console.log( 'ended');
		//-------------------------
		// Handle New Selection
		//-------------------------
		// Require the marquee to contain substance
		const { x, y, w, h } = this.tracer.getBounds();
		const units		= this.anchor.units;

		// ------------------------------
		// Compute rect & preserve action
		// ------------------------------
		// Get keyboard modifiers.
		const mod		= this.getModifiers( e );
		// Reset the marquee tool for new selection.
		const isAdd		= mod.shift;
		const isSub		= mod.alt;
		const isNew		= !( isAdd || isSub );
		const action	= isAdd ? 'add'		// ⌘ Shift = additive
							: isSub ? 'sub'	// ⌥ Option = subtractive
							: 'replace';	// no modifier = replace
		// Compute rectangle
		const rect		= this.createRect( x, y, w, h, action );

		//-------------------------
		// Abort zero-area drags
		//-------------------------
		// Store rect if selection made.
		if ( !(action==='sub' && this.rects.length===0)
			 && rect.w>0 && rect.h>0 ) {
			// Determine if adding or replacing
			if ( rect.type==='replace' )
				this.rects = [ rect ]; // clear old rects, keep replace
			else this.rects.push( rect );

			//--------------------------------
			// Compute & Finalize Selection Mask
			//--------------------------------
			// First apply the user's manual add/subtract rectangles.
			this._computemask();

			// Let application-specific plugins refine the computed mask.
			// Level Marquee can remove empty tile cells here.
			// This happens before the selected event records undo history.
			this.emit( 'maskFinalized', null, this );

			//-------------------------
			// Finalize state
			//-------------------------
			// Reset anchor to the visible box
			this.anchor.move( this.bounds.x, this.bounds.y );
			this.anchor.resize( this.bounds.w, this.bounds.h );

			// Reset tracer to invisible.
			this.tracer.move( 0, 0 );
			this.tracer.resize( 0, 0 );

			// Emit event listener.
		}

		//--------------------------------
		// Ignore Visually Unchanged Level Selections
		//--------------------------------
		// An additive/subtractive operation may affect only empty tiles.
		// Compare the actual selected tile coordinates rather than the
		// rectangle commands used to construct them.
		// If nothing changed, restore the original selection without
		// creating an unnecessary undo/redo entry.
		if ( this.name==='levelMarquee' && this.lastState?.mode==='selected' ) {
			//--------------------------------
			// Reject Unchanged Shape
			//--------------------------------
			// Ignore rectangle metadata differences when the selected cells
			// have not changed at all.
			const before = JSON.stringify( this.selectionCells(this.lastState) );
			const after  = JSON.stringify( this.selectionCells(this) );
			if ( before===after ) {
				// Restore the original rectangles and mask together.
				// This prevents useless empty additive rectangles accumulating.
				this.restoreSelectionState( this.lastState );
				return;
			}
		}

		// A selection must contain at least one included tile.
		// The application may have subtracted all empty cells.
		if ( this.rects.length>0
			 && this.mask?.some(row=>row.some(Boolean)) ) {
			this.jot( 'mode', 'selected' );
			this.emit( 'selected', null, this );
		}
		else {
		    // Retrieve the selection that existed before mousedown.
		    const previous = this.lastState;
		    // Clear the incomplete selection without recording history.
		    this.reset( false, false );
		    // If an ordinary selection existed, record its deselection.
		    // Floating selections already have a separate drop history entry.
		    if ( previous?.mode==='selected' )
		        this.emit( 'selectionCleared', null, previous );
		    return;
		}

		//-------------------------
		// Remove Event Listener(s)
		//-------------------------
		// Remove the mouse listeners for dragging & creating
		this.target.unregister( 'mousemove', 'selecting' );
		this.removeGlobalListeners(); // remove window events
	}

	//--------------------------------
	// Generate Selected Cell Signature
	//--------------------------------
	// Convert a mask into an ordered list of absolute tile positions.
	// Bounds may differ even when the actual selection is identical.
	selectionCells( selection ) {
		// Access marquee selection irregular mask & rectangular bounds.
		const mask   = selection.mask;
		const bounds = selection.bounds;
		if ( !mask || !bounds ) return []; // fail

		// Build return [array] of serialized masks.
		const cells  = [];
		for ( let y=0; y<mask.length; y++ ) {
			for ( let x=0; x<mask[y].length; x++ ) {
				if ( mask[y][x] )
					cells.push( `${bounds.x+x},${bounds.y+y}` );
			}
		}
		// Return [array] of serialized masks.
		return cells; // [array]
	}

	//-------------------------
	// Set Selection Method(s)
	//-------------------------
	// Manually set the marquee selection.
	// RETURNS: [void].
	// * x,y    - [number] Coordinates of location on level to fill.
	// * w,h    - [number] Width and height dimensions of region to fill.
	// * matrix - 2d [array] of matrix tiles.
	// * stamp  - ElementCanvas [object] image of internal contents.
	//   rects  - [array] Rectangle selection(s).
	select( x, y, w, h, matrix, stamp, rects, layerId=null ) {
		//--------------------------------
		// Validate Tool Availability
		//--------------------------------
		// Programmatic selection requires an equipped, empty marquee.
		const enabled	= this.skim( 'enabled' );
		const mode		= this.skim( 'mode' );
		if ( !enabled || mode!=='empty' ) return;

		//--------------------------------
		// Position Selection
		//--------------------------------
		// Align the selection anchor with the supplied matrix.
		this.anchor.move( x, y );		// move selection to coordinates
		this.anchor.resize( w, h );		// resize selection to dimensions

		//--------------------------------
		// Assign Source Layer and Contents
		//--------------------------------
		// Preserve the owning layer before recording history.
		if ( layerId!==null )
			this.layerId = layerId;
		// Store the matrix, stamp, location, and source layer together.
		this.contents = { x, y, w, h, matrix, stamp, layerId: this.layerId };
		this.rects    = rects;

		//--------------------------------
		// Construct Initial Mask
		//--------------------------------
		// Preserve the existing rectangle-based selection calculation.
		this._computemask();

		//--------------------------------
		// Preserve Sparse Level Selections
		//--------------------------------
		// A pasted matrix already defines which cells contain tiles.
		// Use it as the authoritative mask for Level Marquee.
		// Do not resample the destination layer or alter the paste shape.
		if ( this.name==='levelMarquee' &&
			 Array.isArray(matrix) && matrix.length===h &&
			 matrix.every(row=>Array.isArray(row) && row.length===w) ) {
			// Null matrix entries must remain excluded.
			this.mask   = matrix.map( row => row.map(tile=>tile!=null) );
			// Match mask origin and dimensions to the inserted region.
			this.bounds = { x, y, w, h };
		}

		//--------------------------------
		// Finalize Selection and History
		//--------------------------------
		// The selected event sees the completed mask and layer ID.
		this.jot( 'mode', 'floating' );
		this.emit( 'selected', null, this );
	}

	// -------------------------------
	// Cancel a Selection
	// -------------------------------
	// Cancel a selection.
	// RETURNS: [void].
	cancel() {
		// Mode / enableability requirement.
		const enabled	= this.skim( 'enabled' );
		const mode		= this.skim( 'mode' );
		if ( !enabled || !['selecting','selected'].includes(mode) ) return;
		//-------------------------
		// Cancel Selection
		//-------------------------
		// Cancel & emit event listener.
		this.jot( 'mode', 'empty' );
		this.emit( 'canceled', null, this );
		this.reset(); // reset the marquee
	}

	// -------------------------------
	// Compute Selection Mask
	// -------------------------------
	// Merges all rects (add/sub/replace) into a boolean mask
	// and asks the canvas to redraw the overlay.
	// RETURNS: [void].
	_computemask() {
		//-------------------------
		// Setup Computation Vars
		//-------------------------
		// Setup grid dims in tiles.
		const units	= this.anchor.units;
		const cols	= this.target.width  / units;
		const rows	= this.target.height / units;

		//-------------------------
		// Find total bounding box
		//-------------------------
		// Bounding rectangle
		let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
		// Apply each rect in order.
		for ( const rect of this.rects ) {
			const sx = rect.x;
			const sy = rect.y;
			const ex = Math.ceil( rect.x+rect.w );
			const ey = Math.ceil( rect.y+rect.h );

			minX = Math.min( minX, sx );
			minY = Math.min( minY, sy );
			maxX = Math.max( maxX, ex );
			maxY = Math.max( maxY, ey );
		}

		// Allocate only the necessary mask
		const maskW = maxX - minX;
		const maskH = maxY - minY;

		//-------------------------
		// Create compact mask
		//-------------------------
		// Initialize blank mask.
		const mask =
			Array.from(
				{ length: maskH },
				() => Array(maskW).fill( false )
				);

		//-------------------------
		// Apply all rects
		//-------------------------
		// Iterate each rect & toggle off / on grid squares.
		for ( const rect of this.rects ) {
			// Compute dimensions.
			const sx = rect.x - minX;
			const sy = rect.y - minY;
			const w  = rect.w;
			const h  = rect.h;
			// Iterate each part & determine if it's selected or not.
			for ( let y=0; y<h; y++ ) {
				for ( let x=0; x<w; x++ ) {
					const tx = sx + x;
					const ty = sy + y;
					if ( tx<0 || ty<0 || tx>=maskW || ty>=maskH ) continue;
					if ( rect.type==='sub' )
						mask[ty][tx]  = false;	// subtract rect
					else mask[ty][tx] = true;	// add or replace
				}
			}
		};

		//-------------------------
		// Store output
		//-------------------------
		// Store the mask in the tool properties.
		this.mask	= mask;
		// Final bounding rect of selection area
		this.bounds	= {
			x: minX,
			y: minY,
			w: maskW,
			h: maskH
			};

		//-------------------------
		// Optional Rect Simplification
		//-------------------------
		// Try to collapse to a single rect if mask is solid
		const simpleRect = this.tightRectFromMask( mask, minX, minY );
		if ( simpleRect ) {
			this.rects	= [ simpleRect ];
			this.mask	= [ ...Array(simpleRect.h) ].map( ()=>Array(simpleRect.w).fill(true) );
			this.bounds	= {
				x: simpleRect.x,
				y: simpleRect.y,
				w: simpleRect.w,
				h: simpleRect.h
				};
		}
	}

	//-------------------------
	// Rectify Boolean Mask Into Single Rect
	//-------------------------
	// Attempts to simplify a [bool] mask into a single rectangular region.
	// RETURNS: [object|null] rect if it is fully filled with trues, else null.
	// * mask - [2D array] of booleans
	// * ox,oy - [int] top-left x,y coordinates of mask origin.
	tightRectFromMask( mask, ox=0, oy=0 ) {
		// Validate input
		if ( !Array.isArray(mask) || !mask.length || !mask[0].length ) return null;
		const h		= mask.length;
		const w		= mask[0].length;

		// Ensure all rows are same width
		for ( let y=0; y<h; y++ )
			if ( mask[y].length!==w ) return null;

		// Find top row with at least one true
		let top		= 0;
		while ( top<h && !mask[top].some(Boolean) ) top++;

		// Find bottom row with at least one true
		let bottom	= h - 1;
		while ( bottom>=0 && !mask[bottom].some(Boolean) ) bottom--;

		// Bail if fully empty
		if ( top>bottom ) return null;

		// Find leftmost and rightmost cols with any true
		let left	= 0;
		let right	= w - 1;
		while ( left<w && mask.every(row=>!row[left]) ) left++;
		while ( right>=0 && mask.every(row=>!row[right]) ) right--;

		// Bail if no true column exists
		if ( left>right ) return null;

		// Now check if this inner rect is solid (all true)
		for ( let y=top; y<=bottom; y++ )
			for ( let x=left; x<=right; x++ )
				if ( !mask[y][x] ) return null;

		// Return cropped solid rect
		return {
			x	: ox + left,
			y	: oy + top,
			w	: right - left + 1,
			h	: bottom - top + 1,
			type : 'add'
			};
	}

	//-----------------------------
	// Dragging Selection Method(s)
	//-----------------------------
	// Called during selection to see if user clicked inside the marquee region.
	// RETURNS: [void].
	// * e     - Event [object] from mouse click.
	// * info  - [object] Calculated initial click information.
	// * tx,ty - [int] Value of tile x,y coordaintes.
	startDragSelection( e, info, tx, ty ) {
		//-------------------------
		// Check Availability
		//-------------------------
		// Require the tool to be available.
		if ( !this.usable() ) return; // tool unavailable

		//-------------------------
		// Change Mode to Dragging
		//-------------------------
		// Set mode to dragging.
		this.jot( 'mode', 'dragging' );

		//-------------------------
		// Calculate Measurements
		//-------------------------
		// Store original anchor position at drag start
		this.dragStartX = this.anchor.x;
		this.dragStartY = this.anchor.y;
		// Grab the current anchor bounds in grid units
		const boxX	= this.anchor.x;
		const boxY	= this.anchor.y;
		const boxW	= this.anchor.width;
		const boxH	= this.anchor.height;
		// Calculate offset from the top-left corner
		this.grabOffsetX	= tx - boxX;
		this.grabOffsetY	= ty - boxY;

		//-------------------------
		// Add Event Listener(s)
		//-------------------------
		// Add even listener(s) for dragging.
		this.target.register( 'mousemove', 'dragging', e=>this.dragSelection(e), 'window' );
		this.target.register( jsos.mouseUps, 'dragged', e=>this.endDragSelection(e), 'window' );

		// -----------------------------
		// Modifier: Duplicate Selection
		// -----------------------------
		// Get key modifiers.
		const mod	= this.getModifiers( e );
		// If user holds Alt/Option while dragging, emit 'duplicate'.
		if ( mod.duplicate )
			this.emit( 'duplicate', null, this );
	}

	// Called on every mousemove while in mode = 'dragging'
	// RETURNS: [void].
	// * e - Event [object] from mouse click.
	dragSelection( e ) {
		//-------------------------
		// Check Availability
		//-------------------------
		// Require the tool to be available.
		if ( !this.usable() ) return; // tool unavailable
		// Mode / enableability requirement
		const enabled	= this.skim( 'enabled' );
		const mode		= this.skim( 'mode' );
		if ( !enabled || mode!=='dragging' ) return;

		//-------------------------
		// Convert Coordinates to Grid
		//-------------------------
		// Convert to tile coords
		const mouse		= this.target.mousePos( e );
		let tileX		= Math.floor( mouse.x/this.anchor.units );
		let tileY		= Math.floor( mouse.y/this.anchor.units );
		// Compute new top-left of the anchor so the relative offset remains
		tileX			= tileX - this.grabOffsetX;
		tileY			= tileY - this.grabOffsetY;
		// Clamp so the entire box stays within [0..target.width) × [0..target.height)
		/*const maxCols = this.target.width;
		const maxRows 	= this.target.height;
		const boxW		= this.anchor.width;
		const boxH		= this.anchor.height;*/

		//-------------------------
		// Check Modifiers (Alt/Opt/Ctrl/Cmd)
		//-------------------------
		// Get keyboard modifiers.
		const mod		= this.getModifiers( e );
		// Axis lock modifier.
		if ( mod.shift ) {
			const dx	= Math.abs( tileX - this.dragStartX );
			const dy	= Math.abs( tileY - this.dragStartY );
			if ( dx>dy )
				tileY	= this.dragStartY; // lock Y
			else tileX	= this.dragStartX; // lock X
		}

		// Finally, move the anchor to the new position
		if ( tileX!==this.anchor.x || tileY!==this.anchor.y ) {
			this.anchor.move( tileX, tileY );		// move the anchor
			this.bounds	= this.anchor.getBounds();	// update live bounds
		}
	}

	// Called on mouseup (or blur/contextmenu) to finish dragging.
	// RETURNS: [void].
	// * e - Event [object] from mouse click.
	endDragSelection( e ) {
		//-------------------------
		// Mode Gatekeep & Handling
		//-------------------------
		// Mode / enableability requirement
		const enabled	= this.skim( 'enabled' );
		const mode		= this.skim( 'mode' );
		if ( !enabled || mode!=='dragging' ) return;
		// Switch to "floating" (floated selection).
		this.jot( 'mode', 'floating' );

		//-------------------------
		// Remove Event Listener(s)
		//-------------------------
		// Unregister the dragging mousemove & mouseup handlers
		this.target.unregister( 'mousemove', 'dragging' );
		this.removeGlobalListeners(); // remove window events

		//-------------------------
		// Emit Event(s)
		//-------------------------
		// Emit “moved” event for final location change.
		this.emit( 'moved', null, this );
	}

	//-------------------------
	// Deselect Method(s)
	//-------------------------
	// Deselect the selection if selected.
	// RETURNS: [void].
	// * drop	- [bool] Whether to drop the selection (true, else false).
	deselect( drop=true ) {
		//-------------------------
		// Handle Current Selection (if applicable)
		//-------------------------
		// Check if marquee is releasing.
		const mode	= this.skim( 'mode' );
		switch ( mode ) {
			case 'floating':
				// Trigger dropped event.
				if ( drop===true )
					this.emit( 'dropped', null, this );
			case 'selected':
				// Trigger abort event.
				this.emit( 'aborted', null, this );
				//this.matrix.paint( this.marquee.tiles, this.x, this.y );
				break;
			default: break;
		}
		//-------------------------
		// Emit Deselect Event
		//-------------------------
		// Trigger deselected event.
		this.emit( 'deselected', null, this );
	}

	// -----------------------------
	// Modifier Helper: Get Modifiers
	// -----------------------------
	// Returns modifier flags based on current mouse event.
	getModifiers( e ) {
		return {
			alt	      : !!e.altKey,
			shift     : !!e.shiftKey,
			square    : !!( e.altKey && e.shiftKey ),
			axisLock  : !!( e.shiftKey && !e.altKey ),
			duplicate : !!( e.altKey && !e.shiftKey )
			};
	}

	// -----------------------------
	// Modifier Helper: Apply Square or Axis Lock
	// -----------------------------
	// Adjusts width, height, startX/startY based on modifier flags.
	applyModifiersToRect( mod, clickX, clickY, tileX, tileY, tw, th ) {
		// Calculate bounds before moving anchor
		let startX	= Math.min( clickX, tileX );
		let startY	= Math.min( clickY, tileY );

		// Calculate span using comparing mousemove vs. original-click coordinates.
		let endX	= Math.max( clickX, tileX );
		let endY	= Math.max( clickY, tileY );

		// Subtract start coordinate from end coordinate to get dimensions.
		let width	= endX - startX;
		let height	= endY - startY;

		// Clamp to bounds
		startX		= Math.min( Math.max(0,startX), tw-1 );
		startY		= Math.min( Math.max(0,startY), th-1 );

		// Clamp end point
		endX		= Math.min( Math.max(0,endX), tw );
		endY		= Math.min( Math.max(0,endY), th );

		// Recompute width/height after clamping
		width		= endX - startX;
		height		= endY - startY;

		// -----------------------------
		// Modifier: Force Square Mode
		// -----------------------------
		// If both Shift+Alt/Option are held, force square selection box.
		// Square modifier
		/*if ( mod.square ) {
			const size = Math.max( width, height );
			width = height = size;
			// Adjust starting point depending on drag direction
			if ( tileX<clickX ) startX = clickX - size;
			if ( tileY<clickY ) startY = clickY - size;
			// Clamp again after correction
			startX	= Math.min( Math.max(0,startX), tw-1 );
			startY	= Math.min( Math.max(0,startY), th-1 );
			width	= Math.min( size, tw-startX );
			height	= Math.min( size, th-startY );
		}

		// -----------------------------
		// Modifier: Lock Axis (Shift)
		// -----------------------------
		// If only Shift is held (without Alt), lock to dominant axis.
		// NOTE: This is the axis-lock modifier plug.
		else if ( mod.axisLock ) {
			if ( Math.abs(width)>Math.abs(height) ) height = 0; // lock horiztonal
			else width = 0; // lock vertical
		}*/

		// Returns calculated coordinates & dimensions.
		return { startX, startY, width, height };
	}

	// --------------------------------
	// Selection State
	// --------------------------------
	// Capture the current marquee without modifying it.
	// RETURNS: [void].
	getSelectionState() {
		// Get current marquee mode.
		const mode = this.skim( 'mode' );
		// Log the active marquee selection state.
		return {
			mode	 	: ['selecting','dragging'].includes(mode)
							? (mode==='dragging' ? 'floating' : 'selected') : mode,
			rects		: structuredClone( this.rects ),
			bounds  	: this.bounds ? structuredClone(this.bounds) : null,
			layerId     : this.layerId, // level layer id / z-index
			mask		: this.mask ? structuredClone(this.mask) : null,
			contents	:
				this.contents ?
					{
					...this.contents,
					matrix : this.contents.matrix ? structuredClone(this.contents.matrix) : null
					} : null,
			anchor		: {
				x: this.anchor.x,
				y: this.anchor.y,
				w: this.anchor.width,
				h: this.anchor.height
				}
		};
	}


	// Restore a previously captured marquee state.
	// Does NOT emit floated/dropped events.
	// RETURNS: [void].
	restoreSelectionState( state=null ) {
		// Remove any active drag/selection listeners.
		this.removeTargetListeners();
		this.removeGlobalListeners();

		// Restore or clear the selection.
		this.rects		= state ? structuredClone(state.rects) : [];
		this.bounds		= state?.bounds ? structuredClone(state.bounds) : null;
		this.layerId	= state?.layerId ?? null;
		this.mask		= state?.mask ? structuredClone(state.mask) : null;
		this.contents	=
			state?.contents ? {
				...state.contents,
				matrix : state.contents.matrix ? structuredClone(state.contents.matrix) : null
				} : null;

		// Restore anchor position & size.
		const anchor	= state?.anchor ?? { x:0, y:0, w:0, h:0 };
		this.anchor.move( anchor.x, anchor.y );
		this.anchor.resize( anchor.w, anchor.h );

		// Reset temporary tracer.
		this.tracer.move( 0, 0 );	// move selection
		this.tracer.resize( 0, 0 );	// resize selection

		// Restore mode without invoking board operations.
		this.jot( 'mode', state?.mode ?? 'empty' );

		// Restore the mouse listener when enabled.
		if ( this.skim('enabled') )
			this.target.register( 'mousedown', 'selectStart', e=>this.checkClick(e), 'dom' );
		// Emit event saying selection is restored.
		this.emit( 'selectionRestored', null, this );
		return true;
	}

	//-------------------------
	// Remove Listeners
	//-------------------------
	// Remove marquee listener(s).
	// RETURNS: [void].
	removeTargetListeners() {
		// Remove selection listener(s).
		this.target.unregister( 'mousedown', 'selectStart' );
		// Remove mouse move listener(s).
		this.target.unregister( 'mousemove', 'selecting' );
		this.target.unregister( 'mousemove', 'dragging' );
	}
	// Remove window listener(s).
	// RETURNS: [void].
	removeGlobalListeners() {
		// Remove window event(s) for selecting release.
		this.target.unregister( jsos.mouseUps, 'selected' );
		// Remove window  event(s) for dragging release.
		this.target.unregister( jsos.mouseUps, 'dragged' );
	}
}
