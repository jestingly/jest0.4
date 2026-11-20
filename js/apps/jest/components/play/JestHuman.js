//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/play/JestHuman.js loaded' );

//-------------------------
// JestHuman Class
//-------------------------
// Represents a human character [object] with animations for different parts (head, sword, body).
class JestHuman extends JestWorldling {
	//---------------------------------
	// Human Properties
	//---------------------------------
	type			= null;				// [string] Value of [object] taxonomic type (e.g. "human").
	//---------------------------------
	// Core [objects] & Input/Output
	//---------------------------------
	// Movement propert(ies)
	collider		= null;				// [object] Anchor used to test for collision movement (x,y) location(s).
	// Animation / graphical avatar propert(ies)
	head			= null;				// [object] Sprite for the human's head (spritesheet-based).
	body			= null;				// [object] Sprite for the human's body (spritesheet-based).
	sword			= null;				// [object] Animation for the human's sword (spritesheet-based).
	//---------------------------------
	// Motion Variable(s)
	//---------------------------------
	gears			= null;				// [object] of actual possible gears that the user can be in.
	// Directions: 0=up, 1=left, 2=down, 3=right
	dir				= 2;				// [int] Current facing direction
	speed			= 0.5;				// [number] Movement speed of the user.
	freeze			= 0;				// [int] value of time to freeze the user.
	/*forceX			= 0;				// [number] How much to move user on X plane.
	forceY			= 0;				// [number] How much to move user on Y plane.*/
	dirgo			= null;				// [array] of movement directions determined by -1, 0, and 1
	// Sound propert(ies)
	soundStep		= 0;				// [number] Value of current sound step: 0 through n

	//---------------------------------
	// Initialization
	//---------------------------------
	// Initializes the Human.
	// RETURNS: [void].
	// * client		- client [object] that this piece belongs to.
	// * type		- [string] Taxonomic type of [object] (e.g. "human").
	constructor( client, type="human" ) {
		// Call parent constructor
		super( client, false, type ); // construct the parent
		this.type		= type;	// set human taxonomic type
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
		// Remove all view(s) from animation(s)
		for ( const mode in this.gears ) {
			let view	= this.gears.view;
			let ani		= view.animation;
			ani.removeView( view.name );	// remove view from animation
			delete this.gears.view;			// remove view from gears
			delete this.view;				// remove view
		}
	}

	//---------------------------------
	// Setup Method(s)
	//---------------------------------
	// Setup the human [object].
	// RETURNS: [boolean] `true` on success else `false` on fail.
	async setup() {
		// Call parent setup method(s)
		await super.setup();		// call parent setup method
		//---------------------------------
		// Setup Human Definitions
		//---------------------------------
		this.anchor.graticulate( this.client.config.tileGrid );		// human level anchor is in tile-based units
		this.anchor.resize( 1, 1 );									// human body is 1x1 tiles width/height
		return true; // successfully setup
	}

	// Setup a collision detection anchor [object].
	// RETURNS: [void].
	setupCollider() {
		//---------------------------------
		// Create Collision Detection [object]
		//---------------------------------
		// Create collision anchor [object] for user on-wall detection
		const collider	= new Anchor();									// create collider point
		this.collider	= collider;										// store anchor as property
		this.collider.graticulate( this.client.config.tileGrid );		// collision anchor is in level tile-based units
		this.collider.resize( this.anchor.width, this.anchor.height );	// user body is 2x2 tiles width/height
		collider.move( -collider.width/2, collider.height/2 );			// move collider point to a default position
		this.collider.setParent( this.anchor );
	}

	// Setup the human avatar animation [object].
	// RETURNS: [boolean] `true` on success else `false` on fail.
	async setupAvatar() {
		//---------------------------------
		// Set Default Gear View(s)
		// & Prep to Download JANI(s)
		//---------------------------------
		// Load the *.jani file(s)
		const files		= []; // create list of files to load
		for ( const mode in this.gears ) {
			// By default, the loaded animation view is [null].
			this.gears[mode].view	= null;
			const name	= `${mode}.jani`;
			files.push( name ); // push to download JANI by name
		}
		//---------------------------------
		// Load Default JestJani [object(s)]
		//---------------------------------
		// Load jani(s) using fantascope.
		const janis		= await this.client.fantascope.loadFiles( files, 'remote' );
		// Iterate all jani(s) & set parent as human anchor point.
		for ( const mode in this.gears ) {
			// Access loaded JANI.
			const name	= `${mode}.jani`; // generate jani filename [string]
			const jani	= this.client.fantascope.getFile( name );; // [JestJani] instance
			// Add jani to animator loop.
			if ( jani ) {
				// Get AnimationAnimation [object].
				const ani	= jani.getAnimation(); // get jani animation [object]
				if ( ani ) {
					// Add JestJani AnimationAnimation [object] to animator.
					//this.client.animator.add( ani );
					// Create a jani view for human
					const view	= jani.addView( `${this.type}${this.skey}` );
					// Store animation inside of gear [object] for quick-ref
					if ( view ) {
						this.gears[mode].view	= view;	// store ref in gears
						view.setParent( this.focus );	// lock animation to focal point coordinates
					}
					// Throw error if JANI didn't load.
					else console.warn( `Human JANI view failed to create: ${name}.` );
				}
				// Throw error if JANI view didn't load.
				else console.warn( `Human JANI animation failed to render: ${name}.` );
			}
			// Throw error if JANI didn't load.
			else console.warn( `Human JANI failed to load: ${name}.` );
		}
		//---------------------------------
		// Set Visual(s)
		//---------------------------------
		// Set the current JAni
		this.view	= this.gears.idle.view; // set default avatar JANI view
		// Set all default image(s).
		//this.skin( 'SPRITES', null );
		this.skin( 'head', null );
		this.skin( 'body', null );
		this.skin( 'sword', null );
		// Set human sprites
		this.skin( 'sprites', 'sprites/sprites1.png' );
		/*this.skin( 'head', 'heads/Head_00.png' );
		this.skin( 'body', 'bodies/Body_00.png' );
		this.skin( 'hair', 'hairstyles/Hairstyle_03.png' );*/
		this.skin( 'head', 'heads/head22.png' );
		this.skin( 'body', 'bodies/body_black.png' );
		this.skin( 'sword', 'swords/sword1.png' );
		//console.log( this.view.attributes );
		return true; // succees
	}

	//---------------------------------
	// Avatar Handling
	//---------------------------------
	// Change the character's avatar JAnimation.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * name	- [string] value of loaded JAni to use for the human display.
	changeJani( name ) {
		// Set the user's new JAnimation.
		this.setJani( name );
	}

	// Set the human's avatar JAnimation.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * name	- [string] value of loaded JAni to use for the human display.
	setJani( name ) {
		//---------------------------------
		// Remove Current Avatar
		//---------------------------------
		// Turn off existing avatar
		this.view.reset();						// Reset the current JAni
		//---------------------------------
		// Setup New Avatar
		//---------------------------------
		// Equip new avatar
		const view		= this.gears[name].view;
		// Configure new JAni to match pertinent current human stats
		view.reset().enable().play();			// Reset, enable, then play the new JAni
		//---------------------------------
		// Change Human Avatar
		//---------------------------------
		this.view		= view;					// Change human avatar to new JAni
		this.setDirection( false, this.dir );	// Synch player's direction to view
		//console.log( avatar );
		return true; // success
	}

	//---------------------------------
	// Graphic Skin Handling
	//---------------------------------
	// Set the human's image for a given type ('head', 'body', 'sword')
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * attr	- [string] The attribute of skin to change ('head', 'body', 'sword').
	// * path	- [string] The filename of the image asset (e.g. 'heads/head104.png').
	skin( attr, path ) {
		//---------------------------------
		// Validate Arguments
		//---------------------------------
		// Get allowable skin type
		const attrs		= [ 'sprites', 'head', 'body', 'hair', 'sword' ];
		if ( !attrs.includes(attr) ) {
			console.warn( `Human skin(), invalid type: ${attr}` );
			return false;
		}
		// Set the filename as the current image
		this[attr]	= path; // example: this.head = 'head104'
		// Update all human animation image attributes
		for ( const mode in this.gears ) {
			// Require JANI to be loaded.
			const jani	= this.client.fantascope.getFile( `${mode}.jani` );
			if ( !jani ) continue; // jani not found
			// Set new image for JANI view skin.
			const viewName	= `${this.type}${this.skey}`;
			jani.setGroupImage( viewName, attr.toUpperCase(), path );
		}
		return true; // success
	}

	//-------------------------
	// Mode Setter
	//-------------------------
	// Set a dynamic var state (override OSConfigurable parent method).
	// RETURNS: [bool] `true` on success, else `false`.
	// * remote		- [bool] whether action is from server or clientside.
	// * key		- [string] key name of var to set.
	// * val		- [string] value of var.
	jot( remote, key, val ) {
		// If setting mode, handle differently
		if ( key==='mode' && val!==this.skim('mode') ) { // determine if status is changing
			if ( super.jot('mode',val) ) { // try to change mode
				//-------------------------
				// Trigger Mode Change Event
				//-------------------------
				//console.log( `Changing human mode: ${val}` );
				this.emit( 'gearshift', null, val ); // emit mode change event
				//-------------------------
				// Update User Online
				//-------------------------
				// Send updated change to server if clientside.
				if ( !remote )
					this.sync( "mode", { mode: val } );
				return true; // mode changed
			}
			else return false; // mode unchanged
		}
		// Set some other vars besides 'status'
		return super.jot( key, val ); // delegate to parent
	}

	//-------------------------
	// Modal Methods
	//-------------------------
	// Try to operate the human mode based upon key priority
	// * remote		- [bool] whether action is from server or clientside.
	// * mode		- [string] Value of the mode the human is in.
	//   data		- [...] data pertinent to action.
	operate( remote, mode, data=null ) {
		// Alert human mode change if need-be
		if ( this.skim('mode')!==mode )
			this.gearshift( remote, mode ); // call gearshift
		// Perform action based upon mode
		switch ( mode ) {
			case 'idle':	return true;						// do nothing
			case 'walk':	return this.walk( remote, data );	// walk
			case 'sword':	return this.slash( remote );		// Slash sword
			default:		return true;
		}
		return false; // mode not recognized
	}

	// Try to gearshift the human mode based upon key priority
	// * remote	- [bool] whether action is from server or clientside.
	// * mode	- [string] Value of the mode name the human is changing to.
	gearshift( remote, mode ) {
		// Set new mode
		this.jot( remote, 'mode', mode ); // change human mode
		// Perform action based upon new mode
		switch ( mode ) {
			case 'sword': // play sword sound effect
				this.client.soundboard.playSound( 'sword', 'wav', 1 );
				break;
		}
	}

	// Freeze the human for a certain amount of time.
	// * time		- [int] Value of how long to freeze the human in ms.
	/*freeze( time ) { }*/

	//-------------------------
	// Human Actions
	//-------------------------
	// Move the human in a given direction (walking).
	// * remote	- [bool] whether action is from server or clientside.
	// * dirs		- [int|array] Value(s) of direction(s) to move (0=up, 1=left, 2=down, 3=right).
	walk( remote, dirs ) { }

	// Move the human in a given direction (walking).
	// * remote	- [bool] whether action is from server or clientside.
	// * dirs		- [int|array] Value(s) of direction(s) to move (0=up, 1=left, 2=down, 3=right).
	slash( remote ) { }

	//-------------------------
	// Movement Action(s)
	//-------------------------
	// Refocus the user focal point (animation anchor).
	refocus() {
		return super.refocus();
		/*// Get user anchor definitions
		const { userGlobalX, userGlobalY } = this.client.camera.getUserLocation();
		const destX		= userGlobalX;// - this.anchor.width/2;
		const destY		= userGlobalY;// - this.anchor.height/2;
		// Convert to screen coordinates
		const screenPos	= this.client.camera.globalToScreen( destX, destY );
		this.focus.move( screenPos.x, screenPos.y ); // move x & y*/
	}

	// Change human direction
	// * remote	- [bool] whether action is from server or clientside.
	// * dir	- [int] value of direction to move: 0=up, 1=right, 2=down, 3=left
	setDirection( remote, dir ) {
		this.dir = dir; // change direction
		this.view.setLayerIndex( dir ); // update avatar / human visual
		//-------------------------
		// Update User Online
		//-------------------------
		// Send updated change to server if clientside.
		if ( !remote )
			this.sync( "dir", { dir: dir } );
	}

	// Move the actual human X & y some amount.
	// * remote	- [bool] whether action is from server or clientside.
	// * newX	- [int] Human's new x.
	// * newY	- [int] Human's new y.
	move( remote, newX, newY ) {
		// Move human anchor to new (x,y)
		this.anchor.move( newX, newY );
		//-------------------------
		// Update User Online
		//-------------------------
		// Send updated change to server if clientside.
		if ( !remote ) {
			//if ( !this.client.online.websocket.connected ) return;
			this.sync( "move", { x: this.anchor.x, y: this.anchor.y } );
		}
	}

	//-------------------------
	// Movement Action(s)
	//-------------------------
	// Synchronize human with server
	// RETURNS: [void].
	// * action	- [string] value of update action (e.g. "move", etc.).
	// * data	- [object] of data to update on server.
	sync( action, data ) {
		// Send data to websocket server
		this.client.online.selfSendUpdate(
			{ ...data, type: "userUpdate", action: action }
			);
	}
}
