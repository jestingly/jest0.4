//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/clients/JestCreator.js loaded' );

//-------------------------
// Jest Application
//-------------------------
class JestCreator extends Jest {
	// Declare properties
	icon			= 'images/icons/jest_settings.png'; // application icon image URL [string] value
	name			= 'Creator';		// name of application
	version			= 'unknown';		// application version
	id				= 'creator';		// creator application id.
	// Server [objects]
	//online			= null;			// [object] JestOnline for connection to a websocket.
	// JestElement Reference(s)
	filetypes		= '*';				// Comma lineated [string] of permitted open filetype(s)
	filemenu		= null;				// [JestFileMenu] File operation button bar
	fileSelect		= null;				// [object] JestInputFileSelect for file selection.
	// Tabbar menu(s)
	tabbarFile		= null;				// [JestTabbar] tools for file view selection.
	// Tool handling
	easels			= null;				// [object] of easels that hold file views.
	toolbar			= null;				// [JestToolbar] Tool menu selector (draw, fill, etc.)
	toolbox			= null;				// [JestToolbox] Central tool manager for enabling/disabling tools and temp swaps
	actionbar		= null;				// [JestToolbar] Interactor menu for interactive tool actions.
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
		await super.setup();	// call parent setup method
		return true;
	}

	// Launch the application
	// RETURNS: [boolean] `true` on success else `false` on fail.
	async launch() {
		// call parent launch method
		const ok = await super.launch();
		if ( !ok ) return false; // failed\
		return true; // succcess
	}

	// Build the gameboard, user, components, etc.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	async build() {
		// --------------------------------
		// Emit Initial Event(s)
		// --------------------------------
		this.emit( 'prebuild', null ); // emit a pre-build hook event

		// --------------------------------
		// Add Special HTML Class(es)
		// --------------------------------
		this.windows[0].refs.viewport.addClass( 'jest-viewport-creator' );

		// --------------------------------
		// Call Pre-Build Method (if exists)
		// --------------------------------
		try { await this.preset(); }
		catch ( err ) {
			console.error( `Pre-build failed: ${err}` );
			throw err;
		}

		// --------------------------------
		// Call Super
		// --------------------------------
		await super.build();
		// change mode async build() {
		/*try { await super.build(); }
		catch ( err ) {
			console.error( `Build failed in parent super.build() method: ${err}` );
			throw err;
		}*/

		// --------------------------------
		// Set & Get Quick-Refs
		// --------------------------------
		// Get loading-screen loadbar.
		const loadbar	= this.spline.getScreen('loading').loadbar;
		// Update progress bar to show a tool has loaded.
		loadbar.update( 1, 10 ); // step 1 (initialization)
		//this.windows[0].expand( 800, 300 ); // auto-resize the window

		// --------------------------------
		// Plugin Hook(s)
		// --------------------------------
		// Initialize method plugin(s).
		await JestCreator.initPlugins( 'methods', this );
		loadbar.update(); // step 2

		// --------------------------------
		// Create Governor State(s)
		// --------------------------------
		// Instantiate some governor states.
		this.governor.init( 'clipboard', 1 ); // clipboard has 1 history state

		// --------------------------------
		// Create Application Interface [object]
		// --------------------------------
		// Build the panels for the main application screen.
		this.panel.addElements([
			// Build the panel
			{
				name:		'system',
				id:			'jest-creator-system',
				classes:	[ 'jest-creator-system' ]
			},
			{
				name:		'interface',
				id:			'jest-creator-interface',
				classes:	[ 'jest-creator-interface' ]
			},
			{
				name:		'status',
				id:			'jest-creator-status',
				classes:	[ 'jest-creator-status' ]
			}]);
		this.panel.refs.interface.addElements([
			// Build the panel
			{
				name:		'dock',
				id:			'jest-creator-interface-dock',
				classes:	[ 'jest-creator-interface-dock' ]
			},
			{
				name:		'left',
				id:			'jest-creator-interface-left',
				classes:	[ 'jest-creator-interface-left' ]
			},
			{
				name:		'center',
				id:			'jest-creator-interface-center',
				classes:	[ 'jest-creator-interface-center' ]
			},
			{
				name:		'right',
				id:			'jest-creator-interface-right',
				classes:	[ 'jest-creator-interface-right' ]
			}]);
		loadbar.update(); // step 3

		// --------------------------------
		// Setup Gameboard [object]
		// --------------------------------
		this.gameboard.display.addCanvas( 'workspace' ); // create gameboard canvas
		this.gameboard.display.addCanvas( 'sketchpad' ); // create sketchpad canvas
		const canvas = this.gameboard.display.getCanvas( 'workspace' );
		canvas.resize( 0, 0 );          // set default board width & height

		// --------------------------------
		// Animation Handler [object]
		// --------------------------------
		// Assign the gameboard canvas to the animator for animation rendering
		this.animator.canvas = canvas;  // Animator canvas is the world "screen"

		// --------------------------------
		// Create File Menu [object]
		// --------------------------------
		// Create the file menu.
		const filemenu = new JestFileMenu( this );
		this.filemenu  = filemenu;      // store ref
		filemenu.build();               // build menu DOM
		// Create a brand logo inside the system bar.
		//filemenu.setTitle( this.name );
		filemenu.panel.createPanel({
			name       : 'jestLogo',
			tag        : 'img',
			attributes : { src: `${this.config.root}/images/jest_logo_red.png` },
			classes    : [ 'jest-logo' ]
			});
		// Define list of file menu action buttons.
		const fmActions		= [
			{ name: 'new', 	    text: 'New' },
			{ name: 'open',     text: 'Open' },
			{ name: 'save',     text: 'Save' },
			{ name: 'save_as',  text: 'Save As' },
			//{ name: 'sync',     text: 'Sync' },
			{ name: 'close',    text: 'Close' }
			];
		// Iterate list of buttons & generate button.
		fmActions.forEach(
			action => {
				const button	= filemenu.createButton( action )
			});

		//-----------------------------
		// File Menu Icon(s)
		//-----------------------------
		// Use buttons panel to add SVG icons to various button(s).
		const fmBtns		= filemenu.buttons; // get file menu buttons DOM
		// New tool tip:
		fmBtns.new.clicker.addAttribute( 'data-tooltip-keys', 'Ctrl + N' );
		// Open tool tip:
		fmBtns.open.clicker.addAttribute( 'data-tooltip-keys', 'Ctrl + O' );
		// Save tool tip:
		fmBtns.save.clicker.addAttribute( 'data-tooltip-keys', 'Ctrl + S' );
		// Saveas tool tip:
		fmBtns.save_as.clicker.addAttribute( 'data-tooltip-keys', 'Ctrl + Shift + S' );
		// Sync tool tip:
		//fmBtns.sync.clicker.addAttribute( 'data-tooltip', 'Save file to cloud.' );
		// Close tool tip:
		fmBtns.close.clicker.addAttribute( 'data-tooltip-keys', 'Ctrl + W' );
		// Trigger next update.
		loadbar.update(); // step 4

		// --------------------------------
		// Create Input File Select [object]
		// --------------------------------
		// Add file open file-select input [object] to filemenu.
		const fileSelect	= new JestInputFileSelect( this, this.filetypes );
		this.fileSelect		= fileSelect;
		fileSelect.build( 'fileSelect', ['open-file-select'] );
		// Add hidden file-select input panel to filemenu.
		filemenu.panel.addPanel( 'fileSelect', fileSelect.panel );
		// Add file-menu to client interface.
		this.panel.refs.system.addPanel( 'filemenu', filemenu.panel );
		filemenu.register( 'btnClick', 'fileMenu',
			( e, action, button ) => {
				// Call the file menu action method.
				this.fileMenuAction( action.name );
			});
		fileSelect.register(
			'select', 'openFile',
			fileInfo => {
				// Suspend the app & attempt to open the file.
				this.suspend( 'openFile' ); // suspend app
				this.openFile( fileInfo );
			});

		// --------------------------------
		// Create Easels for File View(s)
		// --------------------------------
		// Create easel(s) list for file view(s).
		this.easels			= {}; // [object] of easels
		// Create an easel for viewing & editing files.
		this.easels.files	= new JestEasel( this );

		// --------------------------------
		// Create Toolbar [object]
		// --------------------------------
		// Create the toolbar.
		const toolbar		= new JestToolbar( this );
		this.toolbar		= toolbar; // set toolbar
		toolbar.build();
		// Add toolbar to client interface.
		this.panel.refs.interface.refs.left.addPanel( 'toolbar', toolbar.panel );
		// Add event listener callback(s).
		toolbar.register(
			'btnClick', 'toolSwitch',
			( e, action, button ) => {
				// Switch tools.
				this.toolbox.setTool( action.name );
			});
		loadbar.update(); // step 5

		// --------------------------------
		// Plugin Creator UI Hook(s)
		// --------------------------------
		// Initialize user interface plugin(s).
		await JestCreator.initPlugins( 'ui', this );

		// --------------------------------
		// Plugin Online Hook(s)
		// --------------------------------
		// Initialize online plugin(s).
		await JestCreator.initPlugins( 'online', this );

		// --------------------------------
		// Plugin Settings Hook(s)
		// --------------------------------
		// Initialize settings plugin(s).
		await JestCreator.initPlugins( 'settings', this );
		loadbar.update(); // step 6

		//--------------------------------
		// History Menu Setup
		//--------------------------------
		// Create history (undo/redo) sidebar menu.
		this.sidebar.addDisableExclusion( 'history' ); // prevent forced collapse
		const histSection	= this.sidebar.addSection( 'history', 'History', null, {}, null );
		/*histSection.panel.createPanel({
			name       : 'count',
			tag        : 'div',
			text       : '15 states',
			classes    : ['jest-sidebar-section-header-info']
			});*/

		// --------------------------------
		// Create Toolbox
		// --------------------------------
		const toolbox	= new JestToolbox( this ); // create toolbox
		this.toolbox	= toolbox; // keep reference
		// Register toolbox unequip tool event.
		toolbox.register(
			'unequip', 'appToolsDisable',
			( name ) => {
				// Disable all side panels.
				this.sidebar.disableAllSections();
				// Reset button display.
				this.toolbar.deactivateButtons(); // deactivate all buttons
			});
		// Register toolbox equip tool event.
		toolbox.register(
			'equip', 'appToolSwitch',
			( name ) => {
				// Block action if app is busy.
				if ( this.busy() ) return; // app busy‐gate
				this.emit( 'equip', null, name ); // emit hook
			});

		//--------------------------------
		// Call the Configuration App-Plug
		//--------------------------------
		await this.configure();

		// --------------------------------
		// Add Ticker Event(s)
		// --------------------------------
		// Register the core animation loop using a timer.
		this.timers['ani'].register(
			'tick', 'render',
				e => {
					// Update the interactivity of the program.
					this.update( e );
					// Update the visual gameboard drawing.
					this.draw( e );
				} );
		// Create upper right filemenu bar panel.
		const topright	= new JestDisplay( this );
		topright.build( 'topright', ['jest-filemenu-topright'] );
		this.panel.refs.system.addPanel( 'topright', topright.panel );
		loadbar.update();				// step 10

		// --------------------------------
		// Successfully Exit Build
		// --------------------------------
		// Reveal the application screen.
		this.spline.goToScreen( 'application' );
		// App built, set built status
		this.gearshift( 'built' );		// app build
		this.emit( 'build', null );		// emit a build hook event
		this.emit( 'postbuild', null );	// emit a post-build hook event

		console.log('TEST: plugin types attached per class');
		console.log('OSConfigurable.plugins:', Object.keys(OSConfigurable.plugins));
		console.log('JestTiler.plugins:', Object.keys(JestTiler.plugins));
		console.log('JestAnimator.plugins:', Object.keys(JestAnimator.plugins));
		console.log('OSConfigurable.plugins === JestTiler.plugins:', OSConfigurable.plugins === JestTiler.plugins);
		console.log('JestTiler.plugins === JestAnimator.plugins:', JestTiler.plugins === JestAnimator.plugins);

		return true;
	}

	// Manage the state.
	// RETURNS: [void].
	// e	- Ticker event [object] data about frame.
	update( e ) { }

	// --------------------------------
	// Rendering Method(s)
	// --------------------------------
	// Draw the central gameboard.
	// RETURNS: [void].
	// e	- Ticker event [object] data about frame.
	draw( e ) { }

	// Open a file, generic placeholder (should be overrode).
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * fileInfo	- File information [object].
	async openFile( fileInfo ) { }

	//--------------------------------
	// Mark Level File Changed
	//--------------------------------
	// Take a current program state & mark level file as changed.
	// NOTE: This lets the app know the level has unsaved change(s).
	// * s - [object] current file status.
	markChanged( s ) {
		// Tell the editor the level needs saving.
		s.file.jot( 'changed', true );
	}

	//--------------------------------
	// Synchronize All Tool Availability
	//--------------------------------
	// Evaluate every registered tool's operating restrictions.
	// RETURNS: [void].
	// Tools remain equipped or unequipped independently of blocking.
	// Each tool receives its own blockCheck event and stores its result.
	//
	// Run during regular application updates and immediately after
	// equipment changes so tool availability stays synchronized.
	refreshToolBlocking() {
		//--------------------------------
		// Check All Registered Tools
		//--------------------------------
		// Every tool determines its restrictions through its own
		// registered blockCheck listeners.
		for ( const tool of Object.values(this.toolbox.tools) ) {
			// Ignore unavailable tool references.
			if ( !tool ) continue;
			// Evaluate and update this tool's blocked status.
			this.toolBlockCheck( tool );
		}
	}

	//--------------------------------
	// Resolve Tool Restrictions
	//--------------------------------
	// Ask a tool to evaluate its current operating conditions.
	// Each registered blockCheck listener may append rejection reasons.
	// The client owns the final blocked state.
	// RETURNS: [boolean] true if the tool is blocked.
	// * tool - [JestTool] tool whose availability is being checked.
	toolBlockCheck( tool ) {
		//--------------------------------
		// Validate Tool
		//--------------------------------
		// An unavailable tool cannot be checked.
		if ( !tool ) return false;

		//--------------------------------
		// Prepare Tool Status
		//--------------------------------
		// Retrieve current application state without calling getFileStatus().
		// This prevents recursively triggering another tool block check.
		const state = this.getState();
		const level = state.level;

		// Construct a mutable status object for registered listeners.
		const status = {
			level   : level,
			layer   : level?.getActiveLayer() ?? null,
			reasons : []
			};

		//--------------------------------
		// Evaluate Tool Restrictions
		//--------------------------------
		// Allow tool-specific plugins to inspect the application state
		// and add reasons explaining why the tool cannot operate.
		tool.emit( 'blockCheck', null, status );

		//--------------------------------
		// Apply Tool Availability
		//--------------------------------
		// The existence of one or more reasons blocks tool operation.
		const blocked = status.reasons.length>0;

		// Store the resulting state without changing tool selection.
		tool.block( blocked, status.reasons );

		//--------------------------------
		// Synchronize Equipped Tool Appearance
		//--------------------------------
		// Only the equipped tool controls the main toolbar appearance.
		// A background status check must not change the active cursor.
		if ( tool===this.toolbox.activeTool ) {
			//--------------------------------
			// Reset Previous Toolbar Styling
			//--------------------------------
			// Clear stale blocked styling from previously equipped buttons.
			// This does not deactivate or disable any toolbar buttons.
			for ( const button of Object.values(this.toolbar.buttons) ) {
				if ( button.clicker?.el )
					button.clicker.el.classList.remove( 'tool-blocked' );
			}

			//--------------------------------
			// Style Current Toolbar Button
			//--------------------------------
			// Keep the button selected while indicating restricted use.
			const button = this.toolbar.buttons[tool.name];
			if ( button )
				button.clicker.el.classList.toggle( 'tool-blocked', blocked );

			//--------------------------------
			// Update Workspace Cursor
			//--------------------------------
			// A blocked editing tool displays the prohibited cursor.
			const canvas = this.gameboard.display.getCanvas('workspace');
			if ( canvas )
				canvas.el.classList.toggle( 'tool-blocked-cursor', blocked );
		}

		// Return the evaluated blocking result.
		return blocked;
	}

	//--------------------------------
	// Alert When Tool Is Unavailable
	//--------------------------------
	// Explain why a requested tool operation cannot be performed.
	// Reevaluate the tool's restrictions before reporting the problem.
	//
	// Only display a notification for an actual user action.
	// Never call this method from the regular update/draw loop.
	//
	// RETURNS: [boolean] true if the action cannot proceed,
	//                    false if the tool is available.
	// * tool   - [JestTool] tool attempting an operation.
	// * action - [string] description of the attempted operation.
	//   data   - [object] extra data about the attempted action.
	alertToolBlocked( tool, action='use this tool', data={} ) {
		//--------------------------------
		// Validate Tool
		//--------------------------------
		// Ignore missing and unequipped tools.
		// Multiple plugins can receive global actions, so an
		// inactive tool must not produce an unrelated notification.
		if ( !tool || !tool.enabled() ) return true; // irrelevant

		//--------------------------------
		// Refresh Blocking Status
		//--------------------------------
		// Reevaluate the tool immediately before its operation.
		// The regular update cycle may not have run since a
		// layer was hidden, locked, removed, or changed.
		if ( !this.toolBlockCheck(tool) ) return false; // available

		//--------------------------------
		// Retrieve Blocking Context
		//--------------------------------
		// The blockCheck listener records the rejection reasons.
		const reasons = tool.skim('blockReason') ?? [];

		// Resolve the active layer for a descriptive message.
		const level   = this.getState().level;
		const layer   = level?.getActiveLayer() ?? null;
		const name    = layer?.name ? `"${layer.name}"` : 'the active layer';

		//--------------------------------
		// Determine Explanation
		//--------------------------------
		// Prioritize missing context before individual restrictions.
		// A layer can be both hidden and locked simultaneously.
		let icon      = 'sm_notice.png'; // default notification icon
		let explanation;

		if ( reasons.includes('noLevel') ) {
			explanation = 'Open a level before attempting this operation.';
		}
		else if ( reasons.includes('noLayer') ) {
			icon        = 'sm_x.png';
			explanation = 'Select a layer in the Layers panel to continue.';
		}
		else if ( reasons.includes('layerHidden') && reasons.includes('layerLocked') ) {
			icon        = 'sm_key.png';
			explanation = `Layer ${name} is hidden and locked.`;
		}
		else if ( reasons.includes('layerHidden') ) {
			icon        = 'sm_hide.png';
			explanation = `Layer ${name} is hidden.`;
		}
		else if ( reasons.includes('layerLocked') ) {
			icon        = 'sm_lock.png';
			explanation = `Layer ${name} is locked.`;
		}
		else if ( reasons.includes('transparentTile') ) {
			icon        = 'sm_hide.png';
			explanation = `The coordinate (${data.x},${data.y}) does not reveal a tile.`;
		}
		else {
			// Fallback for custom restrictions registered by plugins.
			explanation =
				'The selected tool is unavailable in the current editing context.';
		}

		//--------------------------------
		// Compose Notification
		//--------------------------------
		// Include both the attempted action and the reason it failed.
		const message  = `Cannot ${action}. ${explanation}`;
		console.error( message );

		//--------------------------------
		// Prevent Repeated Notifications
		//--------------------------------
		// A held mouse button or repeated keyboard event should not
		// flood the user with identical notifications.
		const now      = Date.now();
		const previous = this._lastToolBlockNotice;
		if ( previous?.message===message && now-previous.time<1500 )
			return true; // prevent error flooding

		// Remember the most recently displayed notification.
		this._lastToolBlockNotice = { message, time:now };

		//--------------------------------
		// Display Notification
		//--------------------------------
		// Use notification UI instead of blocking browser alert dialog.
		this.noticer.notify({
			text      : message,
			icon      : `${this.config.root}/images/icons/${icon}`,
			duration  : 4500,
			//persistent: true,
			buttons   :
				[
				{ label: 'Ok', click: () => {/*console.log('Ok pressed');*/} }
				]
			//onExpire  : () => console.log('Notification expired')
			});
		// Play a "complete" sound-effect for affirmation.
		this.soundboard.playSound( 'jest_alert', 'mp3', 1.1 );

		// The attempted operation must not proceed.
		return true;
	}
}
// Make JestCreator globally accessible for plugins
window.JestCreator = JestCreator;
