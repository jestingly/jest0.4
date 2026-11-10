//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/tileset/JestTileset.js loaded' );

//-------------------------
// JestTileset Class
//-------------------------
// Tileset class for attaching tileset image to its definitions
class JestTileset extends JestSavable {
	// Configuration properties
	default			= 'pics1';			// [string] Value of fallback default tileset filename.
	// Tileset propert(ies)
	image			= null;				// [object] ElementImage of loaded image
	tiledefs		= null;				// [object] JestTiledefs used to define tileset tile properties.

	// --------------------------------
	// Constructor
	// --------------------------------
	// Construct the [object].
	// * client		- [object] Application client that this piece belongs to.
	// * name		- [string] Value of overworld tileset (e.g. 'pics1').
	constructor( client, name ) {
		// Call the parent application constructor
		super( client, name );			// construct the parent
	}

	//-------------------------
	// Initialization Methods
	//-------------------------
	// Setup the [object].
	// RETURNS: [boolean] `true` on success else `false` on fail.
	async setup() {
		// --------------------------------
		// Build Level
		// --------------------------------
		this.build();					// build the object
		// --------------------------------
		// Load File(s) Data
		// --------------------------------
		await this.load();				// load the data
		return true; // success
	}

	// Build the object.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	build() {
		return true; // success
	}

	//-------------------------
	// Data Handling
	//-------------------------
	// Load the data [object].
	// RETURNS: [boolean] `true` on success else `false` on fail.
	async load() {
		super.load();		// call parent load start method
		// Try to load & set the image
		try { await this.setImage(this.name); }	// set tileset image
		catch( err ) { throw err; }
		// Try to load & set the tiledefs
		try { await this.setTiledefs(this.name); }	// set tiledefs
		catch( err ) { throw err; }
		this.complete();	// call complete method
		return true;		// success
	}

	// Complete data load.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	complete() {
		super.complete();	// call parent complete method
		//this.client.gameboard.tilesets[this.name] = this; // store reference in stack [object]
		return true;		// success
	}

	//-------------------------
	// Definition Methods
	//-------------------------
	// Load & set the image.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * stem	- [string] Value of URL filename stem to load, without filetype (e.g. 'pics1')
	async setImage( stem ) {
		// Validate argument(s)
		if ( !jsos.prove(stem,'string') ) {
			throw new Error( `Argument "stem" must be of type [string].` );
		}
		stem	= stem ?? this.default;		// store stem (NOTE: file load handled separately)
		// --------------------------------
		// Load Tileset Image Data
		// --------------------------------
		// Try loading tileset image into gallery
		await this.client.imager.loadFile( `tilesets/${stem}.png` )
			.then(
				() => {
					// Update this [object] name.
					this.setName( stem ); // store stem [string]
					// Attempt to get the asset
					const asset		= this.client.imager.getFile( `tilesets/${stem}.png` );
					if ( !asset ) { // tileset image not found
						console.warn( 'Could not locate tileset image data.' );
						return;
					}
					console.log( `Tileset '${stem}' image successfully loaded!` );
					// Set the asset as the current image
					this.image		= asset;
				})
			.catch( (err) => console.error(`Tileset "${stem}.png" image could not be loaded: ${err}`) );
		return true; // success
	}

	// Load & set the tileset definitions.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * stem	- [string] Value of URL filename stem to load, without filetype (e.g. 'pics1')
	async setTiledefs( stem ) {
		// --------------------------------
		// Validate Argument(s)
		// --------------------------------
		if ( !jsos.prove(stem,'string') )
			throw new Error( `Argument 'stem' must be of type [string].` );
		stem	= stem ?? this.default;		// store stem (NOTE: file load handled separately)
		const filename	= `${stem}.tdefs`;

		// --------------------------------
		// Load Tileset Tiledefs Data
		// --------------------------------
		// Load tile definitions *.tdefs file
		await this.client.secretary.loadFile( filename )
			.then(
				() => {
					// Grab tiledefs loaded data.
					const record	= this.client.secretary.getRecord(filename) ?? null;
					if ( !record ) { // record not found
						console.warn( 'Could not locate tileset definitions data.' );
						return;
					}
					console.log( `Tileset '${stem}' tiledefs successfully loaded!` );
					// Render a new tileset definitions [object] using data.
					const tiledefs	= new JestTiledefs();	// create new JestTiledefs [object]
					tiledefs.render( record.defs );			// load data into JestTiledefs [object]
					// Keep a quick-reference to the JestTiledefs [object].
					this.tiledefs	= tiledefs;				// cross-ref JestTiledefs [object]
				})
			.catch(
				( err ) =>
					console.error( `Not all tiledefs "${stem}" were loaded: ${err.message}` )
				);
		return true; // success
	}

	// -------------------------
	// Tile‐Object Utilities
	// -------------------------
	// Build a “generic” tile data object.
	// RETURNS: { ts, tx, ty }
	// * tileset	– [string] key used in this.client.gameboard.tilesets (e.g. "pics1").
	// * tx, ty		– [ints] column & row (in tiles) within that tileset.
	getTileData( tx, ty ) {
		// Return a new object with keys matching { ts, tx, ty }
		return {
			ts: 0,			// tileset identifier used in this.client.gameboard.tilesets
			tx: tx,			// column index of the tile within that tileset
			ty: ty			// row index of the tile within that tileset
			};
	}

	//-------------------------
	// Rendering Method(s)
	//-------------------------
	// Given an (x,y) coordinate, return a brand‐new [ElementCanvas] tile drawing.
	// RETURNS: [ElementCanvas] or [null] on failure.
	// * x		– [int] Value of tile column within the tileset.
	// * y		– [int] Value of tile row within the tileset.
	getTileStamp( x, y ) {
		// Determine if image is loaded.
		if ( !this.image?.file?.el ) return null;
		// Determine the size of one tile in pixels
		const units	= this.client.config.tileGrid;
		// Create a brand‐new ElementCanvas for this single tile
		const canvas = new ElementCanvas();
		canvas.resize( units, units ); // Canvas dims = units×units
		// Grab the 2D drawing context from the new canvas
		const ctx	= canvas.el.getContext( '2d' );
		// Compute source coordinates in the tileset image:
		//   sx = tile column × tile‐pixel‐size
		//   sy = tile row    × tile‐pixel‐size
		const sx	= x * units;
		const sy	= y * units;
		// Draw requested tile from tileset.image at (0,0) of canvas.
		ctx.drawImage(
			this.image.file.el,		// source image element
			sx,  sy,  units, units,	// source rectangle (x,y,width,height)
			0,   0,   units, units 	// destination rectangle on new canvas
			);
		// Return [ElementCanvas] tile image.
		return canvas;
	}

	//--------------------------------
	// Clone an arbitrary 2D tile matrix
	//--------------------------------
	// RETURNS: a deep-cloned copy of `matrix`
	// * matrix – 2D [array] of tile objects {ts,tx,ty} or null
	cloneMatrix( matrix ) {
		// If matrix is empty, return.
		if ( !Array.isArray(matrix) ) return [];
		// Iterate matrix & clone each tile.
		return matrix.map(
			row => Array.isArray(row)
				? row.map(
					tile => tile
						? { ts: tile.ts, tx: tile.tx, ty: tile.ty }  // shallow-copy each tile
						: null
					)
				: []
			);
	}

	//--------------------------------
	// Clone a Tile [object]
	//--------------------------------
	// Return a shallow copy of the tile data at (x,y).
	// RETURNS: cloned [object], or [null] if out of bounds.
	// * x	– x coordinate of tile in the level grid.
	// * y	- y coordinate of tile in the level grid.
	cloneTile( x, y ) {
		// Clone tile if need-be.
		return { ts: 0, tx: x, ty: y };
	}

	//--------------------------------
	// Image Rendering Method(s)
	//--------------------------------
	// Render a temp tile matrix to stamp onto a canvas.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * canvas		- [object] ElementCanvas to stamp tiles onto.
	// * matrix		- [array] 2D tile array `{ ts, tx, ty }`.
	deboss( canvas, matrix ) {
		// Determine if image is loaded.
		if ( !this.image?.file?.el ) return null;
		// Get tile units.
		let units	= this.client.config.tileGrid;
		// Determine width & height of the matrix
		let width	= matrix[0].length * units;
		let height	= matrix.length * units;
		const ctx	= canvas.el.getContext('2d');
		// Iterate tile(s) in matrix & generate stamp
		matrix.forEach(
			( row, ly ) => {
				row.forEach(
					( tile, lx ) => {
						// Define sprite x,y of tile & destination + width/hegith
						let sx	= tile.tx * units;		// Source X in tileset
						let sy	= tile.ty * units;		// Source Y in tileset
						let dx	= lx * units;			// Destination X in pixels
						let dy	= ly * units;			// Destination Y in pixels
						// Draw the tile on the map
						ctx.drawImage( this.image.file.el, sx, sy, units, units, dx, dy, units, units );
					});
			});
		return true; // success
	}

	// Convert a matrix to a new stamp.
	// RETURNS: [object] with matrix [array] & ElementCanvas.
	// * matrix		- 2d [array] matrix to convert into a stamp.
	createStamp( matrix ) {
		// Create a new temporary ElementCanvas for the region
		const stamp = new ElementCanvas();
		const units = this.client.config.tileGrid;
		const w     = matrix[0].length,   // width
			  h     = matrix.length;      // height
		stamp.resize( w*units, h*units ); // resize canvas to matrix dimensions
		// Draw the matrix bitmap on the stamp.
		this.deboss( stamp, matrix );
		return stamp;
	}

	//--------------------------------
	// Image Rendering Method(s)
	//--------------------------------
	// Render a temp tile matrix to stamp onto a canvas.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * canvas		- [object] ElementCanvas to stamp tiles onto.
	// * matrix		- [array] 2D tile array `{ ts, tx, ty }`.
	deboss( canvas, matrix ) {
		// Determine if image is loaded.
		if ( !this.image?.file?.el ) return null;
		// Get tile units.
		let units   = this.client.config.tileGrid;
		// Determine width & height of the matrix
		let width   = matrix[0].length * units;
		let height  = matrix.length * units;
		const ctx   = canvas.el.getContext('2d');
		// Iterate tile(s) in matrix & generate stamp
		matrix.forEach(
			( row, ly ) => {
				row.forEach(
					( tile, lx ) => {
						// Skip empty tile(s).
						if ( tile===null ) return;
						// Define sprite x,y of tile & destination + width/hegith
						let sx = tile.tx * units;   // Source X in tileset
						let sy = tile.ty * units;   // Source Y in tileset
						let dx = lx * units;        // Destination X in pixels
						let dy = ly * units;        // Destination Y in pixels
						// Draw the tile on the map
						ctx.drawImage(
							this.image.file.el,
							sx, sy,
							units, units,
							dx, dy,
							units, units
							);
					});
			});
		return true; // success
	}

	//--------------------------------
	// Get Tile Matrix with Stamp
	//--------------------------------
	// Grab a matrix of tiles from tileset image and return matrix + rendered stamp.
	// RETURNS: [object] { matrix, stamp }
	// * tx			– [int] starting tile column (x) in tileset.
	// * ty			– [int] starting tile row (y) in tileset.
	// * width		– [int] width (in tiles) of matrix.
	// * height		– [int] height (in tiles) of matrix.
	snapshotRegion( tx, ty, width, height ) {
		// Validate image is loaded
		if ( !this.image?.file?.el )
			return { matrix: [], stamp: null };

		// Validate numeric input
		if ( !Number.isInteger(tx) || !Number.isInteger(ty) ||
			 !Number.isInteger(width) || !Number.isInteger(height) )
			return { matrix: [], stamp: null };

		// Get tile size in pixels
		const units		= this.client.config.tileGrid;

		//-------------------------
		// Generate 2D Tile Matrix
		//-------------------------
		const matrix	= [];
		for ( let y=0; y<height; y++ ) {
			const row	= [];
			for ( let x=0; x<width; x++ ) {
				const tile = this.cloneTile( tx+x, ty+y );
				row.push( tile );
			}
			matrix.push( row );
		}

		//-------------------------
		// Render Stamp Canvas
		//-------------------------
		const stamp		= new ElementCanvas();
		stamp.resize( width*units, height*units );
		this.deboss( stamp, matrix );

		//-------------------------
		// Return Result
		//-------------------------
		return {
			matrix : matrix,
			stamp  : stamp
			};
	}
}
