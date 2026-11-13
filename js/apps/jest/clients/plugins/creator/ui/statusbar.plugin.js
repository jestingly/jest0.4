//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/ui/statusbar.plugin.js loaded' );

// Status bar plugin.
(function( window ) {
	// Define the plugin [object]
	var type	= 'ui';
	var subtype	= 'statusbar';
	var plugin	= {
		//--------------------------------
		// Plugin Setup Function
		//--------------------------------
		init: function( client ) {
			// --------------------------------
			// Create Status Bar [object]
			// --------------------------------
			// Create the statusbar.
			const statusbar		= new JestStatusbar( client );
			client.statusbar	= statusbar; // set toolbar
			statusbar.build(); // build statusbar

			// Add statusbar to client interface.
			client.panel.refs.status.addPanel( 'statusbar', statusbar.panel );

			// Set initial message.
			statusbar.cite( 'building ...' );

			// Update the status bar when the application is finished building.
			client.register(
				'postbuild', 'statusbarUpdate',
				() => {
					let message = 'Welcome to <b>Tileshop</b>';
					message += ' by <strong>JEST®</strong>';
					message += ' • Copyright© 2026';
					message += ' • All Rights Reserved.';
					statusbar.cite( message );
				});

			//-------------------------
			// Set Copyright Notice
			//-------------------------
			// Add menu title.
			statusbar.panel.createPanel({
				name       : 'copyright',
				tag        : 'div',
				classes    : [ 'jest-copyright' ],
				text       : 'Copyright <b>©</b> 2026 <strong>JEST® v0.42</strong>. All rights reserved.'
				});

			// --------------------------------
			// Create Loading Bar [object]
			// --------------------------------
			// Add a loading bar to the status bar.
			const loadbar		= new JestLoadbar( client );
			client.loadbar		= loadbar; // keep ref
			loadbar.build( 'jest-loadbar', ['jest-ani-stripes'] ); // build loadbar
			statusbar.panel.addPanel( 'loadbar', loadbar.panel ); // add to statusbar DOM

			// --------------------------------
			// Create Level "mousemove" Info Tracking
			// --------------------------------
			// Get level editor canvas.
			const canvas = this.gameboard.display.getCanvas( 'workspace' );
			// Register mouse location event(s).
			canvas.register(
				['mousemove','mousedown','mouseup'], 'trackTileXY',
				e => {
					// Block action if app is busy.
					if ( client.busy() ) return; // app busy‐gate
					//--------------------------------
					// Validate State
					//--------------------------------
					// Early out if statusbar is missing
					if ( !statusbar || !statusbar.cite ) return;
					// Check for open view & tool.
					const state		= this.getState(); // get program state
					if ( !state?.levelView ) return;
					// Require level view & level [object].
					const view		= state.levelView;

					//--------------------------------
					// Resolve Target Level Layer
					//--------------------------------
					// Acesss active tab level.
					const level     = view.file.context;
					const layer     = level.getActiveLayer(); // get layer
					if ( !layer ) return false;               // can't find layer

					//--------------------------------
					// Access Tile Data @ Coordinate
					//--------------------------------
					// Obtain the mouse level position.
					const pos		= canvas.mousePos( e );
					const units		= this.config.tileGrid ?? 16;
					const x			= Math.floor( pos.x / units );
					const y			= Math.floor( pos.y / units );
					// Get tile (if any) from level
					const tile		= layer.getTile( x, y );
					//--------------------------------
					// Generate Status Display Text
					//--------------------------------
					// Generate status bar text to be displayed.
					let msg = `<strong>level</strong> (${x},${y})`;
					if ( tile && tile.ts!==undefined )
						msg += `  →  <strong>tile</strong> (${tile.tx},${tile.ty})`;
					// Display position/tile info in status bar.
					this.statusbar.cite( msg );
				}, 'dom' );
			// Register mouse location event(s).
			canvas.register( 'mouseleave', 'resetStatus', e => this.statusbar.cite(''), 'dom' );
		},

		//------------------------------ --
		// New Method(s) In Tiler Application
		//--------------------------------
		extend: function( Klass, proto ) {
			// Status bar(s)
			statusbar		= null;		// [JestStatusbar] for displaying program status(es).
			loadbar			= null;		// [JestLoadbar] used to display loading status(es).
		}
	};
	// register with JestCreator
	if ( window.JestCreator && typeof window.JestCreator.use==='function' )
		window.JestCreator.use( type, plugin );
	else console.error( 'ui/statusbar.plugin.js load error: JestCreator.use() not found' );
})( window );
