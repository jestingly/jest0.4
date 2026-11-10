//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/tools/eyedropper/eyedropper.tool.js loaded' );

//-------------------------
// JestToolEyedropper Class
//-------------------------
// Tool for selecting a tile from the level by clicking on the canvas.
// Emits 'sample' event containing tile data at selected location.
class JestToolEyedropper extends JestTool {
	// Object Properties
	target      = null;     // [object] ElementCanvas for click event.
	composite   = false;    // [bool] Sample all visible layers.
	hovering    = false;	// [boolean] Whether pointer is currently over target.
	hoverTile   = null;     // [object|null] Tile currently under the pointer.
	follower    = null;     // [JestMouseFollower] Positions the tile preview.
	preview     = null;     // [HTMLCanvasElement|null] Floating tile preview.

	// --------------------------------
	// Constructor
	// --------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client		- [object] Application client that this piece belongs to.
	// * name		- [string] Value of tool name.
	constructor( client, name ) {
		super( client, name );  // call parent constructor
		const changed = [];     // track sparse undo
	}

	//-------------------------
	// Initialization
	//-------------------------
	// Build the element [object].
	// RETURNS: [void].
	// * name		- unique [string] value of component name in the system.
	// * classes	- [array] of classes to add to panel element.
	build( name='tool-eyedropper', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		const defaultClasses = [ 'tool-eyedropper' ];
		super.build( name, defaultClasses.mergeUnique(classes) );
		// Tool is idle by default.
		this.jot( 'mode', 'idle' );	// tool is idle to start

		//--------------------------------
		// Create Canvas Preview
		//--------------------------------
		// Set canvas square size WxH.
		const size     = this.client.config.tileGrid * 2;
		// Create mouse follower [object].
		const follower =
			new JestMouseFollower(
				this.client,
				{
				offsetX : 0-(size/2),
				offsetY : 0-(size/2)
				});
		// Build the mouse follower element.
		follower.build( 'eyedropper-preview', ['eyedropper-preview'] );
		follower.setFollowerElement( follower.panel ); // use self panel
		this.follower = follower; // store reference
		this.hidePreview();       // auto-hide

		// Create a canvas for clip stamping onto jani element canvas [object].
		const preview = new ElementCanvas();
		preview.resize( size, size ); // resize canvas
		follower.contents.el.appendChild( preview.el );
		this.preview  = preview;
	}

	// --------------------------------
	// Set Target Canvas
	// --------------------------------
	// Set the canvas [object] to enable eyedropper for.
	// RETURNS: [void]
	// * target		- [ElementCanvas] The target to allow selectability on.
	setTarget( target ) {
		// Mode / enableability requirement
		const enabled = this.skim( 'enabled' );
		const mode    = this.skim( 'mode' );
		if ( enabled || mode!=='idle' )
			console.warn( `Eyedropper cannot change target while enabled or active.` );
		// Validate argument(s)
		if ( !(target instanceof ElementCanvas) ) {
			console.warn( `Argument "canvas" must be of type ElementCanvas.` );
			return false; // failed
		}
		// Continue to set the canvas.
		this.target	= target; // set clickable canvas
	}

	//--------------------------------
	// Resolve Tile for Eyedropper Sampling
	//--------------------------------
	// Retrieve the tile to sample using the selected sampling mode.
	//--------------------------------
	// Standard mode samples only the currently active layer.
	// Composite mode searches visible layers from topmost to
	// bottommost, stopping at the first occupied tile.
	//--------------------------------
	// A hidden layer is never considered during composite sampling.
	// Locked layers remain readable because no editing takes place.
	//--------------------------------
	// RETURNS: [object|null] { tile, layer }, or null if empty.
	// * level - [JestLevel] level containing the layers.
	// * x,y   - [int] tile coordinates within the level.
	resolveTile( level, x, y ) {
		//--------------------------------
		// Validate Level
		//--------------------------------
		// Sampling requires an active level.
		if ( !level ) return null;

		//--------------------------------
		// Sample Active Layer Only
		//--------------------------------
		// Preserve standard Eyedropper behavior when Composite
		// sampling is disabled.
		if ( !this.composite ) {
			// Resolve the selected layer.
			const layer = level.getActiveLayer();
			if ( !layer ) return null;

			// Retrieve the tile directly from that layer.
			const tile = layer.getTile( x, y );
			if ( tile==null ) return null;

			// Return both tile data and its source layer.
			return { tile, layer };
		}

		//--------------------------------
		// Sample Visible Layer Hierarchy
		//--------------------------------
		// getLayers() returns bottom-to-top rendering order.
		// Reverse iteration begins at the frontmost visible layer.
		const layers    = level.getLayers();
		for ( let i=layers.length-1; i>=0; i-- ) {
			// Read this layer without changing the active selection.
			const layer = layers[i];

			// Ignore hidden layers.
			if ( !layer.visible ) continue;

			// Look for an occupied cell at the requested position.
			const tile  = layer.getTile( x, y );

			// Empty cells allow us to continue to lower layers.
			if ( tile==null ) continue;

			// The first occupied cell is the visible tile to sample.
			return { tile, layer };
		}

		//--------------------------------
		// No Tile Found
		//--------------------------------
		// None of the eligible layers contains a tile here.
		return null;
	}

	// --------------------------------
	// Enable & Disable
	// --------------------------------
	// Enable the eyedropper tool.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	enable() {
		// Check parent constructor.
		if ( !super.enable() ) return false;
		// Add event listener(s)
		this.jot( 'enabled', true ); // enable eyedropper
		this.reset();          // reset the tool
		this.refreshPreview(); // auto-show tile preview
		return true;           // success
	}

	// Disable the eyedropper tool.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	disable() {
		// Always clean up the preview, even if already disabled.
		this.hidePreview();           // hide tile preview
		this.hovering = false;        // cursor not over target
		// Check parent constructor.
		if ( !super.disable() ) return false;
		// Mark as disabled.
		this.jot( 'enabled', false ); // disable eyedropper
		this.jot( 'mode', 'idle' );   // idle the eyedropper
		// Remove event listener(s)
		this.removeTargetListeners(); // remove target events
		this.removeGlobalListeners(); // remove window events
		this.hoverTile = null;        // reset hover tile preview
	}

	//-------------------------
	// Start Eyedropper
	//-------------------------
	// Begin the eyedropper process.
	// RETURNS: [void].
	// * e		- Event [object] from mouse click.
	start( e ) {
		// Mode / enableability requirement
		const enabled  = this.skim( 'enabled' );
		const mode     = this.skim( 'mode' );
		if ( !enabled || mode!=='idle' ) return;
		// Switch eyedropper mode to live sampling a tile.
		this.jot( 'mode', 'sampling' );	// change mode
		// Emit start event.
		this.emit( 'sample', null, e );	// emit event
		// Reset the eyedropper tool for new selection.
		this.jot( 'mode', 'idle' );	// change mode
		//this.reset(); // reset the tool
	}

	//--------------------------------
	// Show Tile Preview
	//--------------------------------
	// Reveal and position the freshly rendered tile preview.
	// RETURNS: [boolean] `true` on success else `false`.
	// * e - [MouseEvent] Current pointer coordinates.
	showPreview( e ) {
		// Require an available tool and a valid tile preview.
		if (
			!this.skim('enabled') ||
			this.skim('blocked') ||
			!this.hoverTile ||
			!this.follower ||
			!e
			) {
			// Immediately hide the preview.
			this.hidePreview();
			return false; // abort
		}

		// Reveal before positioning so dimensions are available.
		const follower = this.follower;
		follower.enable();  // ensure follower is enabled
		follower.show();    // show the follower
		follower.move( e ); // auto-move the follower into place
		return true;        // return success
	}

	//--------------------------------
	// Hide Tile Preview
	//--------------------------------
	// Release the hovered tile and stop displaying its preview.
	// Safe to call repeatedly, including before preview construction.
	// RETURNS: [void].
	hidePreview() {
		// Clear the hover tile.
		this.hoverTile = null;
		// Hide & disable the mouse follower.
		this.follower?.hide();      // auto-hide the mouse follower
		this.follower?.disable();   // disable the mouse follower
	}

	//-------------------------
	// Resetting Methods
	//-------------------------
	// Reset the eyedropper tool.
	// RETURNS: [void].
	reset() {
		//-------------------------
		// Reset Tool
		//-------------------------
		// Hide tile preview.
		this.hidePreview();
		// Update the tool's mode
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
		// Create the mouse click event for eyedropper start.
		this.target.register( 'click', 'eyedropperStart', e=>this.start(e), 'dom' );
		this.target.register( 'mousemove', 'eyedropperPreview', e=>this.updatePreview(e), 'dom' );
		this.target.register(
			'mouseenter', 'eyedropperEnter', e=>this.enterTarget(e), 'dom' );
		this.target.register(
			'mouseleave', 'eyedropperLeave', e=>this.exitTarget(), 'dom' );
		// Handle window context interruption event.
		this.client.interactor.register( 'interruption', this.skey,
			() => this.exitTarget() );
		//-------------------------
		// Emit Reset Event
		//-------------------------
		// Trigger reset event.
		this.emit( 'reset', null, this );
	}

	//--------------------------------
	// Hovering Method(s)
	//--------------------------------
	// Set the status of whether the cursor is over the target or not.
	// RETURNS: [boolean|void].
	// * hovering - [boolean] Whether over target or not.
	setHovering( hovering ) {
		// Determine if cursor is over target.
		const changing = Boolean( hovering!==this.hovering );
		// If state is changing, change the state.
		if ( changing ) {
			// Change hover status.
			this.hovering = hovering;
			// Emit hovering state change.
			this.emit( 'hovered', null, hovering );
			return true; // changed
		}
		return false; // unchanged
	}

	//--------------------------------
	// Leave/Enter Eyedropper Sampling Target
	//--------------------------------
	// The cursor has hovered into its target element.
	// RETURNS: [void].
	// * e - [MouseEvent] Current pointer coordinates.
	enterTarget( e ) {
		// Emit rollover state change.
		this.emit( 'rollover' );
		this.setHovering( true );  // over target
		this.updatePreview( e );   // show tile preview
		// Refresh blocked status for the toolbar and cursor.
		this.client.toolBlockCheck( this );
	}

	// The cursor has hovered out of its target element.
	// RETURNS: [void].
	exitTarget() {
		// Emit rollout state change.
		this.emit( 'rollout' );
		this.setHovering( false ); // over target
		this.hidePreview();        // hide tile preview
		// Refresh blocked status for the toolbar and cursor.
		this.client.toolBlockCheck( this );
	}

	//--------------------------------
	// Refresh Preview at Current Pointer
	//--------------------------------
	// Sample immediately when equipped without waiting for mouse movement.
	// RETURNS: [boolean|void].
	refreshPreview() {
		// Check for pointer (cursor) coordinates.
		const pointer  = this.client.interactor.getPointer();
		const target   = this.target?.el; // check for target

		// Coordinates & target required.
		if ( !pointer || !target ) return this.exitTarget();

		// Require the actual canvas beneath the pointer.
		// This excludes toolbar buttons, menus and overlapping windows.
		const hovered  =
			document.elementFromPoint(
				pointer.clientX, pointer.clientY );

		// Hovered target must equal eyedropper target.
		if ( hovered===target )
			return this.enterTarget( pointer ); // hovering over target
		else return this.exitTarget();          // exit target area
	}

	//--------------------------------
	// Update Hover Sample & Preview
	//--------------------------------
	// Sample the tile beneath the pointer and display its floating preview.
	// RETURNS: [boolean].
	// * e  - [MouseEvent] Pointer coordinates relative to the target canvas.
	updatePreview( e ) {
		//--------------------------------
		// Validate Tool Availability
		//--------------------------------
		// Only update while the eyedropper is enabled and an event is available.
		if ( !this.skim('enabled') || !e )
			return this.hidePreview(); // auto-hide tile preview

		//--------------------------------
		// Determine Hovered Tile Coordinates
		//--------------------------------
		// Convert the canvas mouse position from pixels to tile coordinates.
		const client   = this.client;
		const state    = this.client.getState();
		const pos      = this.target.mousePos( e );
		const units    = this.anchor.units;
		const x        = Math.floor( pos.x / units );
		const y        = Math.floor( pos.y / units );

		//--------------------------------
		// Resolve Sampling Context
		//--------------------------------
		// Obtain the active level and determine the tile under
		// the pointer using the selected sampling mode.
		const view		= state?.levelView;     // access open file view
		if ( !view ) return this.hidePreview(); // level not found
		const level     = view.file.context;    // access active level

		//--------------------------------
		// Resolve Hovered Tile
		//--------------------------------
		// The cursor is currently over the editor canvas.
		this.setHovering( true ); // set hovering to true
		// "Standard" mode reads the active layer.
		// "Composite" mode searches the visible hierarchy.
		const sample    = this.resolveTile( level, x, y );
		// Store the resolved tile, including lower-layer matches.
		this.hoverTile  = sample?.tile ?? null;

		//--------------------------------
		// Refresh Tool Blocking
		//--------------------------------
		// Update the prohibited cursor if no eligible tile exists.
		// A lower-layer match keeps the tool available.
		this.client.toolBlockCheck( this );

		//--------------------------------
		// Clear Previous Preview
		//--------------------------------
		// Access the preview canvas through its ElementCanvas wrapper.
		const preview  = this.preview.el;
		const ctx      = preview.getContext( '2d' );
		// Remove the previously sampled tile image.
		ctx.clearRect( 0, 0, preview.width, preview.height );

		//--------------------------------
		// Validate Preview Availability
		//--------------------------------
		// Hide the preview when sampling is blocked or required data is missing.
		if ( this.skim('blocked') || !this.hoverTile || !state.tileset )
			return this.hidePreview(); // auto-hide the preview

		//--------------------------------
		// Obtain Tile Stamp
		//--------------------------------
		// Extract the sampled tile image from the active tileset.
		const stamp =
			state.tileset.getTileStamp(
				this.hoverTile.tx,
				this.hoverTile.ty
				);

		// Hide the preview if the tile image could not be generated.
		if ( !stamp?.el )
			return this.hidePreview(); // auto-hide the preview

		//--------------------------------
		// Render Tile Preview
		//--------------------------------
		// Preserve sharp tile pixels when enlarging the stamp.
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage( stamp.el, 0, 0, preview.width, preview.height );

		//--------------------------------
		// Show & Position Mouse Follower
		//--------------------------------
		// Reveal the preview before positioning so its dimensions are available.
		// Apply the follower's configured cursor offsets and boundary clamping.
		this.showPreview( e );
		return true; // success
	}

	//-------------------------
	// Internal: Remove Global Listeners
	//-------------------------
	// Remove target event listener(s).
	removeTargetListeners() {
		this.target.unregister( 'click', 'eyedropperStart' );
		this.target.unregister( 'mousemove', 'eyedropperPreview' );
		this.target.unregister( 'mouseenter', 'eyedropperEnter' );
		this.target.unregister( 'mouseleave', 'eyedropperLeave' );
	}

	// Remove window event listener(s).
	removeGlobalListeners() {
		// Unregister window context interruption event.
		this.client.interactor.unregister( 'interruption', this.skey );
		// Unregister mouseup event(s).
		//this.target.unregister( jsos.mouseUps, 'eyedropper' );
	}
}
