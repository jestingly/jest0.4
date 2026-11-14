//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/tools/dragdrop/tiledrop.plugin.js loaded' );

// Tiledrop plugin.
(function( window ) {
	// Define the plugin [object]
	var type	= 'tools';
	var subtype	= 'tiledrop';
	var plugin	= {
		//--------------------------------
		// Plug Tool Into Tiler Application
		//--------------------------------
		init: function( client ) {
			// --------------------------------
			// Create Dragdrop Tool [object]
			// --------------------------------
			// Add a dragdrop tool to the tileset canvas board.
			const tool = new JestToolDragdrop( this, subtype );
			client.toolbox.registerTool( subtype, tool );
			tool.build(); // build tool
			tool.setClickToDrag(); // click-to-drag (not hold-to-drag)
			// Set tool grid size.
			tool.anchor.graticulate( client.config.tileGrid );

			// Simultaneous tools allowed:
			tool.coopt( 'tilesetMarquee' );

			// --------------------------------
			// Set Tiledrop Drag & Drop Source + Destination
			// --------------------------------
			// Set the "tileset" canvas as the crate source lift region for dragdrop.
			const paletteCanvas = client.gameboard.display.getCanvas( 'palette' );
			tool.setTarget( paletteCanvas ); // set tile-click source
			// Set the "level" canvas as the crate drop destination for dragdrop.
			const levelCanvas   = client.gameboard.display.getCanvas( 'workspace' );
			const levelCanvasEl = levelCanvas.el;
			tool.crate.addGarage( levelCanvasEl );
			// Set swatch panel as a garage.
			const swatchPanelEl = client.swatchPanel.panel.el;
			tool.crate.addGarage( swatchPanelEl );

			//--------------------------------
			// Synchronize Tiledrop Level Zoom
			//--------------------------------
			// Rescales the carried tile preview and updates its destination snapping.
			// The snapshot matrix and original stamp remain logically unscaled.
			// RETURNS: [boolean] `true` on success else `false`.
			const syncTileDropZoom = () => {
				//--------------------------------
				// Validate Carried Tile Data
				//--------------------------------
				// Get the original unscaled snapshot carried by the crate.
				const snapshot = tool.crate.display.getContents();
				const stamp    = snapshot?.stamp;
				const matrix   = snapshot?.matrix;

				// Require a valid tile matrix and its original stamp canvas.
				if ( !stamp?.el || !matrix?.length || !matrix[0]?.length )
					return false; // nothing is currently being carried

				//--------------------------------
				// Resolve Active Level Zoom
				//--------------------------------
				// Get the active level view. Fall back to normal scale when no level
				// is open so the crate never retains a previous level's magnification.
				const state = this.getState();
				const view  = state?.levelView;
				const zoom  = view?.anchor.getZoom() ?? 1;

				// Get the display-space size of one level tile.
				const units = view?.anchor.getUnitsZoomed() ?? client.config.tileGrid;

				//--------------------------------
				// Configure Crate Coordinate Space
				//--------------------------------
				// Keep the crate's logical units equal to the normal tile size.
				tool.crate.anchor.graticulate( client.config.tileGrid );
				// Apply level magnification through the crate anchor.
				tool.crate.anchor.setZoom( zoom );

				// Keep the mouse centered within the first carried tile while freely
				// following the pointer outside a garage.
				tool.crate.offsetX = units / 2;
				tool.crate.offsetY = units / 2;

				//--------------------------------
				// Calculate Zoomed Preview Size
				//--------------------------------
				// Determine the logical tile dimensions of the carried matrix.
				const columns = matrix[0].length;
				const rows    = matrix.length;

				// Convert the logical matrix dimensions into display-space pixels.
				const width  = Math.max( 1, Math.round(columns * units) );
				const height = Math.max( 1, Math.round(rows    * units) );

				//--------------------------------
				// Render Zoomed Crate Preview
				//--------------------------------
				// Get the crate's preview canvas.
				const preview = tool.crate.display.getCanvas( 'dragdrop' );
				if ( !preview ) return false; // abort

				// Scale the original stamp into the crate using nearest-neighbor
				// rendering supplied by ElementCanvas.draw().
				preview.draw(
					stamp, true, true,
					0, 0, 0, 0,
					stamp.width, stamp.height, width, height
					);

				// Match the outer crate panel to the scaled preview dimensions.
				tool.crate.panel.resize( width, height );

				//--------------------------------
				// Refresh Current Drag Position
				//--------------------------------
				// Immediately resnap the crate after a real-time zoom change.
				tool.crate.refreshPosition();
				return true; // success
			};

			// --------------------------------
			// Add Event Listener(s)
			// --------------------------------
			// Event listener when "item picked up".
			tool.register(
				'dragdropPickup', 'liftTile',
				( e, pos, tool ) => {
					//--------------------------------
					// Create Carried Tile Snapshot
					//--------------------------------
					// Copy the selected tileset region into the drag-drop crate.
					if ( !client.toolTilesetTileLift(tool,pos.tx,pos.ty) )
						return false; // pickup failed

					//--------------------------------
					// Match Active Level Zoom
					//--------------------------------
					// Immediately display and snap the crate at the active level scale.
					syncTileDropZoom();

					//--------------------------------
					// Shield Event Overlap(s)
					//--------------------------------
					// Request to suppress necessary action(s).
					tool.suppress(); // suppress event(s)
				});

			// Event listener when carrying to suppress external mouse-interactions.
			tool.register(
				'suppressed', 'suppressMouseActions',
				dragdrop => {
					// Prevent editor tools beneath the carried crate from
					// receiving the same mouse interaction.
					client.delegator.permaSuppress(
						dragdrop.name,
						['click','mouseup','mousedown']
						);
				});

			// Event listener when carrying to release external mouse-interactions.
			tool.register(
				'released', 'releaseMouseActions',
				dragdrop => {
					// Release permanent ownership while retaining a short
					// cooldown for the terminating mouse interaction.
					client.delegator.clearPerma(
						dragdrop.name,
						['click','mouseup','mousedown'],
						300
						);
				});

			// A drop outside every garage emits "dragdropStopped" without
			// emitting "dragdropDropped", so it requires its own cleanup path.
			tool.register(
				'dragdropStopped', 'releaseTileDrop',
				() => {
					//--------------------------------
					// Release Event Overlap Shield
					//--------------------------------
					// Request to release necessary suppression.
					tool.release(); // release suppression
				});

			// Event listener when "item dropped".
			tool.register(
				'dragdropDropped', 'layTile',
				( garage, e, tool, region ) => {
					//--------------------------------
					// Finalize Successful Drop
					//--------------------------------
					// Release suppression before validating.
					// This guarantees cleanup.
					tool.release(); // release suppression

					//--------------------------------
					// Validate State & Get Editor [objects]
					//--------------------------------
					// Check for open view & tool.
					const state = this.getState(); // get program state
					if ( !state?.levelView ) return;
					// Require level view & level [object].
					const view  = state.levelView;

					//--------------------------------
					// Commit Tile Drop Movement
					//--------------------------------
					// Replace a tile on the level.
					//console.log( e, tile );
					//client.toolLevelDraw( tile, e.lx, e.ly );
					if ( garage===levelCanvasEl ) {
						// Get width & height.
						if ( region.matrix[0].length==1 && region.matrix.length==1 ) {
							// Label the action for history panel.
							view.governor.enqueue(
								'edit', { history: `Drop a tile.` } );
							// Continue to drop a single tile onto the level board.
							client.toolLevelReplaceRegion( e.lx, e.ly, region.matrix, region.stamp );
							view.governor.dequeue( 'edit' ); // fail-safe
						}
						// Insert a floating selection containing the matrix.
						else {
							// Log action in the governor.
							this.insertLevelMarqueeSelection( e.lx, e.ly, region.matrix );
						}
					}
					else if ( garage===swatchPanelEl ) {
						//--------------------------------
						// Get Old & New Tile Data
						//--------------------------------
						// Determine if matrix is a single tile.
						const w	= region.matrix[0].length,	// width is length of columns
							  h	= region.matrix.length;		// height is length of rows
						// Only trigger if matrix is 1x1.
						if ( w===1 && h===1 ) {
							// Get tile from matrix.
							const tile = region.matrix[0][0];
							// Prompt user to add tile to swatch panel.
							client.modals.newSwatch.inputs.title.setValue( '' );
							client.modals.newSwatch.open( tile );
						}
					}
				});

			// Event listener when target "double clicked".
			tool.register(
				'dragdropDoubleClicked', 'setSwatchForeground',
				( e, tool ) => {
					// Set the doubleclicked tile as the background swatch.
					//console.log( e );
					client.toolSetTileSwatch( { tx: e.tx, ty: e.ty }, 'foreground' );
					// Play sound-effect to signal.
					client.soundboard.playSound( 'jest_eyedrop', 'wav', 1.3 );
				});

			// A tool has been selected/equipped in the app (listener).
			client.register(
				'equip', subtype,
				( name ) => {
					// Block action if app is busy.
					if ( client.busy() ) return; // app busy‐gate
					// Set the active tool to the marquee tool.
					if ( name==='tiledrop' ) {
						// Toggle the tiledrop tool.
						tool.enable();	// enable tool
					}
				});

			//--------------------------------
			// Live Level Zoom Listener
			//--------------------------------
			// Update an actively carried tiledrop whenever the level zoom changes.
			client.register(
				'levelZoomed', 'tiledropCrateZoom',
				() => {
					// Ignore zoom changes when no tile snapshot is being carried.
					if ( !tool.crate.display.getContents() )
						return; // nothing to update
					// Resize, resnap, and reposition the crate immediately.
					syncTileDropZoom();
				});

			//-------------------------
			// Tileset Selection Hook(s)
			//-------------------------
			// Prevent selection from being floated.
			client.toolbox.tools.tilesetMarquee.register(
				['selected','floated'], 'grabMatrix',
				( tool ) => {
					//console.log('lifted');
					// Get marquee anchor bounds.
					const bounds = tool.anchor.getBounds(); // bounding box info
					// Store the marquee bounds info inside tiledrop contents.
					client.toolbox.tools.tiledrop.setContents( bounds );
					// Clear the selection.
					tool.reset(); // deselect & reset
				});

			// Event listener "interceptor" for when a selection is made.
			tool.register(
				'checkCancel', 'allowSelection',
				( e ) => {
					// Get tileset marquee anchor bounds.
					const tilesetMarquee = client.toolbox.tools.tilesetMarquee;
					const bounds = tilesetMarquee.tracer.getBounds(); // bounding box info
					// Permit the drag-drop if a selection is made.
					if ( bounds.w>0 && bounds.h>0 )
						tool.jot( 'canceling', false );
				});
		},

		//--------------------------------
		// New Method(s) In Tiler Application
		//--------------------------------
		extend: function( Klass, proto ) {
			// Display a tile inside the drag & drop crate.
			// RETURNS: [boolean] `true` on success else `false` on fail.
			// * tool  - [object] JestToolToldrop emitting the event.
			// * x,y   - [number] Coordinates of tile x,y on tileset.
			proto.toolTilesetTileLift = function( tool, x, y ) {
				//console.log( 'lifting tileset tile(s)' );
				// Get active state info.
				const state    = this.getState(); // get current program state
				// Validate an active view is open.
				if ( !state.tileset ) return false; // no active tileset
				const tileset  = state.tileset; // get tileset ref
				// --------------------------------
				// Draw Tile in Crate
				// --------------------------------
				// Check for an active marquee selection.
				let w = 1, h = 1; // width & height
				const contents = tool.getContents();
				if ( contents ) {
					// Get bounds from tiledrop contents (stored via marquee).
					( { x, y, w, h } = contents );
					// Clear the contents.
					tool.setContents( null );
				}
				// Clamp width & height
				w = Math.max( 1, w ); // no smaller than a single tile
				h = Math.max( 1, h ); // no smaller than a single tile
				// Get region matrix & stamp.
				const snapshot = tileset.snapshotRegion( x, y, w, h );
				const { matrix, stamp } = snapshot;
				// Set the crate contents to carry designated tile data.
				//tool.crate.display.setContents( tileset.getTileData(tx,ty) );
				tool.crate.display.setContents( snapshot );
				// Get tile snapshot canvas & stamp onto crate display.
				//const stamp = tileset.getTileStamp( tx, ty );
				tool.crate.display.render( 'dragdrop', stamp );
				// Resize crate to show contents.
				tool.crate.panel.resize( stamp.width, stamp.height );
				return true; // success
			}
		}
	};
	// register with JestTiler
	if ( window.JestTiler && typeof window.JestTiler.use==='function' )
		window.JestTiler.use( type, plugin );
	else console.error( 'dragdrop/tiledrop.plugin.js load error: JestTiler.use() not found' );
})( window );
