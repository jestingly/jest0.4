//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/clients/JestAnimator.js loaded' );

//-------------------------
// Jest Application
//-------------------------
JestAppsRegistry.AppJestAnimator =
	class JestAnimator extends JestCreator {
		// Declare properties
		icon			= 'images/icons/jest_settings.png'; // application icon image URL [string] value
		name			= 'Animator';		// name of application
		version			= '0.3beta';		// application version
		id				= 'animator';		// animator application id.
		// Server [objects]
		//online			= null;			// [object] JestOnline for connection to a websocket.
		// DOM Element Reference(s)
		palette			= null;				// [JestCanvas] object for handling tile selection.
		// Tool handling
		easels			= null;				// [object] of easels that hold file views.
		toolbar			= null;				// [JestToolbar] Tool menu selector (draw, fill, etc.)
		toolbox			= null;				// [JestToolbox] Central tool manager for enabling/disabling tools and temp swaps
		// Editor area
		editor			= null;				// [object] Panel container for editing arena (board & sidebar).
		board			= null;				// [JestElement] Board for editing the jani.
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
			// Force open an empty new jani.
			this.suspend( 'newFile' );	// suspend app
			this.newFile();	// open blank file
			return true;	// succcess
		}

		// Preset the build architecture.
		// RETURNS: [boolean] `true` on success else `false` on fail.
		async preset() {
			this.filetypes	= '.jani';
			return true; // success
		}

		// Setup the animator work station inside the app.
		// RETURNS: [boolean] `true` on success else `false` on fail.
		async configure() {
			// --------------------------------
			// Set & Get Quick-Refs
			// --------------------------------
			// Get the jani editing canvas
			const gameboard	= this.gameboard;	// get gameboard reference
			const canvas	= gameboard.display.getCanvas( 'workspace' );
			// Get loading-screen loadbar.
			const loadbar	= this.spline.getScreen('loading').loadbar;
			const toolbar	= this.toolbar;
			// Get the file menu.
			const filemenu	= this.filemenu;	// get ref

			// --------------------------------
			// Animation Handler [object]
			// --------------------------------
			// Assign the gameboard canvas to the animator for animation rendering
			const animator	= this.animator;	// access ref
			animator.canvas	= canvas;			// animator canvas is workspace canvas

			// --------------------------------
			// Plugin Animator UI Hook(s)
			// --------------------------------
			// Initialize user interface plugin(s).
			await JestAnimator.initPlugins( 'ui', this );

			// --------------------------------
			// Extend File Menu [object]
			// --------------------------------
			const animatorActions	= [
				{ name: 'undo',     text: 'Undo' },
				{ name: 'redo',     text: 'Redo' },
				/*{ name: 'copy',     text: 'Copy' },
				{ name: 'paste',    text: 'Paste' },
				{ name: 'cut',      text: 'Cut' },
				{ name: 'delete',   text: 'Delete' }*/
				];
			// Iterate list of buttons & generate button.
			animatorActions.forEach(
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
			/*// Copy tool tip:
			fmBtns.copy.clicker.addAttribute( 'data-tooltip-keys', 'Ctrl + C' );
			// Paste tool tip:
			fmBtns.paste.clicker.addAttribute( 'data-tooltip-keys', 'Ctrl + V' );
			// Cut tool tip:
			fmBtns.cut.clicker.addAttribute( 'data-tooltip-keys', 'Ctrl + X' );
			// Delete tool tip:
			fmBtns.delete.clicker.addAttribute( 'data-tooltip-keys', 'Delete' );*/

			// --------------------------------
			// Plugin Animator Tool Hook(s)
			// --------------------------------
			// Initialize tools plugins.
			await JestAnimator.initPlugins( 'tools', this );

			/*// --------------------------------
			// Load Default Game Image(s)
			// --------------------------------
			const fileBufferLoad	= [];
			// Load default GIF skins.
			for ( let i=0; i<=31; i++ )
				fileBufferLoad.push( `heads/head${i}.gif` );
			// Load default PNG skins.
			fileBufferLoad.concat([
				'heads/head19.png',
				'heads/head22.png',
				'bodies/body.png',
				'bodies/body2.png',
				'bodies/body_black.png',
				'swords/sword1.png'
				]);
			await this.imager.loadFiles( fileBufferLoad );*/

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
			let view, jani, key;
			const state	= this.getState();				// get current program state
			view		= this.tabbarFile.activeView;	// get active jani file
			jani		= view.file.context;			// active JestJani instance
			key			= view.skey;					// governor stack key
			switch ( name ) {
				case 'new': // start a new JANI file
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
				default: break;
			}
		}

		// Create a brand-new empty jani
		async newFile() {
			// Block action if app is busy.
			if ( this.busy('newFile',true,true) ) return; // app busy‐gate
			try {
				// Create empty FileInfo [object].
				const fileInfo	= this.getFileInfo( 'untitled.jani' );
				this.suspend( 'openFile' ); // suspend app
				return await this.openFile( fileInfo );
			}
			finally {
				this.resume(); // unlock new actions
			}
		}

		// Open a jani file.
		// RETURNS: [boolean] `true` on success else `false` on fail.
		// * fileInfo	- File information [object].
		async openFile( fileInfo ) {
			// Block action if app is busy.
			if ( this.busy('openFile',true,true) ) return; // app busy‐gate
			try {
				//--------------------------------
				// Create Jani File [object]
				//--------------------------------
				// Attempt to read local file if requested.
				if ( fileInfo.network!=='none' ) { // existing jani
					// Use the Secretary to read a local file's data.
					const ok	= await this.fantascope.readFile( fileInfo );
					if ( ok===null ) {
						console.warn( 'Jani file could not be opened!' );
						alert( 'Could not open jani file.' );
						return false; // failed
					}
					console.log( `Opening new editable jani file [object] "${fileInfo.stem}".` );
				}

				//--------------------------------
				// Create Jani File [object]
				//--------------------------------
				// Create a blank new cabinet file [object].
				const cabFile	= new JestFileJani( this, 'local', fileInfo.stem );

				//--------------------------------
				// Register Event(s)
				//--------------------------------
				// Attach an open-file event listener to handle data callback.
				cabFile.register(
					'openFile', 'loadObjects',
					( { jani } ) => {
						// --------------------------------
						// Emit Successful Load Event
						// --------------------------------
						// Emit an app-jani "open jani file" data event.
						this.emit( 'loadFileData', null, cabFile, { jani } )
					});

				// Attach a saved listener when the file data has been written.
				cabFile.register(
					'saved', 'animatorAppResponse',
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
				// Use jani's openFile, passing file object if useful:
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
				// Create a new view panel for jani.
				const view		= new JestFileViewEditorPainterJani( this );
				const skey		= view.skey;		// we'll use system key for various signature(s)
				view.build();						// build the view
				this.easels.files.showcase( view );	// add view to "files" easel
				// Open the file.
				view.openFile( cabFile );			// open the jani file in the view

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
					'undo', 'animatorListen',
					( skey, snapshot ) => this.fileReverted('undo',skey,snapshot) );

				// Listen for redo event.
				view.register(
					'redo', 'animatorListen',
					( skey, snapshot ) => this.fileReverted('redo',skey,snapshot) );

				// Governor action event(s).
				view.governor.register(
					'undo', 'animatorAppResponse',
					( key, snapshot, count, index ) => this.emit('undo',null) );

				// Governor action event(s).
				view.governor.register(
					'redo', 'animatorAppResponse',
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
			if ( this.skim('quiet:openJani')!==true )
				this.soundboard.playSound( 'jest_open1', 'mp3', 1.1 );

			// Return [bool] value.
			return true; // success
		}

		// Close an open jani file.
		// RETURNS: [void].
		// * view	- [object] JestFileView targeting to close ([null] for active jani).
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
					// Close current jani.
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
				// Active jani info.
				janiView:				null,
				jani:					null,
				janiViewKey:			null,
				// Active tileset info.
				tilesetView:			null,
				tileset:				null,
				tilesetViewKey:			null
				};

			//--------------------------------
			// Get Selected Jani View
			//--------------------------------
			// Retrieve the active or previously active jani view.
			const janiView = this.tabbarFile[property];
			// Get active jani file info.
			if ( janiView ) {
				report.janiView			= janiView;							// get active jani file
				report.jani				= report.janiView.file.context;		// active JestJani instance
				report.janiViewKey		= report.janiView.skey;				// governor stack key
			}
			// Return extension report.
			return report; // return info
		}

		// Return JANI animation + method status information.
		// RETURNS: [object] of purview data or [null].
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
			// Validate an active view is open.
			const state		= this.getState( selection ); // get current state
			const janiView	= state.janiView;
			if ( !janiView ) return null; // no active jani

			//--------------------------------
			// Purview Useful Data
			//--------------------------------
			// Return a purview of general useful variables.
			const ani		= state.jani.animation;
			const aniView	= ani.getView( 'default' );
			return {
				curator,
				// Get jani file information.
				'janiView'     : janiView,
				'janiViewKey'  : state.janiViewKey,
				'file'         : janiView.file,
				'fileKey'      : janiView.file.skey,
				'jani'         : janiView.file.context,
				'janiKey'      : janiView.file.context.skey,
				// Get animation information.
				'ani'          : ani,
				'aniView'      : aniView,
				'frame'        : aniView.frame,
				'layer'        : aniView.getLayer(),
				'findex'       : aniView.getFrameIndex(),
				'lindex'       : aniView.getLayerIndex()
				};
		}

		// --------------------------------
		// Enable & Disable
		// --------------------------------
		// Enable the animator application.
		// RETURNS: [void]
		enable() {
			// Add event listener(s)
			this.reset();		// reset the tool
			super.enable();		// parent enable method
		}
		// Disable the animator application.
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
					// Jani File Is Open
					//--------------------------------
					// Determine if a file is open.
					if ( state.janiView!==null ) {
						key			= state.janiViewKey;
						report		= state.janiView.governor.report( 'edit' );
						//console.log( report );
						//--------------------------------
						// Enable/Disable Button(s)
						//--------------------------------
						// Check if file changed & is saveable.
						toggle		= state.janiView.file.skim( "changed" );
						this.filemenu.toggle( 'save', toggle );		// save toggle access
						// Check if file has ever been saved.
						toggle		= state.janiView.file.skim( "saved" );
						this.filemenu.toggle( 'save_as', toggle );	// save as toggle access
						// Check if user is logged in.
						//toggle		= true;// this.login.logged;
						//this.filemenu.toggle( 'sync', toggle );		// sync toggle access
						// Close file is permitted.
						//this.filemenu.toggle( 'close', true );		// close is allowed
						// Check if undo is possible.
						toggle		= report.undoCount>0;
						this.filemenu.toggle( 'undo', toggle );		// undo toggle access
						// Check if redo is possible.
						toggle		= report.redoCount>0;
						this.filemenu.toggle( 'redo', toggle );		// redo toggle access
						/*// Disable copy & delete buttons by default.
						this.filemenu.toggle( 'copy', false );		// copy is not allowed
						this.filemenu.toggle( 'cut', false );		// cut is not allowed
						this.filemenu.toggle( 'delete', false );	// delete is not allowed*/
						// Attempt to enable paste button.
						/*snapshot 	= this.governor.current( 'clipboard' );
						toggle		= snapshot ? true : false;
						this.filemenu.toggle( 'paste', toggle );	// paste toggle access*/
					}
					//--------------------------------
					// Jani File Closed
					//--------------------------------
					else { // If no file is open, disable various components.
						//--------------------------------
						// Enable/Disable Button(s)
						//--------------------------------
						this.filemenu.toggle( 'save', false );		// save is not allowed
						this.filemenu.toggle( 'save_as', false );	// save is not allowed
						//this.filemenu.toggle( 'sync', false );		// sync is not allowed
						//this.filemenu.toggle( 'close', false );		// close is not allowed
						this.filemenu.toggle( 'undo', false );		// undo is not allowed
						this.filemenu.toggle( 'redo', false );		// redo is not allowed
						/*this.filemenu.toggle( 'copy', false );		// copy is not allowed
						this.filemenu.toggle( 'cut', false );		// cut is not allowed
						this.filemenu.toggle( 'paste', false );		// paste is not allowed
						this.filemenu.toggle( 'delete', false );	// delete is not allowed*/
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
		// * e	- Ticker event [object] data about frame.
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
			const editor    = this.gameboard.display.getCanvas( 'workspace' );
			if ( !editor || !editor.el ) {
				console.warn( 'workspace canvas is not set or invalid' );
				return;
			}
			const editorCtx = editor.el.getContext( '2d' );

			// Determine if sketchpad canvas is set.
			const sketch    = this.gameboard.display.getCanvas( 'sketchpad' );
			if ( !sketch || !sketch.el ) {
				console.warn( 'Sketchpad canvas is not set or invalid' );
				return; // abort
			}
			const sketchCtx = sketch.el.getContext( '2d' );

			// Emit pre-draw hooks.
			this.emit( 'predraw', null,
				e, state, enabled, mode,
				editorCtx, sketchCtx );

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
					if ( state.janiView!==null ) {
						//--------------------------------
						// CONFIGURABLE GRID OPTIONS
						//--------------------------------
						const canvasW		= editor.el.width;	// Width of the centered rectangle
						const canvasH		= editor.el.height;	// Height of the centered rectangle
						const gridW			= this.config.janiSpan;	// Width of the centered rectangle
						const gridH			= this.config.janiSpan;	// Height of the centered rectangle
						const canvasColor	= '#dd2e29';		// Color of the canvas background color
						const borderColor	= '#ffffff';		// Color of the rectangle border
						const dashColor		= '#ffffff';		// Color of the inner dashed cross
						const guideColor	= '#e98f8d';		// Color of the guide lines to canvas edges

						const borderWidth	= 1;				// width of center square guide
						const dashWidth		= 1;				// width of dash lines
						const guideWidth	= 1;				// width of edge-to-edge guidelines
						const dashSpacing	= [5, 5];			// Dash pattern

						//--------------------------------
						// CLEAR THE CANVAS
						//--------------------------------
						// Clear the canvas with an empty screen.
						ctx.clearRect( 0, 0, canvasW, canvasH );
						ctx.fillStyle	= canvasColor
						ctx.fillRect( 0, 0, canvasW, canvasH );

						//--------------------------------
						// CALCULATE GRID POSITION
						//--------------------------------
						const gridX		= (canvasW - gridW) / 2;
						const gridY		= (canvasH - gridH) / 2;

						//--------------------------------
						// DRAW RECTANGLE OUTLINE
						//--------------------------------
						/*ctx.setLineDash( dashSpacing );
						ctx.lineWidth	= dashWidth;
						ctx.strokeStyle	= borderColor;
						ctx.lineWidth	= borderWidth;
						ctx.strokeRect( gridX, gridY, gridW, gridH );*/

						//--------------------------------
						// DRAW INNER DASHED LINES (CENTER CROSS)
						//--------------------------------
						/*ctx.setLineDash( dashSpacing );
						ctx.strokeStyle	= dashColor;
						ctx.lineWidth	= dashWidth;

						// Vertical middle line
						ctx.beginPath();
						ctx.moveTo( gridX + gridW/2, gridY );
						ctx.lineTo( gridX + gridW/2, gridY + gridH );
						ctx.stroke();

						// Horizontal middle line
						ctx.beginPath();
						ctx.moveTo( gridX, gridY + gridH/2 );
						ctx.lineTo( gridX + gridW, gridY + gridH/2 );
						ctx.stroke();

						ctx.setLineDash([]); // Reset dash style*/

						//--------------------------------
						// DRAW EXTENSION GUIDE LINES
						//--------------------------------
						// Set line drawing style
						ctx.strokeStyle	= guideColor;
						ctx.lineWidth	= guideWidth;

						// Top to canvas top (center X)
						ctx.setLineDash( dashSpacing );
						ctx.beginPath();
						ctx.moveTo( gridX /*+ gridW/2*/, 0 );
						ctx.lineTo( gridX /*+ gridW/2*/, canvasH );
						ctx.stroke();

						// Left to canvas left (center Y)
						ctx.setLineDash( dashSpacing );
						ctx.beginPath();
						ctx.moveTo( 0, gridY );// + gridH/2 );
						ctx.lineTo( canvasW, gridY );// + gridH/2 );
						ctx.stroke();

						// Top to canvas top (center X)
						ctx.setLineDash( dashSpacing );
						ctx.beginPath();
						ctx.moveTo( gridX + gridW, 0 );
						ctx.lineTo( gridX + gridW, canvasH );
						ctx.stroke();

						// Left to canvas left (center Y)
						ctx.setLineDash( dashSpacing );
						ctx.beginPath();
						ctx.moveTo( 0, gridY + gridH );
						ctx.lineTo( canvasW, gridY + gridH );
						ctx.stroke();

						ctx.setLineDash([]); // Reset dash style
					}
					break;
				default: break; // no mode to draw
			}

			// --------------------------------
			// Render JANI Inside of Animator
			// --------------------------------
			// Draw all relevant animation view(s)
			let views	= [];
			const view	= state.jani.animation.getView( 'default' );
			views.push( view );
			// Sort by Y depth — lower Y = in front (higher Z)
			views.sort(
				(a,b) => {
					const ay	= Math.round( a.globalY );
					const by	= Math.round( b.globalY );
					return ay - by;
				});
			//console.log( `${view.globalX},${view.globalY}` );
			// Render animation views & draw them.
			this.animator.render( e, views );	// render views
			this.animator.draw( views );		// draw views

			// --------------------------------
			// Emit Final Event(s)
			// --------------------------------
			// Emit post-draw hooks.
			this.emit( 'draw', null,
				e, state, enabled, mode,
				editorCtx, paletteCtx, sketchCtx );
			this.emit( 'postdraw', null,
				e, state, enabled, mode,
				editorCtx, paletteCtx, sketchCtx );
		}
	};
// Make JestAnimator globally accessible for plugins
window.JestAnimator = JestAppsRegistry.AppJestAnimator;
