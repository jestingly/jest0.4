//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/settings/system.plugin.js loaded' );

//-------------------------
// System Plugin
//-------------------------
// Add system for handling audio, history, etc.
(function( window ) {
	//--------------------------------
	// Plugin Metadata
	//--------------------------------
	const type    = 'settings';
	const subtype = 'system';

	//--------------------------------
	// Plugin Definition
	//--------------------------------
	const plugin  = {
		//--------------------------------
		// Initialize Plugin
		//--------------------------------
		// Called once when plugin is registered.
		// * client - [object] reference to JestCreator
		init: function( client ) {
			//-------------------------
			// Access Necessary Surface(s)
			//-------------------------
			// Grab the workspace for drawing on the editing area.
			const workspace   = client.gameboard.display.getCanvas( 'workspace' );
			// Grab the sketchpad for off-screen drawing & rendering.
			const sketchpad   = client.gameboard.display.getCanvas( 'sketchpad' );

			//-------------------------
			// Create Control Panel
			//-------------------------
			// Generate a "form" inside the sidebar.
			const systemPanel = new JestForm( client );      // create DOM Panel element [object].
			systemPanel.build( 'system', ['app-system'] );   // build the form

			//-------------------------
			// Mute Sounds Button
			//-------------------------
			// Create the "SFX" mute option (as a checkbox).
			const inputMute   = new JestInputCheckbox( client, 'mute', null, false, 'Mute' );
			inputMute.build( `input-mute` );                 // build field
			systemPanel.addField( 'mute', inputMute );       // add field to form
			inputMute.showLabel(); // show the label

			// Register an event when "sounds" are toggled.
			inputMute.register(
				'change', 'toggleSound',
				enable => {
					// Turn on/off all sounds.
					client.soundboard.mute = enable; // toggle sound
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
			systemPanel.addField( 'volume', inputVolume );
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
			systemPanel.addField( 'history', inputHistory );
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
			// Add to Sidebar
			//-------------------------
			// Add the curator panel to the sidebar.
			client.sidebar.addDisableExclusion( subtype ); // prevent forced collapse
			client.sidebar.addSection( subtype, 'System', systemPanel.panel, {}, systemPanel );
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
	else console.error( 'system.plugin.js load error: JestCreator.use() not found' );
})( window );
