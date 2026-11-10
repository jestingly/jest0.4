//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/tiler/ui/tabbarFile.plugin.js loaded' );

// Tabbar handling plugin (for files).
(function( window ) {
	// Define the plugin [object]
	var type	= 'ui';
	var subtype	= 'tabbarFile';
	var plugin	= {
		//--------------------------------
		// Plugin Setup Function
		//--------------------------------
		init: async function( client ) {
			// --------------------------------
			// Get File Tabbar [object]
			// --------------------------------
			// Get the tabbar.
			const tabbarFile	= client.tabbarFile; // get tabbar
			const button		= client.tabbarFile.buttons.new; // new file (+) button

			// Create event for when tab is changed, to switch level.
			tabbarFile.register(
				'tabChange', 'changeFile',
				( nextView, prevView, action ) => {
					// Push (+) button to end.
					client.tabbarFile.panel.reorderChild( button.panel, -1 )
					// Handle active level change.
					client.tabbarFileChange( nextView, prevView, action );
				});

			// Listener when a tab is closed.
			tabbarFile.register(
				'tabClose', 'closeFile',
				view => {
					// Suspend the app & attempt to close the file.
					client.suspend( 'closeFile' );	// suspend app
					client.closeFile( view );		// close current file
				});
		},

		//--------------------------------
		// New Method(s) In Tiler Application
		//--------------------------------
		extend: function( Klass, proto ) {
			//--------------------------------
			// Tabbar Event(s)
			//--------------------------------
			// Close the active level being viewed.
			// RETURNS: [boolean] `true` on success else `false` on fail.
			// * view	- [object] JestFileView targeting to close ([null] for active level).
			proto.tabbarFileClose = async function( view=null ) {
				// Block action if app is busy.
				if ( this.busy('tabbarFileClose',true,true) ) return; // app busy‐gate
				try {
					//--------------------------------
					// Call Application to Cleanup
					//--------------------------------
					// Emit event for application to cleanup.
					this.emit( 'file:closed', null, view );

					//--------------------------------
					// Teardown File [object]
					//--------------------------------
					// Remove from tabbar.
					this.tabbarFile.removeView( view );
					// Remove the file from the cabinet.
					this.cabinet.closeFile( view.file );

					//--------------------------------
					// Teardown View [object]
					//--------------------------------
					// Destroy file [object].
					view.file.destroy();
					// Remove history panel from the sidebar menu.
					const menu	= this.sidebar.getSection( 'history' );
					menu.removeItem( view.skey );
					// Reset any lingering state.
					view.governor.reset( view.skey );
					// Destroy [object].
					view.destroy();

					//--------------------------------
					// Open Empty File (if no tabs open)
					//--------------------------------
					// Check if any tabs are open.
					this.jot( 'quiet:openFile', true );	// suspend "open" sound
					if ( this.tabbarFile.views.length<1 ) {
						this.suspend( 'newFile' );	// suspend app
						await this.newFile();		// force open an empty level
					}
					this.jot( 'quiet:openFile', false );	// suspend "open" sound
					return true; // success
				}
				finally {
					this.resume(); // resume app
				}
			}

			// Change the active level being viewed.
			// RETURNS: [boolean] `true` on success else `false` on fail.
			// * nextView	- [object] JestFileView to activate for editing.
			// * prevView	- [object] JestFileView to deactivate from editing.
			//   action	- [string] Type of action taking place: 'open', 'switch', 'close', etc.
			proto.tabbarFileChange = async function( nextView, prevView=null, action=null ) {
				// --------------------------------
				// Teardown Previous View (if supplied)
				// --------------------------------
				// Check if a previous view is hiding.
				if ( prevView!==null ) {
					//--------------------------------
					// Toggle View-Specific Parts
					//--------------------------------
					// Hide previous view's history panel from the sidebar menu.
					prevView.history?.hide();			// hide history
					this.sidebar.refit( 'history' );	// refit history
				}

				// --------------------------------
				// Resize Gameboard Canvas to Match File Dimensions
				// --------------------------------
				// Attempt to get the canvas.
				const canvas	= this.gameboard.display.getCanvas( 'workspace' );

				// Determine if canvas is set.
				if ( !canvas || !canvas.el ) {
					console.warn( 'Canvas is not set or invalid' );
					return;
				}

				// Check for an active view.
				if ( nextView!==null ) {
					// Resize a gameboard canvas to match new active target's viewport.
					canvas.resize( nextView.anchor.width, nextView.anchor.height );
					//--------------------------------
					// Switch Active File In Cabinet
					//--------------------------------
					// Set the cabinet's active file
					this.cabinet.switchToFile( nextView.file );
					// Play a sound effect if necessary.
					switch ( action ) {
						case 'switch':
							// Play "tab" change sound effect to signal action.
							this.soundboard.playSound( 'jest_tab', 'mp3', 1.05 );
						default: break;
					}
					//--------------------------------
					// Toggle View-Specific Parts
					//--------------------------------
					// Switch the active history menu.
					nextView.history.show();			// show history
					this.sidebar.refit( 'history' );	// refit history
				}
				else {
					// --------------------------------
					// Check If Canvas Is Available
					// --------------------------------
					// Shrink gameboard to invisible.
					canvas.resize( 0, 0 );
					// Clear the canvas with a black screen.
					// Clear the canvas contents.
					const ctx	= canvas.el.getContext( '2d' );
					ctx.clearRect( 0, 0, canvas.el.width, canvas.el.height );
				}
				return true; // success
			}
		}
	};
	// register with JestCreator
	if ( window.JestCreator && typeof window.JestCreator.use==='function' )
		window.JestCreator.use( type, plugin );
	else console.error( 'ui/tabbar.plugin.js load error: JestCreator.use() not found' );
})( window );
