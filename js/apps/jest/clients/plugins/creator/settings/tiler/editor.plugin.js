//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/settings/tiler/editor.plugin.js loaded' );

//-------------------------
// Editor Options Plugin
//-------------------------
// Add editor options for the tile application level editor.
(function( window ) {
	//--------------------------------
	// Plugin Metadata
	//--------------------------------
	const type    = 'settings';
	const subtype = 'editor';

	//--------------------------------
	// Plugin Definition
	//--------------------------------
	const plugin  = {
		//--------------------------------
		// Initialize Plugin
		//--------------------------------
		// Called once when plugin is registered.
		// * client - [object] reference to JestTiler
		init: function( client ) {
			//-------------------------
			// Access Necessary Surface(s)
			//-------------------------
			// Grab the workspace for drawing on the editing area.
			const workspace = client.gameboard.display.getCanvas( 'workspace' );
			// Grab the sketchpad for off-screen drawing & rendering.
			const sketchpad = client.gameboard.display.getCanvas( 'sketchpad' );

			//-------------------------
			// Auto-Configure Option(s)
			//-------------------------
			// Initiate the tiler as having editor settings.
			client.settings.tiler.editor = {
				crosshair : false,  // crosshair off
				grid      : 0,      // no grid
				zoom      : 0       // empty zoom
				};
			// Keep the crosshair enabled by default unless the user changed it.
			client.settings.tiler.editor.crosshair ??= true;

			//-------------------------
			// Create Control Panel
			//-------------------------
			// Generate a "form" inside the sidebar.
			const optsPanel = new JestForm( client );      // create DOM Panel element [object].
			optsPanel.build( 'editor', ['app-editor'] ); // build the form

			//-------------------------
			// Crosshair Toggle Button
			//-------------------------
			// Create the workspace crosshair option.
			const inputCrosshair =
				new JestInputCheckbox(
					client, 'crosshair', null, client.settings.tiler.editor.crosshair, 'Crosshair'
					);
			inputCrosshair.build( 'input-crosshair' );
			optsPanel.addField( 'crosshair', inputCrosshair );
			inputCrosshair.showLabel();

			// Store whether the cursor crosshair should be drawn.
			inputCrosshair.register(
				'change', 'toggleCrosshair',
				enable => {
					client.settings.tiler.editor.crosshair = enable;
				});

			// Track the pointer over the workspace through Jest's element events.
			const crosshairFollower = new JestMouseFollower( client );
			crosshairFollower.setWatchElement( workspace, client.config.tileGrid );
			crosshairFollower.enable();

			//-------------------------
			// Tab Change Event
			//-------------------------
			// Update the crosshair grid when the active file tab changes.
			client.tabbarFile.register(
				'tabChange', 'editorCrosshairGrid',
				() => {
					// --------------------------------
					// Get Current File State
					// --------------------------------
					// Get current file status.
					const s = client.getFileStatus( null, true );
					// --------------------------------
					// Recalibrate to Zoomed Grid-Size
					// --------------------------------
					// Get the level view & its dimensional information.
					const bounds = s.levelView.anchor.getZoomed();
					// Match the marquee grid to the newly active level view.
					crosshairFollower.setGridUnits( bounds.display.units );
				});

			// Create event for when the magnification zoom value changes.
			client.register(
				'levelZoomed', 'crosshairZoom',
				zoom => {
					// --------------------------------
					// Get Current File State
					// --------------------------------
					// Get current file status.
					const s = client.getFileStatus( null, true );
					// --------------------------------
					// Recalibrate to Zoomed Grid-Size
					// --------------------------------
					// Get the level view & its dimensional information.
					const bounds = s.levelView.anchor.getZoomed();
					// Match the crosshair grid to the active level view zoom.
					crosshairFollower.setGridUnits( bounds.display.units );
				});

			// Draw the row and column highlights after the workspace is rendered.
			client.register(
				'draw', 'gridCrosshair',
				( e, state, enabled, mode, editor ) => {
					// Draw only while the editor is rendering an open level.
					if ( mode!=='running'
						 || !client.settings.tiler.editor.crosshair
						 || !state.levelView ) return; // abort

					// Get canvas context(s).
					const editorCtx = editor.el.getContext( '2d' );

					// Read the latest pointer tile; null means it left the workspace.
					const position  = crosshairFollower.getWatchPosition();
					if ( !position ) return;

					// Convert the hovered tile into workspace pixel coordinates.
					const levelView = state.levelView; // get open tab level file
					const bounds    = levelView.anchor.getZoomed(); // get active level rect info
					const units = bounds.display.units;
					const x     = position.tileX * units;
					const y     = position.tileY * units;

					// Fill the tile-wide crosshair arms, leaving the hovered tile clear.
					editorCtx.save();
					editorCtx.fillStyle   = 'rgba( 255, 0, 0, 0.16 )';
					editorCtx.fillRect( 0, y, x, units );
					editorCtx.fillRect( x+units, y, workspace.el.width-x-units, units );
					editorCtx.fillRect( x, 0, units, y );
					editorCtx.fillRect( x, y+units, units, workspace.el.height-y-units );

					// Draw the dashed boundaries edge-to-edge around both bands.
					editorCtx.strokeStyle = 'rgba( 255, 0, 0, 0.55 )';
					editorCtx.lineWidth   = 1;
					editorCtx.setLineDash( [4,3] );
					editorCtx.beginPath();
					editorCtx.moveTo( 0, y );
					editorCtx.lineTo( workspace.el.width, y );
					editorCtx.moveTo( 0, y+units );
					editorCtx.lineTo( workspace.el.width, y+units );
					editorCtx.moveTo( x, 0 );
					editorCtx.lineTo( x, workspace.el.height );
					editorCtx.moveTo( x+units, 0 );
					editorCtx.lineTo( x+units, workspace.el.height );
					editorCtx.stroke();
					editorCtx.restore();
				});

			//-------------------------
			// Grid Toggle Slider
			//-------------------------
			// Store the grid spacing in tile units.
			client.settings.tiler.editor.grid ??= 1;

			// Create the grid spacing slider.
			const maxGrid   = Math.floor( client.config.levelGrid/2 );
			const inputGrid =
				new JestInputRange(
					client, 'grid', null,
					client.settings.tiler.editor.grid, 'Grid'
					);
			inputGrid.setMin( 0 );
			inputGrid.setMax( maxGrid );
			inputGrid.setStep( 1 );
			inputGrid.build( 'input-grid' );
			optsPanel.addField( 'grid', inputGrid );
			inputGrid.showLabel();

			// Store the selected grid spacing as a number of tile units.
			inputGrid.register(
				'change', 'toggleGrid',
				value => {
					client.settings.tiler.editor.grid = Number( value );
				});

			// Draw the grid over the workspace after it has been rendered.
			client.register(
				'draw', 'gridGrid',
				( e, state, enabled, mode, editor, palette, sketch ) => {
					// Draw only while the editor is rendering an open level.
					if ( mode!=='running' || !state.levelView ) return;
					const levelView  = state.levelView; // get open tab level file
					const bounds     = levelView.anchor.getZoomed(); // get active level rect info
					// Get canvas context(s).
					const editorCtx  = editor.el.getContext( '2d' );
					const paletteCtx = palette.el.getContext( '2d' );
					const sketchCtx  = sketch.el.getContext( '2d' );

					// Skip zero or invalid spacing values.
					const grid       = Number( client.settings.tiler.editor.grid );
					if ( !Number.isInteger(grid) || grid<1 ) return;

					// Convert tile spacing and level size into workspace pixels.
					const units      = bounds.display.units;
					const limit      = client.config.levelGrid;
					const width      = workspace.el.width;
					const height     = workspace.el.height;

					// Clear the previous frame's grid.
					sketchCtx.clearRect( 0, 0, width, height );

					// Draw opaque one-pixel strips so intersections stay uniform.
					sketchCtx.save();
					sketchCtx.globalAlpha = 1;
					sketchCtx.fillStyle   = 'rgba( 0, 0, 0, 1 )';

					// Add vertical and horizontal strips at each tile interval.
					for ( let tile=0; tile<=limit; tile+=grid ) {
						const position    = tile * units;
						sketchCtx.fillRect( position, 0, 1, height );
						sketchCtx.fillRect( 0, position, width, 1 );
					}

					// Restore the sketch context before compositing it.
					sketchCtx.restore();

					// Composite the complete grid with transparency.
					editorCtx.save();
					editorCtx.globalAlpha *= 0.3;
					editorCtx.drawImage( sketchpad.el, 0, 0 );
					editorCtx.restore();
				});

			//-------------------------
			// Grid Keyboard Command(s)
			//-------------------------
			// Register comma and period for grid spacing control.
			client.io.registerShortcut( ',', 'gridSizeDown' );
			client.io.registerShortcut( '.', 'gridSizeUp' );

			// Change the grid spacing through the editor slider.
			client.io.register(
				'keyboardShortcut', 'gridResizeCommand',
				command => {
					// Ignore shortcuts while the user is typing.
					if ( client.io.isTypingInInput() ) return;

					// Ignore commands unrelated to grid spacing.
					if ( !['gridSizeUp','gridSizeDown'].includes(command) )
						return; // abort

					// Get the grid slider from the editor options form.
					const form  = client.sidebar.getSection(subtype)?.getContents();
					const field = form?.getField( 'grid' );
					if ( !field ) return;

					// Read the current spacing and slider limits.
					const value = Number( field.getValue() ?? 0 );
					const min   = Number( field.getMin() ?? 0 );
					const max   = Number( field.getMax() ?? maxGrid );

					// Increase or decrease by one, allowing zero to turn it off.
					const nextValue =
						command==='gridSizeUp' ?
							Math.min( value+1, max ) :
							Math.max( value-1, min );

					// Update the slider; its change handler updates grid setting.
					field.setValue( nextValue );
				});

			//-------------------------
			// Editor Zoom Slider
			//-------------------------
			// Instantiate the settings zoom variable.
			client.settings.tiler.editor.zoom ??= 0;

			// Create the zoom magnifier slider.
			const minZoom   = 1,
				  maxZoom   = 1000;
			const inputZoom =
				new JestInputRange(
					client, 'zoom', null,
					client.settings.tiler.editor.zoom, 'Zoom'
					);
			inputZoom.setMin( minZoom );
			inputZoom.setMax( maxZoom );
			inputZoom.setStep( 1 );
			inputZoom.build( 'input-zoom' );
			optsPanel.addField( 'zoom', inputZoom );
			inputZoom.showLabel();

			// Store the selected zoom scale as a number percentage.
			inputZoom.register(
				'change', 'adjustZoom',
				value => {
					// --------------------------------
					// Get Current File State
					// --------------------------------
					// Get current file status.
					const s = client.getFileStatus( null, true );

					// --------------------------------
					// Change Active Tab's Level Zoom
					// --------------------------------
					// Convert the value to percent.
					const zoom = Number(value) / 100;
					client.settings.tiler.editor.zoom = zoom;
					s.levelView.anchor.setZoom( zoom );

					// --------------------------------
					// Resize Editor Workspace Canvas
					// --------------------------------
					// Determine if editor canvas is set.
					const editor = this.gameboard.display.getCanvas( 'workspace' );
					if ( !editor || !editor.el ) {
						console.warn( 'Workspace canvas is not set or invalid' );
						return; // abort
					}

					// --------------------------------
					// Emit Event(s)
					// --------------------------------
					// Emit a client-wide event to allow plugins to listen.
					client.emit( 'levelZoomed', null, zoom );
				});

			//-------------------------
			// Zoom File Open Event(s)
			//-------------------------
			// Listen for a new file to open, and auto-zoom to 100%.
			/*client.register(
				'openedFile', 'applyTilerDefaultZoomSetting',
				async () => {
					// Automatically set zoom to 100%.
					inputZoom.setValue( 100 ); // auto-set
				});*/

			//-------------------------
			// Zoom Keyboard Command(s)
			//-------------------------
			// Register comma and period for zoom spacing control.
			client.io.registerShortcut( '-', 'zoomSizeDown' );
			client.io.registerShortcut( '=', 'zoomSizeUp' );

			// Change the zoom spacing through the editor slider.
			client.io.register(
			    'keyboardShortcut', 'zoomResizeCommand',
			    command => {
			        // Ignore shortcuts while the user is typing.
			        if ( client.io.isTypingInInput() ) return; // abort

			        // Ignore commands unrelated to zoom spacing.
			        if ( !['zoomSizeUp','zoomSizeDown'].includes(command) )
			            return; // abort

			        // Get the zoom slider from the editor options form.
			        const form  = client.sidebar.getSection(subtype)?.getContents();
			        const field = form?.getField( 'zoom' );
			        if ( !field ) return; // abort

			        // Read the current spacing and slider limits.
			        const value = Number( field.getValue() ?? minZoom );
					const min   = Number( field.getMin() ?? minZoom );
			        const max   = Number( field.getMax() ?? maxZoom );

			        // Increase or decrease by one, allowing zero to turn it off.
					const increment = 10;
			        const nextValue =
			            command==='zoomSizeUp' ?
			                Math.min( value+increment, max ) :
			                Math.max( value-increment, min );

			        // Update the slider; its change handler updates zoom setting.
			        field.setValue( nextValue );
			    });

			//-------------------------
			// Tab Change Event
			//-------------------------
			// Update the zoom range when the active file tab changes.
			client.tabbarFile.register(
				'tabChange', 'editorZoom',
				() => {
					// --------------------------------
					// Get Current File State
					// --------------------------------
					// Get current file status.
					const s    = client.getFileStatus( null, true );
					const zoom = s.levelView.anchor.getZoom();

					// --------------------------------
					// Recalibrate Zoom Controls
					// --------------------------------
					// Match the zoom slider to the active level magnification.
					inputZoom.setValue( zoom * 100 );
				});

			//-------------------------
			// Add to Sidebar
			//-------------------------
			// Add the curator panel to the sidebar.
			client.sidebar.addDisableExclusion( subtype ); // prevent forced collapse
			client.sidebar.addSection( subtype, 'Editor', optsPanel.panel, {}, optsPanel );
			client.sidebar.refit( subtype ); // resize to fit contents
		},

		//--------------------------------
		// New Method(s) In Creator Application
		//--------------------------------
		extend: function( Klass, proto ) { }
	};

	//--------------------------------
	// Register With Creator Application
	//--------------------------------
	if ( window.JestTiler && typeof window.JestTiler.use==='function' )
		window.JestTiler.use( type, plugin );
	else console.error( 'editor.plugin.js load error: JestTiler.use() not found' );
})( window );
