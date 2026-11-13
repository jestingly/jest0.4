//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/tiler/ui/tabbarTileset.plugin.js loaded' );

// Tabbar handling plugin (for files).
(function( window ) {
	// Define the plugin [object]
	var type	= 'ui';
	var subtype	= 'tabbarTileset';
	var plugin	= {
		//--------------------------------
		// Plugin Setup Function
		//--------------------------------
		init: async function( client ) {
			// --------------------------------
			// Create Sidebar Tileset Tabbar [object]
			// --------------------------------
			// Create the tileset tabbar.
			const tabbarTileset  = new JestTabbar( client );
			client.tabbarTileset = tabbarTileset; // set tabbar
			tabbarTileset.build();

			// Add a palette menu to the sidebar.
			client.sidebar.addDisableExclusion( 'palette' ); // prevent forced collapse
			const section  = client.sidebar.addSection( 'palette', 'Palette', null, {} );
			// Add tabbar to client interface.
			//section.addItem( 'tileset', tabbarTileset.panel );
			client.sidebar.refit( 'palette' );

			// Create event for when tab is changed, to switch level.
			tabbarTileset.register(
				'tabChange', 'changeTileset',
				view=>client.tabbarTilesetChange(view)
				);

			// Create & add the palette panel to the sidebar.
			client.gameboard.display.addCanvas( 'palette' ); // create gameboard palette canvas
			const palette  = client.gameboard.display.getCanvas( 'palette' );
			client.palette = palette;           // store palette
			client.palette.addClass( 'block' ); // canvas style is "display:block"
			section.addItem( 'canvas', palette );

			/*//-----------------------------
			// Configure to View
			//-----------------------------
			button.skey = view.skey; // match button skey to view
			// Create event to update tabbar button filename when changed.
			view.file.register( 'stemChange', 'tabbar', file=>client.renameButton(button,file) );
			// Make new view the active tab.
			client.setActiveView( view );
			// Register "close" (x)-button click event.
			button.clicker.refs.closeBtn.register(
				'click', 'closeTab', e=>client.btnClose(e,action,button), 'dom' );
			return true; // success*/
		},

		//--------------------------------
		// New Method(s) In Tiler Application
		//--------------------------------
		extend: function( Klass, proto ) {
			// Change the active tileset being viewed.
			// RETURNS: [boolean] `true` on success else `false` on fail.
			// * view	- [object] JestFileView to activate as tileset selector.
			proto.tabbarTilesetChange = function( view ) {
				console.log( 'Tileset tab change.' );
				// --------------------------------
				// Resize Gameboard Canvas to Match Level Dimensions
				// --------------------------------
				// Attempt to get the canvas.
				const canvas = this.gameboard.display.getCanvas( 'palette' );
				// Check for an active view.
				if ( this.tabbarTileset.activeView!==null ) {
					// Resize a gameboard canvas to match new active target's viewport.
					canvas.resize( view.anchor.width, view.anchor.height );
				}
				//this.sidebar.panel.addPanel( view.skey, view.panel );
				this.sidebar.refit( 'palette' ); // resize to fit contents
				return true; // success
			}
		}
	};
	// register with JestTiler
	if ( window.JestTiler && typeof window.JestTiler.use==='function' )
		window.JestTiler.use( type, plugin );
	else console.error( 'ui/tabbar.plugin.js load error: JestTiler.use() not found' );
})( window );
