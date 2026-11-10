//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/jest/parsers/level/board.plugin.js loaded' );

//-----------------------------
// BOARD Block Plugin
//-----------------------------
(function( window ) {
	// Define the plugin [object]
	var type	= 'keyword';
	var subtype	= 'BOARD';

	// Plugin definition
	var plugin	= {
		// Initialize the plugin.
		init: function( parser ) {
			/*// Get the client from parser.
			const client	= parser.client;
			if ( !client.is('tiler') ) return; // for tiler app
			// Register a pre-save event (level "save" file event) for preloading save data.
			client.cabinet.register(
				'presave', 'levelCloudMetaData',
				( file ) => {
					// Queue the file's level's meta cloud data to save.
					const meta	=  file.context?.meta || {};
					file.enqueue( 'cloud', meta );
				});*/
		},

		// Extend the client class.
		extend: function( Klass, proto ) {
			//--------------------------------
            // Decode one BOARD record.
			//--------------------------------
            proto.decodeBoard = function( line ) {
				//--------------------------------
				// Access & Validate Token Count
				//--------------------------------
				// Split each token by a space character.
                const tokens	= line.trim().split(/\s+/);

				// Validate first token.
				if ( tokens[0]!=='BOARD' )
				    throw new Error( `Expected BOARD record: ${line}` );

				// Require at least 6 tokens.
                if ( tokens.length<6 )
                    throw new Error( `Invalid BOARD line: ${line}` );

				// Denote each token as a parsed variable.
                const rowIndex	= Number( tokens[2] );
                const width		= Number( tokens[3] );
                const tileData	= tokens.slice(5).join('');

				//--------------------------------
				// Validate Board Dimensions
				//--------------------------------
				// Access square level tile dimensions [int] value (e.g. 64 -> 64x64 tiles).
                const grid		= this.client.config.levelGrid;
				// Validate board dimensions.
                if ( !Number.isInteger(rowIndex) ||
                     rowIndex<0 || rowIndex>=grid ||
                     width!==grid ||
                     tileData.length!==width*2 )
                    throw new Error( `Invalid BOARD dimensions: ${line}` );

				//--------------------------------
				// Iterate & Tile & Validate Encoding
				//--------------------------------
                // Validate two-character codes.
                for ( let j=0; j<tileData.length; j+=2 ) {
                    const code = tileData.slice(j,j+2);
                    if ( code==='..' ) continue;
                    if ( code.length!==2 ||
                         !this.charset.includes(code[0]) ||
                         !this.charset.includes(code[1]) )
                        throw new Error( `Invalid tile code: ${code}` );
                }

				// Return the row index + parsed tiles.
                return { rowIndex, tiles: this.parseBoardRow(tileData,width) };
            };

			//--------------------------------
            // Encode BOARD rows.
			//--------------------------------
            proto.encodeBoard = function( board ) {
				//--------------------------------
				// Begin Lines Return [Array]
				//--------------------------------
				// Begin [array] of lines.
                const lines	= [];

				//--------------------------------
				// Validate Board & Dimensions
				//--------------------------------
				// Get square level grid dimensions [int] e.g. WxH in tiles.
				const grid	= this.client.config.levelGrid; // level dimensions
				// Validate data.
                if ( !Array.isArray(board) || board.length!==grid )
                    throw new Error( 'Invalid BOARD height.' );

				//--------------------------------
				// Validate Board Dimensions
				//--------------------------------
				// Iterate each row & encode its line of tiles.
                for ( let y=0; y<grid; y++ ) {
					// Get board row.
                    const row		= board[y];
					const tileData	= this.encodeBoardRow( row ); // encode
					// Push encoded line into the return output.
                    lines.push( `BOARD 0 ${y} ${grid} 0 ${tileData}` );
                }

				// Return modified lines of output.
				return lines; // [array] of parsed lines
            };

			//-------------------------
			// Tile Encoding/Decoding
			//-------------------------
			// Encodes a tile (x, y) into a 2-character base-64 tile code.
			// RETURNS: [str] Encoded 2-character tile code.
			// * xTile	- [int] Value of tile x on tileset.
			// * yTile	- [int] Value of tile y on tileset.
			proto.encodeTile = function( xTile, yTile ) {
				// Determine which block this tile belongs to
				const block		= Math.floor( xTile/this.tileWrap );	// 16-column block
				const localX	= xTile % this.tileWrap;				// X coordinate within the block
				// Compute the scan-line index within the block (row-major order)
				const offset	= (yTile*this.tileWrap) + localX;		// Tile's position in the block
				// Compute the final global index in scan-line format
				const index		= (block*this.tileBlock) + offset;		// Global tile index
				// Convert to base-64 encoding
				const char1		= this.charset[ Math.floor(index/64) ];
				const char2		= this.charset[ index%64 ];
				// Return the encoded 2-character tile code
				return char1 + char2;
			}

			// Decodes a 2-character tile code into a tile index.
			// RETURNS: [int] The decoded tile index.
			// * tileCode	- [string] 2-character tile code.
			proto.decodeTile = function( code ) {
				// Decode the 12-bit number (0-4095)
				const index		= this.charset.indexOf(code[0]) * 64 + this.charset.indexOf(code[1]);
				// There are 512 tiles per block (16 columns x 32 rows)
				const block		= Math.floor( index/this.tileBlock );	// determine which block chunk the tile is in
				const offset	= index % this.tileBlock;				// remainder of blockwrap = index in new block
				// Within a block, tiles are laid out row-major (left-to-right, then next row)
				const xTile		= (offset%this.tileWrap) + (block*this.tileWrap); // x increases across blocks
				const yTile		= Math.floor( offset/this.tileWrap );
				// Return tile data
				return { ts:0, tx: xTile, ty: yTile, c: code };
			}

			//-------------------------
			// Board Row Encoding/Decoding
			//-------------------------
			// Parses a single board row's tile data.
			// RETURNS: [array<int>] Array of tile indices.
			// * dataString	- [string] Concatenated tile codes.
			// * width		- [int] Expected number of tiles in the row.
			proto.parseBoardRow = function( dataString, width ) {
				//--------------------------------
				// Validate Board Dimensions
				//--------------------------------
				// Ensure tile data is complete.
				const expectedLength = width * 2;
				if ( dataString.length<expectedLength )
					throw new Error( `Board row tile data too short. Expected ${expectedLength}, got ${dataString.length}` );

				//--------------------------------
				// Decode Tiles
				//--------------------------------
				// Decode tile codes.
				const rowTiles = [];
				for ( let i=0; i<expectedLength; i+=2 ) {
					// Access tile code from the file.
					const tileCode = dataString.substr( i, 2 );
					// Transparent tile.
					if ( tileCode==='..' ) {
						rowTiles.push( null );
						continue;
					}
					// Try to decode the tile.
					try {
						const index	= this.decodeTile( tileCode );
						rowTiles.push( index );
						//rowTiles.push( this.tileIndexToXY(index) );
					}
					catch ( e ) {
						throw new Error( `Error decoding tile at index ${i/2}: ${e.message}` );
					}
				}

				//--------------------------------
				// Finish & Return
				//--------------------------------
				// Return all tiles in row.
				return rowTiles;
			}

			// Encodes a single row of tile objects into `.nw` tile data.
			// RETURNS: [string] Concatenated 2-character tile codes.
			// * rowTiles	- [array<object>] Array of tile objects { ts, tx, ty }.
			proto.encodeBoardRow = function( rowTiles ) {
				//--------------------------------
				// Validate Board Dimensions
				//--------------------------------
				// Validate input row length.
				const grid = this.client.config.levelGrid;
				if ( rowTiles.length!==grid )
					throw new Error( `encodeBoardRow: Invalid row length. Expected ${grid}, got ${rowTiles.length}` );

				//--------------------------------
				// Encode Tiles
				//--------------------------------
				// Begin tile encoding.
				let tileData = '';
				for ( let tile of rowTiles ) {
					// Transparent tile.
					if ( tile===null ) {
						tileData += '..';
						continue;
					}
					// Validate tile object.
					if ( tile.ts!==0 ) {
						console.warn( `encodeBoardRow: Tile with ts=${tile.ts} detected, .nw format does not store tileset index.` );
						// You may choose to throw an error instead:
						// throw new Error( `encodeBoardRow: ts=${tile.ts} not supported.` );
					}
					// Encode tile coordinates.
					tileData += this.encodeTile( tile.tx, tile.ty );
				}

				//--------------------------------
				// Finish & Return
				//--------------------------------
				// Return the row string.
				return tileData;
			}

			//--------------------------------
			// Decoder: Parse legacy standalone BOARD rows.
			//--------------------------------
            Klass.registerKeywordParser(
                subtype,
                function( ctx, lines, i, result ) {
					//--------------------------------
					// Validate Version
					//--------------------------------
					// Must be a GLEVNW01 *.NW level file.
                    if ( result.version!=='GLEVNW01' )
                        throw new Error( 'BOARD outside LAYER in JESTNW02.' );

					//--------------------------------
					// Decode Line As Board
					//--------------------------------
					// Decode the [array] of lines into a level board.
                    const { rowIndex, tiles } = ctx.decodeBoard( lines[i] );
					// If output hasn't created board row [array], create it.
                    if ( !result.board ) result.board = [];
					// Prevent duplicate row indices.
                    if ( result.board[rowIndex] )
                        throw new Error( `Duplicate BOARD row ${rowIndex}` );

					//--------------------------------
					// Push Into Output & Return
					//--------------------------------
					// Add row of decoded tiles @ index to board rows.
                    result.board[rowIndex] = tiles;
					return i+1; // increment & return
                });

			//--------------------------------
			// Encoder: Write legacy BOARD rows.
			//--------------------------------
            Klass.registerKeywordEncoder(
                subtype,
                function( ctx, board, version ) {
					//--------------------------------
					// Validate Version
					//--------------------------------
					// Must be a GLEVNW01 *.NW level file.
                    if ( version!=='GLEVNW01' ) return [];
					// Return encoded board.
                    return ctx.encodeBoard( board );
                });
		}
	};

	// register with JestParserLevel class
	if ( typeof window.JestParserLevel?.use==='function' )
		window.JestParserLevel.use( type, plugin );
	else console.error( 'board.plugin.js load error: JestParserLevel.use() not found' );
})( window );
