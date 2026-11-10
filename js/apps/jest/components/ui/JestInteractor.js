//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/ui/JestInteractor.js loaded' );

//-----------------------------
// JestInteractor Class
//-----------------------------
// Detects interruptions that may prevent normal input cleanup.
// Emits: 'contextLost' with { reason, event }.
class JestInteractor extends JestElement {
	// Object properties
	active     = false;    // [bool] Whether interruption detection is active.
	pointer    = null;     // [object|null] Last known viewport pointer coordinates.
	_bindings  = null;     // [AbortController|null] Native event bindings.

	//--------------------------------
	// Constructor
	//--------------------------------
	// * client - [object] Parent application client.
	constructor( client ) {
		super( client );  // call parent constructor
		this.build();     // auto-build for DOM access
	}

	//--------------------------------
	// Build List Container
	//--------------------------------
	// Build the element [object].
	// RETURNS: [void].
	// * name		- unique [string] value of component name in the system.
	// * classes	- [array] of classes to add to panel element.
	build( name='jest-list', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		super.build( "div", 'interactor', ['jest-interactor'] );
		// Append DOM element to the document.
		document.body.appendChild( this.panel.el );
	}

	//--------------------------------
	// Enable Context Detection
	//--------------------------------
	// Install global interruption listeners once.
	// RETURNS: [boolean] `true` on success else `false`.
	enable() {
		// Avoid duplicate listener bindings.
		if ( this.active ) return false;
		this.active    = true; // listening is live
		this._bindings = new AbortController();

		// Capture interruptions before ordinary bubbling listeners.
		const options  = {
			capture : true,
			signal  : this._bindings.signal
			};

		// Track the pointer even when no sampling tool is equipped.
		this.panel.register(
			['pointermove','pointerdown'], 'trackPointer',
			e => {
				this.pointer = {
					clientX : e.clientX,
					clientY : e.clientY
					};
				//console.log( this.pointer );
			},
			'window', null, options
			);

		// Window focus was lost.
		this.panel.register(
			'blur', 'default',
			e => this.interrupt( 'blur', e ),
			'window', null, options
			);

		// A native or application context menu is opening.
		this.panel.register(
			'contextmenu', 'default',
			e => this.interrupt( 'contextmenu', e ),
			'window', null, options
			);

		// The browser canceled an ongoing pointer interaction.
		this.panel.register(
			'pointercancel', 'default',
			e => this.interrupt( 'pointercancel', e ),
			'window', null, options
			);

		// The pointer left the document entirely.
		this.panel.register(
			'pointerout', 'default',
			e => {
				if ( e.relatedTarget===null )
					this.interrupt( 'pointerexit', e );
			},
			'window', null, options
			);

		// The document became hidden or the window was minimized.
		this.panel.register(
			'visibilitychange', 'default',
			e => {
				if ( document.hidden )
					this.interrupt( 'hidden', e );
			},
			'document', null, options
			);

		// The document is being left or unloaded.
		this.panel.register(
			'pagehide', 'default',
			e => this.interrupt( 'pagehide', e ),
			'window', null, options
			);

		// User explicitly requested cancellation.
		this.panel.register(
			'keydown', 'default',
			e => {
				if ( e.key==='Escape' && !e.repeat )
					this.interrupt( 'escape', e );
			},
			'window', null, options
			);

		return true; // success
	}

	//--------------------------------
	// Signal Lost Context
	//--------------------------------
	// Notify consumers that interaction cleanup may be required.
	// May also be called directly for application-specific interruptions.
	// RETURNS: [boolean] `true` on success else `false`.
	// * reason - [string] Cause of the interruption.
	// * event  - [Event|null] Original native event, if available.
	interrupt( reason, event=null ) {
		// Determine if listening is active.
		if ( !this.active ) return false;

		// Reset the pointer coordinates.
		this.pointer = null;

		// Emit interruption event.
		this.emit(
			'interruption', null,
			{
			reason : reason,
			event  : event
			});

		return true; // success
	}

	//--------------------------------
	// Disable Context Detection
	//--------------------------------
	// Notify consumers and remove native listeners.
	// RETURNS: [boolean] `true` on success else `false`.
	disable() {
		// Determine if listening is active.
		if ( !this.active ) return false;

		// Throw interruption.
		this.interrupt( 'disabled' );
		this.active    = false;
		this._bindings?.abort();
		this._bindings = null;

		return true; // success
	}

	//--------------------------------
	// Destroy Context Detection
	//--------------------------------
	// Release native listener bindings.
	// RETURNS: [void].
	destroy() {
		// Clear listener(s).
		this.disable();
		// Nullify client [object] ref.
		this.client = null;
	}

	//--------------------------------
	// Get Pointer Coordinates
	//--------------------------------
	// Return the last known pointer position with current page offsets.
	// RETURNS: [object|null].
	getPointer() {
		// Check if coordinates are possible.
		if ( !this.active || !this.pointer || document.hidden )
			return null; // no coords

		// Build a map of mouse page coordinates.
		const { clientX, clientY } = this.pointer;
		return {
			clientX : clientX,
			clientY : clientY,
			pageX   : clientX + window.scrollX,
			pageY   : clientY + window.scrollY
			};
	}
}
