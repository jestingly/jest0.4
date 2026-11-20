//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/ui/JestButton.js loaded' );

//-------------------------
// JestButton Class
//-------------------------
// Button class for creating a menu button.
class JestButton extends JestElement {
	// Object properties
	enabled			= null;			// [bool] whether button is usable.
	active			= null;			// [bool] whether button is active.
	clicker			= null;			// Panel [object] that contains button DOM.
	title			= null;			// OSElement [object] that contains the display text.

	//---------------------------------
	// Constructor
	//---------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client		- client [object] that this piece belongs to.
	// * name		- [string] value of button unique name.
	constructor( client, name ) {
		super( client );
		// Set default modes.
		//this.modes = modes ?? [];
	}

	//---------------------------------
	// Initialization
	//---------------------------------
	// Autogenerate the button interior content.
	// RETURNS: [void].
	// * text		- [string] value of button text content.
	/*setup( text ) {
		return true; // success
	}*/
	// Build the element [object].
	// RETURNS: [void].
	// * name		- unique [string] value of component name in the system.
	// * classes	- [array] of classes to add to panel element.
	// * text		- [string] value of button text content.
	build( name='button', classes=[], text ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		super.build( "div", name, ['button'].mergeUnique(classes) );

		//-------------------------
		// Create Button Element
		//-------------------------
		// Begin action button data.
		let options		= { name: 'clicker', tag: 'button' };
		// Generate button & add to panel.
		this.panel.createPanel( options );
		this.clicker	= this.panel.refs.clicker; // get [object] ref
		// Enable the button.
		this.enable();
		// Deactivate the button.
		this.deactivate();

		//-------------------------
		// Add Event Listener(s)
		//-------------------------
		// Add event listener(s) for dragging.
		this.clicker.register( 'mousedown', 'action', e=>this.mousedown(e), 'dom' );
		this.clicker.register( 'mouseup', 'action', e=>this.mouseup(e), 'dom' );
		this.clicker.register( 'click', 'action', e=>this.click(e), 'dom' );
		
		//-------------------------
		// Title Element
		//-------------------------
		// Add button text to clicker.
		this.clicker.addElements([{
			name       : 'title',
			tag        : 'span',
			classes    : [ 'button-title' ],
			text       : text ?? ''
			}]);
		this.title		= this.clicker.refs.title; // get [object] ref
	}

	//---------------------------------
	// Button Handling Method(s)
	//---------------------------------
	// Rename the button.
	// RETURNS: [void].
	// * name		- [string] Value name of button to change to.
	rename( name ) {
		// Rename the visual text of the button.
		this.title.setHTML( name );
	}

	//---------------------------------
	// Enabling & Activating Method(s)
	//---------------------------------
	// Enable the button.
	// RETURNS: [void].
	// * type		- [string] Value of type of toggle: 'enable', 'activate', etc.
	// * lever		- [bool] Value whether to toggle on `true` else `false`.
	toggle( type, lever ) {
		// Determine type being taken.
		switch ( type ) {
			case 'enable': // enable/disable
				if ( lever ) this.enable();		// enable
				else this.disable();			// disable
				break;
			case 'activate': // activate/deactivate
				if ( lever ) this.activate();	// activate
				else this.deactivate();			// deactivate
				break;
		}
		// Emit toggle event.
		this.emit( 'toggled', null, type, this.enabled );
	}

	// Enable the button.
	// RETURNS: [void].
	enable() {
		// Only execute if the button is disabled.
		if ( this.enabled===true ) return;
		// Set enabled state to enabled.
		this.enabled = true;
		// Update visual state.
		if ( this.panel?.refs?.clicker?.el ) {
			this.panel.refs.clicker.el.disabled = false;
			this.panel.refs.clicker.removeClass( 'disabled' );
		}
		// Emit enable event.
		this.emit( 'enabled' );
	}

	// Disable the button.
	// RETURNS: [void].
	disable() {
		// Only execute if the button is enabled.
		if ( this.enabled===false ) return;
		// Set enabled state to disabled.
		this.enabled = false;
		// Update visual state.
		if ( this.panel?.refs?.clicker?.el ) {
			this.panel.refs.clicker.el.disabled = true;
			this.panel.refs.clicker.addClass( 'disabled' );
		}
		// Emit disable event.
		this.emit( 'disabled' );
	}

	// Activate the button as active.
	// RETURNS: [void].
	activate() {
		// Only execute if the button is deactivated.
		if ( this.active===true ) return;
		// Set active state to active.
		this.active = true;
		// Update visual state.
		if ( this.panel?.refs?.clicker?.el )
			this.panel.refs.clicker.addClass( 'active' );
	}

	// Deactivate the button as inactive.
	// RETURNS: [void].
	deactivate() {
		// Only execute if the button is activated.
		if ( this.active===false ) return;
		// Set active state to inactive.
		this.active = false;
		// Update visual state.
		if ( this.panel?.refs?.clicker?.el )
			this.panel.refs.clicker.removeClass( 'active' );
	}

	//---------------------------------
	// Event Handler(s)
	//---------------------------------
	// Mouse clicks down on button.
	// RETURNS: [void].
	// * e		- [object] mousedown event.
	mousedown( e ) {
		// Trigger event callback(s).
		this.emit( 'mousedown', null, e );
	}
	// Mouse released up on button
	// RETURNS: [void].
	// * e		- [object] mouseup event.
	mouseup( e ) {
		// Trigger event callback(s).
		this.emit( 'mouseup', null, e );
	}
	// Button was clicked.
	// RETURNS: [void].
	// * e		- [object] click event.
	click( e ) {
		// Trigger event callback(s).
		this.emit( 'click', null, e );
	}
}
