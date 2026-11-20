//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/ui/JestScreen.js loaded' );

//-------------------------
// JestScreen Class
//-------------------------
// Screen class extending display for custom stacked screen(s).
class JestScreen extends JestDisplay {
	// Object properties
	enabled			= null;			// [bool] whether button is usable.
	active			= null;			// [bool] whether button is active.
	timeToLive		= null;			// [int|null] Time to live (in cycles) before light clean-up.

	//---------------------------------
	// Constructor
	//---------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client		- client [object] that this piece belongs to.
	constructor( client ) {
		super( client ); // call parent constructor
	}

	//---------------------------------
	// Initialization
	//---------------------------------
	// Build the element [object].
	// RETURNS: [void].
	// * name		- unique [string] value of component name in the system.
	// * classes	- [array] of classes to add to panel element.
	build( name='screen', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		super.build( name, ['jest-screen'].mergeUnique(classes) );
		// Enable the display by default.
		this.disable(); // enable
	}

	//-------------------------
	// Set Time to Live
	//-------------------------
	// Set the screen's time to live.
	// RETURNS: [void].
	//   timeToLive	- [int|null] Value of time to live (or [null] for no-expire)
	setTTL( timeToLive=null ) {
		// Set the time to live.
		this.timeToLive	= timeToLive; // set value
	}

	// Get the screen's time to live.
	// RETURNS: [void].
	getTTL( timeToLive=null ) {
		// Get the time to live.
		return this.timeToLive; // return value
	}

	//-------------------------
	// Screen Transitioning Method(s)
	//-------------------------
	// Trigger the screen enter transition.
	// RETURNS: [void].
	enter() {
		// Emit event(s).
		this.emit( 'enter' );
	}

	// Trigger the screen exit transition.
	// RETURNS: [void].
	exit() {
		// Emit event(s).
		this.emit( 'exit' );
	}

	//-------------------------
	// Screen Toggling Method(s)
	//-------------------------
	// Enable the screen.
	// RETURNS: [void].
	enable() {
		// Only execute if the screen is disabled.
		if ( this.enabled===true ) return;
		// Set enabled state to enabled.
		this.enabled = true;
		// Update visual state.
		if ( this.panel?.el ) {
			this.panel.el.disabled = false;
			this.panel.removeClass( 'disabled' );
		}
		// Emit enable event.
		this.emit( 'enabled' );
	}

	// Disable the screen.
	// RETURNS: [void].
	disable() {
		// Only execute if the screen is enabled.
		if ( this.enabled===false ) return;
		// Set enabled state to disabled.
		this.enabled = false;
		// Update visual state.
		if ( this.panel?.el ) {
			this.panel.el.disabled = true;
			this.panel.addClass( 'disabled' );
		}
		// Emit disable event.
		this.emit( 'disabled' );
	}
}
