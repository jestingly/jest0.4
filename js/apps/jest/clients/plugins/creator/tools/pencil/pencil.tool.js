//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/tools/pencil/pencil.tool.js loaded' );

//-------------------------
// JestToolPencil Class
//-------------------------
// This tool enables freeform penciling on a target canvas.
// It emits a "draw" event continuously as the mouse moves while pressed.
// The event includes both pixel x/y & tile x/y units.
class JestToolPencil extends JestTool {
	// Object propert(ies)
	target            = null;              // [ElementCanvas] Target canvas element to draw on.
	layerId           = null;              // [int] Z value of layer index / id.
	// Movement tracking
	_mouseButton      = null;              // [int] value of mouse button (0=left, 2=right).
	_shiftLineStart   = null;              // [object] First point if user is shift clicking 2 points.
	_undoMap          = new Map();         // [Map<string, {old, neu}>] Unified undo/redo tracking
	_skipTiles        = new Set();         // [Set<string>] Tiles to skip drawing.
	_lastSwishX       = null;              // [float] X value of last draw movement.
	_lastSwishY       = null;              // [float] Y value of last draw movement.
	_accumulatedDist  = 0;                 // [number] Value of active distance drawn.
	_idleThreshold    = 300;               // [ms] how long between draws before idling
	_swishThreshold   = 10;                // [float] attune this to distance motion (in tiles)
	_lastSwishTime    = 0;                 // [number] last movement trigger timestamp
	_motionsTracked   = 0;                 // [int] total how many motions tracked (during draw).
	_motionTrackLapse = null;              // [ms] last motion track update (external update).

	// --------------------------------
	// Constructor
	// --------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client  - [object] Application client that this piece belongs to.
	// * name    - [string] Value of tool name.
	constructor( client, name ) {
		super( client, name ); // call parent constructor
	}

	//-------------------------
	// Initialization
	//-------------------------
	// Build the element [object].
	// RETURNS: [void].
	// * name    - unique [string] value of component name in the system.
	// * classes - [array] of classes to add to panel element.
	build( name='tool-draw', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		const defaultClasses	= [ 'tool-draw' ];
		super.build( name, defaultClasses.mergeUnique(classes) );
	}

	// --------------------------------
	// Set Target(s)
	// --------------------------------
	// Set the canvas [object] to make selectable.
	// RETURNS: [void]
	// * target		- [ElementCanvas] The target to allow selectability on.
	setTarget( target ) {
		// Validate argument(s)
		if ( !(target instanceof ElementCanvas) ) {
			console.warn( `Argument "canvas" must be of type ElementCanvas.` );
			return false; // failed
		}
		// Continue to set the canvas.
		this.target	= target;
		this.jot( 'mode', 'idle' ); // tool is idle to start
	}

	// --------------------------------
	// Set Threshold(s)
	// --------------------------------
	// Set the timeout threshold between draws before sending idle events.
	// RETURNS: [void]
	// * val	- [ms] Int value of time to wait before setting draw as idle.
	setIdleThreshold( val=300 ) {
		// Set the idle time threshold.
		this._idleThreshold	= val;
	}
	// Set the distance threshold between each drawing swish event.
	// RETURNS: [void]
	// * val	- [float] Value of distance (in tile units).
	setSwishThreshold( val=10 ) {
		// Set the distance threshold.
		this._swishThreshold	= val;
	}

	// --------------------------------
	// Enable & Disable
	// --------------------------------
	// Enable drawing mode.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	enable() {
		// Check parent constructor.
		if ( !super.enable() ) return false;
		// Add event listener(s)
		this.reset();	// reset the tool
		this.refresh(); // refresh temporary tool data
		// Set tool "enabled" status to [bool] true.
		this.jot( 'enabled', true );
	}

	// Disable drawing mode.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	disable() {
		// Check parent constructor.
		if ( !super.disable() ) return false;
		// Force stop the pencil if drawing.
		this.stop( null );
		// Reset the tool.
		this.reset(); // reset eyedropper tool
		// Remove event listener(s)
		this.removeTargetListeners(); // remove target events
		this.removeGlobalListeners(); // remove window events
		// Mark as disabled.
		this.jot( 'enabled', false );
	}

	//-------------------------
	// Resetting Methods
	//-------------------------
	// Reset the draw tool.
	// RETURNS: [void].
	reset() {
		//-------------------------
		// Reset Tool
		//-------------------------
		// Reset the last tracked coordinate.
		this._lastSwishX 		= null;			// reset last draw X coordinate
		this._lastSwishY 		= null;			// reset last draw Y coordinate
		this._accumulatedDist	= 0;			// reset distance moved
		this._lastSwishTime		= 0;			// reset last time
		this._motionTracked		= null;			// reset motion-tracking clock
		//-------------------------
		// Reset Tool Mode
		//-------------------------
		// Switchback mode to "idle".
		this.jot( 'mode', 'idle' );
		//-------------------------
		// Remove Event Listener(s)
		//-------------------------
		// Tear down all listener(s).
		this.removeTargetListeners(); // remove target events
		this.removeGlobalListeners(); // remove window events
		//-------------------------
		// Add Event Listener(s)
		//-------------------------
		// Create the mouse click event for draw start.
		this.target.register( 'mousedown', 'drawStart', e=>this.start(e), 'dom' );
		//-------------------------
		// Emit Reset Event
		//-------------------------
		// Trigger reset event.
		this.emit( 'reset', null, this );
	}

	// Called when drawing ends via mouseup or blur.
	// RETURNS: [void].
	// * e	- [object] MouseEvent event listener data.
	stop( e ) {
		//-------------------------
		// Gatekeeping
		//-------------------------
		// Mode gate keep.
		const enabled	= this.skim( 'enabled' );
		const mode		= this.skim( 'mode' );
		if ( !enabled || mode!=='drawing' ) return;
		//-------------------------
		// Reset Tool Mode
		//-------------------------
		// Switchback mode to "idle".
		this.jot( 'mode', 'idle' );
		//-------------------------
		// Emit Stop Event
		//-------------------------
		// Emit stop event.
		this.emit( 'stop', null );
		//-------------------------
		// Force Reset Tool
		//-------------------------
		// Simply reset the tool.
		this.reset();
	}

	// Refresh the draw tool's temporary data.
	// RETURNS: [void].
	refresh() {
		//-------------------------
		// Refresh Data
		//-------------------------
		// Hard-reset the tool (tool has been re-enabled).
		this._shiftLineStart = null;
		//-------------------------
		// Emit Refresh Event
		//-------------------------
		// Trigger refresh event.
		this.emit( 'refresh', null, this );
	}

	//--------------------------------
	// Key Handling Method(s)
	//--------------------------------
	// Called when user starts drawing.
	// RETURNS: [void].
	// * e	- [object] I/O key-release custom payload "event" data.
	releaseShift( e ) {
		// Mode gate keep.
		const enabled = this.skim( 'enabled' );
		const mode    = this.skim( 'mode' );
		if ( !enabled || mode!=='shiftlining' ) return;
		//--------------------------------
		// Only respond to Shift release
		//--------------------------------
		if ( e.key !== 'Shift' &&
			 e.key !== 'ShiftLeft' &&
			 e.key !== 'ShiftRight' ) return;
		//--------------------------------
		// Dismiss Tool Mode
		//--------------------------------
		// Check if in shift-line drawing mode.
		this.jot( 'mode', 'idle' ); // reset mode
		//--------------------------------
		// Clear "Shift Release" Key Listener
		//--------------------------------
		// Check I/O key-release listener
		this.client.io.unregister( 'keyRelease', `${this.name}:cancelShiftLining` );
		console.log( '[shiftLine] Shift released → chain ended' );
	}

	//--------------------------------
	// Drawing Method(s)
	//--------------------------------
	// Called when user starts drawing.
	// RETURNS: [void].
	// * e	- [object] MouseEvent event listener data.
	start( e ) {
		//--------------------------------
		// Validate Tool Availability
		//--------------------------------
		// Explain why the start operation is blocked (if it is).
		if ( this.client.alertToolBlocked(this,'begin stroke') )
			return; // abort action

		//--------------------------------
		// Check Delegated Suppression
		//--------------------------------
		// Check if delegator forbids the pencil.
		if ( !this.client.delegator.allowed(this.name,'click') )     return;
		if ( !this.client.delegator.allowed(this.name,'mouseup') )   return;
		if ( !this.client.delegator.allowed(this.name,'mousedown') ) return;

		//--------------------------------
		// Validate Mode & Enablement
		//--------------------------------
		// Mode gate keep.
		const enabled = this.skim( 'enabled' );
		const mode    = this.skim( 'mode' );
		if ( !enabled || (mode!=='idle' && mode!=='shiftlining') ) return;

		//-------------------------
		// Get Click Position
		//-------------------------
		// Determine if left, or right-clicked.
		const isRightClick = ( e.button === 2 );
		const isLeftClick  = ( e.button === 0 );
		this._mouseButton  = e.button;
		// Calculate click position in tile units
		const click = this.target.mousePos( e );
		const units = this.anchor.units;
		const x     = Math.floor( click.x / units );
		const y     = Math.floor( click.y / units );

		//--------------------------------
		// SHIFT+CLICK INTERCEPT → LINE DRAW MODE
		//--------------------------------
		// Determine if "shift key" is pressed.
		if ( e.shiftKey ) {
			//--------------------------------
			// Define Initial Click Point (if not exists)
			//--------------------------------
			// Check for at least one click origin.
			if ( !this._shiftLineStart )
				this._shiftLineStart = { x, y };
			//--------------------------------
			// Setup "Shift Lining" Mode & Emit Event
			//--------------------------------
			// Check if already in "shift-line" mode.
			if ( mode!=='shiftlining' ) {
				// Change mode to "shiftlining".
				this.jot( 'mode', 'shiftlining' ); // change mode
				//--------------------------------
				// Setup "Shift Release" Key Listener
				//--------------------------------
				// Check for shift key release.
				this.client.io.register(
					'keyRelease', `${this.name}:cancelShiftLining`, e=>this.releaseShift(e) );
				// Emit start of shift-lineing event.
				this.emit( 'startShiftlining', null, e, this._shiftLineStart );
			}
			//--------------------------------
			// Emit Point-to-Point Draw Event
			//--------------------------------
			// Consecutive clicks, shift-line → emit line draw event
			const to = { x, y }; // end point
			// Emit draw point-to-point event.
			this.emit( 'drawShiftlining', null, e, this._shiftLineStart, to );
			// Update the origin → allows chaining
			this._shiftLineStart = to;
			return; // escape
		}

		//-------------------------
		// Log Event Data
		//-------------------------
		// Remember click origin.
		this._shiftLineStart = { x, y };

		//-------------------------
		// Add Event Listener(s)
		//-------------------------
		this.jot( 'mode', 'drawing' ); // change mode
		this.target.register( 'mousemove', 'drawing', e=>this.draw(e), 'window' );
		this.target.register( jsos.mouseUps, 'drawingEnd', e=>this.stop(e), 'window' );
		// Emit start event.
		this.emit( 'start', null, e );
		// Call the draw method.
		this.draw( e ); // emit initial draw immediately
	}

	// Emits draw event during mouse movement.
	// RETURNS: [void].
	// * e	- [object] MouseEvent event listener data.
	draw( e ) {
		//--------------------------------
		// Validate Mode & Enablement
		//--------------------------------
		// Mode gate keep.
		const enabled  = this.skim( 'enabled' );
		const mode     = this.skim( 'mode' );
		if ( !enabled || mode!=='drawing' ) return;

		//--------------------------------
		// Get Click / Grid Coordinates
		//--------------------------------
		// Grid / "tile" position.
		const click    = this.target.mousePos(e);
		const units    = this.anchor.units; // grid units
		const lx       = Math.floor( click.x / units );
		const ly       = Math.floor( click.y / units );;
		const now      = performance.now(); // current timestamp

		// Create location data [object].
		const location = { x: click.x, y: click.y, lx, ly };

		//-------------------------
		// Motion Tracking
		//-------------------------
		// Determine current draw x & y.
		const cx = lx, cy = ly;
		if ( this._lastSwishX===null || this._lastSwishY===null ) {
			this._lastSwishX       = cx;   // track last draw X coordinate
			this._lastSwishY       = cy;   // track last draw Y coordinate
			this._accumulatedDist  = 0;    // reset accumulated distance
			this._lastSwishTime    = now;  // initialize threshold movement time
			this._motionTracked    = 0;    // reset motion tracked count to 0
			this._motionTrackLapse = now;  // reset motion track to now time
		}

		// Track distance of last draw movement.
		const dx       = cx - this._lastSwishX;  // distance X moved
		const dy       = cy - this._lastSwishY;  // distance Y moved
		const dist     = Math.sqrt( dx*dx + dy*dy );

		// Calculate movement distance from last time + time.
		this._accumulatedDist += dist;     // determine distance moved
		const swishLapse     = now - this._lastSwishTime; // time difference

		// Remember click origin.
		this._shiftLineStart = { x: lx, y: ly };
		// Emit draw event.
		this.emit( 'draw', null, e, location, this._accumulatedDist, swishLapse );

		// Check for idling.
		if ( swishLapse>=this._idleThreshold ) {
			// Reset movement(s).
			this._lastSwishX    = cx;     // track last draw X coordinate
			this._lastSwishY    = cy;     // track last draw Y coordinate
			this._lastSwishTime = now;    // reset movement time
			// Emit draw event.
			this.emit( 'idle', null, e, location, this._accumulatedDist, swishLapse );
		}

		// If distance threshold reached within time threshold, release event.
		if ( this._accumulatedDist>=this._swishThreshold ) {
			// Update swish coordinates.
			this._lastSwishX    = cx;     // update last motion X track
			this._lastSwishY    = cy;     // update last motion Y track

			// Calculate swish time lapse & reset timer.
			this._lastSwishTime = now;    // update threshold movement time

			// Calculate [ms] time between motion-tracks.
			const motionLapse   = now - this._motionTrackLapse;

			// Emit motion tracking event.
			this.emit(
				'swish', null,
				e, motionLapse, this._motionTracked,
				location, this._accumulatedDist, swishLapse
				);

			// Reset distance tracking.
			this._accumulatedDist = 0;    // reset tracked distance
		}
	}

	// Update the motion track.
	// RETURNS: [void].
	motionTrack() {
		// Increase motion track count.
		this._motionTracked	++;
		// Capture now time.
		const now = performance.now(); // current timestamp
		this._motionTrackLapse = now;  // set motion track time to now
		// Emit stop event.
		this.emit( 'motionTracked', null, this._motionTrackLapse, this._motionTracked );
	}

	//-------------------------
	// Internal: Remove Global Listeners
	//-------------------------
	// Remove target event listener(s).
	removeTargetListeners() {
		this.target.unregister( 'mousedown', 'drawStart' );
		this.target.unregister( 'mousemove', 'drawing' );
	}
	// Remove window event listener(s).
	removeGlobalListeners() {
		// Check I/O key-release listener.
		this.client.io.unregister( 'keyRelease', `${this.name}:cancelShiftLining` );
		// Remove window event listener(s).
		this.target.unregister( jsos.mouseUps, 'drawingEnd' );
	}
}
