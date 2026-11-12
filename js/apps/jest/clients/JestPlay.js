//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/clients/JestPlay.js loaded' );

//-------------------------
// Jest Application
//-------------------------
JestAppsRegistry.AppJestPlay =
	class JestPlay extends Jest {
		// Declare properties
		icon			= 'images/icons/jest_hat.png';	// application icon image URL [string] value
		name			= 'JEST®';			// name of application
		version			= '0.3beta';		// application version
		id				= 'tiler';			// tiler application id.
		// Game [objects]
		camera			= null;				// [object] JestCamera for viewport clipping the world.
		user			= null;				// [object] JestUser ie. user avatar & interaction device.
		// Editor area
		editor			= null;				// [object] Panel container for editing arena (board & sidebar).
		board			= null;				// [JestElement] Board for editing the file.
		sidebar			= null;				// [JestSidebar] Sidebar menu for actions & palette.

		// --------------------------------
		// Constructor
		// --------------------------------
		// Construct the [object].
		// * options	- [object] Configuration options for the application.
		constructor() {
			// Call the parent application constructor
			super();
		}

		// --------------------------------
		// Initialization
		// --------------------------------
		// Setup the application.
		// RETURNS: [boolean] `true` on success else `false` on fail.
		async setup() {
			await super.setup(); // call parent setup method
			return true;
		}

		// Build the gameboard, user, components, etc.
		// RETURNS: [boolean] `true` on success else `false` on fail.
		async build() {
			// --------------------------------
			// Call Super
			// --------------------------------
			//await super.build();
			try { await super.build(); }
			catch ( err ) {
				console.error( `Build failed in parent super.build() method: ${err}` );
				throw err;
			}

			// --------------------------------
			// Set & Get Quick-Refs
			// --------------------------------
			// Get loading-screen loadbar.
			const loadbar	= this.spline.getScreen('loading').loadbar;
			// Update progress bar to show a tool has loaded.
			loadbar.update( 1, 3 ); // step 1 (initialization)

			// --------------------------------
			// Create Application Interface [object]
			// --------------------------------
			// Build the panels for the main application screen.
			this.panel.addElements([
				// Build the panel
				{
					name:		'interface',
					id:			'jest-creator-interface',
					classes:	[ 'jest-creator-interface' ]
				}]);
			this.panel.refs.interface.addElements([
				// Build the panel
				{
					name:		'center',
					id:			'jest-creator-interface-center',
					classes:	[ 'jest-creator-interface-center' ]
				}]);
			loadbar.update();

			// --------------------------------
			// Define Propert(ies)
			// --------------------------------
			const self		= this;

			// --------------------------------
			// Load Default Game Image(s)
			// --------------------------------
			// Load available skins
			/*const imageFiles	= [];
			for ( let i=0; i<=31; i++ ) {
				imageFiles.push( { category: 'HEAD', stem: 'head'+i, extension: 'GIF' } );
			}
			await this.gallery.loadImages(
				imageFiles.concat([
					{ category: 'HEAD', stem: 'head19', extension: 'PNG' },
					{ category: 'HEAD', stem: 'head22', extension: 'PNG' },
					{ category: 'BODY', stem: 'body', extension: 'PNG' },
					{ category: 'BODY', stem: 'body2', extension: 'PNG' },
					{ category: 'BODY', stem: 'body_black', extension: 'PNG' },
					{ category: 'SWORD', stem: 'sword1', extension: 'PNG' }
					])
				);*/

			// --------------------------------
			// Create Camera [object]
			// --------------------------------
			const camera		= new JestCamera( this );
			this.camera			= camera;					// cross-ref JestCamera [object] reference

			// --------------------------------
			// Setup Gameboard [object]
			// --------------------------------
			const gameboard		= this.gameboard;			// get gameboard reference
			gameboard.display.addCanvas( 'world' );			// create gameboard world canvas
			//this.windows[0].expand( 480, 270 );			// auto-resize the window
			const canvas		= gameboard.display.getCanvas( 'world' );
			canvas.resize( 480, 270 );						// set board width & height

			// Disable right-click on canvas.
			canvas.el.addEventListener( 'contextmenu', e => e.preventDefault() );

			// --------------------------------
			// Create Editor Panel [object]
			// --------------------------------
			// Create editor panel to store the editing/playing area.
			this.editor		=
				this.panel.refs.interface.refs.center.createPanel({
					name:		'editor',
					id:			'jest-tiler-editor',
					classes:	[ 'editor' ]
					});
			//this.editor.resize( null, 100px );

			// Add gameboard world canvas to the editor panel.
			this.editor.addPanel( 'gameboard', canvas );
			//console.log( gameboard );

			// --------------------------------
			// Animation Handler [object]
			// --------------------------------
			// Assign the gameboard canvas to the animator for animation rendering
			const animator		= this.animator; // access ref
			animator.canvas		= canvas; // Animator canvas is the world "screen"

			// --------------------------------
			// Sound Handling [object]
			// --------------------------------
			// Preload some sounds
			const soundNames	= [ 'steps.wav', 'steps2.wav', 'sword.wav' ];
			await this.soundboard.preload( soundNames );

			// --------------------------------
			// Load Tileset [objects]
			// --------------------------------
			// Load a default tileset.
			const tileset		=
				await gameboard.addTileset( 'pics1' )
					.catch(
						( err ) => {
							console.warn( `Tileset could not be loaded: ${err.message}` );
						});
			//console.log( tileset ); return;
			// Add canvas to window viewport.

			// --------------------------------
			// Create Overworld [objects]
			// --------------------------------
			// Create overworld
			const overworld		= new JestOverworld( this, 'map1' );
			await overworld.setup();

			// --------------------------------
			// Load Level [object]
			// --------------------------------
			// Load the *.nw file(s)
			const levelNames	= [
				/*'destinyg_a1.nw', 'destinyg_b1.nw', 'destinyg_c1.nw', 'destinyg_d1.nw',
				'destinyg_a2.nw', 'destinyg_b2.nw', 'destinyg_c2.nw', 'destinyg_d2.nw',
				'destinyg_a3.nw', 'destinyg_b3.nw', 'destinyg_c3.nw', 'destinyg_d3.nw',
				'destinyg_a4.nw', 'destinyg_b4.nw', 'destinyg_c4.nw', 'destinyg_d4.nw',
				'destinyg_a5.nw', 'destinyg_b5.nw', 'destinyg_c5.nw', 'destinyg_d5'*/
				'level39.nw', 'level16.nw', 'level18.nw',
				'level14.nw', 'level13.nw', 'level17.nw',
				'level38.nw', 'level9.nw', 'level10.nw'
				]; // create list of levels to load
			await this.secretary.loadFiles( levelNames )
				.catch(
					( err ) => {
						console.warn( `Not all levels were loaded: ${err.message}` );
					});

			// --------------------------------
			// Create Level [objects]
			// --------------------------------
			// Load every test level using the board or layers from its file version.
			const levels = await this.loadLevels( levelNames );
			console.log( levels );

			// Assume levels have been created as in original code
			// Now create the giant map:
			//this.createGiantMap(levelNames, levels);

			// Simulate overworld layout
			/*for ( let y=0; y<5; y++ ) {
				for ( let x=0; x<4; x++ ) {
					for ( let i=0; i<levelNames.length; i++ ) {
						//let levelName = levelNames[ Math.floor(y/4)*4+y%4 ][ x ];
						console.log( x, y );
						console.log( levelNames[i] );
						overworld.addLevel( levels[ levelNames[i] ], i%4, Math.floor(i/4) );
					}
				}
			}*/
			overworld.addLevel( levels['level39.nw'], 0, 0 );  // MoD?
			overworld.addLevel( levels['level16.nw'], 1, 0 );  // supernick
			overworld.addLevel( levels['level18.nw'], 2, 0 );  // church?
			overworld.addLevel( levels['level14.nw'], 0, 1 );  // vangel
			overworld.addLevel( levels['level13.nw'], 1, 1 );  // zol pub
			overworld.addLevel( levels['level17.nw'], 2, 1 );  // fox den
			overworld.addLevel( levels['level38.nw'], 0, 2 );  // angel clan
			overworld.addLevel( levels['level9.nw'],  1, 2 );  // taylor richards
			overworld.addLevel( levels['level10.nw'], 3, 2 );  // master-li fields

			// --------------------------------
			// Create the server connect [object]
			// --------------------------------
			const online = new JestOnline( this );	// server interactor
			this.online  = online;
			// Add online mode events.
			online.register(
				'selfJoin', 'selfJoin',
				( e, uid, username ) => {
					this.selfJoin( e, uid, username );
				});
			online.register(
				'guestUpdate', 'playerUpdate',
				( e, uid, action ) => {
					this.playerUpdate( e, uid, action );
				});
			online.register(
				'guestJoin', 'playerJoin',
				( e, uid, username ) => {
					this.playerJoin( e, uid, username );
				});
			online.register(
				'guestLeave', 'playerLeave',
				( e, uid, username ) => {
					this.playerLeave( e, uid, username );
				});

			// --------------------------------
			// Create the user [object]
			// --------------------------------
			const user   = new JestUser( this, 0 ); // user character
			await user.setup();
				/*.catch(
					( err ) => {
						console.warn( 'user did not setup properly. Application [should quit].' );
					});*/
			this.user    = user;
			user.level   = /*'destinyg_b3';//*/ 'level13.nw';
			user.anchor.move( 10, 5 );

			// --------------------------------
			// Add Ticker Event(s)
			// --------------------------------
			this.timers['ani'].register(
				'tick', 'render',
					e => {
						// Update gameboard drawing
						this.draw( e );
					});

			// --------------------------------
			// Setup Debugging
			// --------------------------------
			// Default inspector drawing canvas to gameboard
			this.inspector.canvas	= canvas;
			this.inspector.on();
			this.inspector.enable( 'showAnchors' );
			this.inspector.anchors.add( user.focus );
			user.focus.show( '#f00', 50 );
			this.inspector.anchors.add( user.collider );
			user.collider.show( '#000', 50 );
			this.inspector.anchors.add( user.anchor );
			user.anchor.show( '#00f', 50 );

			// --------------------------------
			// Plugin Hook(s)
			// --------------------------------
			// Initialize the plugins.
			//await JestPlay.initPlugins();

			// --------------------------------
			// Connect to the server [object]
			// --------------------------------
			await this.online.connect( this.config.server );
			loadbar.update(); // step 2

			// --------------------------------
			// Successfully Exit Build
			// --------------------------------
			// Reveal the application screen.
			this.spline.goToScreen( 'application' );
			// App built, set built status
			this.gearshift( 'built' ); // app built
			return true;
		}

		// --------------------------------
		// Drawing
		// --------------------------------
		// Load test levels and register them with the gameboard.
		// RETURNS: [object] Levels keyed by their requested filenames.
		// * filenames - [array] Remote level filenames already loaded by Secretary.
		async loadLevels( filenames ) {
			// Store each ready level under the key existing game code expects.
			const levels = {};
			// Prepare each level through the shared level loader.
			for ( const filename of filenames ) {
				// Resolve the remote file metadata required by renderLevelData().
				const fileInfo = this.getFileInfo( filename, null, null, null, 'remote' );
				// Stop if the filename did not resolve to file information.
				if ( !fileInfo )
					throw new Error( `Could not resolve file information for "${filename}".` );

				// Build the JestLevel, its layers, and its rendered layer canvases.
				const prepared = await this.renderLevelData( fileInfo );
				// The shared loader returns null when rendering fails.
				if ( !prepared?.level )
					throw new Error( `Could not prepare level "${filename}".` );

				// Register the ready level for gameplay and overworld lookup.
				const level = prepared.level;
				this.gameboard.addLevel( filename, level );
				levels[filename] = level;
			}

			// Return all loaded levels to the caller.
			return levels; // [object]
		}

		// --------------------------------
		// Drawing
		// --------------------------------
		// Draw the central gameboard.
		// RETURNS: [void].
		// * e	- Ticker event [object] data about frame.
		draw( e ) {
			// Clear the canvas with a black screen
			const canvas    = this.gameboard.display.getCanvas( 'world' );
			// Determine if canvas is set
			if ( !canvas || !canvas.el ) {
				console.warn( 'Canvas is not set or invalid' );
				return;
			}
			const ctx       = canvas.el.getContext( '2d' );
			// Update camera view rendering data
			this.camera.update();
			//ctx.fillStyle = "green";
			ctx.clearRect( 0, 0, canvas.el.width, canvas.el.height );
			// Draw level onto canvas
			const overworld = this.gameboard.overworlds.map1;
			const snapshot  = overworld.getSnapshot();
			overworld.renderVisibleLevels( ctx, snapshot );
			/*ctx.fillStyle = "#FF00FF";
			ctx.fillRect( 0, 0, this.canvas.el.width, this.canvas.el.height );*/

			// --------------------------------
			// Render JANI Inside of Animator
			// --------------------------------
			// Draw all relevant animation view(s).
			let views	= [];
			for ( const worldling of this.gameboard.worldlings ) {
				// Skip disabled worldlings.
				if ( worldling.status!=2 ) continue;
				// Render all worldlings.
				worldling.pulse( e );
				if ( worldling._lens.visible===true ) {
					views.push( worldling.view );
				}
			}
			// Sort by Y depth — lower Y = in front (higher Z)
			views.sort(
				(a,b) => {
					const ay = Math.round( a.globalY );
					const by = Math.round( b.globalY );
					return ay - by;
				});
			//console.log( `${view.globalX},${view.globalY}` );
			// Render animation views & draw them.
			this.animator.render( e, views );	// render views
			this.animator.draw( views );		// draw views

			// If inspector is on, call its update.
			if ( this.inspector.running===true )
				this.inspector.update( e );
		}

		/*// Creates a giant map canvas from individual level canvases arranged in a 4x5 grid,
		// then opens the resulting image in a new window.
		// *levelNames	- [array] of level names.
		// *levels		- [object] where each key is a level name and its value is the level object containing a canvas.
		async createGiantMap( levelNames, levels ) {
			// Define grid dimensions and individual canvas size
			const cols = 4;                     // # File: giantMap.js, line 10, char #1
			const rows = 5;                     // # File: giantMap.js, line 11, char #1
			const cellWidth = 1024;             // # File: giantMap.js, line 12, char #1
			const cellHeight = 1024;            // # File: giantMap.js, line 13, char #1

			// Create the giant canvas element with the computed dimensions
			const giantCanvas = document.createElement('canvas');  // # File: giantMap.js, line 16, char #1
			giantCanvas.width = cols * cellWidth;                  // # File: giantMap.js, line 17, char #1
			giantCanvas.height = rows * cellHeight;                // # File: giantMap.js, line 18, char #1
			const ctx = giantCanvas.getContext('2d');              // # File: giantMap.js, line 19, char #1

			// Iterate over each level and draw its canvas onto the giant canvas
			for (let i = 0; i < levelNames.length; i++) {          // # File: giantMap.js, line 22, char #1
				const name = levelNames[i];                        // # File: giantMap.js, line 23, char #1
				const level = levels[name];                        // # File: giantMap.js, line 24, char #1

				// Check if the level object and its canvas exist
				if (!level || !level.canvas) {                     // # File: giantMap.js, line 26, char #1
					console.error(`Missing level or canvas for level ${name} at index ${i}`); // # File: giantMap.js, line 27, char #1
					continue;
				}

				// Calculate position based on grid: columns wrap every 4 levels
				const col = i % cols;								// # File: giantMap.js, line 31, char #1
				const row = Math.floor(i / cols);					// # File: giantMap.js, line 32, char #1
				const x = col * cellWidth;							// # File: giantMap.js, line 33, char #1
				const y = row * cellHeight;							// # File: giantMap.js, line 34, char #1

				// Draw the level's canvas at the computed (x, y) position
				ctx.drawImage(level.canvas.el, x, y);				// # File: giantMap.js, line 37, char #1
			}

			// File: giantMap.js, line 50, char #1
			const dataURL = giantCanvas.toDataURL('image/png');		// Convert giant canvas to PNG data URL

			// File: giantMap.js, line 52, char #1
			const downloadLink		= document.createElement('a');	// Create an anchor element
			downloadLink.href		= dataURL;						// File: giantMap.js, line 53, char #1
			downloadLink.download	= "giantMap.png";				// File: giantMap.js, line 54, char #1

			// Append the link to the document and trigger a click to start the download
			document.body.appendChild(downloadLink);				// File: giantMap.js, line 56, char #1
			downloadLink.click();									// File: giantMap.js, line 57, char #1
			document.body.removeChild(downloadLink);				// File: giantMap.js, line 58, char #1
		}*/

		// --------------------------------
		// Online Mode Handling
		// --------------------------------
		// Current user joined the server.
		// RETURNS: [void].
		// * e			- player event data [object] sent from server.
		// * uid		- [string] value of player user id.
		// * username	- [string] value of player's username.
		async selfJoin( e, uid, username ) {
			// Load user data into user's player [object].
			this.user.load( uid, username );
		}

		// Update a online "guest" / player.
		// RETURNS: [void].
		// * e		- player event data [object] sent from server.
		// * uid	- [string] value of player user id.
		// * action	- [string] value of action being taken.
		async playerUpdate( e, uid, action ) {
			// Ignore data if it is the user.
			if ( uid===this.user.id ) return false; // ignore
			// Ensure guest with id exists
			if ( !this.gameboard.guests?.[uid] ) {
				console.warn( `JEST® Player Update: cannot find guest id="${uid}"` );
				console.log( this.gameboard.guests );
				return false;
			}
			// Handle action being updated
			switch ( action ) {
				case "move":
					//console.warn( `guestUpdate: moving guest id="${uid}" to (${e.x},${e.y})` );
					this.gameboard.guests[uid].move( true, e.x, e.y );
					break;
				case "mode":
					//console.warn( `guestUpdate: reanimating guest id="${uid}" to (${e.x},${e.y})` );
					this.gameboard.guests[uid].operate( true, e.mode );
					break;
				case "dir":
					//console.warn( `guestUpdate: reanimating guest id="${uid}" to (${e.x},${e.y})` );
					this.gameboard.guests[uid].setDirection( true, e.dir );
					break;
				default:
					console.warn( "JEST® Player Update: uknown action" );
			}
		}

		// An online "guest" / player joined the server.
		// RETURNS: [void].
		// * e			- player event data [object] sent from server.
		// * uid		- [string] value of player user id.
		// * username	- [string] value of player's username.
		async playerJoin( e, uid, username ) {
			// Create the guest player [object].
			await this.gameboard.addGuest( uid, username );
		}

		// An online "guest" / player left the server.
		// RETURNS: [void].
		// * e			- player event data [object] sent from server.
		// * uid		- [string] value of player user id.
		// * username	- [string] value of player's username.
		async playerLeave( e, uid, username ) {
			// Removes the guest player [object].
			await this.gameboard.removeGuest( uid );
		}
	};
// Make JestPlay globally accessible for plugins
window.JestPlay = JestAppsRegistry.AppJestPlay;
