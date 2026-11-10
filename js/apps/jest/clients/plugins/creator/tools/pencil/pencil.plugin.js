//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/tools/pencil/pencil.plugin.js loaded' );

// Pencil plugin.
(function( window ) {
	// Define the plugin [object]
	var type	= 'tools';
	var subtype	= 'pencil';
	var plugin	= {
		//--------------------------------
		// Plug Tool Into Tiler Application
		//--------------------------------
		init: function( client ) {
			// --------------------------------
			// Create Pencil Tool [object]
			// --------------------------------
			// Add a pencil tool to the level canvas board.
			const tool		= new JestToolPencil( client, subtype );
			client.toolbox.registerTool( subtype, tool );
			tool.build(); // build tool
			tool.setSwishThreshold( 5 );	// track every [float] # of tile movements
			tool.setIdleThreshold( 500 );	// reset motion tracking if idle for 500 ms
			// Wire into the grid.
			tool.anchor.graticulate( client.config.tileGrid );
			const canvas	= client.gameboard.display.getCanvas( 'workspace' );
			tool.setTarget( canvas ); // set target

			// Simultaneous tools allowed:
			tool.coopt( 'tiledrop' );

			// Hold-key mapping.
			tool.holdkey( 'Alt', 'eyedropper' );

			//-------------------------
			// Create Control Panel
			//-------------------------
			// Generate a "form" inside the sidebar for pencil tool options.
			const optsPanel = new JestForm( client ); // create DOM panel element [object]
			optsPanel.build( 'options', ['pencil-options'] ); // build the form (pencil-options CSS class)

			// Create the "size" (brush-size) range input field.
			const inputSize = new JestInputRange( client, 'size', null, 1, 'Size' );
			inputSize.setMin( 1 );
			const maxSize	= 100;		// ← whatever upper limit feels best
			inputSize.setMax( maxSize );
			inputSize.setStep( 1 );
			inputSize.setValue( 1 );	// default size is 1 (single-tile pencil)
			inputSize.build( 'input-size' );
			inputSize.panel.addAttribute( 'data-tooltip', 'Brush Size' );
			inputSize.panel.addAttribute( 'data-tooltip-keys', '[+]' );
			optsPanel.addField( 'size', inputSize );
			inputSize.showLabel();

			// Create roundness input (0=diamond, 0.5=circle, 1=square)
			const inputRound = new JestInputRange( client, 'roundness', null, 1, 'Roundness' );
			inputRound.setMin( 0 );
			inputRound.setMax( 1 );
			inputRound.setStep( 0.1 );
			inputRound.setValue( 1 );
			inputRound.build( 'input-roundness' );
			inputRound.panel.addAttribute( 'data-tooltip', 'Brush Roundness' );
			optsPanel.addField( 'roundness', inputRound );
			inputRound.showLabel();

			// Stroke Outline Width
			const inputStroke = new JestInputRange( client, 'stroke', null, 0, 'Stroke' );
			inputStroke.setMin( 0 );
			inputStroke.setMax( 10 );
			inputStroke.setStep( 1 );
			inputStroke.setValue( 0 );	// default to 0 (no stroke)
			inputStroke.build( 'input-stroke' );
			inputStroke.panel.addAttribute( 'data-tooltip', 'Brush Stroke' );
			optsPanel.addField( 'stroke', inputStroke );
			inputStroke.showLabel();

			// Add the pencil tool's panel section to the sidebar.
			client.sidebar.addSection( subtype, 'Pencil', optsPanel.panel, {}, optsPanel );
			client.sidebar.refit( subtype );

			//-------------------------
			// Options Keyboard Command(s)
			//-------------------------
			// Register "[" and "]" for brush size control
			client.io.registerShortcut( '[', 'pencilSizeDown' );
			client.io.registerShortcut( ']', 'pencilSizeUp' );
			// Keyboard shortcut menu actions for brush resizing
			client.io.register(
				'keyboardShortcut', 'pencilResizeCommand',
				command => {
					//--------------------------------
					// Require Pencil Availability
					//--------------------------------
					// Skip if user is typing
					if ( client.io.isTypingInInput() ) return;
					// Check if active tool is "pencil"
					if ( !tool.enabled() ) return;
					// Validate accepted commands.
					if ( !['pencilSizeUp','pencilSizeDown'].includes(command) )
						return; // unrecognized command
					//--------------------------------
					// Access Options Form Data
					//--------------------------------
					// Access form and field
					const form = client.sidebar.getSection(subtype)?.getContents();
					if ( !form ) return; // no form found
					const field = form.getField( 'size' );
					if ( !field ) return; // no size field found
					// Get current size weight.
					const value = parseInt( field.getValue() ?? 1 );
					//--------------------------------
					// Alter Options
					//--------------------------------
					// Apply logic
					if ( command==='pencilSizeUp' )
						field.setValue( Math.min( value+1, field.getMax() ?? 10 ) );
					else if ( command==='pencilSizeDown' )
						field.setValue( Math.max( value-1, field.getMin() ?? 1 ) );
				});

			//-------------------------
			// Toolbar Functionality
			//-------------------------
			// Add "pencil" tool button to toolbar.
			const button = client.toolbar.createButton( { name: subtype, text: null /*Pencil*/ } );
			button.clicker.addAttribute( 'data-tooltip', 'Pencil' );
			button.clicker.addAttribute( 'data-tooltip-keys', 'D' );
			//-----------------------------
			// Icon Pencil
			//-----------------------------
			button.clicker.addElements([
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
					classes    : [ 'ico-pencil' ],
					elements   :
						[
							{
								name       : 'path',
								tag        : 'path',
								attributes :
									{
										'd': 'm303.19 953.34 127.55-47.391-6.6562-1.1719c-14.484-2.6719-26.109-13.641-29.625-28.078l-3.5625-14.672 433.97-433.97 106.12 106.12-417.32 417.32c-3.7969 3.7969-8.3438 6.7969-13.453 8.6719l-226.22 84.047c-33.75 12.516-71.672 4.2188-97.078-21.234-25.406-25.406-33.703-63.328-21.188-97.078l84.047-226.22c1.875-5.0625 4.8281-9.6562 8.625-13.453l417.32-417.32 106.12 106.12-431.95 432-6.7969-1.9219c-11.953-3.4219-21.516-12.469-25.359-24.234l-8.5781-25.688-52.594 141.52zm415.55-737.44 20.531-20.531c60.562-60.562 158.81-60.562 219.37 0l45.938 45.938c60.562 60.562 60.562 158.76-0.046875 219.37l-20.484 20.484z',
										'fill-rule': 'evenodd'
									}
							}
						]
				}]);

			// Register toolbar button action.
			client.register(
				'equip', 'setPencil',
				( name ) => {
					// Block action if app is busy.
					if ( client.busy() ) return; // app busy‐gate
					// Check current button action.
					if ( name===subtype ) {
						client.toolbox.setTool( tool );				// enable new tool
						client.sidebar.enableSection( subtype );	// show pencil panel
						// Activate the menu button
						client.toolbar.buttons[name].activate();	// toggle button on
					}
				});

			// Define keyboard shortcut.
			client.io.registerShortcut( 'D', subtype );
			// Keyboard shortcut menu action.
			client.io.register(
				'keyboardShortcut', 'pencilCommand',
				command => {
					// Block input shortcuts while user is typing
					if ( client.io.isTypingInInput() ) return;
					// Affirm shortcut command is for "pencil" tool.
					if ( command===subtype )
						client.toolbox.setTool( subtype );
				});

			//--------------------------------
			// Handle Tool Block Check
			//--------------------------------
			// Determine whether the tool can edit the active layer.
			tool.register(
				'blockCheck', 'pencilBlocking',
				( status ) => {
					//--------------------------------
					// Validate Level Availability
					//--------------------------------
					// A level must exist before its layers can be edited.
					if ( !status.level ) {
						status.reasons.push( 'noLevel' );
						return; // blocked
					}

					//--------------------------------
					// Validate Active Layer
					//--------------------------------
					// Editing requires an active layer.
					const layer = status.layer;
					if ( !layer ) {
						status.reasons.push( 'noLayer' );
						return; // blocked
					}

					//--------------------------------
					// Validate Layer Properties
					//--------------------------------
					// Hidden layers are not eligible for direct editing.
					if ( !layer.visible )
						status.reasons.push( 'layerHidden' );

					// Locked layers prohibit modifying their contents.
					if ( layer.locked )
						status.reasons.push( 'layerLocked' );
				});

			//-------------------------
			// Draw a Shift-Click Point-to-Point
			//-------------------------
			// Register shift-click drawing listener.
			tool.register(
				'startShiftlining', 'showOrigin',
				( e, pos ) => {
					//console.log( `Origin: (${pos.x}, ${pos.y})` );
					//-------------------------
					// Reset Draw Log For New Draw
					//-------------------------
					// Reset the drawing buffer.
					tool._undoMap	= new Map();  // fresh log each time
					tool._skipTiles	= new Set();  // ← reset skip tiles
					tool.layerId    = null;       // reset target layer id
				});

			// Register shift-click drawing.
			tool.register(
				'drawShiftlining', 'drawLine',
				( e, from, to ) => {
					//--------------------------------
					// Extract Coordinates from Payload
					//--------------------------------
					// Get connected line point(s).
					const points = client.grapher.getLinePoints( from.x, from.y, to.x, to.y );
					//--------------------------------
					// Lay Each Point as a Stamp
					//--------------------------------
					// Iterate each point & atempt to draw.
					for ( const [lx,ly] of points )
						// Send the 'draw' event to intercept for drawing.
						tool.emit( 'draw', null, e, { lx, ly }  );
					//--------------------------------
					// Commit Action to Undo Log
					//--------------------------------
					// Log the line drawn for undo/redo.
					client.toolLogPencil();
				});

			//-------------------------
			// Start Drawing Hook(s)
			//-------------------------
			// Initiate draw event.
			tool.register(
				'start', 'startDraw',
				() => {
					// Play drawing sound effect.
					client.soundboard.playSound( 'jest_poke', 'mp3', 1.1 );
					//-------------------------
					// Reset Draw Log For New Draw
					//-------------------------
					// Reset the drawing buffer.
					tool._undoMap   = new Map();  // fresh log each time
					tool._skipTiles = new Set();  // ← reset skip tiles
					tool.layerId    = null;       // reset target layer id
				});

			//-------------------------
			// Motion Tracking Hook(s)
			//-------------------------
			// Initiate swish event (when a large movement is made).
			tool.register(
				'swish', 'swishDraw',
				( e, trackLapse, tracked, pos, distance, swishLapse ) => {
					// Define motion track timeout.
					const trackLapseThreshold = 400;
					const swishLapseThreshold = 400;
					const units               = tool.anchor.units;
					// Buffer movement speeds
					if ( trackLapse>=trackLapseThreshold || tracked===0 ) {
						if ( swishLapse/distance <= 20
							 || (swishLapse>=swishLapseThreshold && distance>=3) )
							tool.motionTrack();	// track motion
					}
				});

			// Initiate motion tracking event (when persistent or abrupt motion is made).
			tool.register(
				'motionTracked', 'motionSensitivity',
				() => {
					// Play draw swish sound effect.
					client.soundboard.playSound( 'jest_draw', 'wav', 1.1 );
				});

			// Initiate idle tracking event (pencil down, not moving much).
			tool.register(
				'idle', 'idleDraw',
				() => {
					//console.log( 'idle' );
				});

			//-------------------------
			// Drawing Event(s)
			//-------------------------
			// Register event listener callback(s).
			tool.register(
				'draw', 'layTile',
				( e, pos ) => {
					// Block action if app is busy.
					if ( client.busy() ) return; // app busy‐gate
					// Determine whether drawing with foreground or background tile.
					const key    = tool._mouseButton===0 ? 'foreground' : 'background';
					const swatch = client.swatches[key].contents;
					// Replace a tile on the level.
					client.toolLevelDraw( swatch, pos.lx, pos.ly );
				});

			//-------------------------
			// Stop Drawing Hook(s)
			//-------------------------
			// Log the entire line of tile(s) drawn as one undo/redo action.
			tool.register( 'stop', 'logPencil', ()=>client.toolLogPencil() );
		},

		//--------------------------------
		// New Method(s) In Tiler Application
		//--------------------------------
		extend: function( Klass, proto ) {
			// Replace a tile on a level board at (x,y).
			// RETURNS: [boolean] `true` on success else `false` on fail.
			// * tile	- [object] Tile data for tileset, tx, ty, etc.
			// * x,y	- [number] Level (x,y) coords to draw at region.
			proto.toolLevelDraw = function( tile, x, y ) {
				//--------------------------------
				// Check If Paste Possible
				//--------------------------------
				// Validate an active view is open.
				const state     = this.getState();                 // get current program state
				if ( !state.levelView )   return false;            // no active level
				if ( !state.tilesetView ) return false;            // no active level
				// Gather propert(ies) we will use.
				const level     = state.levelView.file.context;    // [object] JestLevel instance
				const tileset   = state.tilesetView.file.context;  // [object] JestTileset instance
				const key       = state.levelView.skey;            // [string] Governor stack key
				const tool      = this.toolbox.tools.pencil;       // [object] Pencil tool
				const mode      = tool.skim( 'mode' );             // [string] Drawing mode
				const gridLimit = this.config.levelGrid;           // [int] Value of level WxH

				//--------------------------------
				// Resolve Target Level Layer
				//--------------------------------
				// Resolve target level layer.
				const layer     = level.getLayer( tool.layerId, true ); // get layer
				if ( !layer || layer.locked ) return false;        // can't find / edit layer
				if ( tool.layerId==null ) tool.layerId = layer.id; // change tool target layer

				//--------------------------------
				// Get Brush Size Setting(s)
				//--------------------------------
				// Get brush size from options
				const optsPanel = this.sidebar.getSection( tool.name );
				const form      = optsPanel.getContents();
				const size      = parseInt( form.getField('size')?.getValue?.() ?? 1 );
				const stroke    = parseInt( form.getField('stroke')?.getValue?.() ?? 0 );
				const roundness = parseFloat( form.getField('roundness')?.getValue?.() ?? 1 );

				//--------------------------------
				// Define Tile Data
				//--------------------------------
				const fgTile    = tile ?? { ...this.swatches.foreground.contents };
				const bgTile    = { ...this.swatches.background.contents };

				//--------------------------------
				// Initialize undo map if needed
				//--------------------------------
				if ( !tool._undoMap ) tool._undoMap = new Map();

				//--------------------------------
				// Draw on the Level (updates tilemap + canvas)
				//--------------------------------
				// Use the full size as a side length, and center it accurately:
				const radius    = size / 2;
				const offset    = Math.floor( radius );
				const rCorner   = radius * roundness;
				const inner     = radius - rCorner;

				//--------------------------------
				// Track which tiles were filled
				//--------------------------------
				const fillSet   = new Set();

				//-----------------------------
				// Rounded Brush Loop (in proto.toolLevelDraw)
				// Applies square → rounded corners → circle based on `roundness`
				//-----------------------------
				for ( let dx=-offset; dx<(size-offset); dx++ ) {
					for ( let dy=-offset; dy<(size-offset); dy++ ) {
						// Get tile coordinates.
						const tx = x + dx,
							  ty = y + dy;

						// OOB check → skip if outside level
						if ( tx<0 || ty<0 || tx>=gridLimit || ty>=gridLimit )
							continue; // outside level

						// Check if inside central rectangle.
						const absX   = Math.abs(dx),
						      absY   = Math.abs(dy);
						let include  = false;

						// If inside central rect → always draw
						if ( absX<=inner || absY<=inner )
							include  = true;
						// Else, check quarter-circle at corner
						else {
							const cx = absX - inner;   // x distance into corner
							const cy = absY - inner;   // y distance into corner
							if ( (cx*cx + cy*cy) <= (rCorner*rCorner) )
								include	= true;
						}
						// 3) Skip tiles outside the rounded region
						if ( !include ) continue;

						//--------------------------------
						// Clone, Draw & Log for Undo/Redo
						//--------------------------------
						// Draw tile & log inside fillSet
						const id      = `${tx},${ty}`;
						const oldTile = layer.cloneTile( tx, ty ); // [Tile] snapshot before change
						layer.fillRegion( tx, ty, 1, 1, fgTile );
						fillSet.add( id );

						// Log for undo/redo.
						if ( mode==='drawing' || mode==='shiftlining' ) {
							const map = tool._undoMap;
							if ( !map.has(id) )
								map.set( id, {
									old: { x:tx, y:ty, ...oldTile },
									neu: { x:tx, y:ty, ...fgTile, __source: 'fill' }
									});
							else map.get(id).neu = { x:tx, y:ty, ...fgTile, __source: 'fill' };
						}
					}
				}
				//--------------------------------
				// Stroke Outline Perimeter (map-driven)
				//--------------------------------
				// Applies stroke around the perimeter of newly filled tiles only.
				// Skips if stroke is 0 or tool not actively drawing.
				if ( stroke>0 && mode==='drawing' ) {
					// Gather Undo Map for Stroke Pass
					const map = tool._undoMap;	// [Map] Existing fill + stroke log entries
					//--------------------------------
					// Iterate Filled Tiles (from map)
					//--------------------------------
					for ( let [id,entry] of map.entries() ) {
						// Only process tiles that were filled (not already stroke or other)
						if ( entry.neu.__source!=='fill' ) continue;
						// Deconstruct tile ID to get coords
						const [ fx, fy ] = id.split(',').map( Number );

						//--------------------------------
						// Check Neighbor Tiles (stroke radius)
						//--------------------------------
						for ( let dx=-stroke; dx<=stroke; dx++ ) {
							for ( let dy=-stroke; dy<=stroke; dy++ ) {
								// Skip center (the filled tile itself)
								if ( dx===0 && dy===0 ) continue;

								// Skip diagonal if manhattan distance exceeds stroke
								if ( (Math.abs(dx)+Math.abs(dy))>stroke ) continue;

								// Calculate target tile
								const sx  = fx + dx;
								const sy  = fy + dy;
								const sid = `${sx},${sy}`;

								// Skip if outside level bounds
								if ( sx<0 || sy<0 || sx>=gridLimit || sy>=gridLimit )
									continue;

								// Skip if stroke already placed or is a fill
								if ( map.has(sid) ) {
									const existing = map.get(sid).neu?.__source;
									if ( existing==='fill' || existing==='stroke' ) continue;
								}

								//--------------------------------
								// Draw Stroke Tile & Log It
								//--------------------------------
								// Draw stroke tile(s).
								const oldTile = layer.cloneTile( sx, sy );
								layer.fillRegion( sx, sy, 1, 1, bgTile );
								// Log for undo/redo.
								map.set( sid, {
									old: { x:sx, y:sy, ...oldTile },
									neu: { x:sx, y:sy, ...bgTile, __source: 'stroke' }
									});
							}
						}

					}
				}
				return true; // success
			}

			//--------------------------------
			// Drawing Method(s)
			//--------------------------------
			// Log a line of pencil tile(s) as a single drawing action.
			// RETURNS: [boolean] `true` on success else `false` on fail.
			proto.toolLogPencil = function() {
				//--------------------------------
				// Validate Pencil Availability
				//--------------------------------
				const state	= this.getState();				// get current app state
				if ( !state.levelView ) return false;		// no active level open
				const view	= state.levelView;				// current view
				const key	= state.levelView.skey;			// undo/redo governor key
				const tool	= this.toolbox.tools.pencil;	// active tool

				//--------------------------------
				// Collect Undo/Redo Entries
				//--------------------------------
				// Grab old & new tile sets for undo/redo log.
				const undoMap = tool._undoMap ?? new Map();	// fallback to empty
				const old = [], neu = [];
				// Collect all former (old) & their replaced (new) tile data.
				for ( const [id,pair] of undoMap.entries() ) {
					old.push({
						x  : pair.old.x,
						y  : pair.old.y,
						ts : pair.old.ts,
						tx : pair.old.tx,
						ty : pair.old.ty
						});
					neu.push({
						x  : pair.neu.x,
						y  : pair.neu.y,
						ts : pair.neu.ts,
						tx : pair.neu.tx,
						ty : pair.neu.ty
						});
				}
				// Check if a logged activity took place.
				if ( old.length===0 && neu.length===0 )
					return false; // nothing to log

				//--------------------------------
				// Submit Undo/Redo Log
				//--------------------------------
				// Log the action inside the governor.
				const log    = {
					action  : "sparseRegion",
					layerId : tool.layerId,
					old     : old,
					neu     : neu
					};
				// Label the action for history panel.
				view.governor.enqueue(
					'edit', { history: `Pencil drawing.` } );
				// Log action in the governor.
				view.governor.log( 'edit', log );
				//console.log( 'Tile line drawn.', log );

				//--------------------------------
				// Clear Undo State
				//--------------------------------
				// Reset change log to ensure next drawing data doesn't intermix.
				tool._undoMap = new Map();  // reset for next stroke
				tool.layerId  = null;       // reset target layer id
				return true; // success
			}
		}
	};
	// register with JestTiler
	if ( window.JestTiler && typeof window.JestTiler.use==='function' )
		window.JestTiler.use( type, plugin );
	else console.error( 'pencil/pencil.pencil.plugin.js load error: JestTiler.use() not found' );
})( window );
