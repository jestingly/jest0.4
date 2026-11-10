//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/tools/hand/hand.plugin.js loaded' );

//-------------------------
// Hand Plugin
//-------------------------
// Adds a hand tool for panning around the level.
(function( window ) {
	//--------------------------------
	// Plugin Metadata
	//--------------------------------
	const type    = 'tools';
	const subtype = 'hand';

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
			// Create Tool
			//-------------------------
			const tool   = new JestToolHand( client, subtype );
			client.toolbox.registerTool( subtype, tool );
			tool.build(); // build the hand tool
			// Wire into the grid.
			tool.anchor.graticulate( client.config.tileGrid );

			// Simultaneous tools allowed:
			tool.coopt( ['tiledrop'] );

			// Set canvas as target
			const canvas = client.gameboard.display.getCanvas( 'workspace' );
			tool.setTarget( canvas );

			//--------------------------------
			// Handle Tool Block Check
			//--------------------------------
			// Determine whether the tool can be used.
			tool.register(
				'blockCheck', 'handBlocking',
				status => { });

			//--------------------------------
			// Toolbar Button & Shortcut
			//--------------------------------
			const button = client.toolbar.createButton( { name: subtype, text: null } );
			button.clicker.addAttribute( 'data-tooltip', 'Hand' );
			button.clicker.addAttribute( 'data-tooltip-keys', 'H' );
			// Register toolbar button action.
			client.register(
				'equip', 'setHand',
				name => {
					// Block action if app is busy.
					if ( client.busy() ) return; // app busy‐gate
					// Check current button action.
					if ( name===subtype ) {
						// Switch the active tool to the hand.
						client.toolbox.setTool( tool ); // enable new tool
						// Activate the menu button
						client.toolbar.buttons[name].activate(); // toggle button on
					}
				});

			//-----------------------------
			// Icon Hand
			//-----------------------------
			button.clicker.addElements([
				{
					name       : 'icon',
					tag        : 'svg',
					attributes : {
						xmlns        : "http://www.w3.org/2000/svg",
						viewBox      : "0 0 1200 1200",
						width        : "1200pt",
						height       : "1200pt",
						"aria-hidden": "true"
						},
					classes    : [ 'ico-hand' ],
					elements   :
						[
							{
								name       : 'path',
								tag        : 'path',
								attributes :
									{
										'd': 'm925.22 380.06s13.453-74.344 77.344-62.672c47.859 8.7656 46.922 60.562 38.719 101.62l-79.453 400.13c-30.375 152.95-164.95 263.39-321.47 263.39h-35.062c-120.37 0-231.05-65.859-288.28-171.37l-155.63-286.92c-23.625-43.5-22.922-84.797 16.922-113.77 39.891-28.875 95.156-23.859 129.14 11.766l85.594 132.98-28.031-381.71c-3.7969-41.297 4.5469-81.75 52.078-88.406 47.438-6.5625 72.984 29.906 75.844 63.469 10.359 111.05 38.953 363.28 38.953 363.28s2.3438 8.2969 9.6562 8.1094c8.3906-0.28125 9.5156-8.7188 9.5156-8.7188l14.156-435.1c1.125-29.766 24.328-58.547 62.766-58.547 29.391 0 60.047 23.625 61.031 53.203 3.7031 110.2 9.0938 444.05 9.0938 444.05s1.125 8.2031 8.4844 8.2031c7.3125 0 8.2969-8.4375 8.2969-8.4375l38.297-386.02s2.9531-70.312 71.016-62.297c59.391 6.9844 51.516 85.266 51.516 85.266l-27.562 386.21s0 8.1562 6.2344 8.7656c7.6406 0.75 9.4219-7.2188 9.4219-7.2188z',
										'fill-rule': 'evenodd'
									}
							}
						]
				}]);

			//-----------------------------
			// Keyboard Handling
			//-----------------------------
			// Define keyboard shortcut.
			client.io.registerShortcut( 'H', subtype );
			// Keyboard shortcut menu action.
			client.io.register( 'keyboardShortcut', 'handCommand',
				command => {
					//--------------------------------
					// Require Hand Availability
					//--------------------------------
					// Block input shortcuts while user is typing.
					if ( client.io.isTypingInInput() ) return;
					// Select the tool and expose its sampling options.
					if ( command===subtype ) {
						// Switch the active tool to the hand.
						client.toolbox.setTool( tool ); // enable new tool
					}
				});
		},


		//--------------------------------
		// New Method(s) In Tiler Application
		//--------------------------------
		extend: function( Klass, proto ) {
		}
	};

	//--------------------------------
	// Register Plugin
	//--------------------------------
	if ( window.JestTiler && typeof window.JestTiler.use==='function' )
		window.JestTiler.use( type, plugin );
	else console.error( 'hand.plugin.js load error: JestTiler.use() not found' );
})( window );
