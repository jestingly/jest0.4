//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/ui/JestMenu.js loaded' );

//-------------------------
// JestMenu Class
//-------------------------
// A menu for handling buttons & actions.
class JestMenu extends JestElement {
	// Object properties
	actions			= [];			// [array] of possible action(s).
	buttons			= {};			// [object] of active buttons.

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
	build( name='menu', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		super.build( "div", name, ['menu'].mergeUnique(classes) );
	}

	//---------------------------------
	// Action Handling
	//---------------------------------
	// Generate menu action button(s)
	// RETURNS: [void].
	// * action		- [object] Data of action(s) to create a button for.
	/*addActions( actions ) {
		// Iterate modes to generate a button for each.
		Object.entries(actions).forEach( action => this.addAction(action) );
	}

	// Generate menu action button.
	// RETURNS: [void].
	// * action		- [object] Value of action data to create a button.
	addAction( action ) {
		// Determine if action has been previously processed.
		if ( action.name in this.actions ) return false;
		// Register a new action.
		this.actions[action.name] = action;
		return true; // success
	}*/

	// Generate menu action button.
	// RETURNS: [object] JestButton or [null] on fail.
	// * action		- [object] Value of action to create a button for.
	createButton( action ) {
		// Determine if action has been previously processed.
		if ( action.name in this.buttons ) {
			console.warn( `Button with action key "${action.name}" already exists.` );
			return null; // fail
		}
		// Create a new button for the action
		const button	= new JestButton( this.client );
		button.build( action.name, null, action.text );
		this.addButton( action, button ); // add button to panel
		return button; // success
	}

	// Generate menu action button.
	// RETURNS: [void].
	// * action		- [object] Value of action to create a button for.
	// * button		- [object] JestButton serving as a clickable button.
	addButton( action, button ) {
		// Validate argument.
		if ( !(button instanceof JestButton) ) {
			console.warn( `Invalid argument type for argument "button".` );
			return false; // fail
		}
		// Determine if action has been previously processed.
		if ( action.name in this.buttons ) {
			console.warn( `Button with action key "${action.name}" already exists.` );
			return false; // fail
		}
		// Add button to panel.
		this.buttons[action.name] = button; // store button reference
		button.panel.register( 'click', 'tab', e=>this.btnClick(e,action,button), 'dom' );
		this.panel.addPanel( action.name, button.panel ); // add button to panel
		return true; // success
	}

	// Get button by name value.
	// RETURNS: [JestButton] instance, or [null].
	// * skey	- [string] Value of button unique key.
	getButton( skey ) {
		// Loop through buttons & find matching button.
		for ( const key in this.buttons ) {
			const button = this.buttons[key]; // get the button object
			if ( button.skey===skey )
				return button; // found button
		}
		return null; // no button found
	}

	// Remove a menu action button.
	// RETURNS: [void].
	// * button		- [object] JestButton serving as a clickable button.
	removeButton( button ) {
		// Validate argument.
		if ( !(button instanceof JestButton) ) {
			console.warn( `Invalid argument type for argument "button".` );
			return false; // fail
		}
		// Detach event listener(s)
		button.panel.unregister( 'click', 'tab' );
		// Remove the button DOM element.
		this.panel.removePanel( button.skey ); // remove button from panel
		return true; // success
	}

	//---------------------------------
	// Button State Handling
	//---------------------------------
	// Toggle a menu button on/off.
	// * key		- [string] Value of menu button to toggle.
	// * lever		- [bool] Value whether to toggle on `true` else `false`.
	toggle( key, lever=true ) {
		// Check for button.
		if ( this.buttons?.[key] ) {
			const button = this.buttons[key];
			button.toggle( 'enable', lever ); // toggle button
		}
	}

	// Toggle all menu buttons.
	// RETURNS: [void].
	// * lever		- [bool] Value whether to toggle on `true` else `false`.
	toggleAll( lever=true ) {
		// Iterate all buttons & enable/disable.
		for ( const key in this.buttons ) {
			// Turn off all buttons.
			const button = this.buttons[key];
			button.toggle( 'enable', lever ); // toggle button
		}
	}

	//---------------------------------
	// Button State Handling
	//---------------------------------
	// Enable or disable a single button.
	// RETURNS: [void].
	// * name		- [string] Value of button name.
	enableButton( name ) {
		// Check for button.
		const button = this.buttons[name];
		if ( button ) button.enable(); // enable
	}

	// Enable or disable entire menu.
	// RETURNS: [void].
	enable() {
		// Iterate all buttons & enable.
		for ( const name in this.buttons )
			this.buttons[name].enable();
	}

	// Deactivate all the buttons.
	// RETURNS: [void].
	deactivateButtons() {
		// Toggle "active" Button Class
		Object.entries(this.buttons).forEach(
			( [key,button] ) => {
				button.deactivate();
			});
	}

	//---------------------------------
	// Event Handling
	//---------------------------------
	// Callback when a button was clicked.
	// RETURNS: [void].
	// * e			- [object] MouseEvent event listener data.
	// * action		- [string] Value of action of button.
	// * button		- [object] JestButton serving as a clickable button.
	btnClick( e, action, button ) {
		//console.log( `Button ${action.name} clicked.` );
		//console.log( action );
		// Emit an event
		this.emit( 'btnClick', null, e, action, button );
	}
}
