//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/methods/editor.plugin.js loaded' );

// Level editor "methods" plugin.
(function( window ) {
	// Define the plugin [object]
	var type	= 'methods';
	var subtype	= 'editor';
	var plugin	= {
		//--------------------------------
		// Plugin Setup Function
		//--------------------------------
		init: function( client ) {
			// Appropriately label each history item.
			client.register(
				'history:logged', 'labelItem',
				( item, log ) => {
					// Check for history label.
					if ( log.history )
						return item.setLabel( log.history );
					// Switch log action & determine label.
					switch ( log.action ) {
						case 'fillTile': // use a fill tile
							item.setLabel( 'Tiles changed.' );
							break;
						case 'sparseRegion': // draw a series of tile(s)
							item.setLabel( 'Sparse region laid.' );
							break;
						case 'fillRegion': // drop a clone of the region
							item.setLabel( 'Region filled.' );
							break;
						case 'dropRegion': // drop a clone of the region
							item.setLabel( 'Region placed.' );
							break;
						//default: console.warn( `Revert Action Unknown: ` );
					}
				});
		},

		//--------------------------------
		// New Method(s) In Tiler Application
		//--------------------------------
		extend: function( Klass, proto ) {
			//--------------------------------
			// Level Editing Method(s)
			//--------------------------------
			// Replace a region in the level matrix with a tile.
			// RETURNS: [boolean] `true` on success else `false` on fail.
			// * x,y		- [number] Coordinates of location on level to fill.
			// * matrix		- 2D [array] Matrix to replace a region with.
			//   stamp		- ElementCanvas [object] stamp (for faster render).
			//   history	- [boolean] Whether to log history for undo/redo.
			//   layerId	- [int] Value of level layer id.
			proto.toolLevelReplaceRegion = function(
				x, y, matrix, stamp=null, history=true, layerId=null ) {
				//--------------------------------
				// Gatekeep & Access Level Propert(ies)
				//--------------------------------
				// Validate an active view is open.
				if ( !this.tabbarFile.activeView ) return;    // disabled
				const view		= this.tabbarFile.activeView; // get active level file
				// Resolve active level layer.
				const level		= view.file.context;          // active JestLevel instance
				const key		= view.skey;                  // governor stack key

				//--------------------------------
				// Resolve Target Level Layer
				//--------------------------------
				// Resolve target level layer.
				const layer     = level.getLayer( layerId, true ); // get layer
				if ( !layer || layer.locked ) return false;   // can't find / edit layer

				//--------------------------------
				// Get Old & New Tile Data
				//--------------------------------
				// Build arrays for undo log
				const oldArr    = [];
				const newArr    = [];
				// Loop through matrix
				for ( let row=0; row<matrix.length; row++ ) {
					for ( let col=0; col<matrix[row].length; col++ ) {
						// Grab tile inside matrix.
						const tile = matrix[row][col];
						if ( !tile ) continue; // skip empty
						// Determine level grid x,y.
						const lx   = x + col;
						const ly   = y + row;
						// Bounds check
						if ( !layer.inBounds1D(lx) || !layer.inBounds1D(ly) ) continue;
						// Clone existing tile
						const oldT = layer.cloneTile( lx, ly );
						// Apply tile
						layer.fillRegion( lx, ly, 1, 1, tile );
						// Build undo entry
						oldArr.push( { x:lx, y:ly, ...oldT } );
						newArr.push( { x:lx, y:ly, ...tile } );
					}
				}

				//--------------------------------
				// Create Snapshot For Undo/Redo
				//--------------------------------
				// Log to governor.
				if ( oldArr.length ) {
					// Generate "sparseRegion" log.
					const log = {
						action  : 'sparseRegion',
						layerId : layer.id,
						old     : oldArr,
						neu     : newArr
						};
					if ( history ) view.governor.log( 'edit', log );
					else return log;
				}
				return true; // success
			}

			//--------------------------------
			// File Undo/Redo Method(s)
			//--------------------------------
			// Take a # (positive or negative) and use it to undo or redo.
			// RETURNS: [void].
			// * count	- signed [int] value to iterate (negative for undo).
			proto.revertFile = function( count ) {
				// Validate an active view is open.
				if ( !this.tabbarFile.activeView ) return false; // disabled
				const view		= this.tabbarFile.activeView;	// get active level file viewer
				const level		= view.file.context;			// active JestLevel instance
				const key		= view.skey;					// governor stack key
				// Iterate requested amount of direction.
				const dir		= count<0 ? 'undo' : 'redo';	// determine direction
				for ( let i=0; i<Math.abs(count); i++ ) {
					if ( dir==='undo' ) // undo last action
						view.governor.undo( 'edit' ); // get undo data
					else if ( dir==='redo' ) // redo last action
						view.governor.redo( 'edit' ); // get redo data
				}
			}

			//--------------------------------
			// File Undo/Redo Method(s)
			//--------------------------------
			// Listen to undo an action inside an open level file's governor.
			// RETURNS: [boolean].
			// * dir		- [string] Value of whether "undo" or "redo".
			// * skey		- [string] Level editor view unique system key.
			// * snapshot	- [object] Data from undo/redo event.
			proto.fileReverted = function( dir, skey, snapshot ) {
				//--------------------------------
				// Gatekeep & Access Level Propert(ies)
				//--------------------------------
				// Validate an active view is open.
				const easel		= this.easels?.files;		// get easel for finding view
				const view		= easel?.getView( skey );	// file viewer
				const file		= view?.file?.context;		// active JestLevel instance
				if ( !snapshot || !view || !file ) return false; // can't access file view

				//--------------------------------
				// Resolve Target Level Layer
				//--------------------------------
				// Resolve target level layer from history.
				const level		= view.file.context;		// active JestLevel instance

				//--------------------------------
				// Revert Level Layer History
				//--------------------------------
				// Structural layer actions must be handled BEFORE the
				// existing layer lookup. Undoing deletion requires
				// reconstructing a layer that no longer exists.
				const layerActions = [
					'layerAdd',
					'layerDelete',
					'layerRename',
					'layerReorder',
					'layerVisibility',
					'layerLock'
					];

				// Handle structural and property history independently
				// from existing tile, marquee, and entity operations.
				if ( layerActions.includes(snapshot.action) ) {
					//--------------------------------
					// Resolve Replay Direction
					//--------------------------------
					// Undo applies the before state.
					// Redo applies the after state.
					const data  = dir==='undo' ? snapshot.before : snapshot.after;

					// Track whether the requested operation succeeded.
					let success = false;

					//--------------------------------
					// Replay Layer Operation
					//--------------------------------
					switch ( snapshot.action ) {
						//--------------------------------
						// Add Layer
						//--------------------------------
						case 'layerAdd': {
							// Undo creation by removing the created layer.
							if ( dir==='undo' )
								success = level.removeLayer( snapshot.after.id );
							// Redo creation using its original ID and data.
							else success = !!level.restoreLayer( snapshot.after );
							break;
						}

						//--------------------------------
						// Delete Layer
						//--------------------------------
						case 'layerDelete': {
							// Undo deletion by rebuilding the original layer.
							if ( dir==='undo' )
								success = !!level.restoreLayer( snapshot.before );
							// Redo deletion by removing that same layer.
							else success = level.removeLayer( snapshot.before.id );
							break;
						}

						//--------------------------------
						// Rename Layer
						//--------------------------------
						case 'layerRename': {
							// Restore the appropriate name.
							const target = level.getLayer( data.id );
							if ( !target ) break;
							// Set target name.
							target.name  = data.name;
							success      = true;
							break;
						}

						//--------------------------------
						// Reorder Layers
						//--------------------------------
						case 'layerReorder': {
							// The recorded array is already ordered
							// from bottommost to topmost layer.
							if ( !Array.isArray(data) ) break;

							// Reorder existing layer instances.
							success = level.reorderLayers( data );

							// Treat an already-correct order as success.
							if ( !success ) {
								const current = level.getLayers();
								success =
									current.length===data.length
										&& current.every( (layer,index)=>layer.id===data[index] );
							}

							break;
						}

						//--------------------------------
						// Visibility
						//--------------------------------
						case 'layerVisibility': {
							// Restore visibility without creating new history.
							const target   = level.getLayer( data.id );
							if ( !target ) break;

							target.visible = data.visible;
							success        = true;
							break;
						}

						//--------------------------------
						// Locking
						//--------------------------------
						case 'layerLock': {
							// Restore the layer's editing permission.
							const target   = level.getLayer( data.id );
							if ( !target ) break;

							target.locked  = data.locked;
							success        = true;
							break;
						}
					}

					//--------------------------------
					// Validate Operation Result
					//--------------------------------
					// Never report a successful history replay if the
					// requested layer operation could not be applied.
					if ( !success ) return false;

					//--------------------------------
					// Restore Active Layer Selection
					//--------------------------------
					// Layer creation and deletion can change the active
					// layer. Restore the selection for the replay direction.
					if (
						snapshot.action==='layerAdd' ||
						snapshot.action==='layerDelete'
					) {
						const activeId = dir==='undo'
							? snapshot.activeBefore : snapshot.activeAfter;

						// Only select IDs that exist in the restored state.
						if ( activeId!==null && activeId!==undefined )
							level.setActiveLayer( activeId );
					}

					//--------------------------------
					// Refresh Level and UI
					//--------------------------------
					// The restore method has already rebuilt any new
					// layer canvas. Refresh the visible level composite.
					view.refreshCanvas?.();

					// The Layers sidebar represents the active file.
					// Rebuild it only when this is the active file view.
					if ( this.tabbarFile?.activeView===view )
						this.refreshLayers( level.activeLayerId );

					// Mark the edited file as having unsaved changes.
					this.markChanged( view );

					//--------------------------------
					// Finish History Replay
					//--------------------------------
					// Preserve the existing revert event convention.
					this.emit( 'revert', null, dir, snapshot );
					return true; // success
				}

				// Check for layer using layer id from history snapshot.
				const layer     = level.getLayer( snapshot.layerId ); // get layer
				if ( !layer ) return false;

				//--------------------------------
				// Resolve History Layer
				//--------------------------------
				// Get altered dimensions & coordinates.
				let x, y, w, h, replace;
				if ( dir==='undo' ) // undo last action
					( { x, y, w, h, old: replace } = snapshot );
				else if ( dir==='redo' ) // redo last action
					( { x, y, w, h, neu: replace } = snapshot );
				//--------------------------------
				// Draw on the Level (updates tilemap + canvas)
				//--------------------------------
				// Check undo/redo action & perform appropriate action.
				//console.log( x, y, w, h, replace );
				switch ( snapshot.action ) {
					case 'fillTile': // use a fill tile
						layer.fillRegion( x, y, w, h, replace );
						break;
					case 'sparseRegion': // draw a series of tile(s)
					case 'marqueeFloat':
					case 'marqueeDrop':
						layer.applySparseRegion( replace );
						break;
					case 'fillRegion': // drop a clone of the region
					case 'dropRegion': // drop a clone of the region
						layer.dropRegion( x, y, replace );
						break;
					/*default:
						console.warn( `Revert Action Unknown: ` );
						return false; // fail*/
				}
				// Emit an event.
				this.emit( 'revert', null, dir, snapshot );
				return true; // success
			}

			//--------------------------------
			// Utility: center of visible gameboard
			//--------------------------------
			// RETURNS: { x, y } in *pixel* coordinates local to the canvas
			// * units	- [int] set grid dimension units
			proto.getVisibleLevelCenter = function( units=1 ) {
				//--------------------------------
				// Access Drawing Workspace Area
				//--------------------------------
				// Get level canvas.
				const canvas	= this.gameboard.display.getCanvas('workspace').el;

				//--------------------------------
				// Calculate Position & Dimensions
				//--------------------------------
				// NOTE: If your canvas is inside a scrollable DIV, use that instead:
				const container	= canvas.parentElement;		// access canvas parent
				const visibleW	= container.clientWidth;
				const visibleH	= container.clientHeight;
				const scrollX	= container.scrollLeft;
				const scrollY	= container.scrollTop;
				const canvasW	= canvas.width;				// canvas width (in pixels)
				const canvasH	= canvas.height;			// canvas height (in pixels)

				//--------------------------------
				// Calculate Center
				//--------------------------------
				// Begin center calculation(s).
				let centerX, centerY;

				// Horizontal center
				// container wider than canvas → full canvas visible
				if ( visibleW>=canvasW ) centerX = canvasW / 2;
				else {
					const halfVW	= visibleW / 2;
					const minMidX	= halfVW;
					const maxMidX	= canvasW - halfVW;
					const rawMidX	= scrollX + halfVW;
					centerX			= Math.min( Math.max(rawMidX,minMidX), maxMidX );
				}

				// Vertical center
				if ( visibleH>=canvasH ) centerY = canvasH / 2;
				else {
					const halfVH	= visibleH / 2;
					const minMidY	= halfVH;
					const maxMidY	= canvasH - halfVH;
					const rawMidY	= scrollY + halfVH;
					centerY			= Math.min( Math.max(rawMidY,minMidY), maxMidY );
				}

				//--------------------------------
				// Return Center in Units (e.g. Tiles)
				//--------------------------------
				// Confine centerX and centerY to units.
				centerX	= Math.floor( centerX / units );
				centerY	= Math.floor( centerY / units );
				return { x: centerX, y: centerY }; // return coordinates
			}

			// Fill a region in the level matrix with a tile.
			// RETURNS: [boolean] `true` on success else `false` on fail.
			// * x,y		- [number] Coordinates of location on level to fill.
			// * w,h		- [number] Width and height dimensions of region to fill.
			//   tile		- [object] Tile data to flood fill into region.
			//   layerId	- [int] Value of level layer id.
			proto.toolLevelFillRegion = function( x, y, w, h, tile=null, layerId=null ) {
				//--------------------------------
				// Gatekeep & Access Level Propert(ies)
				//--------------------------------
				// Validate an active view is open.
				if ( !this.tabbarFile.activeView ) return;		// disabled
				const view		= this.tabbarFile.activeView;	// get active level file
				const level		= view.file.context;			// active JestLevel instance
				const key		= view.skey;					// governor stack key

				//--------------------------------
				// Resolve Target Level Layer
				//--------------------------------
				// Resolve target level layer.
				const layer     = level.getLayer( layerId, true ); // get layer
				if ( !layer || layer.locked ) return false;

				//--------------------------------
				// Get Old & New Tile Data
				//--------------------------------
				// Build the “new” tile that we want to draw:
				const swatch	= this.swatches.background.contents;
				const newTile	= tile ?? { ts: swatch.ts, tx: swatch.tx, ty: swatch.ty };

				//--------------------------------
				// Deep-Clone Existing Region on Level Tilemap
				//--------------------------------
				// This gives us an h×w array of {ts,tx,ty} or null,
				// strictly separated from the live tilemap.
				const oldMatrix	= layer.cloneRegion( x, y, w, h );

				//--------------------------------
				// Draw on the Level (updates tilemap + canvas)
				//--------------------------------
				layer.fillRegion( x, y, w, h, newTile );

				//--------------------------------
				// Build a 2D [array] of `new` values to match `oldMatrix` shape
				//--------------------------------
				// Every cell in `newMatrix` is the same newTile object,
				// but we must clone it into individual {ts,tx,ty} so undo can restore it
				const newMatrix	= this.grapher.createMatrix( w, h, newTile );

				//--------------------------------
				// Create Snapshot For Undo/Redo
				//--------------------------------
				const log = {
					action  : "fillRegion",
					layerId : layer.id,
					x       : x,
					y       : y,
					w       : w,
					h       : h,
					old     : oldMatrix,	// deep-cloned old region
					neu     : newMatrix		// deep-cloned “just placed” tiles
					};
				view.governor.log( 'edit', log );	// log change in governor
				return true; // success
			}

			//--------------------------------
			// Fill Masked Marquee Tiles
			//--------------------------------
			// Clear selected tiles on the requested level layer.
			//
			// The bottom layer remains solid and uses the background swatch.
			// Upper layers are sparse: lifting tiles leaves null cells.
			//
			// Both the old and new states are recorded explicitly so
			// JestGovernor can restore transparent cells during undo/redo.
			//
			// RETURNS: [object|boolean] tile change log or success state.
			// * x,y     - [int] Values of mask top-left x,y coordinates on canvas.
			// * mask    - 2d [array<boolean>] of add/subtract rects to draw.
			//   history - [boolean] Whether to log history for undo/redo.
			//   layerId - [int] Value of level layer id.
			proto.toolLevelFillMask = function( x, y, mask, history=true, layerId=null ) {
				//--------------------------------
				// Validate Editing Context
				//--------------------------------
				// Prevent editing while the application is unavailable.
				if ( this.busy() ) return false;

				// Resolve the level and requested layer.
				const view	= this.tabbarFile.activeView;
				if ( !view ) return false;

				const level	= view.file.context;
				const layer	= level.getLayer( layerId, true );

				// Locked layers cannot be modified.
				if ( !layer || layer.locked ) return false;

				// Require a valid selection mask.
				if ( !Array.isArray(mask) || !mask.length || !mask[0]?.length )
					return false;

				//--------------------------------
				// Determine Layer Clearing Behavior
				//--------------------------------
				// The bottom layer is solid; layers above it are sparse.
				const isGroundLayer = level.getLayers()[0]===layer;

				// Only the bottom layer receives the background swatch.
				const swatch	= this.swatches.background.contents;
				const newTile	=
					isGroundLayer
						? { ts:swatch.ts, tx:swatch.tx, ty:swatch.ty }
						: null;

				//--------------------------------
				// Collect Reversible Tile Changes
				//--------------------------------
				// Preserve previous and resulting values for each cell.
				const oldArr = [];
				const newArr = [];
				for ( let my=0; my<mask.length; my++ ) {
					for ( let mx=0; mx<mask[my].length; mx++ ) {
						// Only edit cells belonging to the effective selection.
						if ( !mask[my][mx] ) continue;

						// Calculate the absolute tile coordinates.
						const lx = x + mx;
						const ly = y + my;

						// Ignore cells outside the level.
						if ( !layer.inBounds1D(lx) || !layer.inBounds1D(ly) )
							continue;

						// Capture the original tile, including transparency.
						const oldTile = layer.cloneTile( lx, ly );

						// Do not create history for an already-empty upper cell.
						if ( oldTile===null && newTile===null )
							continue;

						// Record the original cell.
						oldArr.push({
							x  : lx,
							y  : ly,
							ts : oldTile?.ts ?? null,
							tx : oldTile?.tx ?? null,
							ty : oldTile?.ty ?? null
							});

						// Record the new cell.
						newArr.push({
							x  : lx,
							y  : ly,
							ts : newTile?.ts ?? null,
							tx : newTile?.tx ?? null,
							ty : newTile?.ty ?? null
							});
					}
				}

				//--------------------------------
				// Apply Changes to Layer
				//--------------------------------
				// Do not create empty history records.
				if ( oldArr.length===0 ) return false;

				// Update the tilemap and redraw changed pixels.
				// The layer method now understands null tile records.
				if ( !layer.applySparseRegion(newArr) )
					return false;

				//--------------------------------
				// Prepare History
				//--------------------------------
				// Preserve the existing sparseRegion history format.
				const log = {
					action  : 'sparseRegion',
					layerId	: layer.id,
					old	    : oldArr,
					neu	    : newArr
					};

				// Let the caller own the history transaction when requested.
				if ( !history ) return log;

				// Otherwise, record directly with the existing governor.
				view.governor.log( 'edit', log );
				return true; // success
			}
		}
	};
	// register with JestCreator
	if ( window.JestCreator && typeof window.JestCreator.use==='function' )
		window.JestCreator.use( type, plugin );
	else console.error( 'methods/editor.plugin.js load error: JestCreator.use() not found' );
})( window );
