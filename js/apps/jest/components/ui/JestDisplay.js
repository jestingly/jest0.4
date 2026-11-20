//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/ui/JestDisplay.js loaded' );

//-------------------------
// JestDisplay Class
//-------------------------
// Display class for custom content inside of a menu.
class JestDisplay extends JestElement {
	// Object properties
	canvases	= {};			// [object] Map of named ElementCanvas objects.
	target		= null;			// [object] JestElement inner target object.z

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
	// * name    - unique [string] value of component name in the system.
	// * classes - [array] of classes to add to panel element.
	build( name='display', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		super.build( "div", name, ['display'].mergeUnique(classes) );
		// Enable the display by default.
		this.enable(); // enable
	}

	//-------------------------
	// Canvas: Add
	//-------------------------
	// Add a named canvas to the display.
	// RETURNS: [ElementCanvas] the created canvas.
	// * name		– [string] unique canvas name.
	addCanvas( name ) {
		// Validate name.
		if ( !name || typeof name!=='string' ) return null;
		// Prevent duplicates.
		if ( this.canvases[ name ] ) return this.canvases[ name ];
		// Create and store canvas.
		const canvas = new ElementCanvas( this.client );
		canvas.resize( 0, 0 ); // resize to nothing
		this.canvases[ name ] = canvas;
		this.panel.addPanel( name, canvas );
		return canvas; // return canvas [object]
	}

	//-------------------------
	// Canvas: Remove
	//-------------------------
	// Remove a named canvas from the display.
	// RETURNS: [bool] true if removed, false if not found.
	// * name		– [string] canvas name to remove.
	removeCanvas( name ) {
		const canvas = this.canvases[ name ];
		if ( !canvas ) return false;
		// Remove from DOM and delete ref.
		canvas.remove(); // remove canvas
		delete this.canvases[ name ];
		return true; // success
	}

	//-------------------------
	// Canvas: Get
	//-------------------------
	// Get a named canvas from the map.
	// RETURNS: [ElementCanvas|null] the canvas if found.
	// * name		– [string] name of the canvas.
	getCanvas( name ) {
		return this.canvases[name] ?? null;
	}

	//---------------------------------
	// Add a Panel to Display
	//---------------------------------
	// Set a target element inside the display.
	// RETURNS: [bool] success.
	// target	- [JestElement] object to add, or [null] to autogenerate.
	setTarget( target ) {
		// Check if argument is valid.
		if ( !(target instanceof JestElement) ) {
			target	= new JestElement( this.client );
			target.build( 'div', 'target', ['display-target'] );
		}
		// Clear previous target if set.
		if ( this.target ) {
			this.target	= null; // clear target
			this.panel.removePanel( 'target' ); // remove panel
		}
		// Add the element inside the display.
		this.target	= target; // keep ref
		this.panel.addPanel( 'target', target.panel ); // add to DOM
		return true; // susccess
	}

	// Get the display target.
	// RETURNS: [object] or [null].
	getTarget() { return this.target; }

	//---------------------------------
	// Enabling & Activating Method(s)
	//---------------------------------
	// Enable the display.
	// RETURNS: [void].
	// * action		- [string] Value of action to toggle: 'enable', 'activate', etc.
	// * lever		- [bool] Value whether to toggle on `true` else `false`.
	toggle( action, lever ) {
		// Determine action being taken.
		switch ( action ) {
			case 'enable': // enable/disable
				if ( lever ) this.enable();		// enable
				else this.disable();			// disable
				break;
		}
	}

	//--------------------------------
	// Enable Display
	//--------------------------------
	// RETURNS: [bool] true if set, else false.
	enable() {
		// Do not double enable.
		const enabled	= this.skim( 'enabled' );
		if ( enabled===true ) return false; // no need to eanble
		// Enable.
		this.jot( 'enabled', true ); // enable
		this.panel.removeClass( 'disabled' );
		return true; // enabled
	}

	//--------------------------------
	// Disable Display
	//--------------------------------
	// RETURNS: [bool] true if set, else false.
	disable() {
		// Do not double enable.
		const enabled	= this.skim( 'enabled' );
		if ( enabled===false ) return false; // no need to disable
		// Disable.
		this.jot( 'enabled', false ); // disable
		this.panel.addClass( 'disabled' );
		return true; // disabled
	}

	//-------------------------
	// Render Canvas
	//-------------------------
	// Draw canvas content to named canvas.
	// * name		– [string] name of canvas to render into.
	// * source		– [ElementCanvas] canvas to draw.
	render( name, source ) {
		const canvas = this.getCanvas( name );
		if ( canvas ) canvas.draw( source, true, true );
	}
}
