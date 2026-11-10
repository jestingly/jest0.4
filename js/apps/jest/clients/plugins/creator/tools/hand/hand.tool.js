//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/tools/hand/hand.tool.js loaded' );

//-------------------------
// JestToolHand Class
//-------------------------
// Drag the workspace to pan around the level.
class JestToolHand extends JestTool {
	target     = null;    // [ElementCanvas] Canvas that starts a pan.
	container  = null;    // [HTMLElement] Element that scrolls around the canvas.
	startX     = 0;       // [number] Pointer X position when the drag began.
	startY     = 0;       // [number] Pointer Y position when the drag began.
	scrollX    = 0;       // [number] Scroll-left position when the drag began.
	scrollY    = 0;       // [number] Scroll-top position when the drag began.
	dragging   = false;   // [boolean] Whether a pan is active.

	// --------------------------------
	// Constructor
	// --------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client - [object] Application client that this piece belongs to.
	// * name   - [string] Value of tool name.
	constructor( client, name ) {
		super( client, name ); // call parent constructor
	}

	// --------------------------------
	// Enable & Disable
	// --------------------------------
	// Enable the hand tool and listen for a pan start.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	enable() {
		// Let the parent tool update its enabled state.
		if ( !super.enable() ) return false;
		// Listen for the initial press on the canvas.
		this.target.register(
			'mousedown', 'handStart', e=>this.start(e), 'dom' );
		this.target.el.style.cursor = 'grab';
		this.jot( 'enabled', true ); // enable selectability
		return true; // success
	}

	// --------------------------------
	// Enable & Disable
	// --------------------------------
	// Reset the tool to be used.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	reset() {
		//--------------------------------
		// Remove Event Listeners
		//--------------------------------
		// Remove all target listener(s) for safe cleanup.
		this.removeTargetListeners(); // remove tagert listener(s)
		this.removeGlobalListeners(); // remove taget listener(s)
		//--------------------------------
		// Reset State & Visual(s)
		//--------------------------------
		// Restore the idle cursor when the hand tool is still enabled.
		this.dragging = false;
		if ( this.skim('enabled') )
			this.target.el.style.cursor = 'grab';
		//--------------------------------
		// Add Event Listener
		//--------------------------------
		// Listen for the initial press on the canvas.
		this.target.register( 'mousedown', 'handStart', e=>this.start(e), 'dom' );
		return true; // success
	}
	
	//--------------------------------
	// Disable Hand Tool
	//--------------------------------
	// Disable tool interactions and clear its event(s).
	// RETURNS: [boolean].
	disable() {
		//--------------------------------
		// Remove Event Listeners
		//--------------------------------
		// Remove any temporary drag listeners & the press listener.
		this.stop(); // stop tool
		this.removeTargetListeners();
		this.removeGlobalListeners();
		//--------------------------------
		// Reset Visual Change(s)
		//--------------------------------
		// Reset cursor.
		this.target.el.style.cursor = '';
		//--------------------------------
		// Mark Tool Disabled
		//--------------------------------
		// Let the parent tool update its enabled state.
		if ( !super.disable() ) return false;
		// Disable & return success.
		this.jot( 'enabled', false );
		return true; // success
	}

	// --------------------------------
	// Set Hand Drawing Target
	// --------------------------------
	// Set the workspace canvas and its scroll container.
	// RETURNS: [boolean] success.
	// * target - [ElementCanvas] Canvas to pan.
	setTarget( target ) {
		// Require the workspace canvas type used by the other canvas tools.
		if ( !(target instanceof ElementCanvas) ) {
			console.warn( 'Hand target must be an ElementCanvas.' );
			return false; // fail
		}
		// Set target & its parent container.
		this.target    = target;
		this.container = target.el.parentElement;
		return true; // success
	}

	// Start a pan when the user presses on the workspace canvas.
	// * e - Event [object] from mouse click.
	start( e ) {
		// Ignore non-primary mouse buttons.
		if ( e.button!==0 || this.dragging ) return;

		// Remember the initial pointer and scroll positions.
		this.startX   = e.clientX;
		this.startY   = e.clientY;
		this.scrollX  = this.container.scrollLeft;
		this.scrollY  = this.container.scrollTop;
		this.dragging = true;
		this.target.el.style.cursor = 'grabbing';

		// Track the drag outside the canvas, and stop when the button is released.
		this.target.register( 'mousemove', 'handPan', e=>this.pan(e), 'window' );
		this.target.register( jsos.mouseUps, 'handPanEnd', ()=>this.stop(), 'window' );
	}

	// Move the scroll position opposite to the pointer movement.
	// * e - Event [object] from mouse move.
	pan( e ) {
		// Do nothing unless a drag is active.
		if ( !this.dragging ) return;
		// The scroll container clamps these values to its scrollable range.
		this.container.scrollLeft = this.scrollX - (e.clientX-this.startX);
		this.container.scrollTop  = this.scrollY - (e.clientY-this.startY);
	}

	// End the active pan and remove its window-level callbacks.
	stop() {
		// Simply reset the tool.
		this.reset(); // reset tool
	}

	//-------------------------
	// Remove Listeners
	//-------------------------
	// Remove event listener(s).
	// RETURNS: [void].
	removeTargetListeners() {
		// Remove both callbacks registered for the active drag.
		this.target.unregister( 'mousedown', 'handStart' );
		this.target.unregister( 'mousemove', 'handPan' );
	}

	// Remove window listener(s).
	// RETURNS: [void].
	removeGlobalListeners() {
		// Remove window event listener(s).
		this.target.unregister( jsos.mouseUps, 'handPanEnd' );
	}
}
