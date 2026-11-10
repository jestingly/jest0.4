//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/clients/JestTiler.js loaded' );

//-------------------------
// Jest Application
//-------------------------
JestAppsRegistry.AppJestTiler =
	class JestTiler extends JestCreator {
		// Declare properties
		icon			= 'images/icons/jest_settings.png'; // application icon image URL [string] value
		name			= 'Tiler';		// name of application
		version			= '0.3beta';		// application version
		id				= 'tiler';			// tiler application id.
		// Server [objects]
		//online			= null;			// [object] JestOnline for connection to a websocket.
		// JestElement Reference(s)
		tilesetSelect	= null;				// [object] JestInputFileSelect for image file selection.
		// Tabbar menu(s)
		tabbarTileset	= null;				// [JestTabbar] tools for tileset palette view selection.
		// DOM Element Reference(s)
		palette			= null;				// [JestCanvas] object for handling tile selection.
		// Tool handling
		easels			= null;				// [object] of easels that hold file views.
		toolbar			= null;				// [JestToolbar] Tool menu selector (draw, fill, etc.)
		toolbox			= null;				// [JestToolbox] Central tool manager for enabling/disabling tools and temp swaps
		// Drawing propert(ies)
		swatches		= null;				// [object] Display swatch(es) for palette tile(s).
		swatchPanel		= null;				// [object] JestSwatchPanel for handling tile swatches.
		// Editor area
		editor			= null;				// [object] Panel container for editing arena (board & sidebar).
		board			= null;				// [JestElement] Board for editing the level.
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
			if ( !ok ) return false; // failed
			// --------------------------------
			// Post Launch Action(s)
			// --------------------------------
			// Disable all side panels.
			this.sidebar.disableAllSections();
			// Click a default tool to use.
			this.toolbar.buttons.levelMarquee.panel.refs.clicker.el.click();
			// Set the foreground & background swatches.
			this.toolSetTileSwatch( { tx:0, ty: 1 }, 'foreground' );	// set default swatch
			this.toolSetTileSwatch( { tx: 63, ty: 31 }, 'background' );	// set default swatch
			// Force open an empty new level.
			this.suspend( 'newFile' );	// suspend app
			this.newFile();			// open blank file
			return true; // succcess
		}

		// Preset the build architecture.
		// RETURNS: [boolean] `true` on success else `false` on fail.
		async preset() {
			this.filetypes	= '.nw';
			return true; // success
		}

		// Setup the tiler work station inside the app.
		// RETURNS: [boolean] `true` on success else `false` on fail.
		async configure() {
			// --------------------------------
			// Set & Get Quick-Refs
			// --------------------------------
			// Get the level editing canvas
			const gameboard	= this.gameboard;	// get gameboard reference
			const canvas	= gameboard.display.getCanvas( 'workspace' );
			// Get loading-screen loadbar.
			const loadbar	= this.spline.getScreen('loading').loadbar;
			const toolbar	= this.toolbar;
			// Get the file menu.
			const filemenu	= this.filemenu;	// get ref

			// --------------------------------
			// Plugin Tiler UI Hook(s)
			// --------------------------------
			// Initialize user interface plugin(s).
			await JestTiler.initPlugins( 'ui', this );

			// --------------------------------
			// Extend File Menu [object]
			// --------------------------------
			const tilerActions	= [
				{ name: 'undo',     text: 'Undo'   },
				{ name: 'redo',     text: 'Redo'   },
				{ name: 'copy',     text: 'Copy'   },
				{ name: 'paste',    text: 'Paste'  },
				{ name: 'cut',      text: 'Cut'    },
				{ name: 'delete',   text: 'Delete' }
				];
			// Iterate list of buttons & generate button.
			tilerActions.forEach(
				action => {
					const button	= filemenu.createButton( action )
				});

			//-----------------------------
			// File Menu Icon(s)
			//-----------------------------
			// Use buttons panel to add SVG icons to various button(s).
			const fmBtns		= filemenu.buttons; // get file menu buttons DOM
			// Undo tool tip:
			fmBtns.undo.clicker.addAttribute( 'data-tooltip-keys', 'Ctrl + Z' );
			// Redo tool tip:
			fmBtns.redo.clicker.addAttribute( 'data-tooltip-keys', 'Ctrl + Y' );
			// Copy tool tip:
			fmBtns.copy.clicker.addAttribute( 'data-tooltip-keys', 'Ctrl + C' );
			// Paste tool tip:
			fmBtns.paste.clicker.addAttribute( 'data-tooltip-keys', 'Ctrl + V' );
			// Cut tool tip:
			fmBtns.cut.clicker.addAttribute( 'data-tooltip-keys', 'Ctrl + X' );
			// Delete tool tip:
			fmBtns.delete.clicker.addAttribute( 'data-tooltip-keys', 'Delete' );

			// --------------------------------
			// Create Toolbar Title
			// --------------------------------
			// Create primary swatch (foreground).
			/*const title		= new JestDisplay( this );
			title.build( 'title', ['title'] ); // build display
			toolbar.panel.addPanel( 'title', title.panel );
			title.panel.addElements([{
				name    : 'text',
				tag     : 'div',
				text    : 'Swatch',
				classes : []
				}])*/

			// --------------------------------
			// Create Swatch Display(s)
			// --------------------------------
			// Create swatch(es) list of swatch display(s).
			this.swatches	= {}; // [object] of tile swatches
			// Create primary swatch (foreground).
			const swatchFg	= new JestDisplay( this );
			this.swatches.foreground = swatchFg;
			swatchFg.build( 'swatch', ['swatch','swatch-fg'] ); // build display
			toolbar.panel.addPanel( 'swatchFg', swatchFg.panel );
			swatchFg.panel.addAttribute( 'data-tooltip', 'Foreground Tile' );
			// Create secondary swatch (background).
			const swatchBg	= new JestDisplay( this );
			this.swatches.background = swatchBg;
			swatchBg.build( 'swatch', ['swatch','swatch-bg'] ); // build display
			toolbar.panel.addPanel( 'swatchBg', swatchBg.panel );
			swatchBg.panel.addAttribute( 'data-tooltip', 'Background Tile' );

			// --------------------------------
			// Load Default Game-World Presets [object]
			// --------------------------------
			// Attempt to download default game world presets.
			await this.gameboard.addWorld( 'jest' );
			const world		= this.gameboard.getWorld( 'jest' );
			//console.log( `Opening new world preset file [object] "${fileInfo.stem}".` );
			// Open game world tileset(s).
			for ( const data of world.tilesets ) {
				await this.openTilesetFile( data.stem );
			}
			loadbar.update(); // step 7

			// --------------------------------
			// Load Toolbox Tool Plugin(s)
			// --------------------------------
			// Setup temporary loadbar variable(s).
			// NOTE: Loadbar is accessible after UI plugins.
			let loadStep	= 0; // tracks current step
			let loadTotal	= 0; // total steps
			// Determine how many tool plugin(s) to load.
			loadTotal		= this.countPlugins( 'tools' );
			// Condense loader screen load segments.
			let loadScrnSteps	= 2;
			// Begin discharging load events.
			this.register(
				'pluginInitLoadedItem:tools', 'tilerLoadbar',
				() => {
					console.log( `Loaded tool ${loadStep} of ${loadTotal}.` );
					// Update progress bar to show a tool has loaded.
					this.loadbar.update( ++loadStep, loadTotal );
					// Update load screen loadbar.
					loadbar.update( 7+loadScrnSteps*(loadStep/loadTotal) ); // step 8 & 9
				});
			// Initialize tools plugins.
			await JestTiler.initPlugins( 'tools', this );

			//--------------------------------
			// Synchronize Tool Availability
			//--------------------------------
			// Reevaluate restrictions when application state changes.
			// The tool remains equipped regardless of the result.
			this.register(
				'update', 'refreshToolBlocking',
				() => this.refreshToolBlocking()
				);
			// Refresh immediately after the equipped tool changes.
			// Do not wait for the next application update cycle.
			this.toolbox.register(
				'postequip', 'refreshToolBlocking',
				() => this.refreshToolBlocking()
				);

			//--------------------------------
			// Move Swatch Buttons
			//--------------------------------
			// Move swatch buttons to end.
			toolbar.panel.reorderChild( toolbar.buttons.eyedropper.panel, -1 );
			toolbar.panel.reorderChild( swatchFg.panel, -1 );
			toolbar.panel.reorderChild( swatchBg.panel, -1 );

			// --------------------------------
			// Governor Hook(s)
			// --------------------------------
			// Notify user about a clipboard "copy" event.
			this.governor.register(
				'logged', 'clipboardSuccess',
				( key, stack ) => {
					// Handle a clipboard "copy" event.
					if ( key==='clipboard' ) {
						// Send user a simple notification.
						this.noticer.notify({
							text      : 'Marquee selection copied to clipboard!',
							icon      : `${this.config.root}/images/icons/sm_copy.png`,
							duration  : 4000,
							//persistent: true,
							buttons   :
								[
								{ label: 'Ok', click: () =>  {/*console.log('Ok pressed');*/} }
								]
							//onExpire  : () => console.log('Notification expired')
							});
						// Play "copy" sound effect to signal action.
						this.soundboard.playSound( 'jest_copy', 'wav', 1.05 );
					}
				});

			// --------------------------------
			// Miscellaneous Event(s)
			// --------------------------------
			// Register cabinet file saved event(s).
			this.register(
				'file:saved', 'appResponse',
				() => {
					// Send user a simple notification.
					this.noticer.notify({
						text      : 'File successfully saved!',
						icon      : `${this.config.root}/images/icons/sm_write.png`,
						duration  : 4000,
						//persistent: true,
						buttons   :
							[
							{ label: 'Ok', click: () =>  {/*console.log('Ok pressed');*/} }
							]
						//onExpire  : () => console.log('Notification expired')
						});
					// Play a "complete" sound-effect for affirmation.
					this.soundboard.playSound( 'jest_complete', 'mp3', 1.1 );
				});

			// Register cabinet file closed event(s).
			this.register(
				'file:closed', 'appResponse',
				( view ) => {
					// Play sound-effect signal.
					this.soundboard.playSound( 'jest_close2', 'mp3', 1.05 );
				});

			// Notify user about a delete event.
			this.register(
				'deleted', 'deleteSuccess',
				() => {
					// Play sound effect to signal action.
					this.soundboard.playSound( 'jest_delete', 'wav', 1.1 );
				});
			// Notify user about an undo event.
			this.register(
				'undo', 'undoSuccess',
				() => {
					// Play sound effect to signal action.
					this.soundboard.playSound( 'jest_undo', 'wav', 1.01 );
				});
			// Notify user about a redo event.
			this.register(
				'redo', 'redoSuccess',
				() => {
					// Play sound effect to signal action.
					this.soundboard.playSound( 'jest_redo', 'wav', 1.035 );
				});
			// Notify user about a paste event.
			this.register(
				'pasted', 'pasteSuccess',
				() => {
					// Play sound effect to signal action.
					this.soundboard.playSound( 'jest_paste', 'wav', 1.025 );
				});
			// Signal foreground swatch change (from swatch panel).
			this.swatchPanel.register(
				'select', 'foregroundChange',
				() => {
					// Play sound-effect to signal swatch change.
					this.soundboard.playSound( 'jest_eyedrop', 'wav', 1.3 );
				});

			// Return success
			return true; // success
		}

		//--------------------------------
		// File Handling Method(s)
		//--------------------------------
		// File menu action taking place.
		// RETURNS: [void].
		// * name		- [string] Value of action taking place.
		async fileMenuAction( name ) {
			// Block action if app is busy.
			if ( this.busy() ) return;	// app busy‐gate
			// Process which action is being triggered.
			let view, level, key;
			const state	= this.getState();				// get current program state
			view		= this.tabbarFile.activeView;	// get active level file
			level		= view.file.context;			// active JestLevel instance
			key			= view.skey;					// governor stack key
			switch ( name ) {
				case 'new': // start a new level file
					this.suspend( 'newFile' );		// suspend app
					await this.newFile();			// call the new method
					break;
				case 'open': // open file select
					await this.fileSelect.openFileDialog();
					//this.fileSelect.input.el.click();
					break;
				case 'save': // save file data
					// Validate an active view is open.
					if ( !view ) return; // disabled
					await this.cabinet.saveFile( view.file.skey, "overwrite" ); // save
					break;
				case 'save_as': // save file data
					// Validate an active view is open.
					if ( !view ) return; // disabled
					await this.cabinet.saveFile( view.file.skey, "new" ); // save as
					break;
				/*case 'sync': // sync file data
					// Validate an active view is open.
					if ( !view ) return; // disabled
					await this.cabinet.saveFile( view.file.skey, "cloud" ); // sync to cloud
					break;*/
				case 'close': // close the file
					// Validate an active view is open.
					if ( !view ) return; // disabled
					// Suspend the app & attempt to close the file.
					this.suspend( 'closeFile' );	// suspend app
					this.closeFile( view );			// close view (defaults to active)
					break;
				case 'undo': // undo a level action
					this.revertFile( -1 );
					break;
				case 'redo': // redo a level action
					this.revertFile( 1 );
					break;
				case 'copy': // copy a selection
					this.copy();
					break;
				case 'cut': // cut a selection
					this.cut();
					break;
				case 'paste': // paste a previous copy
					this.paste();
					break;
				case 'delete': // delete a selection
					this.delete();
					break;
				default: break;
			}
		}

		//--------------------------------
		// Open Various File(s)
		//--------------------------------
		// Open a tileset palette arena.
		// RETURNS: [boolean] `true` on success else `false` on fail.
		// * filename	- [string] Value of tileset name (e.g. "pics1").
		async openTilesetFile( filename ) {
			// Use the secretary to a read a file.
			//try {
				// Clip the filename from the path data.
				const name		= this.getFilename( filename );
				//--------------------------------
				// Create Tileset File [object]
				//--------------------------------
				// Create a blank new cabinet file [object].
				console.log( `Opening new selectable tileset file [object] "${name}".` );
				const cabFile	= new JestFileTileset( this, 'remote', name );
				await cabFile.openFile( name ); // attempt to open file contents
				//--------------------------------
				// Add File to Cabinet
				//--------------------------------
				// Open the file in the cabinet.
				// NOTE: This gives each file a unique system key.
				this.cabinet.openFile( cabFile );
				//--------------------------------
				// Setup File Editing View
				//--------------------------------
				// Create a new view panel for level.
				const view		= new JestFileViewEditorPainterTileset( this );
				view.build();				// build the view
				view.openFile( cabFile );	// open the tileset in the viewer
				// Open new tab for view.
				this.tabbarTileset.addView( view );
				return true; // success
			/*}
			catch ( err ) {
				console.warn( `Tileset data corrupt or unreadable: ${err.message}` );
				return false; // fail
			}*/
		}

		// Create a brand-new empty level
		async newFile() {
			// Block action if app is busy.
			if ( this.busy('newFile',true,true) ) return; // app busy‐gate
			try {
				// Create empty FileInfo [object].
				const fileInfo	= this.getFileInfo( 'untitled.nw' );
				this.suspend( 'openFile' ); // suspend app
				return await this.openFile( fileInfo );
			}
			finally {
				this.resume(); // unlock new actions
			}
		}

		// Open a level file.
		// RETURNS: [boolean] `true` on success else `false` on fail.
		// * fileInfo	- File information [object].
		async openFile( fileInfo ) {
			// Block action if app is busy.
			if ( this.busy('openFile',true,true) ) return; // app busy‐gate
			try {
				//--------------------------------
				// Create Level File [object]
				//--------------------------------
				// Attempt to read local file if requested.
				if ( fileInfo.network!=='none' ) { // existing level
					// Use the Secretary to read a local file's data.
					const ok	= await this.readLevelData( fileInfo )
					if ( ok===null ) {
						console.warn( 'Level file could not be opened!' );
						alert( 'Could not open level file.' );
						return false; // failed
					}
					console.log( `Opening new editable level file [object] "${fileInfo.filename}".` );
				}

				//--------------------------------
				// Create Level File [object]
				//--------------------------------
				// Create a blank new cabinet file [object].
				const cabFile	= new JestFileLevel( this, 'local', fileInfo.stem );

				//--------------------------------
				// Register Event(s)
				//--------------------------------
				// Attach an open-file event listener to handle data callback.
				cabFile.register(
					'openFile', 'loadObjects',
					( payload ) => {
						// Emit an app-level "open level file" data event.
						this.emit( 'loadFileData', null, cabFile, payload )
					});
				// Attach a saved listener when the file data has been written.
				cabFile.register(
					'saved', 'appResponse',
					( e ) => {
						// Respond to saved status.
						switch ( e.status ) {
							case 'success': // successfully saved
								// Emit "saved" success event.
								this.emit( 'file:saved', null );
								break;
							default: break; // unknown
						}
					});

				//--------------------------------
				// Read & Open File
				//--------------------------------
				// Use level's openFile, passing file object if useful:
				await cabFile.openFile( fileInfo ); // attempt to open

				//--------------------------------
				// Add File to Cabinet
				//--------------------------------
				// Open the file in the cabinet.
				// NOTE: This gives each file a unique system key.
				this.cabinet.openFile( cabFile );

				//--------------------------------
				// Setup File Editing View
				//--------------------------------
				// Create a new view panel for level.
				const view		= new JestFileViewEditorPainterLevel( this );
				const skey		= view.skey;		// we'll use system key for various signature(s)
				view.build();						// build the view
				this.easels.files.showcase( view );	// add view to "files" easel
				// Open the file.
				view.openFile( cabFile );			// open the level file in the view

				//--------------------------------
				// Handle File Change/Save Event(s)
				//--------------------------------
				// Set view mode to pre-saved (since opened file) & unchanged.
				cabFile.jot( "saved", true );		// it has not been saved
				cabFile.jot( "changed", false );	// it has not been changed

				//--------------------------------
				// Setup Undo/Redo History Management
				//--------------------------------
				// Set edit history state (undo/redo) limit.
				view.governor.init( 'edit', 20 );

				// Add file change event listener.
				view.governor.register(
					'changed', 'fileChange',
					( state, snapshot ) => {
						// Check if the file has changed.
						switch ( snapshot.action ) {
							case "dropRegion":
							case "fillRegion":
							case "fillTile":
							case "sparseRegion":
								// The file has changed.
								view.file.jot( "changed", true );
								break;
							default: break;
						}
					});

				// Listen for undo event.
				view.register(
					'undo', 'appListen',
					( skey, snapshot ) => this.fileReverted('undo',skey,snapshot) );

				// Listen for redo event.
				view.register(
					'redo', 'appListen',
					( skey, snapshot ) => this.fileReverted('redo',skey,snapshot) );

				// Governor action event(s).
				view.governor.register(
					'undo', 'appResponse',
					( key, snapshot, count, index ) => this.emit('undo',null) );

				// Governor action event(s).
				view.governor.register(
					'redo', 'appResponse',
					( key, snapshot, count, index ) => this.emit('redo',null) );

				// Add a history navigator UI menu of edit(s).
				view.setupHistoryUI();
				// Refit the history collapsible menu when history changes.
				view.register(
					'history:updated', 'refitMenu',
					() => this.sidebar.refit('history') ); // refit history list in menu
				// Appropriately label each history item.
				view.register(
					'history:logged', 'labelItem',
					( item, log ) => {
						// Broadcast event to custom label history states.
						this.emit( 'history:logged', null, item, log );
					});

				// Add history panel to the sidebar menu.
				const histMenu	= this.sidebar.getSection( 'history' );
				histMenu.addItem( skey, view.history.panel );
				view.history.hide(); // hide the history

				//--------------------------------
				// Add View to Tab-bar
				//--------------------------------
				// Open new tab for view.
				const tab	= this.tabbarFile.addView( view );
				// Add filetype icon.
				/*tab.clicker.addElements([
					{
						name       : 'icon',
						tag        : 'svg',
						attributes : {
							xmlns        : "http://www.w3.org/2000/svg",
							viewBox      : "0 0 1200 1200"
							},
						classes    : [ 'ico-javatar' ],
						elements   :
							[
								{
									name       : 'path',
									tag        : 'path',
									attributes : { 'd': 'M918.71,525.01v215.28c0,102.93-110.97,179.57-207.29,179.28l-435.74,1.33L0,1198.61l727.99,1.39c260.18-14.63,459.05-195.82,472.01-459.59l-.14-740.41-526.1,523.66c-1.16,6.29,2.75,3.83,6.89,4.13,62.9,4.59,129.33-.9,192.02-2.89,15.3-.49,30.76.59,46.05.11Z' }
								}
							]
					}]);*/
			}
			finally {
				this.resume(); // unlock new actions
			}

			//--------------------------------
			// Emit Opened File Event
			//--------------------------------
			// Emit an "opened file" event listener.
			await this.emitAsync( 'openedFile', {} );

			//--------------------------------
			// Finish & Play Confirmation Sound
			//--------------------------------
			// Play sound-effect to signal.
			//if ( this.skim('quiet:openJani')!==true )
				//this.soundboard.playSound( 'jest_open1', 'mp3', 1.1 );

			// Return [bool] value.
			return true; // success
		}

		// Close an open level file.
		// RETURNS: [void].
		// * view	- [object] JestFileView targeting to close ([null] for active level).
		async closeFile( view=null ) {
			// Block action if app is busy.
			if ( this.busy('closeFile',true,true) ) return; // app busy‐gate
			try {
				//--------------------------------
				// Confirm File Close
				//--------------------------------
				// Check for open view.
				if ( !view ) return;
				// Warn if unsaved changes.
				const saved		= view.file.skim( "saved" );
				const changed	= view.file.skim( "changed" );
				if ( !saved || changed )
					if ( !confirm("You have unsaved changes. Close anyway?") ) return;
					// Close current level.
				this.suspend( 'tabbarFileClose' ); // suspend app
				await this.tabbarFileClose( view );
				// Update the UI.
				this.update();
			}
			finally {
				this.resume(); // unlock new actions
			}
		}

		//--------------------------------
		// Reporting Method(s)
		//--------------------------------
		// Get the state of the selected level and tileset views.
		// RETURNS: [object] containing selected view information.
		//   selection	- [string] View selection mode ('active' or 'previous').
		getState( selection='active' ) {
			//--------------------------------
			// Determine View Selection
			//--------------------------------
			// Select which tabbar view references should be inspected.
			// Defaults to currently active views for backward compatibility.
			const property	= selection==='previous' ? 'previousView' : 'activeView';

			// Begin the report.
			let report	= {
				// Active level info.
				levelView:				null,
				level:					null,
				levelViewKey:			null,
				// Active tileset info.
				tilesetView:			null,
				tileset:				null,
				tilesetViewKey:			null
				};

			//--------------------------------
			// Get Selected Level View
			//--------------------------------
			// Retrieve the active or previously active level view.
			const levelView = this.tabbarFile[property];
			// Populate the level information when a valid view exists.
			if ( levelView ) {
				report.levelView		= levelView;
				report.level			= levelView.file.context;
				report.levelViewKey		= levelView.skey;
			}

			//--------------------------------
			// Get Selected Tileset View
			//--------------------------------
			// Retrieve the active or previously active tileset view.
			const tilesetView = this.tabbarTileset[property];
			// Populate the tileset information when a valid view exists.
			if ( tilesetView ) {
				report.tilesetView		= tilesetView;
				report.tileset			= tilesetView.file.context;
				report.tilesetViewKey	= tilesetView.skey;
			}
			// Return the requested application state.
			return report;
		}

		//--------------------------------
		// Resolve Current Level File
		//--------------------------------
		// RETURNS: [object|null] file status and level reference.
		/*const current = function() {
			// Reuse the same file status convention as other JEST tools.
			const s = client.getFileStatus( tool, true );
			if ( !s || !s.file || !s.levelView ) return null;
			// The active level is the level view's file context.
			const level = s.levelView.file?.context ?? s.file.context ?? null;
			if ( !level || typeof level.getLayers!=='function' ) return null;
			return { ...s, level }; // resolved state
		};*/

		// Return useful information about the selected level and tileset.
		// RETURNS: [object] containing file status, or [null] if unavailable.
		//   tool		- [object] Tool requesting the status.
		//   bypass		- [bool] Whether to bypass the application's busy check.
		//   selection	- [string] View selection mode ('active' or 'previous').
		getFileStatus( tool=null, bypass=false, selection='active' ) {
			//--------------------------------
			// Initial Gatekeep
			//--------------------------------
			// Block the operation while the application is busy,
			// unless the caller explicitly requests a bypass.
			if ( !bypass && this.busy() ) return null; // app busy‐gate

			//--------------------------------
			// Handle Tool & Its Status
			//--------------------------------
			// Refresh the requesting tool's availability.
			// The result does not prevent retrieving file information.
			if ( tool )
				this.toolBlockCheck( tool );
			// Retrieve the tool's primary curator, if available.
			const curator = tool?.curators?.primary ?? null;

			//--------------------------------
			// Require File to Be Open
			//--------------------------------
			// Resolve either the active or previously active tabbar views.
			const state			= this.getState( selection ); // get current state
			const levelView		= state.levelView;
			const tilesetView	= state.tilesetView;
			// A level view must exist to produce a valid file status.
			if ( !levelView ) return null; // no active jani

			//--------------------------------
			// Purview Useful Data
			//--------------------------------
			// Provide the requesting tool with references to the
			// selected level, file, tileset, and associated system keys.
			return {
				curator,
				// Get level file information.
				'levelView'      : levelView,
				'levelViewKey'   : state.levelViewKey,
				'file'           : levelView.file,
				'fileKey'        : levelView.file.skey,
				'level'          : levelView.file.context,
				'levelKey'       : levelView.file.context.skey,
				// Get tileset file information.
				'tilesetView'    : tilesetView,
				'tilesetViewKey' : tilesetView.skey,
				'tileset'        : tilesetView.file.context
				};
		}

		// --------------------------------
		// Enable & Disable
		// --------------------------------
		// Enable the tiler application.
		// RETURNS: [void]
		enable() {
			// Add event listener(s)
			this.reset();		// reset the tool
			super.enable();		// parent enable method
		}
		// Disable the tiler application.
		// RETURNS: [void]
		disable() {
			// Reset the selection.
			this.reset();		// deselect if selected
			super.disable();	// parent disable method
		}

		//--------------------------------
		// Button Toggling Method(s)
		//--------------------------------
		// Reset the program.
		// RETURNS: [void].
		reset() { }

		// Manage the state.
		// RETURNS: [void].
		// e	- Ticker event [object] data about frame.
		update( e ) {
			// Get active state info.
			let state	= this.getState(); // get current program state
			let snapshot, report, mode, enabled, key, toggle;
			// If no selection is made, return null.
			enabled		= this.skim( 'enabled' );
			mode		= this.skim( 'mode' );
			if ( !enabled ) return;
			// Emit pre-update hook.
			this.emit( 'preupdate', null, e, state, enabled, mode ); // emit hook
			//--------------------------------
			// Interactor Buttons Are Disabled (until enabled)
			//--------------------------------
			// Disable all actionbar tools by default.
			this.actionbar.toggleAll( false );
			//--------------------------------
			// Handle Mode
			//--------------------------------
			// Handle mode.
			switch ( mode ) {
				case 'running':	// application is running
					//--------------------------------
					// Level File Is Open
					//--------------------------------
					// Determine if a file is open.
					if ( state.levelView!==null ) {
						key			= state.levelViewKey;
						report		= state.levelView.governor.report( 'edit' );
						//console.log( report );
						//--------------------------------
						// Enable/Disable Button(s)
						//--------------------------------
						// Check if file changed & is saveable.
						toggle		= state.levelView.file.skim( "changed" );
						this.filemenu.toggle( 'save', toggle );		// save toggle access
						// Check if file has ever been saved.
						toggle		= state.levelView.file.skim( "saved" );
						this.filemenu.toggle( 'save_as', toggle );	// save as toggle access
						// Check if user is logged in.
						//toggle		= true;// this.login.logged;
						//this.filemenu.toggle( 'sync', toggle );		// sync toggle access
						// Close file is permitted.
						this.filemenu.toggle( 'close', true );		// close is allowed
						// Check if undo is possible.
						toggle		= report.undoCount>0;
						this.filemenu.toggle( 'undo', toggle );		// undo toggle access
						// Check if redo is possible.
						toggle		= report.redoCount>0;
						this.filemenu.toggle( 'redo', toggle );		// redo toggle access
						// Disable copy & delete buttons by default.
						this.filemenu.toggle( 'copy', false );		// copy is not allowed
						this.filemenu.toggle( 'cut', false );		// cut is not allowed
						this.filemenu.toggle( 'delete', false );	// delete is not allowed
						// Attempt to enable paste button.
						snapshot 	= this.governor.current( 'clipboard' );
						toggle		= snapshot ? true : false;
						this.filemenu.toggle( 'paste', toggle );	// paste toggle access
					}
					//--------------------------------
					// Level File Closed
					//--------------------------------
					else { // If no file is open, disable various components.
						//--------------------------------
						// Enable/Disable Button(s)
						//--------------------------------
						this.filemenu.toggle( 'save', false );		// save is not allowed
						this.filemenu.toggle( 'save_as', false );	// save is not allowed
						//this.filemenu.toggle( 'sync', false );		// sync is not allowed
						this.filemenu.toggle( 'close', false );		// close is not allowed
						this.filemenu.toggle( 'undo', false );		// undo is not allowed
						this.filemenu.toggle( 'redo', false );		// redo is not allowed
						this.filemenu.toggle( 'copy', false );		// copy is not allowed
						this.filemenu.toggle( 'cut', false );		// cut is not allowed
						this.filemenu.toggle( 'paste', false );		// paste is not allowed
						this.filemenu.toggle( 'delete', false );	// delete is not allowed
					}
				default: break;	// uknown mode
			}
			// Emit post-update hooks.
			this.emit( 'update', null, e, state, enabled, mode );		// emit hook
			this.emit( 'postupdate', null, e, state, enabled, mode );	// emit hook
		}

		// --------------------------------
		// Rendering Method(s)
		// --------------------------------
		// Draw the central gameboard.
		// RETURNS: [void].
		// * e - Ticker event [object] data about frame.
		draw( e ) {
			// --------------------------------
			// Check State & Status
			// --------------------------------
			// Get active state info.
			let state	= this.getState(); // get current program state
			let snapshot, report, mode, enabled, key;
			// If no selection is made, return null.
			enabled		= this.skim( 'enabled' );
			mode		= this.skim( 'mode' );
			if ( !enabled ) return null;
			// --------------------------------
			// Check If Canvas Is Available
			// --------------------------------
			// Determine if editor canvas is set.
			const editor     = this.gameboard.display.getCanvas( 'workspace' );
			if ( !editor || !editor.el ) {
				console.warn( 'Workspace canvas is not set or invalid' );
				return; // abort
			}
			const editorCtx  = editor.el.getContext( '2d' );

			// Determine if palette canvas is set.
			const palette    = this.gameboard.display.getCanvas( 'palette' );
			if ( !palette || !palette.el ) {
				console.warn( 'Palette canvas is not set or invalid' );
				return; // abort
			}
			const paletteCtx = palette.el.getContext( '2d' );

			// Determine if sketchpad canvas is set.
			const sketch     = this.gameboard.display.getCanvas( 'sketchpad' );
			if ( !sketch || !sketch.el ) {
				console.warn( 'Sketchpad canvas is not set or invalid' );
				return; // abort
			}
			const sketchCtx  = sketch.el.getContext( '2d' );

			// Emit pre-draw hooks.
			this.emit( 'predraw', null,
				e, state, enabled, mode,
				editorCtx, paletteCtx, sketchCtx );

			// --------------------------------
			// Draw Depending Upon Mode
			// --------------------------------
			// Handle mode.
			switch ( mode ) {
				case 'running':	// application is running
					// --------------------------------
					// Render the Editor Canvas
					// --------------------------------
					// Require a file to be open.
					if ( state.levelView!==null ) {
						// Set the fill color to blue
						//editorCtx.fillStyle = '#000';
						// Clear the canvas with an empty screen.
						editorCtx.clearRect( 0, 0, editor.el.width, editor.el.height );
						//editorCtx.fillStyle = 'transparent';
						// --------------------------------
						// Draw Level Board on Editor
						// --------------------------------
						// Draw active view on editor.
						state.levelView.refreshCanvas(); // refresh composite render
						const levelImage = state.levelView.getViewRender(); // get canvas
						editorCtx.drawImage(
							levelImage.el,   // image contents being copied
							0, 0,            // source crop x,y
							levelImage.width, levelImage.height, // source W x H
							0, 0,            // destination x,y
							editor.width, editor.height // destination W x H
							);
					}

					// --------------------------------
					// Render the Palette Canvas
					// --------------------------------
					// Require a file to be open.
					if ( state.tilesetView!==null ) {
						// Clear the canvas with an empty screen.
						paletteCtx.clearRect( 0, 0, palette.el.width, palette.el.height );
						// --------------------------------
						// Draw Tileset Board on Palette
						// --------------------------------
						// Draw active view on palette.
						const tilesetImage	= state.tilesetView.getViewRender();
						paletteCtx.drawImage(
							tilesetImage.el,	// image contents being copied
							0, 0,				// source crop x,y
							tilesetImage.el.width, tilesetImage.el.height, // source W x H
							0, 0,				// destination x,y
							palette.width, palette.height // destination W x H
							);
					}
					break;
				default: break; // no mode to draw
			}
			// Emit post-draw hooks.
			this.emit( 'draw', null,
				e, state, enabled, mode,
				editorCtx, paletteCtx, sketchCtx );
			this.emit( 'postdraw', null,
				e, state, enabled, mode,
				editorCtx, paletteCtx, sketchCtx );
		}

		//--------------------------------
		// Copy / Paste / Clear Method(s)
		//--------------------------------
		// Store some selection to clipboard for paste.
		copy() {
			// Emit copy event(s).
			this.emit( 'copy', null );		// emit hook
		}

		// Store some selection to clipboard for paste & remove it.
		cut() {
			// Emit cut event(s).
			this.emit( 'copy', null );		// emit hook
			this.emit( 'delete', null );	// emit hook
		}

		// Paste an item from the clipboard.
		paste() {
			// Access application state & current clipboard.
			const state		= this.getState(); // get current program state
			// Look for a snapshot on the clipboard.
			const snapshot 	= this.governor.current( 'clipboard' ); // clipboard data
			if ( !snapshot ) return;
			// Emit paste event(s).
			this.emit( 'paste', null, snapshot ); // emit hook
		}

		// Delete a selected item.
		delete() {
			// Access application state & emit event.
			const state		= this.getState(); // get current program state
			this.emit( 'delete', null ); // emit hook
		}

		//--------------------------------
		// Drag & Drop Method(s)
		//--------------------------------
		// Set the active background tile swatch.
		// RETURNS: [boolean] `true` on success else `false` on fail.
		// * tile	- [object] Coordinates of tile x,y on tileset.
		// * key	- [string] Value of swatch to sample to (e.g. 'foreground').
		toolSetTileSwatch( tile, key ) {
			// Block action if app is busy.
			if ( this.busy() ) return;	// app busy‐gate
			// Get active state info.
			const state		= this.getState();				// get current program state
			//console.log( state );
			// Validate an active view is open.
			if ( !state.tilesetView ) return false;			// no active tileset
			if ( !this.swatches?.[key] ) return false;		// no swatch
			// --------------------------------
			// Get Double-Clicked Tile
			// --------------------------------
			const { tx, ty } = tile;
			// Grab the tile snapshot & store in display backend contents data.
			const data		= state.tileset.getTileData( tx, ty );
			const display	= this.swatches[key];
			display.contents = data;
			// Render the tile in the swatch display
			const canvas	= state.tileset.getTileStamp( tx, ty );
			display.addCanvas( 'tile' );		// add a canvas to display
			display.render( 'tile', canvas );	// render tile on canvas
			// Highlight the swatch.
			if ( display ) {
				display.panel.addClass( 'signal' );
				setTimeout( ()=>display.panel.removeClass('signal'), 500 );
			}
			// Emit swatch change event.
			this.emit( 'swatchChange', null, key, { tx, ty } );
		}

		// Convert a 2D tile map [array] into an [ElementCanvas] stamp.
		// * matrix	- 2D [array] of tile data.
		getMatrixStamp( matrix ) {
			//--------------------------------
			// Check If Paste Possible
			//--------------------------------
			// Validate an active view is open.
			const state		= this.getState();		// get current program state
			if ( !state.tilesetView ) return false;	// no active level
			const tileset	= state.tilesetView.file.context;	// active [JestTileset] instance
			// Convert the region to a stamp.
			const stamp		= tileset.createStamp( matrix );	// convert to stamp
			return stamp; // return stamp
		}
	};
// Make JestTiler globally accessible for plugins
window.JestTiler = JestAppsRegistry.AppJestTiler;
