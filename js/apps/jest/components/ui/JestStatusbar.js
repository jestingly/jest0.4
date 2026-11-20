//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/ui/JestStatusbar.js loaded' );

//-------------------------
// JestStatusbar Class
//-------------------------
// Create a status bar using Panel base
class JestStatusbar extends JestElement {
	// Object properties
	status			= null;				// [object] Panel used for general text status display.

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
	build( name='statusbar', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		super.build( 'div', name, ['statusbar'].mergeUnique(classes) );
		//---------------------------------
		// Create Status Bar Display(s)
		//---------------------------------
		// Create statusbar & status display.
		const status	= new JestDisplay( this );
		status.build( 'status', ['status'] );	// build display
		this.status		= status;				// store reference
		this.panel.addPanel( 'status', status.panel );
		// Clear the current message (default).
		this.cite(''); // empty message text
	}

	//-------------------------
	// Dynamic Var Method(s)
	//-------------------------
	// OVERRIDE: Set a dynamic variable.
	// RETURNS: [bool] `true` on success, else `false`.
	// * key	- [string] name of key to set.
	// * val	- [string] value of key.
	jot( key, val ) {
		// Handle "message" differently.
		if ( key==='message' ) {
			// Update "queued" value.
			super.jot( key, val );		// save message
			this.jot( 'queued', true );	// awaiting display
			// Emit queued event.
			this.emit( 'queued', null, val );
			return true; // success
		}
		// Set the value.
		return super.jot( key, val ); // success
	}

	//---------------------------------
	// Log & Display Status-Text
	//---------------------------------
	// Log the message inside the status bar (without updating).
	// RETURNS: [void]
	// * text	- [string] Content to save as the status bar status.
	log( text ) {
		// Update status bar message.
		this.jot( 'message', text );
	}

	// Cite a message inside the statusbar & update.
	// RETURNS: [void]
	// * text	- [string] Content to display in the status bar.
	cite( text ) {
		// Change & display statusbar message.
		this.log( text );	// log message
		this.update();		// auto-update
	}

	// Update the statusbar to reflect the logged message.
	// RETURNS: [void]
	// * text	- [string] Content to display in the status bar.
	update() {
		//---------------------------------
		// Get Initial Message & Parse
		//---------------------------------
		// Parse the message & emit an event (for optional additional parsing).
		const message	= this.skim( 'message' );
		this.jot( 'parsed', message ); // raw message
		//---------------------------------
		// Emit Parse Event (for external parsing)
		//---------------------------------
		// Emit queued event.
		this.emit( 'parsed', null, message );
		const parsed	= this.skim( 'parsed' );
		//---------------------------------
		// Update Statusbar Visible Message
		//---------------------------------
		// Display status inside statusbar DOM.
		if ( this.status?.panel?.el )
			this.status.panel.setHTML( parsed );
		// Update status bar "updated" status.
		this.jot( 'queued', false ); // not awaiting display
	}
}
