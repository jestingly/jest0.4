//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/tools/pencil/eraser.plugin.js loaded' );

// Eraser plugin.
(function( window ) {
	// Define the plugin [object]
	var type	= 'tools';
	var subtype	= 'eraser';
	var plugin	= {
		//--------------------------------
		// Plug Tool Into Tiler Application
		//--------------------------------
		init: function( client ) {
			// --------------------------------
			// Create Eraser Tool [object]
			// --------------------------------
			// Reuse pencil input tracking, but provide eraser drawing behavior.
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

			//-------------------------
			// Create Control Panel
			//-------------------------
			// Generate a "form" inside the sidebar for eraser tool options.
			const optsPanel = new JestForm( client ); // create DOM panel element [object]
			optsPanel.build( 'options', ['eraser-options'] ); // build the form (eraser-options CSS class)

			// Brush-size input field.
			const inputSize = new JestInputRange( client, 'size', null, 1, 'Size' );
			inputSize.setMin( 1 );
			const maxSize	= 100;		// ← whatever upper limit feels best
			inputSize.setMax( maxSize );
			inputSize.setStep( 1 );
			inputSize.setValue( 1 );	// default size is 1 (single-tile eraser)
			inputSize.build( 'input-size' );
			inputSize.panel.addAttribute( 'data-tooltip', 'Eraser Size' );
			inputSize.panel.addAttribute( 'data-tooltip-keys', '[+]' );
			optsPanel.addField( 'size', inputSize );
			inputSize.showLabel();

			// Brush roundness input (0=diamond, 0.5=circle, 1=square)
			const inputRound = new JestInputRange( client, 'roundness', null, 1, 'Roundness' );
			inputRound.setMin( 0 );
			inputRound.setMax( 1 );
			inputRound.setStep( 0.1 );
			inputRound.setValue( 1 );
			inputRound.build( 'input-roundness' );
			inputRound.panel.addAttribute( 'data-tooltip', 'Eraser Roundness' );
			optsPanel.addField( 'roundness', inputRound );
			inputRound.showLabel();

			// Add the eraser tool's panel section to the sidebar.
			client.sidebar.addSection( subtype, 'Eraser', optsPanel.panel, {}, optsPanel );
			client.sidebar.refit( subtype );

			//-------------------------
			// Options Keyboard Command(s)
			//-------------------------
			// Register "[" and "]" for brush size control
			client.io.registerShortcut( '[', 'pencilSizeDown' );
			client.io.registerShortcut( ']', 'pencilSizeUp' );
			// Keyboard shortcut menu actions for brush resizing
			client.io.register(
				'keyboardShortcut', 'eraserResizeCommand',
				command => {
					//--------------------------------
					// Require Eraser Availability
					//--------------------------------
					// Skip if user is typing
					if ( client.io.isTypingInInput() ) return;
					// Check if active tool is "eraser"
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
			// Add "eraser" tool button to toolbar.
			const button = client.toolbar.createButton( { name: subtype, text: null /*Eraser*/ } );
			button.clicker.addAttribute( 'data-tooltip', 'Eraser' );
			button.clicker.addAttribute( 'data-tooltip-keys', 'E' );
			//-----------------------------
			// Icon Eraser
			//-----------------------------
			button.clicker.addElements([
				{
					name       : 'icon',
					tag        : 'svg',
					attributes : {
						xmlns        : "http://www.w3.org/2000/svg",
						viewBox      : "-5 -10 110 110",
						width        : "24",
						height       : "24",
						"aria-hidden": "true"
						},
					classes    : [ 'ico-eraser' ],
					elements   :
						[
							{
								name       : 'path',
								tag        : 'path',
								attributes :
									{
										'd': 'm89.398 44.898-33.398-33.398c-0.80078-0.80078-2-0.80078-2.8008 0l-36.301 36.398c-3.8984 3.9023-3.8984 10.203 0 14.102l21 21h-25.898c-1.1016 0-2 0.89844-2 2s0.89844 2 2 2h34c2.5 0 5.1016-1 7-2.8984l36.301-36.301c0.39844-0.39844 0.60156-0.89844 0.60156-1.3984-0.003906-0.503906-0.10156-1.10156-0.503906-1.503906zm-39.199 36.402c-2.3008 2.3008-6.1016 2.3008-8.5 0l-22-22.102c-2.3008-2.3008-2.3008-6.1016 0-8.5l4.6016-4.6016 30.5 30.5z',
										//'fill-rule': 'evenodd'
									}
							}
						]
				}]);

			// Register toolbar button action.
			client.register(
				'equip', 'setEraser',
				( name ) => {
					// Block action if app is busy.
					if ( client.busy() ) return; // app busy‐gate
					// Check current button action.
					if ( name===subtype ) {
						client.toolbox.setTool( tool );				// enable new tool
						client.sidebar.enableSection( subtype );	// show eraser panel
						// Activate the menu button
						client.toolbar.buttons[name].activate();	// toggle button on
					}
				});

			// Define keyboard shortcut.
			client.io.registerShortcut( 'E', subtype );
			// Keyboard shortcut menu action.
			client.io.register(
				'keyboardShortcut', 'eraserCommand',
				command => {
					// Block input shortcuts while user is typing
					if ( client.io.isTypingInInput() ) return;
					// Affirm shortcut command is for "eraser" tool.
					if ( command===subtype )
						client.toolbox.setTool( subtype );
				});

			//--------------------------------
			// Handle Tool Block Check
			//--------------------------------
			// Determine whether the tool can edit the active layer.
			tool.register(
				'blockCheck', 'eraserBlocking',
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
					client.toolLogEraser();
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

			// Initiate idle tracking event (eraser down, not moving much).
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
					// Replace a tile on the level.
					client.toolLevelErase( pos.lx, pos.ly );
				});

			//-------------------------
			// Stop Drawing Hook(s)
			//-------------------------
			// Log the entire line of tile(s) drawn as one undo/redo action.
			tool.register( 'stop', 'logEraser', ()=>client.toolLogEraser() );

			// --------------------------------
			// Settings Change Listener(s)
			// --------------------------------
			// Create event for when the magnification zoom value changes.
			client.register(
				'levelZoomed', 'eraserZoom',
				zoom => {
					// --------------------------------
					// Get Current File State
					// --------------------------------
					// Get current file status.
					const s = client.getFileStatus( tool, true );
					// --------------------------------
					// Recalibrate to Zoomed Grid-Size
					// --------------------------------
					// Match the tool grid to the active level view zoom.
					tool.anchor.graticulate( s.levelView.anchor.getUnitsZoomed() );
				});
		},

		//--------------------------------
		// New Method(s) In Tiler Application
		//--------------------------------
		extend: function( Klass, proto ) {
			// Erase a tile on a level board at (x,y).
			// RETURNS: [boolean] `true` on success else `false` on fail
			// * x,y	- [number] Level (x,y) coords to draw at region.
			proto.toolLevelErase = function( x, y ) {
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
				const tool      = this.toolbox.tools.eraser;       // [object] Eraser tool
				const mode      = tool.skim( 'mode' );             // [string] Drawing mode
				const gridLimit = this.config.levelGrid;           // [int] Value of level WxH

				//--------------------------------
				// Resolve Target Level Layer
				//--------------------------------
				// Resolve target level layer.
				const layers    = level.getLayers();
				const layer     = level.getLayer( tool.layerId, true ); // get layer
				if ( !layer || layer.locked ) return false;        // can't find / edit layer
				if ( tool.layerId==null ) tool.layerId = layer.id; // change tool target layer
				const bottom    = layers[0] === layer;             // whether bottom layer or not

				//--------------------------------
				// Get Brush Size Setting(s)
				//--------------------------------
				// Get brush size from options
				const optsPanel = this.sidebar.getSection( tool.name );
				const form      = optsPanel.getContents();
				const size      = parseInt( form.getField('size')?.getValue?.() ?? 1 );
				const roundness = parseFloat( form.getField('roundness')?.getValue?.() ?? 1 );

				//--------------------------------
				// Define Tile Data
				//--------------------------------
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
				// Rounded Brush Loop (in proto.toolLevelErase)
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
						const newTile = bottom ? bgTile : null;    // New tile to replace with

						// Ignore erasing transparent areas.
						if ( oldTile===null && newTile===null ) continue;

						// If bottom layer, apply background tile.
						if ( bottom )
							layer.fillRegion( tx, ty, 1, 1, newTile );
						else // transparent tile
							layer.applySparseRegion([{
								x: tx, y: ty, ts: null, tx: null, ty: null
								}]);

						// Log for undo/redo.
						if ( mode==='drawing' || mode==='shiftlining' ) {
							const map = tool._undoMap;
							if ( !map.has(id) )
								map.set( id, {
									old:
										{
										x:tx, y:ty,
										...(oldTile ?? { ts:null, tx:null, ty:null })
										},
									neu:
										{
										x:tx, y:ty,
										...(newTile ?? { ts:null, tx:null, ty:null })
										},
									});
							else
								map.get(id).neu =
									{
									x:tx, y:ty,
									...(newTile ?? { ts:null, tx:null, ty:null })
									};
						}
					}
				}
				return true; // success
			}

			//--------------------------------
			// Drawing Method(s)
			//--------------------------------
			// Log a line of eraser tile(s) as a single drawing action.
			// RETURNS: [boolean] `true` on success else `false` on fail.
			proto.toolLogEraser = function() {
				//--------------------------------
				// Validate Eraser Availability
				//--------------------------------
				const state	= this.getState();				// get current app state
				if ( !state.levelView ) return false;		// no active level open
				const view	= state.levelView;				// current view
				const key	= state.levelView.skey;			// undo/redo governor key
				const tool	= this.toolbox.tools.eraser;	// active tool

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
					'edit', { history: `Eraser drawing.` } );
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
	else console.error( 'pencil/eraser.eraser.plugin.js load error: JestTiler.use() not found' );
})( window );
