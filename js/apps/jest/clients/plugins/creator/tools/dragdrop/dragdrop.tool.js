//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/tools/dragdrop/dragdrop.tool.js loaded' );

//-------------------------
// JestToolDragdrop Class
//-------------------------
// This tool enables grabbing objects from to drop inside container(s).
class JestToolDragdrop extends JestTool {
	// Object propert(ies)
	target		= null;			// [ElementCanvas] Target canvas element to draw on.
	contents	= null;			// [...] queue content(s) for dragdrop.
	crate		= null;			// [JestToolCrate] for carrying [object].
	startTimer	= null;			// Timeout for double-click handling.
	clickToDrag	= true;			// [bool] Whether click-to-drag (true) or hold-to-drag (false).

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
	// * name    - unique [string] value of component name in the system.
	// * classes - [array] of classes to add to panel element.
	build( name='tool-dragdrop', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		const defaultClasses = [ 'tool-dragdrop' ];
		super.build( name, defaultClasses.mergeUnique(classes) );
		// --------------------------------
		// Create Crate Tool [object]
		// --------------------------------
		// Add a crate tool to the editor.
		const crate  = new JestToolCrate( this.client );
		crate.build(); // generate crate
		this.crate   = crate;
		this.client.panel.addPanel( 'crate', crate.panel );

		// React to drop event.
		crate.register(
			'dropped', 'dragdrop',
			( garage, localPos ) => {
				if ( garage ) {
					//console.log( `Crate dropped into "${ droppedGarage.name }". Local coords:`, localPos );
					// Call the drag drop draw method.
					this.drop( garage, localPos.x, localPos.y ); // attempt to draw/place.
				}
				else {
					//console.log( 'Crate dropped outside any garage.' );
					this.stop( null, false ); // stop & reset (no need to re-drop)
				}
				// Disable the crate & hide it.
				this.crate.disable();  // disable if ensabled
				this.crate.clear();    // erase crate contents & hide
			});

		// Set graticulate listener to update crate.
		this.anchor.register( 'graticulate', 'crateUpdate',
			( units ) => {
				// Update the crate units.
				this.crate.anchor.graticulate( units );
			});

		// --------------------------------
		// Create Canvas In Crate [object]
		// --------------------------------
		// Add a canvas to the crate for drag display.
		crate.display.addCanvas( 'dragdrop' );
		// Disable the crate & hide it.
		this.crate.disable();  // disable if ensabled
		this.crate.clear();    // erase crate contents & hide
		// Disable this to start.
		this.disable();        // disabled
		// Change crate styling when entering/leaving
		/*crate.register(
			'garagEenter', 'highlightGarage',
			garage => {
				garage.panel.el.style.backgroundColor = '#eef';
			});
		crate.register(
			'garageLeave', 'unhighlightGarage',
			garage => {
				garage.panel.el.style.backgroundColor = '';
			});*/
	}

	// --------------------------------
	// Set File
	// --------------------------------
	// Set the canvas [object] to make selectable.
	// RETURNS: [void]
	// * target  - [ElementCanvas] The target to allow selectability on.
	setTarget( target ) {
		// Validate argument(s)
		if ( !(target instanceof ElementCanvas) ) {
			console.warn( `Argument "canvas" must be of type ElementCanvas.` );
			return false; // failed
		}
		// Continue to set the canvas.
		this.target	= target;
		// Set mode to idle.
		this.jot( 'mode', 'idle' ); // tool is idle to start
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
		this.jot( 'enabled', true );
		this.reset();         // reset drag drop
		this.crate.enable();  // enable the crate
	}
	// Disable drawing mode.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	disable() {
		// Check parent constructor.
		if ( !super.disable() ) return false;
		// Remove event listener(s)
		this.jot( 'enabled', false );
		this.removeTargetListeners(); // remove target event(s)
		this.removeGlobalListeners(); // remove global event(s)
		this.crate.disable(); // disable the crate
	}

	//--------------------------------
	// Set Click-to-Drag Mode
	//--------------------------------
	// Enable or disable "click to drag" mode.
	// * bool	– [boolean] true enables click-to-drag, false uses hold-to-drag.
	setClickToDrag( bool=true ) {
		this.clickToDrag = !!bool; // convert to strict boolean
	}

	//-------------------------
	// Resetting Method(s)
	//-------------------------
	// Reset the crate tool.
	// RETURNS: [void].
	reset() {
		//-------------------------
		// Reset Mode & Listener(s)
		//-------------------------
		// Tear down all listener(s).
		this.removeTargetListeners();	// remove target events
		this.removeGlobalListeners();	// remove window events
		this.jot( 'mode', 'idle' );		// change mode
		// Clear the contents.
		this.removeContents();
		// Add mousedown & doubleclicked event(s) (begin lifting).
		if ( !this.clickToDrag ) // hold-to-drag
			this.target.register( 'mousedown', 'dragdropStart',
			( e ) => {
				this.start( e );
			}, 'dom' );
		else this.target.register( 'mouseup', 'dragdropStart',
			( e ) => {
				this.start( e );
			}, 'window' );
		// Add double-click event listener.
		this.target.register( 'dblclick', 'dragdropDoubleClick', e=>this.doubleclick(e), 'dom' );
	}

	//-------------------------
	// Set Crate Contents
	//-------------------------
	// Set the contents to be dragged.
	// RETURNS: [boolean] true on success, else false.
	// * contents – [any] object or structure to store for dragging.
	setContents( contents ) {
		// Mode gate keep.
		const enabled	= this.skim( 'enabled' );
		const mode		= this.skim( 'mode' );
		// Avoid duplicate pickup while carrying.
		if ( !enabled || mode!=='starting' ) return;
		// Call parent method.
		if ( !super.setContents(contents) ) return false; // failed
		// Emit add event.
		this.emit( 'dragdropContentsSet', null, contents, this );
		return true; // success
	}

	//-------------------------
	// Get Crate Contents
	//-------------------------
	// Get the contents currently being dragged.
	// RETURNS: [any|null] Contents or null if empty.
	getContents() {
		return super.getContents();
	}

	//-------------------------
	// Remove Crate Contents
	//-------------------------
	// Clear the currently stored dragdrop contents.
	// RETURNS: [boolean] true if contents were cleared, else false.
	removeContents() {
		// Call parent method.
		const removed	= super.setContents( null );
		// Emit remove event.
		this.emit( 'dragdropContentsRemoved', null, removed, this );
		return true; // success
	}

	//-------------------------
	// Check For Drag & Drop
	//-------------------------
	// Called when user starts dragging.
	// RETURNS: [bool] true (if inside target) else false.
	// * e	- [object] MouseEvent event listener data.
	clickCheck( e ) {
		// Check if mouse released inside target visible portions.
		const el		= this.target.el;
		const rect		= jsos.getVisibleRect( el );
		if ( !rect ) return; // fully clipped or offscreen
		const x			= e.clientX;
		const y			= e.clientY;
		const isInside	=
			x >= rect.left &&
			x <= rect.right &&
			y >= rect.top &&
			y <= rect.bottom;
		return isInside; // bool
	}

	//-------------------------
	// Drag & Drop Method(s)
	//-------------------------
	// Called when user starts dragging.
	// RETURNS: [void].
	// * e	- [object] MouseEvent event listener data.
	start( e ) {
		//console.log( 'grabbing dragdrop' );
		// Mode gate keep.
		const enabled	= this.skim( 'enabled' );
		const mode		= this.skim( 'mode' );
		// Avoid duplicate pickup while carrying.
		if ( !enabled || mode==='carrying' ) return;
		//-------------------------
		// Change Tool Mode
		//-------------------------
		// Set tool mode.
		this.jot( 'mode', 'starting' );
		//-------------------------
		// Set Timeout for Single-Click
		//-------------------------
		// Delay single click handling to wait and see if dblclick happens.
		this.startTimer = setTimeout(
			() => {
				//console.log( 'timeout' );
				//-------------------------
				// Change Tool Mode
				//-------------------------
				// Set tool mode.
				this.jot( 'mode', 'carrying' );
				//-------------------------
				// Get Click Location(s)
				//-------------------------
				// Find the x & y screen click position(s).
				let click = this.click( e );
				//-------------------------
				// Lift Crate Then Emit Event
				//-------------------------
				// Now “lift” the crate at that exact point:
				this.removeGlobalListeners(); // remove window stop event(s)
				this.crate.show();		// show the crate
				this.crate.enable();	// enable if disabled
				this.crate.startDragAt( click.screenX, click.screenY, click.grabOffsetX, click.grabOffsetY );
				this.emit( 'dragdropPickup', null, e, { tx: click.tx, ty: click.ty }, this );
				this.startTimer = null;	// reset click timer
			}, 250 ); // typical threshold for distinguishing clicks vs dblclick
		//-------------------------
		// Global Mouse Release Event(s)
		//-------------------------
		// Add window mouse hold-to-drag cancel event(s).
		if ( !this.clickToDrag ) // mouse hold dragging
			this.target.register( jsos.mouseUps, 'dragdropStop', e=>this.stop(e), 'window' );
		// Mouse click-to-drag cancel event(s).
		else {
			// Check if click is inside the target.
			const isInside	= this.clickCheck( e );
			// If released inside, start drag-&-drop.
			if ( !isInside ){
				// Prepare to cancel.
				this.jot( 'canceling', true );
				// Call to allow for cancel interception.
				this.emit( 'checkCancel', null, e );
				// Cancel, if canceling continuing.
				if ( this.skim('canceling')===true ) {
					this.emit( 'dragdropCancel', null );
					//console.log( 'Mouse released outside target.' );
					this.stop( e );	// cancel drag-drop start
					return false;	// drag-drop canceled
				}
			}
			// Register mousedown drag-drop drop event (for second "mouseclick to drop").
			this.target.register( 'mousedown', 'dragdropStop', e=>this.stop(e), 'window' );
		}
	}

	// Double click event (emits event with specs).
	// RETURNS: [void].
	// * e	- [object] MouseEvent event listener data.
	doubleclick( e ) {
		// Mode gate keep.
		const enabled	= this.skim( 'enabled' );
		const mode		= this.skim( 'mode' );
		if ( !enabled || (mode!=='idle' && mode!=='starting') ) return;
		//-------------------------
		// Change Tool Mode
		//-------------------------
		// Set tool mode.
		this.jot( 'mode', 'swatching' );
		//-------------------------
		// Cancel Single Click Timer
		//-------------------------
		// If a single-click timer exists, cancel it — don't run the click logic.
		if ( this.startTimer ) {
			clearTimeout( this.startTimer );
			this.startTimer = null;
		}
		//-------------------------
		// Get Click Location(s)
		//-------------------------
		// Find the x & y screen click position(s).
		let click = this.click( e );
		// Emit doubleclick event.
		this.emit( 'dragdropDoubleClicked', null, click, this );
		//-------------------------
		// Revert Tool Mode
		//-------------------------
		// Reset the tool.
		this.reset();
	}

	// Get the click event spec(s).
	// RETURNS: [object] of data: { screenX, screenY, grabOffsetX, grabOffsetY }
	// * e	- [object] MouseEvent event listener data.
	click( e ) {
		//-------------------------
		// Get Click Location
		//-------------------------
		// Find the x & y of the mouse click
		let click = this.target.mousePos( e );
		// Convert to grid units.
		let x     = Math.floor( click.x / this.anchor.units );
		let y     = Math.floor( click.y / this.anchor.units );
		//-------------------------
		// Get Screen Location (for crate)
		//-------------------------
		// Compute where the cursor is:
		const screenX     = e.clientX,
		      screenY     = e.clientY;
		// “Grab” the crate from its center.
		const crateWidth  = this.anchor.units;
		const crateHeight = this.anchor.units;
		const grabOffsetX = Math.floor( crateWidth/2 );
		const grabOffsetY = Math.floor( crateHeight/2 );
		// Return screen click data.
		return {
			tx: x, ty: y, crateWidth, crateHeight,
			screenX, screenY, grabOffsetX, grabOffsetY
			};
	}

	// Emits drop event when mouse is released.
	// RETURNS: [void].
	// * garage		- [object] of garage being dropped in.
	// * localX		- [number] Value of relative x location in the garage.
	// * localY		- [number] Value of relative y location in the garage.
	drop( garage, localX, localY ) {
		//console.log( 'dropping dragdrop' );
		// Mode gate keep.
		const enabled = this.skim( 'enabled' );
		//const mode	= this.skim( 'mode' );
		if ( !enabled ) return;
		//-------------------------
		// Get Data for Event
		//-------------------------
		// Get data from crate contents.
		const contents = this.crate.display.getContents();
		// Use the crate's current destination-space units. These may differ from
		// the source tool units when dropping onto a zoomed surface, for example.
		const units    = this.crate.anchor.getUnitsZoomed(); // tile units
		const levelX   = Math.round( localX / units );
		const levelY   = Math.round( localY / units );
		//-------------------------
		// Handle Crate
		//-------------------------
		this.crate.hide();     // hide the crate
		this.crate.disable();  // disable if enabled
		//-------------------------
		// Reset Tool Mode
		//-------------------------
		// Reset the tool.
		this.reset(); // reset tool
		//-------------------------
		// Emit Event(s)
		//-------------------------
		// Emit drop( event.
		this.emit(
			'dragdropDropped', null,
			garage,
			{ x: localX, y: localY, lx: levelX, ly: levelY },
			this, contents
			);
	}

	// Called when dropping ends via mouseup or blur.
	// RETURNS: [void].
	// * drop	- [Boolean] Whether to drop the crate or not (defaults to [true]).
	stop( e, drop=true ) {
		//console.log( 'stopping dragdrop' );
		// Prevent other events upward.
		if ( e ) e.preventDefault(); // halt bubbling
		//-------------------------
		// Cancel Single Click Timer
		//-------------------------
		// Check for start timer (buffers between double-click).
		if ( this.startTimer ) {
			clearTimeout( this.startTimer );
			this.startTimer = null;
		}
		//-------------------------
		// Handle Crate
		//-------------------------
		// Trigger the crate drop event if possible.
		if ( e && drop )
			this.crate.drop( e );   // drop the crate
		this.crate.reset();         // reset the crate
		this.crate.hide();          // hide the crate
		this.crate.disable();       // disable if enabled
		//-------------------------
		// Reset Tool Mode
		//-------------------------
		// Reset the tool.
		this.reset(); // reset tool
		//-------------------------
		// Emit Event(s)
		//-------------------------
		// Emit drop( event.
		this.emit( 'dragdropStopped', null, this );
	}

	//-------------------------
	// Remove Listener(s)
	//-------------------------
	// Remove dragdrop listener(s).
	removeTargetListeners() {
		// Remove dragdrop listener(s).
		this.target.unregister( 'mouseup', 'dragdropStart' );
		this.target.unregister( 'mousedown', 'dragdropStart' );
		this.target.unregister( 'dblclick', 'dragdropDoubleClick' );
	}

	// Remove window listener(s).
	removeGlobalListeners() {
		// Remove window event listener(s).
		this.target.unregister( 'mouseup', 'dragdropStart' );
		this.target.unregister( 'mousedown', 'dragdropStop' );
		this.target.unregister( jsos.mouseUps, 'dragdropStop' );
	}
}
