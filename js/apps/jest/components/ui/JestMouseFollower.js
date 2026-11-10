//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/ui/JestMouseFollower.js loaded' );

//-----------------------------
// JestMouseFollower Class
//-----------------------------
// Positions an element beside the mouse cursor.
class JestMouseFollower extends JestElement {
	// Object properties
	contents        = null;    // [OSElement|null] Element for optional contents.
	followerElement = null;    // [OSElement|null] Visual element positioned beside the cursor.
	watchElement    = null;    // [OSElement|null] Element receiving pointer events.
	boundsElement   = null;    // [OSElement|null] Optional boundary for follower placement.
	active          = false;   // [bool] Whether mouse following is active.
	offsetX         = 0;       // [number] Horizontal distance from cursor.
	offsetY         = 0;       // [number] Vertical distance from cursor.
	gridUnits       = 1;       // [number] Grid size used to calculate tile coordinates.
	watchPosition   = null;    // [object|null] Latest watched-element pointer position.

	//--------------------------------
	// Constructor
	//--------------------------------
	// Construct the [object].
	// * client  - [object] parent controller
	// * options - [object] Positioning options.
	constructor( client, options={} ) {
		super( client ); // call parent constructor
		// Configure positioning via custom options.
		this.offsetX  = options.offsetX ?? this.offsetX;
		this.offsetY  = options.offsetY ?? this.offsetY;
		// Configure grid size through the same validation used by later updates.
		if ( options.gridUnits!==undefined )
			this.setGridUnits( options.gridUnits );
	}

	// Destroy the [object].
	// RETURNS: [void]
	destroy() {
		// Stop tracking and remove pointer listeners.
		this.disable();
		// Remove the built follower panel when it still exists.
		this.panel?.remove();
	}

	//--------------------------------
	// Build MouseFollower DOM
	//--------------------------------
	// Creates the floating mousefollower DOM box.
	// RETURNS: [void].
	// * name    - unique [string] value of component name in the system.
	// * classes - [array] of classes to add to panel element.
	build( name='mousefollower', classes=[] ) {
		// --------------------------------
		// Construct Main Panel
		// --------------------------------
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		super.build( 'div', name, ['jest-mousefollower'].mergeUnique(classes) );

		// --------------------------------
		// Create Mouse Follower Content Box
		// --------------------------------
		// Add internal contents element.
		this.panel.addElements([{
			name    : 'contents',
			tag     : 'div',
			classes : ['contents']
			}]);
		this.contents = this.panel.refs.contents; // keep ref
		// Append DOM element to the document.
		document.body.appendChild( this.panel.el );
		this.hide(); // hidden by default
	}

	//--------------------------------
	// Enable Following
	//--------------------------------
	// Turn on mouse following.
	// RETURNS: [boolean] `true` on success else `false`.
	enable() {
		// A follower element or watched element is required.
		if ( !this.followerElement && !this.watchElement ) return false;
		// Mark following as active before listeners can emit events.
		this.active = true;
		// Watch the configured element for cursor movement.
		if ( this.watchElement )
			this.registerWatchEvents();
		return true; // success
	}

	//--------------------------------
	// Disable Following
	//--------------------------------
	// Turn off mouse following.
	// RETURNS: [boolean] `true` on success else `false`.
	disable() {
		// Remove registered pointer callbacks.
		this.unregisterWatchEvents();
		// Clear the watched position and notify listeners if needed.
		this.clearWatchPosition();
		// Mark following as inactive.
		this.active = false;
		return true; // success
	}

	//--------------------------------
	// Set Pointer Watch Element
	//--------------------------------
	// Set the element whose pointer coordinates and tile positions are monitored.
	// RETURNS: [boolean] `true` on success else `false`.
	// * element - [OSElement] Element to monitor (for example, the workspace canvas).
	// * gridUnits - [number] Pixel size of one grid tile on the watched element.
	setWatchElement( element, gridUnits=this.gridUnits ) {
		// Validate the watched element.
		if ( !(element instanceof OSElement) ) {
			console.error( '[JestMouseFollower] Watch element must be an OSElement.' );
			return false; // fail
		}
		// Validate and store the tile size before changing the watched element.
		if ( !this.setGridUnits(gridUnits) ) return false;
		// Stop monitoring the old element before replacing it.
		this.unregisterWatchEvents();
		// Clear the old position before switching watched elements.
		this.clearWatchPosition();
		// Store the watched element.
		this.watchElement = element;
		// Reattach callbacks when following is already active.
		if ( this.active )
			this.registerWatchEvents();
		return true; // success
	}

	//--------------------------------
	// Set Grid Units
	//--------------------------------
	// Set the tile size used to calculate pointer tile coordinates.
	// RETURNS: [boolean] `true` on success else `false`.
	// * gridUnits - [number] Pixel size of one grid tile on the watched element.
	setGridUnits( gridUnits ) {
		// Validate the grid size.
		if ( !Number.isFinite(gridUnits) || gridUnits<=0 ) {
			console.error( '[JestMouseFollower] Grid units must be a positive number.' );
			return false; // fail
		}
		// Store the new tile size.
		this.gridUnits = gridUnits;
		// Recalculate the current tile coordinate without retaining a DOM event.
		if ( this.watchPosition ) {
			this.watchPosition.tileX = Math.floor( this.watchPosition.x / gridUnits );
			this.watchPosition.tileY = Math.floor( this.watchPosition.y / gridUnits );
		}
		return true; // success
	}

	//--------------------------------
	// Register Watched-Element Events
	//--------------------------------
	// Monitor pointer entry, movement, and exit through the element event system.
	// RETURNS: [void].
	registerWatchEvents() {
		console.log('reg');
		// Register all pointer events under this follower's unique key.
		this.watchElement.register(
			['mouseenter','mousemove','mouseleave','wheel'],
			this.skey,
			e => this.handleWatchEvent(e),
			'dom' );
	}

	//--------------------------------
	// Unregister Watched-Element Events
	//--------------------------------
	// Remove pointer callbacks previously registered on the watched element.
	// RETURNS: [void].
	unregisterWatchEvents() {
		console.log('unreg');
		// A watched element is optional for visual-only followers.
		this.watchElement?.unregister(
			['mouseenter','mousemove','mouseleave','wheel'],
			this.skey );
	}

	//--------------------------------
	// Handle Watched-Element Events
	//--------------------------------
	// Capture pointer coordinates, update the optional visual follower, and emit events.
	// RETURNS: [void].
	// * e - [MouseEvent] Pointer event received from the watched element.
	handleWatchEvent( e ) {
		// Clear the current position when the cursor leaves the watched element.
		if ( e.type==='mouseleave' )
			return this.clearWatchPosition();
		// Get coordinates relative to the watched element.
		const local =
			typeof this.watchElement.mousePos==='function'
				? this.watchElement.mousePos( e )
				:
				{
					x : e.clientX - this.watchElement.el.getBoundingClientRect().left,
					y : e.clientY - this.watchElement.el.getBoundingClientRect().top
				};
		// Convert element-relative pixels into tile coordinates.
		const position = {
			x       : local.x,
			y       : local.y,
			tileX   : Math.floor( local.x / this.gridUnits ),
			tileY   : Math.floor( local.y / this.gridUnits ),
			pageX   : e.pageX,
			pageY   : e.pageY,
			clientX : e.clientX,
			clientY : e.clientY
			};
		// Keep the latest position; `null` marks that the cursor was outside.
		const entered = this.watchPosition===null;
		this.watchPosition = position;
		// Show the visual follower only on entry, then keep it aligned to the cursor.
		if ( this.followerElement ) {
			if ( entered ) this.show();
			this.move( e );
		}
		// Notify listeners of entry once and report every updated position.
		if ( entered )
			this.emit( 'enter', null, position, e );
		this.emit( 'move', null, position, e );
	}

	//--------------------------------
	// Clear Watched Position
	//--------------------------------
	// Clear the current position and notify listeners when tracking ends.
	// RETURNS: [void].
	clearWatchPosition() {
		// Clear the visual follower when the cursor was previously inside.
		if ( !this.watchPosition ) return;
		// Save the last position for listeners before clearing it.
		const position = this.watchPosition;
		this.watchPosition = null;
		// Hide the visual follower and notify listeners.
		if ( this.followerElement ) this.hide();
		this.emit( 'leave', null, position );
	}

	//--------------------------------
	// Get Current Position
	//--------------------------------
	// Get the latest watched-element pointer and tile coordinates.
	// RETURNS: [object|null] Position data, or `null` when not hovering.
	getWatchPosition() {
		// Return a shallow copy so callers cannot replace the stored position.
		return this.watchPosition ? { ...this.watchPosition } : null;
	}

	//--------------------------------
	// Show Follower Element
	//--------------------------------
	// Reveal the visual follower element.
	// RETURNS: [void]
	show() {
		// Show the follower element.
		if ( !this.followerElement ) return false;
		this.followerElement.removeClass( 'hidden' ); // show
		this.emit( 'show', null );
	}

	//--------------------------------
	// Hide Follower Element
	//--------------------------------
	// Hide the visual follower element.
	// RETURNS: [void]
	hide() {
		// Hide the element.
		if ( !this.followerElement ) return false;
		this.followerElement.addClass( 'hidden' ); // hide
		this.emit( 'hide', null );       // emit hide event
	}

	//--------------------------------
	// Set Follower Element
	//--------------------------------
	// Set the visual element positioned beside the cursor.
	// RETURNS: [boolean] `true` on success else `false`.
	// * element - [OSElement] Visual follower element.
	setFollowerElement( element ) {
		// Validate argument(s).
		if ( !(element instanceof OSElement) ) {
			console.error( '[JestMouseFollower] Follower element must be an OSElement.' );
			return false; // fail
		}
		// Store the element to position.
		this.followerElement = element;
		return true; // success
	}

	//--------------------------------
	// Set Follower Bounds
	//--------------------------------
	// Set an optional element boundary for follower placement.
	// RETURNS: [boolean] `true` on success else `false`.
	// * element - [OSElement|null] Bounds element, or `null` to use the watched element (or viewport).
	setBoundsElement( element=null ) {
		// Validate a supplied bounds element.
		if ( element!==null && !(element instanceof OSElement) ) {
			console.error( '[JestMouseFollower] Bounds element must be an OSElement or null.' );
			return false; // fail
		}
		// Store the explicit placement boundary.
		this.boundsElement = element;
		return true; // success
	}

	//--------------------------------
	// Move With Mouse
	//--------------------------------
	// Position the element relative to a mouse event.
	// RETURNS: [boolean] `true` on success else `false`.
	// * e - [object] MouseEvent event listener data.
	move( e ) {
		if ( !e ) return false;
		return this.moveTo( e.pageX+this.offsetX, e.pageY+this.offsetY );
	}

	//--------------------------------
	// Move To Position
	//--------------------------------
	// Position the element at page coordinates.
	// RETURNS: [boolean] `true` on success else `false`.
	// * x,y	- [number] Page coordinates.
	moveTo( x, y ) {
		// Require an active follower element.
		if ( !this.active || !this.followerElement ) return false;

		// Measure the visible follower element.
		const rect   = this.followerElement.el.getBoundingClientRect();

		// Use explicit bounds, then the watched element, then the viewport.
		const boundsElement = this.boundsElement ?? this.watchElement;
		const bounds =
			boundsElement
				? boundsElement.el.getBoundingClientRect()
				: { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
		// Convert bounds to page coordinates and account for follower dimensions.
		const minX   = bounds.left + window.scrollX;
		const minY   = bounds.top  + window.scrollY;
		const maxX   = Math.max( minX, bounds.right  + window.scrollX - rect.width );
		const maxY   = Math.max( minY, bounds.bottom + window.scrollY - rect.height );
		// Clamp the follower inside both horizontal and vertical bounds.
		const left   = Math.max( minX, Math.min(x, maxX) );
		const top    = Math.max( minY, Math.min(y, maxY) );

		// Apply the clamped page position.
		this.followerElement.el.style.left = `${left}px`;
		this.followerElement.el.style.top  = `${top}px`;
		return true; // success
	}
}
