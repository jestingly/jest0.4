//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/play/JestUser.js loaded' );

//-------------------------
// JestUser Class
//-------------------------
// Represents a user object with animations for different parts (head, sword, body).
class JestUser extends JestPlayer {
	// --------------------------------
	// Core [objects] & Input/Output
	// --------------------------------
	// Track keys
	keysListen		= [];				// [array] of registered keyboard inputs the user can input
	keys			= {};				// [object] of actual keyboard keys being pressed

	// --------------------------------
	// Initialization
	// --------------------------------
	// Initializes the User.
	// RETURNS: [void].
	// * client		- client [object] that this piece belongs to.
	constructor( client ) {
		// Call parent constructor
		super( client, 'user' );	// construct the parent
		// Setup recognizable gears
		this.gears		=
			{
				idle:
					{
						// Gears this gear can shift into (ordered by priority):
						gearshifts:		[ 'sword', 'walk', 'idle' ],
						keycode:		null,
						turbo:			0,			// timeout countdown, not countdown if 0
						signaled:		null
					},
				sword:
					{
						// Gears this gear can shift into (ordered by priority):
						gearshifts:		[ 'sword', 'walk', 'idle' ],
						keycode:		's',
						turbo:			1000/60*4*5,
						shiftback:		'idle',
						signaled:		null
					},
				walk:
					{
						// Gears this gear can shift into (ordered by priority):
						gearshifts:		[ 'sword', 'walk', 'idle' ],
						keycode:		'arrows',
						turbo:			0,			// timeout countdown, not countdown if 0
						signaled:		null
					},
			};
		// Setup recognizable keys
		this.keysListen	=
			new Map([
				// Arrow keys
				[ 'ArrowUp', 'up' ],
				[ 'ArrowRight', 'right' ],
				[ 'ArrowDown', 'down' ],
				[ 'ArrowLeft', 'left' ],
				// Control keys
				[ 's', 's' ],
			]);
		// Setup movement preference(s)
		this.dirgo		=
			[
				 0, -1,		// up
				-1,  0,		// left
				 0,  1,		// down
				 1,  0,		// right
				 0,  0		// idle
			];
	}

	//-------------------------
	// Memory Management
	//-------------------------
	// Destruct the [object]
	// RETURNS: [void].
	teardown() {
		super.teardown(); // call parent destructor
	}

	// --------------------------------
	// Setup Method(s)
	// --------------------------------
	// Setup the user [object].
	// RETURNS: [boolean] `true` on success else `false` on fail.
	async setup() {
		// Call parent setup method(s)
		await super.setup();		// call parent setup method

		// --------------------------------
		// Boundaries Checking
		// --------------------------------
		// Setup onwall collider.
		this.setupCollider();

		// --------------------------------
		// Graphical Setup
		// --------------------------------
		// Setup the user avatar.
		await this.setupAvatar();
			/*.catch(
				( err ) => {
					console.warn( `User avatar failed to setup: ${err}` );
				});*/

		// --------------------------------
		// Setup Listener(s)
		// --------------------------------
		// Set other event(s)
		this.register( 'gearshift', 'avatar', (e)=>this.changeJani(e) ); // change avatar animation
		// Setup key event listener(s)
		this.client.io.register( 'keyPress', 'userKeyListener', this.keyPress.bind(this) );
		this.client.io.register( 'keyRelease', 'userKeyListener', this.keyRelease.bind(this) );

		// --------------------------------
		// Start Worldling [object]
		// --------------------------------
		super.start();		// start the worldling [object]

		// --------------------------------
		// Set User Mode
		// --------------------------------
		this.jot( false, 'mode', 'idle' );
		this.status	= 2; // ready
		return true; // success
	}

	// --------------------------------
	// Key Listener(s) & Handling
	// --------------------------------
	// Register key presses.
	// * data	- [object] Data passed from keyboard listener event.
	keyPress( data ) {
		// Handle key event
		const now	= performance.now();					// current time
		const key	= this.keysListen.get( data.key );		// keyboard key being pressed
		if (!key) return; // Ignore keys not in keysListen
		//console.log( key );
		// Set key state to true
		if ( !(key in this.keys) )
			this.keys[key] = true;	// set key pressed as active
		//console.log( `Key pressed: ${data.key} (Mapped: ${key})`, this.keys );
	}

	// Handle key releases.
	// * data - [object] Data passed from keyboard listener event.
	keyRelease( data ) {
		// Remove the key from the active keys [array]
		const key	= this.keysListen.get( data.key );		// Keyboard key being released
		if ( !key ) return;
		// Remove key on release
		if ( this.keys.hasOwnProperty(key) )
			delete this.keys[key];	// set key pressed as inactive
		//console.log( `Key released: ${data.key} (Mapped: ${key})`, this.keys );
	}

	// --------------------------------
	// Central Loop
	// --------------------------------
	// Central user timeout loop.
	// * e	- [object] of central pulse event data.
	// RETURNS: [void].
	pulse( e ) {
		// Call parent worldling pulse method.
		if ( super.pulse(e) ) {
			// Perform core central actions
			this.input(); // check user input
		}
	}

	// Handle user input.
	// RETURNS: [void].
	input() {
		// --------------------------------
		// Determine Active Keycode(s)
		// --------------------------------
		// Generate [object] of modes user is actively trying to shift into (by keypress)
		// Get current time
		const now			= performance.now();
		let keycodes		= {};
		for ( const mode in this.gears ) {
			let keycode		= this.keycode( this.gears[mode].keycode );
			if ( keycode!==false ) {
				if ( !this.gears[mode].turboBlocked ) {			// 🚨 Only allow non-blocked modes
					keycodes[mode] = keycode;
					if ( this.gears[mode].signaled===null )		// 🚨 Only update if first press
						this.gears[mode].signaled = now;
				}
			}
			else {
				this.gears[mode].turboBlocked	= false;		// 🚨 Reset block when key is released
				this.gears[mode].signaled		= null;			// 🚨 Reset signaled on release
			}
		}
		// --------------------------------
		// Check For User Gear Change
		// --------------------------------
		// Determine current user mode & make move(s)
		const currentMode	= this.skim( 'mode' );
		const gearshifts	= this.gears[ currentMode ].gearshifts; // get current user gear
		let enacted			= false;
		for ( const mode of gearshifts ) {
			if ( mode in keycodes ) {
				// Determine turbo time remaining (or null for infinite)
				let turbo	= (this.gears?.[mode]?.turbo ?? 0)>0 && this.gears?.[mode]?.signaled>0
					? this.gears?.[mode]?.signaled + this.gears[mode].turbo
					: null;
				//console.log( now, turbo );
				// If turbo is active, run gear
				if ( turbo===null || now<turbo ) {
					this.operate( false, mode, keycodes[mode] );
					enacted = true;
				}
				else if ( now>=turbo && !this.gears[mode].turboBlocked ) {
					//console.log( `Turbo expired for ${mode}, locking out` );
					this.gears[mode].turboBlocked = true; // 🚨 Lock this mode from re-triggering
					if ( this.gears[mode].shiftback ) {
						//console.log( `Shifting back to ${this.gears[mode].shiftback}` );
						this.operate( false, this.gears[mode].shiftback ); // 🚨 Shift back mode
					}
				}
				break;
			}
		}
		// Run fallback if no gearshift occurred
		if ( !enacted )
			this.operate( false, 'idle' );
	}

	// Check for available requested key code(s).
	// RETURNS: [...] value on success, else [bool] `false` on fail.
	// * codes	- [string|stray] Value of code(s) to check for (ie. 'arrow')
	keycode( codes ) {
		// If codes is null, return true
		if ( codes===null ) return false;
		// If directions is an int, convert it to an array
		if ( jsos.prove(codes,'string') )
			codes	= [codes];
		// If it's neither a string nor an array of strings, throw an error
		codes	= jsos.typecast( codes, 'stray' );
		if ( !codes.length>0 )
			throw new Error( 'Invalid input: arg `codes` must be a [string] or an [array] of [strings].' );
		// Begin parsing which keycode(s) are available
		let keycodes	= []; // return [array] of pertinent pressed keys
		// Iterate requested codes & determine active key code(s) available
		for ( const code of codes ) {
			switch ( code ) {
				case 's':
					return this.keys.hasOwnProperty(code) && this.keys[code]===true; // determine if pressed
				case 'arrows':
					// Determine move keys
					const dirKeys	= [ 'up', 'left', 'down', 'right' ]; // valid dir keys
					// Loop through the keys array from the end to the beginning
					for ( let i=0; i<dirKeys.length; i++ ) {
						// Determine direction code name
						let dir		= dirKeys[i];
						// Check if the key is a direction key
						if ( this.keys?.[dir] ) {
							keycodes.push( i );
						}
					}
					// Check if keys pressed
					return keycodes.length>0 ? keycodes : false;
				default: return false; // fail
			}
		}
		return false; // no keycode
	}

	// Freeze the user for a certain amount of time.
	// * time		- [int] Value of how long to freeze the user in ms.
	/*freeze( time ) {
		// If directions is an int, convert it to an array
		if ( !jsos.prove(time,'int') || time<=0 ) return false;
		// Get current time
		const now	= performance.now();
		// Set the frozen time as now + time
		//this._clock( 'freeze', now+time );
	}*/

	//-------------------------
	// User Actions
	//-------------------------
	// Move the user in a given direction (walking).
	// RETURNS: [bool] `true` on success, else `false` on fail.
	// * remote	- [bool] whether action is from server or clientside.
	// * dirs	- [int|array] Value(s) of direction(s) to move (0=up, 1=left, 2=down, 3=right).
	walk( remote, dirs ) {
		// If directions is an int, convert it to an array
		if ( jsos.prove(dirs,'int') )
			dirs	= [dirs];

		// If it's neither an int nor an array of ints, throw an error
		dirs	= jsos.typecast( dirs, 'intray' );
		if ( !dirs.length>0 )
			throw new Error( 'Invalid input: arg `dirs` must be an [int] or an [array] of [ints].' );

		// Footsteps make a sound every #nth iteration
		const soundStep		= this.soundStep;
		const soundDelay	= 10; // even [int] every # interations plays a full SFX footstep cycle
		if ( this.soundStep==0 || this.soundStep==soundDelay/2 ) {
			const step	= this.soundStep===0 ? 'steps' : 'steps2';
			this.client.soundboard.playSound( step, 'wav', 1.6 );
		}
		this.soundStep = (this.soundStep+1) % soundDelay;

		// Iterate requested directions & move
		for ( const dir of dirs ) {
			// Move user in requested direction
			switch ( dir ) {
				case 0: // up
					//console.log( 'Moving up' );
					// Add logic to move the user up
					this.setDirection( false, 0 );
					this.move( false, 0, -this.speed );
					break;
				case 1: // left
					//console.log( 'Moving left' );
					// Add logic to move the user left
					this.setDirection( false, 1 );
					this.move( false, -this.speed, 0 );
					break;
				case 2: // down
					//console.log( 'Moving down' );
					// Add logic to move the user down
					this.setDirection( false, 2 );
					this.move( false, 0, this.speed );
					break;
				case 3: // right
					//console.log( 'Moving right' );
					// Add logic to move the user right
					this.setDirection( false, 3 );
					this.move( false, this.speed, 0 );
					break;
				default:
					console.log( 'Invalid direction' );
			}
		}
	}

	// Move the user in a given direction (walking).
	// * remote	- [bool] whether action is from server or clientside.
	// * dirs		- [int|array] Value(s) of direction(s) to move (0=up, 1=left, 2=down, 3=right).
	slash( remote ) {
		// Get current time
		//const now	= performance.now();
		// Check if slash motion is complete
		/*if ( now>=(this._clocks.sword+this.gears.sword.turbo) ) {
			 console.log( 'changing' );
		}
		else {
			//console.log( now, this._clocks.sword, this.gears.sword.turbo );
			//console.log( 'slashing' );
		}*/
		//return true; // continue
	}

	//-------------------------
	// Movement Action(s)
	//-------------------------
	// Move the actual user X & y some amount.
	// RETURNS: [void].
	// * remote	- [bool] whether action is from server or clientside.
	// * dx		- [float] Value of how much to move the user's x.
	// * dy		- [float] Value of how much to move the user's y.
	move( remote, dx, dy ) {
		// --------------------------------
		// Interrupt For Remote Change
		// --------------------------------
		// If serverside change, automove player
		if ( remote )
			return super.move( true, dx, dy );	// delegate movement to parent

		// --------------------------------
		// Continue For Local Change
		// --------------------------------
		// Declare variable(s)
		let testX, testY;
		const tileGrid	= this.client.config.tileGrid;
		const speed		= this.speed * tileGrid;
		let forceX		= dx * tileGrid;
		let forceY		= dy * tileGrid;

		// Begin testing
		let testing		= forceX!==0 || forceY!==0;
		while ( testing ) {
			// Setup the testing variables.
			testing	= false;
			testX	= forceX;
			testY	= forceY;

			//------------------------------------------
			// Setup directional testing context
			//------------------------------------------
			let isVertical		= this.dir===0 || this.dir===2;	// up/down = vertical movement
			let forcePrimary	= isVertical ? forceY : forceX;	// main axis for movement logic
			// index into dirgo[] (movement vector table)
			let dirIndex		= this.dir * 2 + (isVertical ? 1 : 0);
			let dirModifier		= this.dirgo[dirIndex]; // modifier = 1, -1, or 0 depending on direction

			//----------------------------------------
			// Phase 1: Large movement check
			//----------------------------------------
			// Check for movement
			if ( Math.abs(forcePrimary)>=2 ) {
				// Check for wall
				if ( this.onwall( this.collider, testX/tileGrid, testY/tileGrid ) ) {
					testing = true;
					if ( isVertical )
						forceY	-= dirModifier / 2;
					else forceX	-= dirModifier / 2;
				}
			}
			else {
				let moveOffset		= 0;
				let blockDetected	= [ false, false, false, false ];
				for ( let i=0; i<4; i++ ) {
					// Handle X & Y movement test
					testX	= isVertical
						? ( i%2===0 ? (tileGrid*3)/2 - moveOffset : -( (tileGrid*3)/2 - moveOffset) )
						: ( i<2 ? 0 : (tileGrid / 2) * dirModifier );
					testY	= isVertical
						? ( i<2 ? 0 : (tileGrid/2) * dirModifier )
						: ( i%2===0 ? tileGrid - moveOffset : -(tileGrid - moveOffset) );

					// Check for wall
					if ( this.onwall( this.collider, testX/tileGrid, testY/tileGrid ) ) {
						if ( moveOffset<tileGrid/2 ) {
							moveOffset += 2;
							i--;
							continue;
						}
						blockDetected[i] = true;
					}
				}
				// Check if no blocks detected
				if ( !blockDetected[0] && !blockDetected[2] ) {
					if ( isVertical ) forceX += speed;
					else forceY += speed;
				}
				// Handle walls detected
				else if ( !blockDetected[1] && !blockDetected[3] ) {
					if ( isVertical ) forceX -= speed;
					else forceY -= speed;
				}
				// Check for wall again & stop movement if so
				if ( this.onwall(this.collider, testX/tileGrid, testY/tileGrid) ) {
					if ( isVertical ) forceY = 0;
					else forceX = 0;
				}
			}
		}

		// Capture current user x & y coordinates
		const userX = this.anchor.x;
		const userY = this.anchor.y;

		// Calculate new x & y
		const newX  = userX + forceX/tileGrid; //dx;
		const newY  = userY + forceY/tileGrid; //dy;

		// Move the user anchor.
		const move  = this.client.camera.checkUserPosition( newX, newY );
		this.level  = move.level; // set level [string] name
		super.move( false, move.x, move.y ); // delegate movement to parent
	}
}
