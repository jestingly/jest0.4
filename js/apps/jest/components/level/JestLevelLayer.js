//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/level/JestLevelLayer.js loaded' );

//-------------------------
// JestLevelLayer Class
//-------------------------
// Represents a single tile layer belonging to a level.
// Manages tile data, visibility, locking, and rendering.
//-------------------------------------------------------
class JestLevelLayer extends JestSavable {
	// Layer properties
	id				= null;				// Unique layer identifier
	name			= null;				// Display name
	level			= null;				// Parent JestLevel reference
	visible			= true;				// Whether layer is rendered
	locked			= false;			// Whether layer can be edited
	// Object properties
	canvas			= null;				// [ElementCanvas] object
	stamp			= null;				// [ElementCanvas] object used for tile stamping
	overworld		= null;				// [object] JestOverworld reference level is within.
	// Level parts
	tilemap			= null; 			// 2D [array] Raw tile map of level.
	chunks			= null;				// [array] Tile map of level compressed into chunks.
	tiledefs		= null;				// [object] Tiledefs aligned to specific tile indices.

	// --------------------------------
	// Constructor
	// --------------------------------
	// Construct the [object].
	// * client		- [object] Application client creating the object.
	// * name		- [string] Value of level name (e.g. 'level1').
	constructor( client, name ) {
		// Call the parent object constructor
		super( client, name );	// construct the parent
		this.jot( 'status', 'constructed' ); // set status
	}

	//-------------------------
	// Teardown Method(s)
	//-------------------------
	// Destroy the view [object]
	// RETURNS: [void].
	destroy() {
		// Prevent double‐destroy
		if ( this.skim('status')==='destroyed' ) return;
		this.jot( 'status', 'destroyed' );
		// Unregister any listeners on this.anchor
		/*if ( this.anchor && this.anchor.unregisterAll )
			this.anchor.unregisterAll();*/
		// Clear & remove canvases
		if ( this.canvas && this.canvas.el ) {
			this.canvas.el.getContext('2d').clearRect( 0, 0, this.canvas.el.width, this.canvas.el.height );
			this.canvas.el.remove(); // detach from DOM
		}
		if ( this.stamp && this.stamp.el ) {
			this.stamp.el.getContext('2d').clearRect( 0, 0, this.stamp.el.width,this.stamp.el.height );
			this.stamp.el.remove();
		}
		// Remove layer canvas from the DOM, if attached.
		this.canvas?.remove?.();
		// Nullify [object] reference propert(ies).
		this.level		= null; // nullify level property
		// Null out large fields
		this.tilemap	= this.chunks = this.tiledefs = null;
		this.canvas		= this.stamp  = null;
		// Call parent destroy if it exists
		if ( super.destroy ) super.destroy();
	}

	//-------------------------
	// Initialization Methods
	//-------------------------
	// Setup the object [object].
	// RETURNS: [boolean] `true` on success else `false` on fail.
	async setup() {
		// Check if setup is possible.
		const status	= this.skim( 'status' );
		if ( status!=='constructed' ) return false;

		// --------------------------------
		// Build Level
		// --------------------------------
		this.jot( 'status', 'building' );	// set status
		this.build();						// build the object

		// --------------------------------
		// Load File(s) Data
		// --------------------------------
		this.jot( 'status', 'empty' );		// set status
		return true; // success
	}

	// Build the [object].
	// RETURNS: [boolean] `true` on success else `false` on fail.
	build() {
		// Check if setup is possible.
		const status	= this.skim( 'status' );
		if ( status!=='building' ) return false;
		// --------------------------------
		// Create Drawing [objects]
		// --------------------------------
		// Create the level rendering element canvas [object]
		const canvas		= new ElementCanvas();
		this.canvas			= canvas;
		// Update canvas dimensions
		const levelSpan		= this.client.config.levelSpan;
		canvas.resize( levelSpan, levelSpan );
		// Create a canvas for clip stamping onto level element canvas [object]
		const stamp			= new ElementCanvas();
		this.stamp			= stamp;

		// --------------------------------
		// Setup Sizing Method(s) [object]
		// --------------------------------
		/*// Add resize event handler for canvas updating
		this.anchor.register( 'resize', 'level', (w,h)=>this.resize(w,h) );
		// Set tile size
		this.anchor.graticulate( this.client.config.tileGrid );
		// Set level width & height
		this.anchor.resize( this.client.config.levelGrid, this.client.config.levelGrid );*/
		return true; // success
	}

	// --------------------------------
	// Tile Type Registry & Handling
	// --------------------------------
	// Build tileTypes: 2D array of Sets storing tile types per (x,y).
	// RETURNS: [Set] of types, or empty Set if none exist.
	// * tiles		- Ordered 2D [array] of tile tileset indices.
	buildTileTypes( tiles ) {
		// Gather variable(s)
		let tileset		= this.client.gameboard.getTileset( 'pics1' );
		const levelGrid	= this.client.config.levelGrid;
		// Initialize a 2D array of Sets
		const levelTileTypes	=
			Array.from(
				{ length: levelGrid },
				() => Array.from( { length: levelGrid }, () => new Set() )
				);
		// Populate tile definitions per tile position
		for ( let y=0; y<levelGrid; y++ ) {
			for ( let x=0; x<levelGrid; x++ ) {
				// Get tile @ coordinate (x,y).
				const tile		= tiles[y][x];
				if ( !tile ) continue; // skip transparent tile
				// Get tile code (b64 string).
				const tileCode	= tile.c ?? this.client.parsers.level.encodeTile( tile.tx, tile.ty );
				const tileTypes	= tileset.tiledefs.getTypesByCode( tileCode ); // Get types
				if ( tileTypes.size>0 )
					levelTileTypes[y][x] = tileTypes; // Store types
			}
		}
		// Return 2D-array of mapped tiles.
		this.tiledefs = levelTileTypes;
	}

	// Retrieve tile types at (x,y) coordinates in level.
	// RETURNS: [Set] of types, or empty Set if none exist.
	// * x, y	- [int] Tile coordinates in the tileset.
	getTileTypes( x, y ) {
		return this.tiledefs[y]?.[x] || new Set();
	}

	// --------------------------------
	// Level Rendering
	// --------------------------------
	// Clear the level board.
	// RETURNS: [boolean] success or fail.
	clear() {
		// Empty the level first.
		this.tilemap	= null;		// empty tilemap
		this.chunks		= null;		// empty chunks
		this.tiledefs	= null;		// empty tile definitions
		// Clear the canvas.
		if ( this.canvas?.el ) {
			const ctx	= this.canvas.el.getContext( '2d' );
			ctx.clearRect( 0, 0, this.canvas.el.width, this.canvas.el.height );
		}
		// Revert mode to empty.
		this.jot( 'status', 'empty' ); // set status
		return true;
	}

	// Build the object.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * tiles		- Ordered 2D [array] of tile tileset indices.
	render( tiles ) {
		// Generate list of tile
		//const tiles		= this.genLevel();
		//console.log( tiles );
		// Iterate tiles & map local tiledefs
		/*for ( let y=0; y<tiles.length; y++ ) {
			for ( let x=0; x<tiles[y].length; x++ ) {
				const tile	= tiles[y][x];
				if ( !tile ) continue;
				foreach
			}
		}*/
		// Gatekeep the method with mode-check.
		const status	= this.skim( 'status' );
		if ( status!=='empty' && status!=='rendered' ) return false;
		this.jot( 'status', 'rendering' ); // set status
		// Collect all known tile-types on board.
		this.tilemap	= tiles;		// store tiles 2D [array]
		this.buildTileTypes( tiles );	// store tile def types
		// Organize tile types into chunks for blitting.
		const chunks	= this.encodeRawLevelToChunks( tiles );
		this.chunks		= chunks; // save chunks
		//console.log( tilemap );
		// Get canvas contexts & clear it.
		if ( this.canvas?.el ) {
			const ctx	= this.canvas.el.getContext( '2d' );
			ctx.clearRect( 0, 0, this.canvas.el.width, this.canvas.el.height );
		}
		this.blit( chunks ); // render level bitmap
		this.jot( 'status', 'rendered' ); // set status
		//window.open(this.stamp.el.toDataURL());
	}

	//-------------------------
	// Canvas Methods
	//-------------------------
	// Resize the canvas element.
	// NOTE: This is a callback method.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	/*resize() {
		// Update canvas dimensions
		const levelSpan		= this.client.config.levelSpan;
		if ( this.canvas )
			this.canvas.resize( levelSpan, levelSpan );
		return true;	// success
	}*/

	//-------------------------
	// Level Handling
	//-------------------------
	// Encode a 2D array of tiles into a compact string format.
	// RETURNS: [string] Encoded tile string representation.
	// * grid		- [array] 2D array of tiles, where each tile has `ts`, `tx`, and `ty` properties.
	encodeMatrixID( grid ) {
		return grid.map(
			row => row.map(
				tile =>
					tile.ts.toString(16).padStart(2,'0') +
					tile.tx.toString(16).padStart(2,'0') +
					tile.ty.toString(16).padStart(2,'0')
				).join('')
			).join('_');
	}

	// Decode a string-encoded tile representation back into a 2D tile array.
	// RETURNS: [array] 2D array of tile objects `{ ts, tx, ty }`.
	// * encoded	- [string] Encoded tile string representation.
	decodeMatrixID( encoded ) {
		return encoded.split('_').map(
			row =>
				row.match(/.{6}/g).map(
					hex => ({
						ts: parseInt( hex.substring(0,2), 16 ),	// Tileset id
						tx: parseInt( hex.substring(2,4), 16 ),	// Sprite X coordinate on tileset
						ty: parseInt( hex.substring(4,6), 16 )	// Sprite Y coordinate on tileset
					}))
			);
	}

	// Encode an object `{ x, y }` into a 4-character hex string.
	// RETURNS: [string] Encoded hex position.
	// * pos		- [object] `{ x, y }` position object.
	encodePosition( pos ) {
		return pos.x.toString(16).padStart(2,'0') + pos.y.toString(16).padStart(2,'0');
	}

	// Decode an array of hex tile positions into `{ x, y }` objects.
	// RETURNS: [array] Array of `{ x, y }` positions.
	// * positions	- [array] Array of hex strings representing positions.
	decodeMatrixXY( positions ) {
		return positions.map( pos => this.decodePosition(pos) );
	}

	// Decode a 4-character hex position string into `{ x, y }`.
	// RETURNS: [object] `{ x, y }` position object.
	// * encoded	- [string] Encoded hex position (4 characters).
	decodePositionString( encoded ) {
		return encoded.match(/.{4}/g).map( pos => this.decodePosition(pos) );
	}

	// Decode a 4-character hex position string into `{ x, y }`.
	// RETURNS: [object] `{ x, y }` position object.
	// * encoded	- [string] Encoded hex position (4 characters).
	decodePosition( encoded ) {
		return {
			x: parseInt( encoded.substring(0,2), 16 ),
			y: parseInt( encoded.substring(2,4), 16 )
		};
	}

	// Generate a level of tiles.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	genLevel() {
		// Validate level width/height
		const tiles			= [];		// [array] of tiles
		const levelGrid		= this.client.config.levelGrid;
		for ( let y=0; y<levelGrid; y++ ) {
			const row		= [];
			for ( let x=0; x<levelGrid; x++ ) {
				// Create tile & add to row
				const tile	= { ts:0, tx:0, ty:0 };
				row.push( tile );
			}
			tiles.push( row );
		}
		// Return the generated tiles
		return tiles;
		/*// Encode the raw level into chunks.
		const chunks	= this.encodeRawLevelToChunks( tiles );
		// Set tiles
		this.chunks		= chunks;*/
	}

	// Encodes raw 2D [array] of tiles to level chunks [array]
	// RETURNS: [array] of chunks or `false` on fail.
	// * tiles		- 2D [array] of raw tiles comprising the level.
	encodeRawLevelToChunks( tiles ) {
		if ( !tiles || !tiles.length ) return false
		// Group positions by tileId
		const chunks		= {};
		const visited		= new Set();
		const levelGrid		= this.client.config.levelGrid;
		for ( let y=0; y<levelGrid; y++ ) {
			for ( let x=0; x<levelGrid; x++ ) {
				// Create a [string] keyname.
				let key			= `${x},${y}`;
				// Skip already processed tiles
				if ( visited.has(key) || !tiles[y][x] ) continue;
				// Treat each tile as a single 1x1 matrix
				let matrix		= [[ tiles[y][x] ]];
				// Encode the matrix
				const matrixID	= this.encodeMatrixID( matrix );
				// Find all matching tiles in the grid
				for ( let yy=0; yy<levelGrid; yy++ ) {
					for ( let xx=0; xx<levelGrid; xx++ ) {
						let matchKey		= `${xx},${yy}`;
						if ( !visited.has(matchKey) && this.sameTile(tiles[y][x],tiles[yy][xx]) ) {
							// Store position as a hex string
							const posHex	= this.encodePosition( { x: xx, y: yy } );
							if ( !chunks[matrixID] )
								chunks[matrixID] = "";
							chunks[matrixID]	+= posHex;
							visited.add( matchKey );
						}
					}
				}
			}
		}
		return chunks;
	}

	// Compare two tiles.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * tileA		- [object] first tile to compare.
	// * tileB		- [object] second tile to compare.
	sameTile( tileA, tileB ) {
		if ( !tileA || !tileB ) return false;
		return tileA.ts===tileB.ts && tileA.tx===tileB.tx && tileA.ty===tileB.ty;
	}

	//-------------------------
	// Level Rendering
	//-------------------------
	// Render tilemap chunks using pre-rendered tile matrices.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * chunks   - [object] Tilemap chunks dictionary `{ matrix: [positions] }`.
	blit( chunks ) {
		// Validate argument(s)
		if ( !chunks ) return false;
		// Select tileset (by index)
		let units		= this.client.config.tileGrid;
		let tileset		= this.client.gameboard.tilesets['pics1'];
		// Get the main level canvas to draw on
		const ctx		= this.canvas.el.getContext( '2d' );
		// Iterate the chunks & draw tile(s)
		Object.entries(chunks).forEach(
			( [ encodedMatrix, encodedPositions ] ) => {
				// Get matrix.
				const matrix		= this.decodeMatrixID( encodedMatrix );
				// Resize stamp to fit matrix.
				const width			= matrix[0].length * units;
				const height		= matrix.length * units;
				this.stamp.resize( width, height );		// resize stamp to match matrix dimensions
				// Deboss the matrix onto the stamp.
				tileset.deboss( this.stamp, matrix );	// imprint matrix into this.stamp
				let positions		= this.decodePositionString( encodedPositions );
				positions.forEach(
					( { x: levelX, y: levelY } ) => {
						let dxPos	= levelX * units;
						let dyPos	= levelY * units;
						ctx.drawImage( this.stamp.el, dxPos, dyPos );
					});
			});
		return true;
	}

	//-------------------------
	// Level Clipping
	//-------------------------
	// Return a shallow copy of the tile data at (x,y).
	// RETURNS: cloned [object], or [null] if out of bounds.
	// * x	– x coordinate of tile in the level grid.
	// * y	- y coordinate of tile in the level grid.
	cloneTile( x, y ) {
		// Try to get the tile.
		const tile = this.getTile( x, y );
		// Clone tile if need-be.
		return tile ? { ts: tile.ts, tx: tile.tx, ty: tile.ty } : null;
	}

	// Check whether a 1D interval [origin, origin+length) lies fully inside [0, max)
	// RETURNS: true if entirely in-bounds, false otherwise.
	// * origin		– starting coordinate (in tiles)
	// * length		– size of the interval (in tiles)
	// * max		– the maximum size (in tiles), e.g. level width or height
	inBounds1D( origin, length=0, max=null ) {
		// Default max to level grid if not set
		if ( max===null ) {
			//const units = this.client.config.tileGrid;
			max = this.client.config.levelGrid;
		}
		// Determine if coordinate is out of bounds
		return origin>=0 && (origin+length)<max;
	}

	// “Clip” a 1D region [origin, origin+length) to [0, max).
	// RETURNS: { origin: newOrigin, length: newLength } such that:
	//   • newOrigin ≥ 0
	//   • newOrigin+newLength ≤ max
	//   • If the original region was completely outside, newLength becomes 0.
	// * origin		– starting coordinate (in tiles)
	// * length		– size of the interval (in tiles)
	// * max		– the maximum size (in tiles), e.g. level width or height
	clip1D( origin, length, max ) {
		// clamp the start to at least 0
		const start	= Math.max( 0, origin );
		// clamp the end to at most max
		const end	= Math.min( origin+length, max );
		// if end≤start, region is out-of-bounds (or zero-width)
		const newLength = end>start ? end - start : 0;
		return { origin: start, length: newLength };
	}

	// Get a rectangle region at a location on the map with image bitmap.
	// RETURNS: [object] with matrix [array] & ElementCanvas.
	// Uses `deboss()` to stamp tiles into a temporary canvas.
	// * x		– left of region rectangle to crop in the level grid.
	// * y		- top of region rectangle to crop in the level grid.
	// * w, h	– width & height in tiles
	snapshotRegion( x, y, w, h ) {
		// Pull the tile sub-matrix
		const matrix	= this.cloneRegion( x, y, w, h );
		if ( !matrix.length ) return null;
		// Create a new temporary ElementCanvas for the region
		const tileset	= this.client.gameboard.tilesets['pics1'];
		const stamp		= tileset.createStamp( matrix );
		// Return copied data.
		return { matrix, stamp };
	}

	// Get a rectangle region matrix at a location on the map.
	// RETURNS: 2D [array] (h rows × w cols) of tile objects,
	// clipped from this.tilemap starting at (originX,originY).
	// * originX – left of region rectangle to crop in the level grid.
	// * originY - top of region rectangle to crop in the level grid.
	// * w, h    – width & height in tiles
	getRegionMatrix( originX, originY, w, h ) {
		// Ensure tilemap exists
		if ( !this.tilemap ) return []; // require tilemap to be set
		const matrix     = []; // begin region 2d-array
		// Iterate rows by height count.
		for ( let row=0; row<h; row++ ) {
			const y      = originY + row; // start at requested Y-origin
			const rowArr = [];
			// Iterate columns by width count.
			for ( let col=0; col<w; col++ ) {
				const x  = originX + col; // start at requested X-origin
				// If out of bounds, push a [null] placeholder.
				if ( y<0 || y>=this.tilemap.length || x<0 || x>=this.tilemap[0].length )
					rowArr.push( null );
				else rowArr.push( this.tilemap[y][x] ); // copy tile data
			}
			matrix.push( rowArr ); // collect row copy
		}
		return matrix; // region WxH 2D [array]
	}

	// -----------------------------
	// Get Composite Marquee Region
	// -----------------------------
	// Copy a composite masked region (not just rectangular).
	// RETURNS: [object|null] contents data, or null if invalid.]
	// * x, y  - [int] Values of mask top-left x,y coordinates on canvas.
	// * mask  - 2d [array<boolean>] of add/subtract regions to draw.
	cloneMaskRegion( x, y, mask ) {
		//--------------------------------
		// Copy Level Tiles-Matrix From Mask
		//--------------------------------
		// Build new matrix from mask.
		const matrix = [];
		// Get mask dimensions.
		const h = mask.length,
			  w = mask[0].length;
		// Iterate mask & render a matrix with tile data.
		for ( let my=0; my<h; my++ ) {
			const row = [];
			for ( let mx=0; mx<w; mx++ ) {
				if ( mask[my][mx] ) {
					// Calculate level coordinates to access tile on level.
					const lx = x + mx;
					const ly = y + my;
					row.push( this.cloneTile(lx,ly) ); // store x,y tile data
				}
				else row.push( null ); // preserve shape with blank
			}
			matrix.push( row ); // push row into matrix
		}
		//--------------------------------
		// Generate Stamp Using Matrix
		//--------------------------------
		// Get tileset to use.
		const tileset = this.client.gameboard.tilesets['pics1'];
		// Build stamp canvas.
		const stamp   = tileset.createStamp( matrix );
		//--------------------------------
		// Return Data
		//--------------------------------
		// Return contents data.
		return { matrix, stamp, x, y, w, h };
	}

	// Get the tile data [object] at (x,y).
	// RETURNS: [object] tile data, or [null] if out of bounds.
	// * x	– x coordinate of tile in the level grid.
	// * y	- y coordinate of tile in the level grid.
	getTile( x, y ) {
		if ( !this.tilemap ) return null;
		if ( y<0 || y>=this.tilemap.length )	return null;
		if ( x<0 || x>=this.tilemap[0].length )	return null;
		return this.tilemap[y][x]; // return tile [object]
	}

	// Given (x,y,w,h), use getRegionMatrix to grab the tile objects,
	// then return a brand-new 2D array of plain {ts,tx,ty} (or null) clones.
	cloneRegion( x, y, w, h ) {
		// Get the raw region (these are references into this.tilemap).
		const raw = this.getRegionMatrix( x, y, w, h );
		if ( !raw || !raw.length ) return [];
		// Build a cloned 2D [array].
		const copy =
			raw.map(
				row =>
					row.map(
						tile => {
							if ( !tile ) return null;
							// shallow‐copy the ts/tx/ty fields into a fresh object
							return { ts: tile.ts, tx: tile.tx, ty: tile.ty };
						})
					);
		return copy; // this 2D [array] is entirely separate from tilemap
	}

	// Paste a 2D tile‐matrix into tilemap at (originX, originY).
	// RETURNS: [bool] true on success, else false.
	// * originX, originY – top‐left tile coords to overwrite in tilemap.
	// * matrix          – 2D [array] (h rows × w cols) of tile objects.
	overwriteRegion( originX, originY, matrix ) {
		// Locked layers cannot be edited.
		if ( this.locked ) return false;
		// Require an existing tilemap and a non‐empty matrix
		if ( !this.tilemap || !matrix || !matrix.length ) return false;
		const h = matrix.length;
		const w = matrix[0] ? matrix[0].length : 0;
		// Iterate over each row/col of the input matrix
		for ( let row=0; row<h; row++ ) {
			const y = originY + row;
			// If out of bounds, skip
			if ( !this.inBounds1D(y) ) continue; // out of bounds
			for ( let col=0; col<w; col++ ) {
				const x = originX + col;
				// If out of bounds, skip
				if ( !this.inBounds1D(x) ) continue; // out of bounds
				// Get tile & skip if [null].
				const tile = matrix[row][col];
				if ( !tile ) continue; // empty tile data
				// Overwrite tilemap with cloned tile data at (x,y)
				this.tilemap[y][x] = { ...tile };
			}
		}
		return true; // success
	}

	// Fill a rectangular region (w×h) at (originX, originY) with a single tile.
	// * originX, originY – top-left tile coords of region to fill, in level grid.
	// * w, h		– width & height of region to fill (in tile units).
	// * tile		– object { ts, tx, ty } specifying the tile to fill with.
	fillRegion( originX, originY, w, h, tile ) {
		// Locked layers cannot be edited.
		if ( this.locked ) return false;
		// Require an existing tilemap, a level canvas, and a valid tile object.
		if ( !this.tilemap || !this.canvas || !tile ) return false;
		const maxRows = this.tilemap.length;
		const maxCols = this.tilemap[0]?.length || 0;
		const units   = this.client.config.tileGrid;
		const ctx     = this.canvas.el.getContext( '2d' );
		const tileset = this.client.gameboard.tilesets['pics1'];
		// Iterate each row & column then draw tile.
		for ( let row=0; row<h; row++ ) {
			const y   = originY + row;
			// Source & destination y regions.
			const sy  = tile.ty * units;
			const dy  = y * units;
			// Determine if tile is out of bounds.
			if ( !this.inBounds1D(y) ) continue; // out of bounds
			for ( let col=0; col<w; col++ ) {
				const x  = originX + col;
				// Source & destination x regions.
				const sx = tile.tx * units;
				const dx = x * units;
				// Determine if tile is out of bounds.
				if ( !this.inBounds1D(x) ) continue; // out of bounds
				// Overwrite tilemap at (x, y) with a shallow clone of `tile`.
				this.tilemap[y][x] = {
					ts:	tile.ts,
					tx:	tile.tx,
					ty:	tile.ty
					};
				//--------------------------------
				// Clear Previous Cell Before Drawing
				//--------------------------------
				// Transparent pixels in the replacement tile must not
				// preserve pixels from the previous image.
				ctx.clearRect( dx, dy, units, units );
				// Continue to draw tile on the map.
				ctx.drawImage(
					tileset.image.file.el,	// use tileset image for tile graphic
					sx, sy, units, units,   // source rectangle
					dx, dy, units, units    // destination rectangle
					);
			}
		}
		return true; // success
	}

	// Draw a 2D tile‐matrix onto the main level canvas at (originX, originY).
	// Does NOT modify tilemap—draws pixels only.
	// RETURNS: [bool] true on success, else false.
	// * originX, originY – top‐left tile coords on the level canvas.
	// * matrix          – 2D [array] of tile objects to stamp.
	stampRegionOnLevel( originX, originY, matrix ) {
		// Require the level canvas and a non‐empty matrix
		if ( !this.canvas || !matrix || !matrix.length ) return false;
		// Get units, destination canvas context & tileset
		const units   = this.client.config.tileGrid;
		const ctx     = this.canvas.el.getContext( '2d' );
		const tileset = this.client.gameboard.tilesets['pics1'];
		// Iterate matrix &
		for ( let row=0; row<matrix.length; row++ ) {
			for ( let col=0; col<matrix[row].length; col++ ) {
				const tile = matrix[row][col];
				if ( !tile ) continue; // skip empty slots
				// Source (sx, sy) in tileset
				const sx   = tile.tx * units;
				const sy   = tile.ty * units;
				// Destination (dx, dy) on level canvas in pixels
				const dx   = (originX + col) * units;
				const dy   = (originY + row) * units;
				// Draw image at area
				ctx.drawImage(
					tileset.image.file.el,
					sx, sy, units, units,	// source rect
					dx, dy, units, units	// dest rect
					);
			}
		}
		return true; // success
	}

	// High‐level: Update tilemap & immediately stamp onto the level canvas.
	// RETURNS: [bool] true if both overwriteRegion & drawImage succeed; else false.
	// * originX, originY	– top‐left tile coords on the map.
	// * matrix		– 2D [array] of tile objects.
	// * stamp		– [ElementCanvas] object to stamp @ loc; use [null] to autogenerate.
	dropRegion( originX, originY, matrix, stamp=null ) {
		// Locked layers cannot be edited.
		if ( this.locked ) return false;
		// First write new tiles into tilemap.originX, originY, matrix
		if ( !this.overwriteRegion(originX,originY,matrix) ) return false;
		// If a stamp is provided, simply stamp it.
		if ( stamp!==null ) {
			//console.log( 'stamping using stamp..' );
			// Get units, destination canvas context & tileset
			const units = this.client.config.tileGrid;
			const ctx   = this.canvas.el.getContext( '2d' );
			const x     = originX * units,
				  y     = originY * units,
				  w     = stamp.el.width,
				  h     = stamp.el.height;
			// Draw the stamp at the desired location.
			ctx.drawImage(
				stamp.el, 0, 0, w, h,	// source rect
				x, y, w, h				// dest rect
				);
		}
		else {
			//console.log( 'stamping using matrix..' );
			this.stampRegionOnLevel( originX, originY, matrix );
		} // autogenerate
		return true; // success
	}

	//--------------------------------
	// Apply Sparse Region
	//--------------------------------
	// Apply a collection of tile edits to the layer's tilemap
	// and its corresponding canvas.
	//
	// A tile with null/undefined tile coordinates represents
	// an empty cell. Empty cells must erase existing pixels
	// rather than drawing a background tile.
	//
	// This also supports older undo records that contain only
	// x/y coordinates when the previous tile was null.
	//
	// RETURNS: [boolean] true if the operation was processed.
	// * tiles - [array] tile records containing x, y, ts, tx, ty.
	applySparseRegion( tiles ) {
		//--------------------------------
		// Validate Layer and Tile Data
		//--------------------------------
		// Require a valid tilemap, drawing canvas and sparse array.
		if ( !this.tilemap || !this.canvas || !Array.isArray(tiles) )
			return false;

		// Access the tile grid, tileset and drawing context.
		const units		= this.client.config.tileGrid;
		const tileset	= this.client.gameboard.tilesets['pics1'];
		const ctx		= this.canvas.el.getContext('2d');

		//--------------------------------
		// Apply Individual Tile Changes
		//--------------------------------
		// Every cell is independently updated and redrawn.
		for ( const { x, y, ts, tx, ty } of tiles ) {
			// Ignore positions outside the layer.
			if ( !this.inBounds1D(x) || !this.inBounds1D(y) )
				continue; // skip

			// Calculate the destination pixel coordinates.
			const dx = x * units;
			const dy = y * units;

			//--------------------------------
			// Clear Previous Pixel Contents
			//--------------------------------
			// Always remove the old image before drawing a replacement.
			// This prevents transparent sprite pixels from leaving
			// remnants of whatever was drawn in the cell previously.
			ctx.clearRect( dx, dy, units, units );

			//--------------------------------
			// Handle Empty Tiles
			//--------------------------------
			// Null, undefined, or legacy x/y-only entries all
			// represent an empty tile in sparse history.
			if ( ts==null || tx==null || ty==null ) {
				this.tilemap[y][x] = null; // clear tile
				continue; // skip drawing
			}

			//--------------------------------
			// Store and Render Occupied Tile
			//--------------------------------
			// Preserve the tile's actual source coordinates.
			this.tilemap[y][x] = { ts, tx, ty };

			// Draw the replacement tile onto the cleared cell.
			ctx.drawImage(
				tileset.image.file.el,
				tx * units, ty * units, units, units,
				dx, dy, units, units
				);
		}

		return true; // success
	}

	// -------------------------
	// Tile‐Object Utilities
	// -------------------------
	// Build a “generic” tile data object.
	// RETURNS: { ts, tx, ty }
	// * tileset	– [string] key used in this.client.gameboard.tilesets (e.g. "pics1").
	// * tx, ty		– [ints] column & row (in tiles) within that tileset.
	getTileData( tileset, tx, ty ) {
		// Return a new object with keys matching { ts, tx, ty }
		return {
			ts: tileset,	// tileset identifier used in this.client.gameboard.tilesets
			tx: tx,			// column index of the tile within that tileset
			ty: ty			// row index of the tile within that tileset
			};
	}
}
