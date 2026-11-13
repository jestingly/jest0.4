//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/tools/entities/entities.tool.js loaded' );

//-------------------------
// JestToolEntities Class
//-------------------------
// This class frames an [object] that serves as a base usable tool.
class JestToolEntities extends JestTool {
	// UI handling properties
	toolbar     = null;         // [object] JestToolbar for buttons
	imageSelect = null;         // JestInputFileSelect [object] for sprite image(s).

	// Canvas target
	target      = null;         // [ElementCanvas] workspace canvas
	// Entity selection
	selected    = null;         // [JestCuratorObject|null] selected entity
	hovered     = null;         // [JestCuratorObject|null] hovered entity
	// Dragging measurements
	dragStartX  = null;         // [number] original entity X
	dragStartY  = null;         // [number] original entity Y
	grabOffsetX = 0;            // [number] cursor offset in pixels
	grabOffsetY = 0;            // [number] cursor offset in pixels
	// Dragging state
	moved       = false;        // [bool] whether entity has moved

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
	build( name='tool-entities', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		const defaultClasses	= [ 'tool-entities' ];
		super.build( name, defaultClasses.mergeUnique(classes) );

		// Tool is empty by default.
		this.jot( 'mode', 'empty' );	// tool is idle to start

		// --------------------------------
		// Create Image File Select Input [object]
		// --------------------------------
		// Add file open file-select input [object] to filemenu.
		const filetypes		= this.client.imager.filetypes.join( ', .' );
		const imageSelect	= new JestInputFileSelect( this.client, `.${filetypes}` );
		this.imageSelect	= imageSelect;
		imageSelect.build( 'imageSelect', ['open-image-select'] );
		// Add image file-select input field to buttons toolbar.
		//this.panel.refs.buttons.addPanel( 'imageSelect', imageSelect.panel );
	}

	// --------------------------------
	// Set Target
	// --------------------------------
	// Assign the workspace canvas.
	// RETURNS: [boolean].
	// * target - [ElementCanvas] canvas to interact with
	setTarget( target ) {
		//--------------------------------
		// Validate Target
		//--------------------------------
		if ( !(target instanceof ElementCanvas) ) {
			console.warn( 'Entities target must be an ElementCanvas.' );
			return false;
		}
		// Cannot change canvas during interaction.
		if ( this.skim('enabled') || this.skim('mode')==='dragging' ) {
			console.warn( 'Entities cannot change target while enabled.' );
			return false;
		}
		//--------------------------------
		// Store Target
		//--------------------------------
		this.target = target;
		return true;
	}

	// --------------------------------
	// Enable & Disable
	// --------------------------------
	// Enable the entities tool.
	// RETURNS: [boolean].
	enable() {
		// Check parent constructor.
		if ( !super.enable() ) return false;
		// Add event listener(s)
		this.jot( 'enabled', true ); // enable entities
		this.reset(); // reset the tool
	}

	// Disable the entities tool.
	// RETURNS: [boolean].
	disable() {
		// Check parent constructor.
		if ( !super.disable() ) return false;
		// Cancel active interaction.
		this.reset();
		// Remove mouse listeners.
		this.removeTargetListeners();
		this.removeGlobalListeners();
		this.jot( 'enabled', false );
		this.updateCursor(); // update cursor
		return true;
	}

	//-------------------------
	// Resetting Methods
	//-------------------------
	// Reset tool interaction and selection.
	// RETURNS: [void].
	reset() {
		//--------------------------------
		// Remove Event Listeners
		//--------------------------------
		this.removeTargetListeners();
		this.removeGlobalListeners();

		//--------------------------------
		// Clear Selection
		//--------------------------------
		this.selected		= null;
		this.dragStartX		= null;
		this.dragStartY		= null;
		this.grabOffsetX	= 0;
		this.grabOffsetY	= 0;
		this.moved			= false;
		this.hovered		= null;
		// Return to idle mode.
		this.jot( 'mode', 'empty' );

		//--------------------------------
		// Register Mouse Listener
		//--------------------------------
		// If canvas is accessible & tool is enabled.
		if ( this.target && this.skim('enabled') ) {
			// Set mousedown mouse event.
			this.target.register(
				'mousedown', 'entitySelectStart',
				e=>this.checkClick(e), 'dom'
				);
			// Set mousemove event (for hover detection).
			this.target.register(
				'mousemove', 'entityHover',
				e=>this.updateCursor(e), 'dom'
				);
		}

		//--------------------------------
		// Emit Reset Event
		//--------------------------------
		this.emit( 'reset', null, this );
	}

	//-------------------------
	// Selection Method(s)
	//-------------------------
	// Check whether the user clicked an entity.
	// RETURNS: [void].
	// * e - [MouseEvent] mouse event
	checkClick( e ) {
		//--------------------------------
		// Validate Interaction
		//--------------------------------
		if ( !this.skim('enabled') ) return;
		if ( this.skim('mode')==='dragging' ) return;
		if ( e.button!==0 ) return;
		//--------------------------------
		// Check Keyboard Modifiers
		//--------------------------------
		// Determine if shift key is pressed.
		const add		= e.shiftKey;
		// Check for alt/option key.
		const sub		= e.altKey;
		//--------------------------------
		// Calculate Mouse Position
		//--------------------------------
		const mouse		= this.target.mousePos( e );
		//--------------------------------
		// Find Clicked Entity
		//--------------------------------
		const object	= this.getEntityAt( mouse.x, mouse.y );
		// Clicking empty space deselects.
		if ( !object ) {
			this.deselect();
			return;
		}
		//--------------------------------
		// Select Entity
		//--------------------------------
		this.select( e, object );
		//--------------------------------
		// Begin Dragging
		//--------------------------------
		this.startDragEntity( e );
	}

	//-------------------------
	// Entity Hover Handling
	//-------------------------
	// Update the cursor according to the entity beneath it.
	// * e - [MouseEvent] mouse event
	updateCursor( e=null ) {
	    //--------------------------------
	    // Validate Tool State
	    //--------------------------------
		// Require target to be available.
	    if ( !this.target ) return;
	    // Access the actual canvas element.
	    const canvas = this.target.el;

	    // Restore cursor when disabled.
	    if ( !this.skim('enabled') ) {
			this.hovered = null;
	        canvas.style.cursor = '';
			return; // finished
	    }

	    //--------------------------------
	    // Determine Hovered Entity
	    //--------------------------------
		// Get current tool mode.
	    const mode = this.skim( 'mode' );

	    // Dragging takes priority.
	    if ( mode==='dragging' ) {
			this.hovered = this.selected;
	        canvas.style.cursor = 'grabbing';
	        return; // finished
	    }

		// Find the entity beneath the mouse.
		let object = null;
	    if ( e ) {
			// Check if mouse is hovering, grabbing, etc.
		    const mouse  = this.target.mousePos( e );
		    object = this.getEntityAt( mouse.x, mouse.y );
	    }

		//--------------------------------
	    // Update Hover State
	    //--------------------------------
		// Emit new hover-over event.
	    if ( this.hovered!==object ) {
	        this.hovered = object;
	        this.emit( 'hover', null, object );
	    }

	    // Update cursor.
	    canvas.style.cursor = object ? 'grab' : '';
	}

	// Find the uppermost entity under the cursor.
	// RETURNS: [JestCuratorObject|null].
	// * x,y - [number] mouse position in canvas pixels
	getEntityAt( x, y ) {
		//--------------------------------
		// Request Entity Objects
		//--------------------------------
		// Plugin supplies the current level's entities.
		const items = [];
		this.emit( 'getEntities', null, items );

		//--------------------------------
		// Check Entity Bounds
		//--------------------------------
		// Reverse order prioritizes the topmost drawn entity.
		for ( let i=items.length-1; i>=0; i-- ) {
			// Access curator item returned from getEntities() hook.
			const object = items[i];
			const data   = object?.data;

			//--------------------------------
			// Resolve Entity Dimensions
			//--------------------------------
			const image = data?.image;

			// Check whether the entity image is ready.
			const valid = Boolean( image?.canvas && image.skim('image')==='drawn' );

			// Skip hidden objects.
			if ( object.skim('visible')===false ) continue;

			// Convert entity coordinates into pixels.
			const units = this.anchor.units;
			const bx    = Number(data.x) * units;
			const by    = Number(data.y) * units;

			// Use actual dimensions or default NPC dimensions.
			const bw    = valid ? image.canvas.width  : 45;
			const bh    = valid ? image.canvas.height : 48;

			// Require valid bounds.
			if ( ![bx,by,bw,bh].every(Number.isFinite) )
				continue; // skip

			//--------------------------------
			// Check Point Intersection
			//--------------------------------
			if ( x>=bx && x<bx+bw
				 && y>=by && y<by+bh )
				return object;
		}
		return null;
	}

	// Select an entity object.
	// RETURNS: [boolean].
	// * e		- [MouseEvent] mouse event
	// * object	- [JestCuratorObject] entity to select
	select( e=null, object=null ) {
		//--------------------------------
		// Require Valid Item to Select
		//--------------------------------
		// Object must be set.
		if ( !object ) return false;
		//--------------------------------
		// Store Selection
		//--------------------------------
		// Store item as selected.
		this.selected	= object;
		// Change mode to selected.
		this.jot( 'mode', 'selected' );
		//--------------------------------
		// Emit Selection Event
		//--------------------------------
		// Emit a new selected item event.
		this.emit( 'selected', null, object );
		this.updateCursor( e ); // update cursor
		return true;
	}

	// Clear the current entity selection.
	// RETURNS: [void].
	deselect() {
		//--------------------------------
		// Mode Gatekeep
		//--------------------------------
		// Do not interrupt an active drag.
		if ( this.skim('mode')==='dragging' ) return;
		const previous = this.selected;

		//--------------------------------
		// Clear Selection
		//--------------------------------
		// Clear selection.
		this.selected = null;

		//--------------------------------
		// Switch Mode & Emit Event
		//--------------------------------
		// Switch mode to empty.
		this.jot( 'mode', 'empty' );
		// Notify plugin.
		if ( previous ) // if deselecting, emit event
			this.emit( 'deselected', null, previous );
	}

	//-----------------------------
	// Dragging Entity Method(s)
	//-----------------------------
	// Begin dragging the selected entity.
	// RETURNS: [void].
	// * e - [MouseEvent] starting mouse event
	startDragEntity( e ) {
		//--------------------------------
		// Validate Selection / Gatekeep
		//--------------------------------
		// Object must be set.
		const object = this.selected;
		if ( !object ) return;
		// Readonly NPCs may be selected, but not moved.
		if ( object.data.readonly===true ) return;

		//--------------------------------
		// Calculate Measurements
		//--------------------------------
		const mouse = this.target.mousePos( e );
		const units = this.anchor.units;
		// Store original coordinates.
		this.dragStartX  = Number( object.data.x );
		this.dragStartY  = Number( object.data.y );
		// Calculate entity's pixel position.
		const x     = this.dragStartX * units;
		const y     = this.dragStartY * units;
		// Preserve where the cursor grabbed the image.
		this.grabOffsetX = mouse.x - x;
		this.grabOffsetY = mouse.y - y;
		this.moved  = false;

		//--------------------------------
		// Change Mode
		//--------------------------------
		this.jot( 'mode', 'dragging' );
		this.updateCursor(); // update cursor

		//--------------------------------
		// Add Event Listeners
		//--------------------------------
		// Add a listener for when the mouse moves.
		this.target.register(
			'mousemove', 'entityDragging',
			e=>this.dragEntity(e), 'window' );
		// Add a listener for all mouse-up event(s).
		this.target.register(
			jsos.mouseUps, 'entityDragged',
			e=>this.endDragEntity(e), 'window' );

		//--------------------------------
		// Emit Drag Start
		//--------------------------------
		this.emit(
			'dragStart', null,
			{ object, x: this.dragStartX, y: this.dragStartY }
			);
	}

	// Move the selected entity with the cursor.
	// RETURNS: [void].
	// * e - [MouseEvent] movement event
	dragEntity( e ) {
		//--------------------------------
		// Validate Dragging State
		//--------------------------------
		if ( !this.skim('enabled') ) return;
		if ( this.skim('mode')!=='dragging' ) return;
		const object = this.selected;
		if ( !object ) return;

		//--------------------------------
		// Calculate New Coordinates
		//--------------------------------
		const mouse	= this.target.mousePos( e );
		const units	= this.anchor.units;
		// Convert pixel position to level coordinates.
		let x	= (mouse.x-this.grabOffsetX) / units;
		let y	= (mouse.y-this.grabOffsetY) / units;

		//--------------------------------
		// Apply Axis Lock
		//--------------------------------
		// Get keyboard modifiers.
		const mod	= this.getModifiers( e );
		// Shift locks movement to the dominant axis.
		if ( mod.shift ) {
			const dx	= Math.abs( x-this.dragStartX );
			const dy	= Math.abs( y-this.dragStartY );
			if ( dx>dy )
				y	= this.dragStartY;
			else x	= this.dragStartX;
		}

		//--------------------------------
		// Validate Coordinates
		//--------------------------------
		if ( !Number.isFinite(x) || !Number.isFinite(y) )
			return;
		// Match coordinate precision used by numeric fields.
		x	= Math.round( x*4 ) / 4;
		y	= Math.round( y*4 ) / 4;
		// Skip unchanged positions.
		if ( x===Number(object.data.x) && y===Number(object.data.y) )
			return;

		//--------------------------------
		// Update Entity Position
		//--------------------------------
		object.updateData( 'x', x );
		object.updateData( 'y', y );
		this.moved	= true;

		//--------------------------------
		// Emit Movement Event
		//--------------------------------
		this.emit( 'dragging', null, { object, x, y } );
	}

	// Finish dragging the selected entity.
	// RETURNS: [void].
	// * e - [MouseEvent] release event
	endDragEntity( e ) {
		//--------------------------------
		// Validate Dragging State
		//--------------------------------
		if ( this.skim('mode')!=='dragging' ) return;
		const object	= this.selected;
		//--------------------------------
		// Remove Event Listeners
		//--------------------------------
		// Cleanup listener(s).
		this.target.unregister( 'mousemove', 'entityDragging' );
		this.removeGlobalListeners();
		//--------------------------------
		// Restore Selection Mode
		//--------------------------------
		this.jot( 'mode', (object?'selected':'empty') );
		//--------------------------------
		// Emit Completed Movement
		//--------------------------------
		if ( object && this.moved ) {
			this.emit( 'dragged', null,
				{
				object,
				before : { x: this.dragStartX, y: this.dragStartY },
				after  : { x: Number(object.data.x), y: Number(object.data.y) }
				});
		}
		// Clear drag state.
		this.moved		= false;
		this.dragStartX	= null;
		this.dragStartY	= null;
		this.updateCursor( e ); // update cursor
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

	//-------------------------
	// Remove Listeners
	//-------------------------
	// Remove entity target listener(s).
	removeTargetListeners() {
		if ( !this.target ) return;
		this.target.unregister( 'mousedown', 'entitySelectStart' );
		this.target.unregister( 'mousemove', 'entityDragging' );
		this.target.unregister( 'mousemove', 'entityHover' );
	}
	// Remove window listener(s).
	removeGlobalListeners() {
		if ( !this.target ) return;
		this.target.unregister( jsos.mouseUps, 'entityDragged' );
	}
}
