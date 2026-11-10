//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/settings/options.plugin.js loaded' );

//-------------------------
// Options Plugin
//-------------------------
// Add options for handling audio, history, etc.
(function( window ) {
	//--------------------------------
	// Plugin Metadata
	//--------------------------------
	const type		= 'settings';
	const subtype	= 'options';

	//--------------------------------
	// Plugin Definition
	//--------------------------------
	const plugin = {
		//--------------------------------
		// Initialize Plugin
		//--------------------------------
		// Called once when plugin is registered.
		// * client - [object] reference to JestCreator
		init: function( client ) {
			// Keep the crosshair enabled by default unless the user changed it.
			client.settings.crosshair ??= true;

			//-------------------------
			// Create Control Panel
			//-------------------------
			// Generate a "form" inside the sidebar.
			const optsPanel = new JestForm( client );      // create DOM Panel element [object].
			optsPanel.build( 'options', ['app-options'] ); // build the form

			//-------------------------
			// Mute Sounds Button
			//-------------------------
			// Create the "SFX" mute option (as a checkbox).
			const inputMute = new JestInputCheckbox( client, 'mute', null, false, 'Mute' );
			inputMute.build( `input-mute` );               // build field
			optsPanel.addField( 'mute', inputMute );       // add field to form
			inputMute.showLabel(); // show the label

			// Register an event when "sounds" are toggled.
			inputMute.register(
				'change', 'toggleSound',
				enable => {
					// Turn on/off all sounds.
					client.soundboard.mute = enable; // toggle sound
					//client.jot( 'optsSounds', enable );
				});
			let toggle = false; // sounds not muted, by default
			inputMute.setChecked( toggle );

			//-------------------------
			// Sound Volume Slider
			//-------------------------
			// Create volume input slider (0=mute, 100=full)
			const inputVolume = new JestInputRange( client, 'volume', null, 1, 'Volume' );
			inputVolume.setMin( 0 );
			inputVolume.setMax( 100 );
			inputVolume.setStep( 1 );
			inputVolume.build( 'input-volume' );
			optsPanel.addField( 'volume', inputVolume );
			inputVolume.showLabel();

			// Register an event when "sound" volume is modified.
			inputVolume.register(
				'change', 'scaleSound',
				value => {
					// Scale sound volume by slider input.
					client.soundboard.volume = value; // adjust volume
				});
			inputVolume.setValue( 10 );

			//-------------------------
			// History Limit Slider
			//-------------------------
			// Create history limit input slider.
			const inputHistory = new JestInputRange( client, 'history', null, 1, 'History' );
			inputHistory.setMin( 15 );
			inputHistory.setMax( 30 );
			inputHistory.setStep( 1 );
			inputHistory.build( 'input-history' );
			optsPanel.addField( 'history', inputHistory );
			inputHistory.showLabel();

			// Register an event when "history limit" modified.
			inputHistory.register(
				'change', 'changeHistoryLimit',
				value => {
					//--------------------------------
					// Convert Input Value -> Int
					//--------------------------------
					// Match history limit to the slider input.
					value = Number( value ); // convert arg to number
					// Validate value is a positive integer.
					if ( !Number.isInteger(value) || value<1 ) {
						console.log( 'History Limit: Value must be an integer.' );
						return false; // fail
					}

					// Update internal settings.
					client.settings.history = value; // adjust history limit

					//--------------------------------
					// Adjust All History Limit(s)
					//--------------------------------
					// Iterate all open level views & adjust history limit.
					for ( const key in client.easels.files.views ) {
						const view = client.easels.files.views[key];
						// Change the history edit limit of each level.
						view.governor.setLimit( 'edit', value );
					}
				});
			inputHistory.setValue( 15 );

			//-------------------------
			// Crosshair Toggle Button
			//-------------------------
			// Create the workspace crosshair option.
			const inputCrosshair =
				new JestInputCheckbox(
					client, 'crosshair', null, client.settings.crosshair, 'Crosshair' );
			inputCrosshair.build( 'input-crosshair' );
			optsPanel.addField( 'crosshair', inputCrosshair );
			inputCrosshair.showLabel();

			// Store whether the cursor crosshair should be drawn.
			inputCrosshair.register(
				'change', 'toggleCrosshair',
				enable => {
					client.settings.crosshair = enable;
				});

			// Track the pointer over the workspace through Jest's element events.
			const workspace = client.gameboard.display.getCanvas( 'workspace' );
			const crosshairFollower = new JestMouseFollower( client );
			crosshairFollower.setWatchElement( workspace, client.config.tileGrid );
			crosshairFollower.enable();

			// Draw the row and column highlights after the workspace is rendered.
			client.register(
				'draw', 'gridCrosshair',
				( e, state, enabled, mode, editorCtx ) => {
					// Draw only while the editor is rendering an open level.
					if ( mode!=='running' || !client.settings.crosshair || !state.levelView )
						return;

					// Read the latest pointer tile; null means it left the workspace.
					const position = crosshairFollower.getWatchPosition();
					if ( !position ) return;

					// Convert the hovered tile into workspace pixel coordinates.
					const units = client.config.tileGrid;
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
			// Add to Sidebar
			//-------------------------
			// Add the curator panel to the sidebar.
			client.sidebar.addDisableExclusion( subtype ); // prevent forced collapse
			client.sidebar.addSection( subtype, 'Options', optsPanel.panel, {}, optsPanel );
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
	if ( window.JestCreator && typeof window.JestCreator.use==='function' )
		window.JestCreator.use( type, plugin );
	else console.error( 'options.plugin.js load error: JestCreator.use() not found' );
})( window );
