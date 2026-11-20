//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/play/JestGuest.js loaded' );

//-------------------------
// JestGuest Class
//-------------------------
// Represents an external guest object with animations for different parts (head, sword, body).
class JestGuest extends JestPlayer {
	//---------------------------------
	// Initialization
	//---------------------------------
	// Initializes the Guest.
	// RETURNS: [void].
	// * client		- client [object] that this piece belongs to.
	constructor( client ) {
		// Call parent constructor
		super( client, 'guest' );	// construct the parent
		// Setup recognizable gears
		this.gears		= { 'sword':{}, 'walk':{}, 'idle':{} };
	}

	//-------------------------
	// Memory Management
	//-------------------------
	// Destruct the [object]
	// RETURNS: [void].
	teardown() {
		super.teardown(); // call parent destructor
	}

	//---------------------------------
	// Setup Method(s)
	//---------------------------------
	// Setup the guest [object].
	// RETURNS: [boolean] `true` on success else `false` on fail.
	async setup() {
		// Call parent setup method(s)
		await super.setup();		// call parent setup method
		//---------------------------------
		// Graphical Setup
		//---------------------------------
		await this.setupAvatar();
		//---------------------------------
		// Setup Listener(s)
		//---------------------------------
		// Set other event(s)
		this.register( 'gearshift', 'avatar', (e)=>this.changeJani(e) ); // change avatar animation
		//---------------------------------
		// Start Worldling [object]
		//---------------------------------
		super.start();		// start the worldling [object]
		//---------------------------------
		// Set Guest Mode
		//---------------------------------
		this.jot( false, 'mode', 'idle' );
		//this.emit( 'gearshift',null,true );
		this.status	= 2; // ready
		return true; // success
	}

	//---------------------------------
	// Visual Rendering
	//---------------------------------
	// Set the guest's avatar JAnimation.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * name	- [string] value of loaded JAni to use for the human display.
	setJani( name ) {
		super.setJani( name );
	}

	//---------------------------------
	// Central Loop
	//---------------------------------
	// Central guest timeout loop.
	// RETURNS: [void].
	// * e	- [object] of central pulse tick event data.
	pulse( e ) {
		// Call parent worldling pulse method.
		super.pulse( e );
		// Perform core central actions
		this.update(); // run central update
	}

	// Handle guest input.
	// RETURNS: [void].
	update() {
		//---------------------------------
		// Determine Active Keycode(s)
		//---------------------------------
		// Generate [object] of modes guest is actively trying to shift into (by keypress)
		// Get current time
		const now			= performance.now();
		//---------------------------------
		// Check For Guest Gear Change
		//---------------------------------
		// Determine current guest mode & make move(s)
		const currentMode	= this.skim( 'mode' );
		//const gearshifts	= this.gears[currentMode].gearshifts; // get current guest gear
		// Run fallback if no gearshift occurred
		//if ( !enacted )
		this.operate( false, currentMode );
	}
}
