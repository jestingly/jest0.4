//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/ui/JestSpline.js loaded' );

//-----------------------------
// JestSpline Class
//-----------------------------
// Master controller for switching and managing visible screens.
class JestSpline extends JestElement {
	// Object properties
	screens		= {};			// [object] Map of name → screen instance.
	stack		= [];			// [array] Stack of active screen names.
	active		= null;			// [string|null] Name of the current top screen.

	//--------------------------------
	// Constructor
	//--------------------------------
	// Setup screen manager component.
	// * client - [object] Main app reference
	constructor( client ) {
		super( client );		// call parent constructor
	}

	//---------------------------------
	// Initialization
	//---------------------------------
	// Build the element [object].
	// RETURNS: [void].
	// * name		- unique [string] value of component name in the system.
	// * classes	- [array] of classes to add to panel element.
	build( name='spline', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		super.build( 'div', name, ['jest-spline'].mergeUnique(classes) );
	}

	//--------------------------------
	// Register a Screen
	//--------------------------------
	// Store a screen in the registry.
	// * name		- [string] screen name.
	// * screen		- [object] instance of a screen.
	// * timeToLive	- [int|null] Value of time to live (or [null] for no-expire)
	registerScreen( name, screen, timeToLive=null ) {
		// Determine if screen already exists.
		if ( !name || !screen ) return false;
		this.screens[name] = screen; // keep ref
		return true; // success
	}

	// Get a screen from the registry.
	// * name		- [string] screen name.
	getScreen( name ) {
		// Determine if screen already exists.
		if ( !name || !this.screens?.[name] ) return null;
		return this.screens[name]; // return ref
	}

	//--------------------------------
	// Switch to a Screen
	//--------------------------------
	// Cleanly transition from current to target screen.
	// * name - [string] target screen name
	goToScreen( name ) {
		// Determine if screen exists or already active.
		if ( this.active===name || !this.screens[name] ) return false;

		// Exit current screen
		if ( this.active ) {
			const cur = this.screens[this.active];
			if ( cur.exit ) cur.exit(); // call exit method
			cur.disable?.(); // hide screen
		}

		// Set new active screen
		this.active	= name;
		const next	= this.screens[name];

		// Append or make visible
		if ( next.panel && !next.panel.parentNode )
			this.panel.addPanel( name, next.panel );
		next.enable?.(); // show screen
		if ( next.enter ) next.enter(); // lifecycle
		return true; // success
	}

	//--------------------------------
	// Overlay / Stack Screen
	//--------------------------------
	// Temporarily push a screen over the active one.
	// * name - [string] overlay screen
	pushScreen( name ) {
		// Determine if screen exists.
		if ( !this.screens[name] ) return false;
		if ( this.active ) this.stack.push( this.active );
		this.goToScreen( name );
		return true; // success
	}

	//--------------------------------
	// Return from Overlay
	//--------------------------------
	// Return to the last screen beneath the overlay.
	popScreen() {
		const last = this.stack.pop();
		if ( last ) this.goToScreen( last );
	}

	//--------------------------------
	// Garbage Collection
	//--------------------------------
	// Remove screen panels that are no longer in use.
	// Screens must be marked with .gc=true or .ttl>0 to be cleaned.
	// RETURNS: [int] count of removed screens.
	cleanupUnusedScreens() {
		// Begin counting how many have been removed.
		let removed = 0;
		for ( const [name, screen] of Object.entries(this.screens) ) {
			// Skip if active or on stack
			if ( name===this.active || this.stack.includes(name) )
				continue;

			// Skip if no GC hint
			if ( !screen.gc && !screen.ttl )
				continue;

			// Remove DOM panel if attached
			if ( screen.panel && screen.panel.parentNode ) {
				screen.panel.removePanel( name );
				removed++;
			}

			// Optional: remove from memory entirely
			if ( screen.gc )
				delete this.screens[name];
			else if ( screen.ttl ) {
				screen.ttl--;
				if ( screen.ttl<=0 ) delete this.screens[name];
			}
		}
		// Return remove count.
		return removed; // return [int] count
	}
}
