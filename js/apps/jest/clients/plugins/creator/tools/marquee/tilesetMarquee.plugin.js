//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/tools/marquee/tilesetMarquee.plugin.js loaded' );

(function( window ) {
	var type	= 'tools';
	var subtype	= 'tilesetMarquee';
	var plugin	= {
		//--------------------------------
		// Initialize Tileset Marquee Tool
		//--------------------------------
		init: function( client ) {
			//-------------------------
			// Access Necessary Surface(s)
			//-------------------------
			// Get the tileset view & its dimensional information.
			const tilesetView = client.getState().tilesetView;

			// --------------------------------
			// Create Marquee Tool [object]
			// --------------------------------
			// Instantiate marquee tool
			const tool   = new JestToolMarquee( client, subtype );
			client.toolbox.registerTool( subtype, tool );
			tool.build(); // build the tool

			// Match the marquee anchor to native tileset tile pixels.
			tool.anchor.graticulate( tilesetView.anchor.units );
			// Wire tool to grid and palette canvas
			const canvas = client.gameboard.display.getCanvas( 'palette' );
			tool.setTarget( canvas );

			//-------------------------
			// Toolbar Functionality
			//-------------------------
			// Add "Palette" button
			/*const button	= client.toolbar.createButton( { name: subtype, text: null } );
			button.clicker.addAttribute( 'data-tooltip', 'Palette' );
			button.clicker.addAttribute( 'data-tooltip-keys', 'P' );
			button.clicker.addElements([
				//-----------------------------
				// Icon Palette
				//-----------------------------
				{
					name       : 'icon',
					tag        : 'svg',
					attributes : {
						xmlns        : "http://www.w3.org/2000/svg",
						viewBox      : "0 0 1200 1200",
						width        : "24",
						height       : "24",
						"aria-hidden": "true"
						},
					classes    : [ 'ico-palette' ],
					elements   :
						[
							{
								name       : 'path',
								tag        : 'path',
								attributes : {'d': 'm249.66 1005c0 72.844-109.31 72.844-109.31 0s109.31-72.844 109.31 0'}
							},
							{
								name       : 'path',
								tag        : 'path',
								attributes : {'d': 'm958.69 432.24-190.92-190.92-437.76 437.9-179.29 179.29c14.156-4.2656 29.062-6.4688 44.297-6.4688h105.84l-37.922-37.922c-3.375-3.375-5.25-7.9688-5.25-12.75s1.875-9.375 5.25-12.75l123-123 123-123.14 123.14-123 123-123c7.0312-7.0312 18.422-7.0312 25.453 0l123 123c7.0312 7.0312 7.0312 18.422 0 25.453l-123 123-123 123.14-123.14 123-37.875 37.875h42.375l419.86-419.76z'}
							},
							{
								name       : 'path',
								tag        : 'path',
								attributes : {'d': 'm195 870c-37.312 0-71.062 15.141-95.391 39.609-2.0625 2.0625-3.9375 4.0781-5.7656 6.2344-1.2188 1.3125-2.3906 2.625-3.4688 4.0781-1.5469 1.7812-3.1406 3.8438-4.5469 5.7656-2.1562 3.1406-4.3125 6.1406-6.2344 9.375-13.078 21.375-19.547 45.609-19.547 69.938 0 3.2344 0.14062 6.375 0.375 9.6094v0.70312c0.23438 3 0.60938 6 1.0781 9 0.23438 2.1562 0.60938 4.3125 1.0781 6.4688 1.2188 6.1406 2.7656 12.141 4.7812 18 0.46875 1.6875 1.2188 3.375 1.7812 5.0625 0.70312 1.7812 1.4531 3.7031 2.2969 5.5312 1.4531 3.375 3.1406 6.7031 4.9219 9.9375 1.0781 1.9219 2.1562 3.8438 3.2344 5.625 1.9219 3.2344 4.0781 6.2344 6.2344 9.375 0.375 0.46875 0.70312 0.9375 1.0781 1.4531 0.84375 1.0781 1.6875 2.1562 2.625 3.2344 0.23438 0.375 0.46875 0.70312 0.84375 1.0781 1.0781 1.4531 2.2969 2.7656 3.4688 4.0781 0.46875 0.60938 0.9375 1.0781 1.4531 1.6875 1.3125 1.5469 2.8594 3.1406 4.3125 4.5469l6.2344 5.7656c1.3125 1.2188 2.625 2.3906 4.0781 3.4688l5.7656 4.5469c3.1406 2.1562 6.1406 4.3125 9.375 6.2344 13.312 8.1562 28.219 14.062 44.156 17.062 2.1562 0.46875 4.3125 0.84375 6.4688 1.0781 6.2344 0.9375 12.703 1.4531 19.312 1.4531h945v-270zm0 207.66c-40.031 0-72.656-32.578-72.656-72.656 0-40.031 32.578-72.656 72.656-72.656 40.031 0 72.656 32.578 72.656 72.656 0 40.031-32.578 72.656-72.656 72.656zm915 14.344c0 9.9375-8.0625 18-18 18h-696c-9.9375 0-18-8.0625-18-18v-174c0-9.9375 8.0625-18 18-18h696c9.9375 0 18 8.0625 18 18z'}
							},
							{
								name       : 'path',
								tag        : 'path',
								attributes : {'d': 'm330 60h-270v873.1c1.3594-2.5312 2.7188-5.0156 4.2188-7.4531 1.6875-2.8125 3.6562-5.7188 5.6719-8.625l1.0781-1.5938c1.9688-2.625 3.7031-4.875 5.3906-6.8438 1.3125-1.6875 2.7188-3.2812 4.1719-4.875 1.5469-1.9219 3.8438-4.3594 6.2812-6.7969h0.046875c0.14062-0.1875 0.32812-0.32812 0.46875-0.46875l74.391-74.391h-53.719c-9.9375 0-18-8.0625-18-18v-696.05c0-9.9375 8.0625-18 18-18h174c9.9375 0 18 8.0625 18 18v575.72l30-30z'}
							},
							{
								name       : 'path',
								tag        : 'path',
								attributes : {'d': 'm927 918h165v174h-165z'}
							},
							{
								name       : 'path',
								tag        : 'path',
								attributes : {'d': 'm753 918h156v174h-156z'}
							},
							{
								name       : 'path',
								tag        : 'path',
								attributes : {'d': 'm579 918h156v174h-156z'}
							},
							{
								name       : 'path',
								tag        : 'path',
								attributes : {'d': 'm396 918h165v174h-165z'}
							},
							{
								name       : 'path',
								tag        : 'path',
								attributes : {'d': 'm651.1 425.9 116.67-116.67 123 123-116.67 116.67z'}
							},
							{
								name       : 'path',
								tag        : 'path',
								attributes : {'d': 'm528 548.86 123.14 123.14 110.25-110.39-123-123z'}
							},
							{
								name       : 'path',
								tag        : 'path',
								attributes : {'d': 'm515.29 561.66v-0.046875l-110.25 110.34 123 123 110.34-110.25h-0.046875z'}
							},
							{
								name       : 'path',
								tag        : 'path',
								attributes : {'d': 'm330 747-54.375 54.375 50.672 50.625h144.71l44.297-44.297-123-123z'}
							},
							{
								name       : 'path',
								tag        : 'path',
								attributes : {'d': 'm108 108h174v165h-174z'}
							},
							{
								name       : 'path',
								tag        : 'path',
								attributes : {'d': 'm108 291h174v156h-174z'}
							},
							{
								name       : 'path',
								tag        : 'path',
								attributes : {'d': 'm108 465h174v156h-174z'}
							},
							{
								name       : 'path',
								tag        : 'path',
								attributes : {'d': 'm108 804h71.719l102.28-102.28v-62.719h-174z'}
							}
						]
				}]);*/

			/*// Register palette action
			client.register(
				'equip', subtype,
				( name ) => {
					// Block action if app is busy.
					if ( client.busy() ) return; // app busy‐gate
					// Set the active tool to the marquee tool.
					if ( name===subtype ) {
						client.toolbox.setTool( tool ); // enable new tool
						// Enable side panel options.
						client.sidebar.enableSection( 'palette' );
						// Activate the menu button
						client.toolbar.buttons[name].activate();	// toggle button on
					}
				});*/

			// Define keyboard shortcut.
			/*client.io.registerShortcut( 'P', subtype );
			// Keyboard shortcut menu action.
			client.io.register( 'keyboardShortcut', 'tilesetMarqueeCommand',
				command => {
					// Block input shortcuts while user is typing
					if ( client.io.isTypingInInput() ) return;
					// Affirm shortcut command is for "draw" tool.
					if ( command===subtype )
						client.toolbox.setTool( subtype );
				});*/

			//-------------------------
			// Tab Change Event
			//-------------------------
			// Update the marquee grid when the active tileset tab changes.
			client.tabbarTileset.register(
				'tabChange', 'tilesetMarqueeGrid',
				() => {
					// --------------------------------
					// Get Current File State
					// --------------------------------
					// Get current file status.
					const s = client.getFileStatus( tool, true );

					// --------------------------------
					// Recalibrate to Zoomed Grid-Size
					// --------------------------------
					// Get the tileset view & its dimensional information.
					const bounds = s.tilesetView.anchor.getZoomed();
					// Match the marquee grid to the newly active tileset view.
					tool.anchor.graticulate( bounds.display.units );
				});

			//-------------------------
			// Marquee Visual Rendering
			//-------------------------
			// Register marquee drawing visual.
			client.register(
				'draw', subtype,
				( e, state, enabled, mode, editor, palette ) => {
					// Block action if app is busy.
					if ( client.busy() ) return; // app busy‐gate
					// Only if client is running.
					if ( mode!=='running' ) return;
					// Get canvas context(s).
					const editorCtx  = editor.el.getContext( '2d' );
					const paletteCtx = palette.el.getContext( '2d' );

					// --------------------------------
					// Draw Tool Visual(s)
					// --------------------------------
					// Get level marquee tool mode.
					const toolMode   = tool.skim( 'mode' );
					// Do not draw if nothing to draw.
					if ( toolMode!=='selecting' && toolMode!=='selected'
						 && toolMode!=='floating' && toolMode!=='dragging' ) return;

					// -----------------------------
					// Validate Marquee Mask/Trace
					// -----------------------------
					// Get tile measurements.
					const units  = tool.anchor.units;
					// Check if current marquee has either valid mask or traced rectangle.
					const bounds = tool.anchor?.getBounds?.() ?? null;
					const mask   = tool.mask;
					const tracer = tool.tracer;
					const trace  = tracer?.getBounds?.() ?? null;

					let masked   = false;
					let traced   = false;

					// Validate mask area
					if ( bounds && bounds.w>0 && bounds.h>0
						 && Array.isArray(mask) && mask.length>0 )
						masked   = true;

					// Validate traced area
					if ( trace && trace.w>0 && trace.h>0 )
						traced   = true;

					// Exit if nothing to process
					if ( !masked && !traced ) return;

					// -------------------------------
					// Mode: selected / selecting
					// -------------------------------
					// Visually show marquee semi-transparent rect.
					switch ( toolMode ) {
						case "selected":
						case "selecting":
						case "floating":
						case "dragging":
							// Determine dashed outline.
							const dashSpeed	= 0.5;
							const offset	= ( e.tickCount*dashSpeed ) % 10;

							// Check if a composite selection exists.
							if ( traced ) {
								// Calculate dimensions.
								const cols	= trace.w;	// trace region width
								const rows	= trace.h;	// trace region height
								// Composite stroke style(s).
								const stroke	=
									[{
										color  : 'rgba( 0, 0, 0, 1 )',
										weight : 1.5,
										dash   : [ 6, 4 ],
										offset : offset
									}];
								// Create a temporary mask of the active tracer.
								const mask2	= client.grapher.createMatrix( trace.w, trace.h, true );
								// Draw active tracer rect.
								client.drawCompositeRect(
									paletteCtx, {units,cols,rows},
									trace.x, trace.y, mask2,
									"rgba( 50, 0, 0, 0.2 )",	// fill
									stroke, null, null			// stroke
									);
							}
							break;
						default: break;
					}
				});
		}
	};

	// Register with JestTiler
	if ( window.JestTiler && typeof window.JestTiler.use==='function' )
		window.JestTiler.use( type, plugin );
	else console.error( 'marquee/tilesetMarquee.plugin.js load error: JestTiler.use() not found' );
})( window );
