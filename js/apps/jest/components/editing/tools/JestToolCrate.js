//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/editing/tools/JestToolCrate.js loaded' );

//-------------------------
// JestToolCrate Class
//-------------------------
// This class makes a draggable & droppable crate for "garages".
class JestToolCrate extends JestTool {
	// Object propert(ies)
	garages       = [];           // [array] Array of garage Panel instances.
	garageCanvases	= new WeakMap(); // Optional canvas wrappers paired with registered garages.
	currentGarage = null;         // [Element|null] Garage currently hovered over.
	// Miscellaneous variables
	display       = null;         // [JestDisplay] object for displaying content(s).
	lastPointer   = null;         // [object|null] Latest viewport mouse coordinates.

	//--------------------------------
	// Constructor
	//--------------------------------
	// Construct the Crate with a Panel.
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
	// * name     - unique [string] value of component name in the system.
	// * classes  - [array] of classes to add to panel element.
	build( name='tool-crate', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		const defaultClasses = [ 'tool-crate' ];
		super.build( name, defaultClasses.mergeUnique(classes) );
		// Tool is empty by default.
		this.jot( 'mode', 'empty' ); // tool is idle to start
		//---------------------------------
		// Create Canvas In Crate [object]
		//---------------------------------
		// Add a canvas to the crate for tile display.
		const display = new JestDisplay( this.client );
		display.build();          // build the display panel
		this.display  = display;  // cross-reference
		this.panel.addPanel( 'display', display.panel );
		// Hide by default.
		this.hide();
	}

	//-------------------------
	// Add/Remove Garage(s)
	//-------------------------
	// Add a Panel that acts as a drop target.
	// * garage  - [JestElement] instance representing a garage.
	//   canvas  - [ElementCanvas] to attach to the garage.
	addGarage( garage, canvas=null ) {
		// Validate argument(s).
		if ( !(garage instanceof HTMLElement) ) {
			console.warn( `Crate Add Garage: argument must be of type JestElement.` );
			return false;
		}
		// Avoid duplicates
		if ( this.garages.includes(garage) ) return false;
		this.garages.push( garage ); // add to [array]
		// Use the editable bounds when the garage has a matching canvas wrapper.
		if ( canvas?.el===garage )
			this.garageCanvases.set( garage, canvas );
		return true; // success
	}

	// Remove a previously added garage.
	// * garage		- [JestElement] instance to remove.
	removeGarage( garage ) {
		// Check if garage is in garages [array]
		const index	= this.garages.indexOf( garage );
		if ( index===-1 ) {
			console.warn( `Crate Remove Garage: garage not found.` );
			return false;
		}
		// Remove garage from [array].
		this.garages.splice( index, 1 );
		this.garageCanvases.delete( garage );
		return true; // success
	}

	//--------------------------------
	// Find Garage Under Pointer
	//--------------------------------
	// RETURNS: [object|null] Garage, local pixels, and snapped tile coordinates.
	// * e - [MouseEvent] Pointer event in viewport coordinates.
	getGarageHit( e ) {
		// Search the elements under the pointer in visual stacking order.
		const units = this.anchor.getUnitsZoomed();
		for ( const garage of document.elementsFromPoint(e.clientX,e.clientY) ) {
			if ( !this.garages.includes(garage) ) continue;

			// Resolve the same origin for hit testing, snapping, and dropping.
			const canvas = this.garageCanvases.get( garage );
			let bounds;
			if ( canvas ) {
				bounds = canvas.getRinkClientBounds();
				// Neighbor previews and padding are outside the level garage.
				if ( !bounds || e.clientX<bounds.left || e.clientX>=bounds.right ||
					 e.clientY<bounds.top || e.clientY>=bounds.bottom )
					continue; // skip
			}
			else {
				// Swatches and other DOM garages keep their border-adjusted origin.
				const rect = garage.getBoundingClientRect();
				bounds = {
					left   : rect.left + garage.clientLeft,
					top    : rect.top + garage.clientTop,
					scaleX : 1,
					scaleY : 1
					};
			}

			// Convert the pointer to garage-local pixels before snapping.
			const x = (e.clientX-bounds.left) / bounds.scaleX;
			const y = (e.clientY-bounds.top) / bounds.scaleY;
			let lx  = Math.round( x / units );
			let ly  = Math.round( y / units );

			// Keep a hit near the far edge on the level's last tile.
			const edit = canvas?.getRinkBounds();
			if ( edit?.cols>0 ) lx = Math.min( lx, edit.cols-1 );
			if ( edit?.rows>0 ) ly = Math.min( ly, edit.rows-1 );

			return { garage, ...bounds, x, y, lx, ly };
		}
		return null;
	}

	//-------------------------
	// Enable Dragging
	//-------------------------
	// Turn on drag capability for this crate.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	enable() {
		// Check parent constructor.
		if ( !super.enable() ) return false;
		// Mode requirement.
		const mode		= this.skim( 'mode' );
		if ( mode!=='empty' ) return false;
		// Enable.
		this.jot( 'enabled', true );	// enable
		return true; // success
	}

	//-------------------------
	// Disable Dragging
	//-------------------------
	// Turn off drag capability.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	disable() {
		// Check parent constructor.
		if ( !super.disable() ) return false;
		// Mode / enableability requirement
		//const mode		= this.skim( 'mode' );
		//if ( mode=='' ) return false;
		// Reset the crate & disable.
		this.reset(); // reset the crate
		this.removeTargetListeners();	// remove target events
		this.jot( 'enabled', false );	// disable
		return true; // success
	}

	//-------------------------
	// Resetting Method(s)
	//-------------------------
	// Reset the crate tool.
	// RETURNS: [void].
	clear() {
		//-------------------------
		// Hide The Crate
		//-------------------------
		this.hide(); // hide the crate
		this.panel.move( 0, 0 );		// move to top left
		this.panel.resize( 0, 0 );		// resize to nothing
		return true; // success
	}

	// Reset the crate tool.
	// RETURNS: [void].
	reset() {
		//-------------------------
		// Update Styling
		//-------------------------
		// Finalize drop: leave element where it is
		this.hide(); // hide the crate
		this.panel.el.style.cursor = 'grab';  // set cursor to default
		this.panel.el.style.zIndex = '';      // reset z-index
		//this.panel.el.innerHTML  = '';      // empty content
		// Clear the remembered pointer after dragging finishes.
		this.lastPointer = null;
		//-------------------------
		// Reset Mode & Listener(s)
		//-------------------------
		// Tear down all listener(s).
		this.removeTargetListeners();  // remove target events
		this.removeGlobalListeners();  // remove window events
		this.jot( 'mode', 'empty' );   // change mode
		// Add mousedown event (begin lifting).
		this.panel.register( 'mousedown', 'lift', e=>this.lift(e), 'dom' );
	}

	//-------------------------
	// Show/Hide Method(s)
	//-------------------------
	// Show the crate tool.
	// RETURNS: [void].
	show() {
		//-------------------------
		// Show The Crate
		//-------------------------
		this.panel.removeClass( 'hidden' );	// toggle on as shown
		return true; // success
	}

	// Hide the crate tool.
	// RETURNS: [void].
	hide() {
		//-------------------------
		// Hide The Crate
		//-------------------------
		this.panel.addClass( 'hidden' );	// toggle off as hidden
		return true; // success
	}

	//-------------------------
	// Initializing Moving Method(s)
	//-------------------------
	// Lift method triggered by clicking the crate to drag it.
	// * e	- [object] MouseEvent event listener data.
	lift( e ) {
		//console.log( 'lifted crate' );
		// Mode / enableability requirement
		const enabled	= this.skim( 'enabled' );
		const mode		= this.skim( 'mode' );
		if ( !enabled || mode!=='empty' ) return false;
		e.preventDefault();		// prevent default actions underneath
		e.stopPropagation();	// stop bubbling upward
		//-------------------------
		// Compute Location(s)
		//-------------------------
		// Record initial mouse offset within the element.
		const click		= this.panel.mousePos( e );
		const rect		= this.panel.el.getBoundingClientRect();
		// Get global coordinates.
		const globalX	= e.clientX + window.scrollX;
		const globalY	= e.clientY + window.scrollY;
		//-------------------------
		// Change Mode(s)
		//-------------------------
		// Change mode to "dragging".
		this.jot( 'mode', 'dragging' ); // change mode
		this.show(); // show the crate
		// Begin the drag.
		this.beginDrag( globalX, globalY, click.x, click.y );
	}

	// Method triggered manually to lift the crate (not by mouse click event).
	startDragAt( screenX, screenY, offsetX=0, offsetY=0 ) {
		//console.log( 'start crate drag' );
		// Mode / enableability requirement
		const enabled	= this.skim( 'enabled' );
		const mode		= this.skim( 'mode' );
		if ( !enabled || mode!=='empty' ) return false;
		//-------------------------
		// Compute Location(s)
		//-------------------------
		// Get global coordinates.
		const globalX = screenX + window.scrollX;
		const globalY = screenY + window.scrollY;
		//-------------------------
		// Change Mode(s)
		//-------------------------
		// Change mode to "dragging".
		this.jot( 'mode', 'dragging' ); // change mode
		// Begin the drag.
		this.beginDrag( globalX, globalY, offsetX, offsetY );
		return true; // success
	}

	// Begin dragging the crate.
	beginDrag( globalX, globalY, offsetX, offsetY ) {
		//-------------------------
		// Gatekeep Depending on Mode
		//-------------------------
		//console.log( 'begin crate drag' );
		// Mode / enableability requirement
		const enabled	= this.skim( 'enabled' );
		const mode		= this.skim( 'mode' );
		if ( !enabled || mode!=='dragging' ) return;
		//-------------------------
		// Compute Location
		//-------------------------
		// Update both coordinate offsets.
		this.offsetX   = offsetX; // update offset of click x pos
		this.offsetY   = offsetY; // update offset of click y pos
		//--------------------------------
		// Remember Current Pointer Position
		//--------------------------------
		// Convert the supplied page coordinates back into viewport coordinates so
		// the crate can be repositioned if its grid changes before the mouse moves.
		this.lastPointer = {
			clientX : globalX - window.scrollX,
			clientY : globalY - window.scrollY
			};
		//--------------------------------
		// Absolute Position Panel Element
		//--------------------------------
		// Ensure element is absolute positioned.
		const elStyle  = window.getComputedStyle( this.panel.el );
		if ( elStyle.position!=='absolute' )
			this.panel.el.style.position = 'absolute';
		// Move crate to mouse location.
		const left     = globalX - offsetX - parseFloat(elStyle.borderLeftWidth);
		const top      = globalY - offsetY - parseFloat(elStyle.borderTopWidth);
		this.panel.move( top, left );
		//-------------------------
		// Change Style(s)
		//-------------------------
		this.panel.el.style.zIndex = '9999';
		this.panel.el.style.cursor = 'grabbing';
		//-------------------------
		// Event Handler(s)
		//-------------------------
		// Add global listeners for move & drop.
		this.panel.register( 'mousemove', 'dragging', e=>this.move(e), 'window' );
		this.panel.register( jsos.mouseUps, 'dragged', e=>this.drop(e), 'window' );
		//-------------------------
		// Emit Event(s)
		//-------------------------
		// Notify start.
		this.emit( 'dragStart', null, this );
	}

	//-------------------------
	// Internal: Move (mousemove)
	//-------------------------
	// * e	- [object] MouseEvent event listener data.
	move( e ) {
		//-------------------------
		// Gate Keep Mode
		//-------------------------
		//console.log( 'moving crate' );
		// Mode / enableability requirement.
		const enabled = this.skim( 'enabled' );
		const mode    = this.skim( 'mode' );
		if ( !enabled || mode!=='dragging' ) return;

		//-------------------------
		// Stop Domino DOM Event(s)
		//-------------------------
		e.preventDefault();  // prevent default actions underneath
		e.stopPropagation(); // stop bubbling upward

		//--------------------------------
		// Remember Current Pointer Position
		//--------------------------------
		// Preserve the latest pointer location so zoom changes can immediately
		// reposition the crate without waiting for another mousemove event.
		this.lastPointer = {
			clientX : e.clientX,
			clientY : e.clientY
			};

		//-------------------------
		// Check If Inside Garage
		//-------------------------
		// Find the garage that accepts this exact pointer position.
		const hit = this.getGarageHit( e );
		const hoveredGarage = hit?.garage ?? null;
		// If hoveredGarage changed vs this.currentGarage, fire enter/leave.
		if ( hoveredGarage!==this.currentGarage ) {
			if ( this.currentGarage ) {
				//console.log( 'left garage' );
				// Emit event, clear garage & remove class.
				this.emit( 'garageLeave', null, this.currentGarage );
				this.currentGarage = null;
				this.panel.removeClass( 'active' );
			}
			if ( hoveredGarage ) {
				//console.log( 'entered garage' );
				// Emit event, set garage & add class.
				this.currentGarage = hoveredGarage;
				this.emit( 'garageEnter', null, this.currentGarage );
				this.panel.addClass( 'active' );
			}
		}

		//-------------------------
		// Move Crate
		//-------------------------
		// Calculate page absolute position so crate follows mouse.
		let px, py; // new coordinates
		// Use this crate's current display-space grid size.
		const units = this.anchor.getUnitsZoomed();
		// Convert the snapped tile back to viewport coordinates for the crate.
		if ( hit ) {
			px  = hit.left + hit.lx*units*hit.scaleX;
			py  = hit.top  + hit.ly*units*hit.scaleY;
		}
		else {
			// Follow the pointer freely outside every garage.
			px  = e.clientX - this.offsetX;
			py  = e.clientY - this.offsetY;
		}
		// Update element position
		this.anchor.move( px, py );	// update anchor coordinates to track motion
		// Offset px & py to compensate, visually, for border.
		const elStyle = window.getComputedStyle( this.panel.el );
		px -= parseFloat( elStyle.borderLeftWidth );
		py -= parseFloat( elStyle.borderTopWidth );
		this.panel.move( py+window.scrollY, px+window.scrollX ); // crate visual

		//-------------------------
		// Emit Event(s)
		//-------------------------
		// Notify move.
		this.emit( 'dragMove', null, { px, py } );
	}

	//--------------------------------
	// Refresh Crate Position
	//--------------------------------
	// Recalculate the crate position using the last known mouse coordinates.
	// This allows live zoom changes to update snapping without requiring the
	// physical mouse to move again.
	// RETURNS: [boolean] `true` when refreshed else `false`.
	refreshPosition() {
		//--------------------------------
		// Validate Current Drag State
		//--------------------------------
		// Require a remembered pointer position and an active drag.
		if ( !this.lastPointer )
			return false; // nothing to refresh

		if ( this.skim('mode')!=='dragging' )
			return false; // crate is not being carried

		//--------------------------------
		// Reprocess Current Pointer
		//--------------------------------
		// Reuse move() so garage detection, snapping, borders, anchors, and
		// visual positioning all follow the same calculation path.
		this.move({
			clientX : this.lastPointer.clientX,
			clientY : this.lastPointer.clientY,
			// Supply the MouseEvent methods used by move().
			preventDefault()  {},
			stopPropagation() {}
			});

		return true; // success
	}

	//-------------------------
	// Internal: Drop (mouseup)
	//-------------------------
	// Drop the crate & emit an event about location / garage information.
	// * e	- [object] MouseEvent event listener data.
	drop( e ) {
		//--------------------------------
		// Validate Argument(s)
		//--------------------------------
		//console.warn( 'dropping crate' );
		// Validate argument(s).
		if ( !e ) {
			console.warn( '[Crate] Cannot Drop: arg 1 must be [object] of type MouseEvent.' );
			return; // abort
		}

		//--------------------------------
		// Ensure Valid Mode (Gatekeep)
		//--------------------------------
		// Mode / enableability requirement
		const enabled = this.skim( 'enabled' );
		const mode    = this.skim( 'mode' );
		if ( !enabled || mode!=='dragging' ) return;

		//--------------------------------
		// Block Domino DOM Action(s)
		//--------------------------------
		e.preventDefault();   // prevent default actions underneath
		e.stopPropagation();  // stop bubbling upward

		//--------------------------------
		// Calculate Garage-Local Position
		//--------------------------------
		// Recheck the release position in case the canvas moved or resized.
		const hit = this.getGarageHit( e );

		//--------------------------------
		// Emit Drop Crate Event & Reset
		//--------------------------------
		// Send the same tile coordinates used by the visual snap.
		this.emit( 'dropped', null, hit?.garage ?? null, hit );
		this.reset(); // reset the crate
	}

	//-------------------------
	// Internal: Remove Listeners
	//-------------------------
	// Remove crate listener(s).
	removeTargetListeners() {
		// Remove crate listener(s).
		this.panel.unregister( 'mousedown', 'lift' ); // remove lift listener
	}
	// Remove window listener(s).
	removeGlobalListeners() {
		// Remove window event(s) for crate dragging.
		this.panel.unregister( 'mousemove', 'dragging' );
		// Remove window event(s) for crate drag end.
		this.panel.unregister( jsos.mouseUps, 'dragged' );
	}

	//-------------------------
	// Additional Ideas
	//-------------------------
	// • You might add a semi-transparent “ghost” clone of the crate during drag
	//   and leave the original in place until drop. That avoids DOM reflows.
	// • To handle layered garages more accurately, maintain an explicit z-index
	//   or priority property on garages, then pick the highest-priority one under cursor.
	// • If you want snapping behavior, compute the closest grid/alignment in drop.
	// • If you need touch support, register 'touchstart', 'touchmove', 'touchend'
	//   alongside mouse events (with proper preventDefault).
}
