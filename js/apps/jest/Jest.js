//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/Jest.js loaded' );

//-------------------------
// Jest Application
//-------------------------
class Jest extends Application {
	//--------------------------------
	// Class Propert(ies)
	//--------------------------------
	// Declare properties
	icon			= 'images/icons/jest_hat.png';	// application icon image URL [string] value
	name			= 'Jest';				// name of application
	version			= '0.0';				// application version
	id				= null;					// give application a unique ID (for CSS).
	config			= null;					// [object] JestConfiguration for global property declarations.
	// State Handler Reference(s)
	settings		= null;					// [object] Settings available across the application.
	governor		= null;					// [object] JestGovernor handling state changes.
	// Validation & testing handler(s)
	parser			= null;					// [object] Parser available to validate text.
	// User & server handling [objects]
	online			= null;					// [object] JestOnline for connection to a websocket.
	login			= null;					// [object] JestLogin for user authentication & login.
	cloud			= null;					// [object] JestCloud for syncing content to a server.
	// Algorithmic handling [objects]
	spline			= null;					// [object] JestSpline (fills Window to hold screens).
	grapher			= null;					// [object] Grapher for handling matrices & points.
	// File Handling [objects]
	delegator		= null;					// [object] Central delegator for chronological handling.
	interactor		= null;					// [object] JestInteractor for handling window / input event(s).
	inspector		= null;					// [object] JestInspector for handling custom & some built-in debugging.
	transmitter		= null;					// Transmitter [object] for handling file transmissions (download, upload, etc.)
	cabinet			= null;					// cabinet [object] (used to organize file [objects]).
	secretary		= null;					// secretary [object] (used to handle file download & parsing).
	parsers			= null;					// [object] Parsers available (e.g. 'level').
	// Graphical Handling [objects]
	imager			= null;					// Create the imager organizer [object].
	gallery			= null;					// Create the image gallery [object].
	gameboard		= null;					// [object] JestGameboard with canvas, for rendering
	animator		= null;					// Create the animator [object] (used to render animations).
	fantascope		= null;					// [object] JestFantascope for handling janis.
	// Miscellaneous stack(s)
	modals			= {};					// [object] of central modal registry.
	timers			= {};					// [object] of timers 16ms delay for ~60 FPS (1000ms / 60 ≈ 16ms).
	// Game [objects]
	io				= null;					// JestInputOutput [object] for interaction
	// GUI handling [objects]
	panel			= null;					// [object] Panel root container for entire editor UI
	// Messaging system [objects]
	tooltip			= null;					// JestTooltip [object] for handling mouseover tooltips.
	noticer			= null;					// JestNoticer [object] for
	//modal			= null;					// Modal [object] for action confirmation handling.

	// --------------------------------
	// Constructor
	// --------------------------------
	// Creates the application.
	// * options	- [object] Configuration options for the application.
	constructor() {
		super(); // call the parent application constructor
	}

	// --------------------------------
	// Initialization
	// --------------------------------
	// Check if the client type matches value.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * name	- [string] value of client name.
	is( name ) {
		// Determine if name equals the client id.
		return name===this.id ? true : false;
	}

	// --------------------------------
	// Initialization
	// --------------------------------
	// Setup the application.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	async setup() {
		super.setup(); // call parent setup method
		return true; // success
	}

	// Launch the application
	// RETURNS: [boolean] `true` on success else `false` on fail.
	async launch() {
		// call parent launch method
		if ( !super.launch() ) return false; // failed

		// --------------------------------
		// Create State Handler [objects]
		// --------------------------------
		// Instantiate the settings [object].
		this.settings	= {}; // fresh empty settings [object] to start
		// Instantiate the governor.
		this.governor	= new JestGovernor( this );

		// --------------------------------
		// Validation Handler(s)
		// --------------------------------
		// Instantiate the parser [object].
		this.parser		= new JestParser( this );

		// --------------------------------
		// Create Application Window [object]
		// --------------------------------
		// Initialize modal-specific components
		const title		= this.name+' '+this.version+' Window';
		const windowObj	=
			this.addWindow(
				title,
				{
					classes: [ 'jest-application-jest', 'jest-style-harlequin' ]
				});
		if ( windowObj===null ) return false;

		// --------------------------------
		// Setup Application Window
		// --------------------------------
		console.log( 'jestAlert: Application `'+this.name+'` launch() opening application window ...' );
		let open		= this.setupWindow( windowObj );
		if ( open!==true ) {
			throw new Error( 'jestAlert: Jest failed to open window!' );
			return false; // fail
		}

		// --------------------------------
		// Open the window
		// --------------------------------
		// Open application window.
		windowObj.open();			// open window
		// App open, idle window
		this.gearshift( 'idle' );	// idle window

		// --------------------------------
		// Begin Building Application [object]
		// --------------------------------
		this.suspend();		// mark application as busy
		//try { await this.build(); }
		//catch ( err ) { throw new Error(`${this.name} v. ${this.version} build failed: ${err}`); }
		await this.build();
		this.resume();		// mark application available

		// --------------------------------
		// Shift Application Into Gear
		// --------------------------------
		// Change mode to running.
		this.jot( 'mode', 'idle' );				// 🚫 pause everything first
		this.jot( 'enabled', false );			// 🚫 pause everything first
		// Switch application to a running state.
		this.switchforth( 'running', true );	// ✅ resume to normal state

		return true; // success
	}

	// Open the window [object]
	// RETURNS: [bool] `true` on success else `false`
	setupWindow( windowObj ) {
		// Require windowObj to be part of application windows
		if ( !this.windows.includes(windowObj) )
			return false; // "window" not part of application
		// --------------------------------
		// Setup Windo Header
		// --------------------------------
		// Configure the window panel(s)
		// Build the header
		/*const header	=
			{
				name:		'header',
				classes:	[ 'jest-window-header', 'jest-style-harlequin', 'jest-freezeframe' ],
				elements:	JestEnvironment.librarian.libs.HarlequinWindow.windowHeaderConfig( this.icon, this.name+' '+this.version )
			};*/
		// --------------------------------
		// Setup Window Body
		// --------------------------------
		// Build the body
		const body		=
			{
				name:		'viewport',
				classes:	[ 'jest-window-viewport', 'jest-style-harlequin' ]
			};
		if ( this.id!==null )
			body.classes.push( `jest-viewport-${this.id}` );
		// --------------------------------
		// Setup Window Footer
		// --------------------------------
		// Build the footer
		/*const footer	=
			{
				name:		'footer',
				classes:	[ 'jest-window-footer', 'jest-style-harlequin' ],
				//elements:	this.getBuildFooterElements()
			};*/
		// Add window elements
		windowObj.addElements( [ /*header,*/ body, /*footer*/ ] );
		// --------------------------------
		// Setup [JestSpline] Viewport (simply fills body)
		// --------------------------------
		// Create a JestSpline for screen management.
		this.spline		= new JestSpline( this );
		this.spline.build(); // build it
		// Add JestWindow inside of Window.
		windowObj.refs.viewport.addPanel( 'screens', this.spline.panel );
		return true; // success
	}

	// Preset the build architecture.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	async preset() { return true; }

	// Build the configuration, inspector, timer, i/o, etc.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	async build() {
		// --------------------------------
		// Attempt to Build
		// --------------------------------
		// Determine logic based upon requested status change
		const currentMode   = this.skim( 'status' );
		if ( currentMode!=='idle' )
			return false; // no need to rebuild
		//super.setup(); // call parent setup method
		// App open, set building status
		this.gearshift( 'building' );
		// Instantiate some variables
		this.parsers        = {}; // Being the blank parsers [object] for storing parser [objects]

		// --------------------------------
		// Create Application Pane [object]
		// --------------------------------
		console.log( 'jestAlert: Application `'+this.name+'` building interface ...' );

		// --------------------------------
		// Configuration [object]
		// --------------------------------
		const config        = new JestConfiguration( this );
		this.config         = config;

		// --------------------------------
		// Create Application Default Screen
		// --------------------------------
		// Register the default application loading screen.
		const screenLoad    = new JestScreen( this );
		screenLoad.build( 'screen', ['jest-screen-loading-default'] ); // build it

		// Create loading screen brand logo.
		/*screenLoad.panel.createPanel({
			name       : 'logo',
			tag        : 'img',
			attributes : { src: `${this.config.root}/images/jest_logo_red.png` },
			classes    : [ 'jest-logo', 'jest-ani-oscillate' ]
			});*/

		// Add JEST svg logo.
		screenLoad.panel.addElements([
			{
				name       : 'logo',
				tag        : 'svg',
				attributes : {
					xmlns   : "http://www.w3.org/2000/svg",
					viewBox : "0 0 1200 325"
					},
				classes    : [ 'jest-logo', 'jest-ani-oscillate' ],
				elements   :
					[
						{
							name       : 'path',
							tag        : 'path',
							attributes : { 'd': 'M319.53,67.77h153.07c54,2.94,102.91,44.49,114.74,97.12,4.87,21.66,2.74,43.42,3.16,65.46h-161.17c8.98,10.9,22.91,16.74,36.92,17.63l268.88-.04c13.52-1.35,26.86-6.88,35.55-17.59h-161.17c.65-17.37-1.21-35.07.79-52.34,6.81-58.71,58.1-106.87,117.1-110.23h153.07V2.32l139.36,140.06h-64.75v57.36c0,3.43,2.52,11.68,3.88,15.12,9.71,24.56,32.38,31.92,56.97,33.12,36.25,1.77,73.79-1.69,110.16.34l73.91,73.89-190.41.38c-53.27-1.58-102.58-31.22-121.2-82.21-11.65-31.91-7.09-64.66-7.92-98.01h-146.74c-14.45.84-28.45,4.29-38.36,15.49h163.29c.33,1.29.63,2.48.74,3.84,1.31,16.65.42,41.72-2.48,58.12-9.32,52.58-54.75,95.46-107.79,101.95-96.54,1.85-193.29.24-289.91.82-58.56-3.3-109.21-50.09-117.06-108.17-2.02-14.94-2.72-37.72-1.54-52.72.11-1.36.41-2.55.74-3.84h163.29c-9.95-11.2-23.88-14.66-38.37-15.48h-146.74c-.86,33.3,3.78,66.15-7.92,98-18.78,51.14-67.72,80.54-121.2,82.21l-190.41-.38,73.91-73.89c36.38-2.03,73.91,1.44,110.16-.34,23.26-1.14,45.63-7.93,55.93-30.64,1.81-3.98,4.92-13.47,4.92-17.6v-57.36h-64.75L319.53,2.32v65.45Z' }
						}
					]
			}]);

		// Register screen into the spline.
		this.spline.registerScreen( 'loading', screenLoad );

		// Add a loading bar to the status bar.
		const loadbar      = new JestLoadbar( this );
		screenLoad.loadbar = loadbar;							// keep ref to loadbar in screen
		loadbar.build( 'jest-loadbar', ['jest-ani-stripes'] );	// build loadbar
		screenLoad.panel.addPanel( 'loadbar', loadbar.panel );	// add to statusbar DOM

		// Create loading screen copyright.
		screenLoad.panel.createPanel({
			name    : 'copyright',
			tag     : 'div',
			text    : `Copyright <b>©</b> 2025 <strong>JEST</strong>. All rights reserved.`,
			classes : [ 'jest-copyright', 'jest-ani-fade-oscillate' ]
			});

		// Default application to show the loading screen.
		this.spline.goToScreen( 'loading' );

		// --------------------------------
		// Algorithmic [object]
		// --------------------------------
		const grapher       = new Grapher();
		this.grapher        = grapher;
		// Setup the graph matrix.
		grapher.graticulate( config.tileGrid );			// set graph grid
		const length        = config.levelGrid;			// get default level W x H
		grapher.resize( length, length );				// set graph W x H

		// --------------------------------
		// Core Interraction [object]
		// --------------------------------
		// Mouse-event delegation.
		this.delegator      = new Delegator();
		// Create context listener (for window / lost context).
		this.interactor     = new JestInteractor( this );
		this.interactor.enable(); // enable it

		// --------------------------------
		// Inspector / Debugging [object]
		// --------------------------------
		const inspector     = new JestInspector( this );
		this.inspector      = inspector;

		// --------------------------------
		// Create Internal Timer [object]
		// --------------------------------
		// Central game timeout loop
		this.timers['ani']  = new Timeout( 'raf' );		// Intervals are 16.67ms delay for ~60 FPS (1000ms / 60 ≈ 16.67ms).
		this.timers['ani'].start();						// start ticking
		//timers['ani'].register( 'tick', 'game', this.update.bind(this,...args) );

		// --------------------------------
		// Create Input-Output Handler [object]
		// --------------------------------
		const io            = new JestInputOutput();	// input-output handling
		this.io             = io;						// set cross-reference to [object] property
		this.timers['ani'].register( 'tick', 'input-output', e=>io.update(e) );

		// --------------------------------
		// File Handling [objects]
		// --------------------------------
		this.transmitter    = new JestTransmitter( this );

		// --------------------------------
		// File Handling [objects]
		// --------------------------------
		// Create the cabinet [object] for file [object] organization.
		this.cabinet        = new JestCabinet( this );
		// Create the secretary [object] for file handling
		this.secretary      = new JestSecretary( this, `${this.config.webfiles}` );

		// --------------------------------
		// Create Main Screen [object]
		// --------------------------------
		// Register the main application screen.
		const screenMain    = new JestScreen( this );
		screenMain.build(); // build it
		// Build the panel
		this.panel          = screenMain.panel;			// assign main screen as the main panel
		this.spline.registerScreen( 'application', screenMain );

		// --------------------------------
		// Login Handler [object]
		// --------------------------------
		// Create the login handler [object] for account interfacing.
		const login         = new JestLogin( this );
		this.login          = login; // keep ref

		// --------------------------------
		// Cloud Handler [object]
		// --------------------------------
		// Create the cloud handler [object] for backing up data.
		const cloud         = new JestCloud( this );
		this.cloud          = cloud; // keep ref

		/*console.log('TEST: plugin types attached per class');
		console.log('OSConfigurable.plugins:', Object.keys(OSConfigurable.plugins));
		console.log('Jest.plugins:', Object.keys(Jest.plugins));
		console.log('JestTiler.plugins:', Object.keys(JestTiler.plugins));
		console.log('JestAnimator.plugins:', Object.keys(JestAnimator.plugins));
		console.log('OSConfigurable.plugins === JestTiler.plugins:', OSConfigurable.plugins === JestTiler.plugins);
		console.log('JestTiler.plugins === JestAnimator.plugins:', JestTiler.plugins === JestAnimator.plugins);*/

		// --------------------------------
		// Plugin Hook(s)
		// --------------------------------
		// Initialize parser plugins.
		await Jest.initPlugins( 'parsers', this );
		// Add recognized filetype(s) to secretary
		this.secretary.addFiletype(
			'wav',
			{
				subpath: 'sounds', extension: 'wav',
				responseType: 'blob', parse: 'blob',
				parser: 'sound'
			});
		this.secretary.addFiletype(
			'mp3',
			{
				subpath: 'sounds', extension: 'mp3',
				responseType: 'blob', parse: 'blob',
				parser: 'sound'
			});
		this.secretary.addFiletype(	// png filetype handler
			'png',
			{
				subpath: 'images', extension: 'png',
				responseType: 'blob', parse: 'blob',
				parser: 'image'
			});
		this.secretary.addFiletype(	// gif filetype handler
			'gif',
			{
				subpath: 'images', extension: 'gif',
				responseType: 'blob', parse: 'blob',
				parser: 'image'
			});
		this.secretary.addFiletype(	// jani filetype handler
			'jani',
			{
				subpath: 'janis', extension: 'jani',
				responseType: 'text', parse: 'text',
				parser: 'jani'
			});
		this.secretary.addFiletype(	// tiledefs filetype handler
			'tdefs',
			{
				subpath: 'tiledefs', extension: 'tdefs',
				parse: 'text', parser: 'tiledefs'
			});
		this.secretary.addFiletype(	// levels filetype handler
			'nw',
			{
				subpath: 'levels', extension: 'nw',
				responseType: 'text', parse: 'text',
				parser: 'level'
			});
		this.secretary.addFiletype(	// json filetype handler
			'json', { extension: 'json', parse: 'json', parser: 'json' } );
		// Create parser [objects]
		this.parsers.sound		= new JestParserSound( this );
		this.parsers.jani		= new JestParserJani( this );
		await this.parsers.jani.setup(); // setup the janis parser
		this.parsers.tiledefs	= new JestParserTiledefs( this );
		this.parsers.level		= new JestParserLevel( this );
		this.parsers.image		= new JestParserImage( this );
		await this.parsers.level.setup(); // setup the level parser

		// --------------------------------
		// Image File Organizing Handler
		// --------------------------------
		this.gallery		= new JestGallery( this, `${this.config.webfiles}/images`, 'images/default-placeholder.png', 5 );
		this.imager			= new JestImager( this ); // downloads images

		//-------------------------
		// Preload Core Graphics
		//-------------------------
		// Preload essential core graphic(s).
		const preloadImages = [
			'ui/opps.gif', 'ui/letters.gif', 'ui/sprites.gif', 'ui/state.gif'
			];

		// Await & preload all image(s) asynchronously.
		try {
			await this.imager.loadFiles( preloadImages, false );
		}
		catch ( error ) {
			console.warn( 'Could not preload core graphics:', error );
		}

		// Verify each image loaded successfully.
		for ( const file of preloadImages ) {
			// Attempt to access downloaded file.
		    const image = this.imager.getFile( file );
			// If image failed, throw an error.
		    if ( !image )
		        console.warn( `Failed to preload graphic: ${file}` );
		}

		// --------------------------------
		// Register Image Directories
		// --------------------------------
		/*// Register & set default fallback image directory.
		this.gallery.registerCategory( 'WEB', 'web' );
		this.gallery.setFallbackCategory( 'WEB' ); // make fallback
		// Register core folder(s)
		this.gallery.registerCategory( 'TILESET', 'tilesets' );
		// Set character skins folder(s)
		this.gallery.registerCategory( 'SPRITES', 'sprites' );
		this.gallery.registerCategory( 'HEAD', 'heads', 'images/heads-placeholder.png' );
		this.gallery.registerCategory( 'BODY', 'bodies' );
		this.gallery.registerCategory( 'SHIELD', 'shields' );
		this.gallery.registerCategory( 'SWORD', 'swords' );*/

		// --------------------------------
		// Create Gameboard [object] (useful for organization)
		// --------------------------------
		this.gameboard		= new JestGameboard( this );
		//this.gameboard.anchor.resize( 480, 270 );		// set board width & height

		// --------------------------------
		// Animation Handler [object]
		// --------------------------------

		// Create the fantascope [object] for jani handling
		this.fantascope		= new JestFantascope( this );
		// Create the animator for animation rendering
		this.animator		= new AnimationAnimator();	// Create a single Animator instance.

		// --------------------------------
		// Sound Handling [object]
		// --------------------------------
		// Create primary game soundboard for handling SFX
		const soundboard	= new JestSoundboard( this, 'primary' );
		this.soundboard		= soundboard;

		// --------------------------------
		// Default Sound Effect(s)
		// --------------------------------
		// Preload default sounds.
		const preloadMP3	=
			[
			'jest_complete.mp3', 'jest_success.mp3',
			'jest_alert.mp3', 'jest_error.mp3',
			'jest_close0.mp3', 'jest_close1.mp3', 'jest_close2.mp3',
			'jest_open0.mp3', 'jest_open1.mp3',
			'jest_prompt.mp3', 'jest_pour.mp3', 'jest_poke.mp3', 'jest_draw.mp3',
			'jest_swatch_add.mp3', 'jest_swatch_remove.mp3',
			'jest_deflect.mp3', 'jest_login.mp3',
			'jest_mouse_down.mp3', 'jest_mouse_up.mp3',
			'jest_tab.mp3', 'jest_collapse.mp3'
			];
		await this.soundboard.preload( preloadMP3 );
		const preloadWAV	=
			[
			'jest_copy.wav', 'jest_undo.wav', 'jest_redo.wav', 'jest_delete.wav',
			'jest_paste.wav', 'jest_float.wav', 'jest_unfloat.wav', 'jest_eyedrop.wav',
			'jest_flip.wav', 'jest_draw.wav', 'jest_dupe.wav', 'jest_breeze.wav'
			];
		await this.soundboard.preload( preloadWAV );

		// --------------------------------
		// Create Tooltip
		// --------------------------------
		// Initialize loader plugins.
		this.tooltip		= new JestTooltip( this );
		this.tooltip.build(); // build the element
		this.tooltip.enableLiveMode();

		// --------------------------------
		// Create Messaging System(s)
		// --------------------------------
		// Create a notification handler.
		this.noticer		= new JestNoticer( this );
		this.noticer.build(); // build the notification handler
		this.spline.panel.addPanel( 'noticer', this.noticer.panel );

		// --------------------------------
		// Plugin Hook(s)
		// --------------------------------
		// Initialize loader plugins.
		await Jest.initPlugins( 'loaders', this );

		// --------------------------------
		// Register Window Event(s)
		// --------------------------------
		// Add window blur / focus events.
		this.windows[0].register( 'visibilitychange', 'app',
			( e ) => {
				if ( document.visibilityState==='hidden' )
					this.switchforth('idle',false); // idle application
				else this.switchback(); // resume application
			}, 'document' );
		this.windows[0].register( 'blur', 'app',
			e=>this.switchforth('idle',false), 'window' );
		this.windows[0].register( 'focus', 'app', e=>this.switchback(), 'window' );
		// Disable the application to start.
		this.disable(); // disable app

		// Create a generic modal message.
		//const modal			= new JestModal();
		return true; // success
	}

	// Debugging "jot" override interceptor.
	/*jot( key, val ) {
		// Handle "message" differently.
		if ( key==='mode' )
			console.error( val );
		// Set the value.
		return super.jot( key, val ); // success
	}*/

	// --------------------------------
	// UI / Modal Method(s)
	// --------------------------------
	// Snapshot current status flags, then switch into an idle state
	// (e.g. during window unfocus or modal operation).
	// RETURNS: [void].
	// mode		- [string] Value of new state.
	// enabled	- [bool] Whether to leave enabled (or `false` to disable).
	switchforth( mode='idle', enable=true ) {
		const currentMode	= this.skim( 'mode' );
		const currentEn		= this.skim( 'enabled' );
		// 🛑 Prevent pointless re-snapshotting idle state
		if ( currentMode===mode && currentEn===enable ) return;

		// Take snapshot of current user interface.
		const snapshot = {
			mode:		currentMode,
			enabled:	currentEn,
			};
		this.governor.log( 'status', snapshot );
		// Switch to some interim mode.
		this.jot( 'mode', mode ); // interim mode
		// Toggle enability.
		if ( enable ) this.enable();
		else this.disable();
		//if ( mode==='idle' )
			//console.log( 'idle' );
	}

	// Pop the last UI snapshot and restore all flags.
	// RETURNS: [void].
	switchback() {
		// Switch back to normal interface.
		const prev = this.governor.current( 'status' );
		if ( !prev ) return;
		// 🛑 Avoid consuming a snapshot we don’t use
		if ( prev.mode==='idle' && prev.enabled===false ) {
			console.warn( 'Skipped switchback: still idle and disabled.' );
			return;
		}
		// Consume snapshot "only once" before restoring
		this.governor.undo( 'status' );
		// Change mode & enabled status to previous.
		this.jot( 'mode', prev.mode );
		// Toggle enability.
		if ( prev.enabled ) this.enable();
		else this.disable();
	}

	// Push a busy state.
	// RETURNS: [this] for chaining.
	// * action - [string|bool] descriptor (optional)
	suspend( action=true ) {
		// Check action.
		const stack		= this.skim('busy') ?? [];
		stack.push( action );
		// Set mode to busy to true.
		this.jot( 'busy', stack );
		// Emit busy start event.
		this.emit( 'busyStart', action );
		return this; // chainable
	}

	// Resume (pop) a busy state.
	// RETURNS: [this] for chaining.
	resume() {
		// Get stack.
		const stack		= this.skim('busy') ?? [];
		if ( stack.length<1 ) {
			console.error( 'Application resume() skipping: "Busy" stack empty.' );
			return this;
		}
		const action	= stack.pop(); // remove top
		// Set busy mode to stack.
		this.jot( 'busy', stack );
		// Emit busy end event.
		this.emit( 'busyEnd', action );
		return this; // chainable
	}

	// Check if application is busy.
	// RETURNS: [bool] busy status
	// * allowed	- [string|bool] matchable mode
	//   strict		- [bool] whether busy accepts any match (false) or only top level (true)
	//   required	- [bool] whether allowed must match (true) or is an exception (false)
	busy( allowed=false, strict=true, required=false ) {
		//--------------------------------------------------
		// Retrieve busy stack ([array] of current busy modes)
		//--------------------------------------------------
		// Check current busy status.
		const stack		= this.skim('busy') ?? [];
		if ( stack.length===0 ) return false;
		// Get current busy state.
		const current	= stack[stack.length-1];

		//-----------------------------
		// Strict check: Only top of stack matters
		//-----------------------------
		// Is strict, top-level match required.
		if ( strict ) {
			if ( required ) // must match exactly
				return current!==allowed;
			// Return false if bypass is allowed (either false or allowed match)
			else return !( current===false || current===allowed ); // bypass
		}

		//-----------------------------
		// Loose Mode: Scan stack for any match
		//-----------------------------
		// Must find exact match anywhere
		if ( required )
			return !stack.includes( allowed );
		// Not busy if `false` or `allowed` is in stack
		else return !stack.includes(false) && !stack.includes( allowed );
	}

	// --------------------------------
	// Enabling & Activating Method(s)
	// --------------------------------
	// Enable the button.
	// RETURNS: [void].
	enable() {
		// Check if it is currently enabled.
		const enabled	= this.skim( 'enabled' );
		// Only execute if the button is disabled.
		if ( enabled===true ) return;
		// Set enabled state to enabled.
		this.jot( 'enabled', true );
		// Update visual state.
		//console.log( 'enabling...' );
		this.spline.panel.removeClass( 'disabled' );
		// Resume all rAF timer(s).
		for ( const key in this.timers ) {
			if ( this.timers[key].skim('mode')==='raf' )
				this.timers[key].resume();
		}
	}

	// Disable the button.
	// RETURNS: [void].
	disable() {
		// Check if it is currently disabled.
		const enabled	= this.skim( 'enabled' );
		// Only execute if the button is disabled.
		if ( enabled===false ) return;
		// Set enabled state to disabled.
		this.jot( 'enabled', false );
		// Update visual state.
		//console.log( 'disabling...' );
		this.spline.panel.addClass( 'disabled' );
		// Pause all rAF timer(s).
		for ( const key in this.timers ) {
			if ( this.timers[key].skim('mode')==='raf' )
				this.timers[key].pause();
		}
	}
}

// Make Jest globally accessible for plugins
window.Jest = Jest;

/*let ptr1 = window.Jest;
while (ptr1) {
	console.log('Static walk:', ptr1.name);
	ptr1 = Object.getPrototypeOf(ptr1);
}*/
