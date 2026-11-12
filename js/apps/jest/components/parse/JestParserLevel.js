//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/parse/JestParserLevel.js loaded' );

//-------------------------
// NWFileParser Class
//-------------------------
// Parses Graal game `.nw` map files.
class JestParserLevel extends JestGamepiece {
	// Static class properties
	// Keywords: [object] Set array of acceptable keyword(s).
	static keywords        = new Set();
	static keywordParsers  = {};   // { keywordName : (ctx, lineArray, indexRef, resultObj) => newIndex }
	static keywordEncoders = {};   // { keywordName : (ctx, dataObjArray) => stringLines[] }
	// Explicit filetype & versioning properties
	version          = 'JESTNW02'; // Level file version
	// Tileset scanline reading / handling definition(s)
	charset          = null;       // [string] Default tile decoding order.
	tileWrap         = 16;         // after 16 tiles, the indices wrap
	tileBlock        = null;       // how many tiles in the wrapping block
	tilesetWidth     = 2048;       // width of tileset in pixels
	tilesetHeight    = 512;        // height of tileset in pixels
	tilesetRows      = null;       // 128 tiles per row
	tilesetColumns   = null;       // 32 tiles per column
	totalTiles       = null;       // 4096 total tiles

	//-------------------------
	// Constructor
	//-------------------------
	// Initializes the parser.
	// RETURNS: [void] Nothing.
	// * client    - client [object] that this piece belongs to.
	// * options   - [object] Optional configuration parameters.
	//   tileOrder - [string] Custom tile decoding order.
	constructor( client, options={} ) {
		super( client ); // call parent constructor
		// Accept custom tileOrder parse algorithm
		if ( options.tileOrder )
			this.charset	 = options.tileOrder;
		else {
			// Determine parse order
			this.charset	 = '';
			this.charset	+= 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
			this.charset	+= 'abcdefghijklmnopqrstuvwxyz';
			this.charset	+= '0123456789';
			this.charset	+= '+';
			this.charset	+= '/';
		}
		// Instantiate calculations
		const units = this.client.config.tileGrid; // get tile WxH
		this.tilesetColumns	= this.tilesetWidth / units;				// 128 tile columns
		this.tilesetRows	= this.tilesetHeight / units;				// 32 tile rows
		this.totalTiles		= this.tilesetRows * this.tilesetColumns;	// 4096 total tiles
		this.tileBlock		= this.tilesetRows * this.tileWrap;			// 512 tiles per block
	}

	// Setup the parser (use async).
	async setup() {
		// Initialize method plugin(s).
		await JestParserLevel.initPlugins( 'keyword', this );
	}

	//-------------------------
	// Static Plugin Method(s)
	//-------------------------
	// Register the level block keyword for decoding level blocks.
	static registerKeywordParser( keyword, parserFn ) {
		this.keywords.add( keyword );
		this.keywordParsers[keyword] = parserFn;
	}

	// Register the level block keyword for encoding level blocks.
	static registerKeywordEncoder( keyword, encoderFn ) {
		this.keywordEncoders[keyword] = encoderFn;
	}

	//-------------------------
	// NW File Parsing
	//-------------------------
	// Parses the provided `.nw` file content.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * fileContent	- [string] The raw text content of the `.nw` file.
	parse( { data: fileContent } ) {
		//-------------------------
		// Begin Line Split + Return Result
		//-------------------------
		// Begin declarations
		const lines		= fileContent.split( /\r?\n/ ); // Normalize line breaks.
		const result	= {
			version:	null,	// game version identifier
			};
		// Declare reusable counter variable
		let i = 0;

		//-------------------------
		// Validate File Signature
		//-------------------------
		while ( i<lines.length && lines[i].trim()==='' ) i++; // Skip blank lines
		if ( i>=lines.length || !['GLEVNW01','JESTNW02'].includes(lines[i].trim()) ) {
			console.warn( 'Invalid or unsupported level file signature.' );
			return false; // Reject file immediately
		}
		result.version	= lines[i].trim();
		i++;

		//-------------------------
		// Parse Map Contents
		//-------------------------
		while ( i<lines.length ) {
			let line	= lines[i].trim();
			let decode; // declare temp vars
			if ( line==='' ) {
				i++;
				continue;
			}

			//-------------------------
			// PLUGIN Block Parsing
			//-------------------------
			const keyword = line.split(/\s+/)[0];
			if ( this.constructor.keywords.has(keyword) ) {
				const fn = this.constructor.keywordParsers[keyword];
				if ( typeof fn==='function' ) {
					i = fn( this, lines, i, result ) ?? (i+1);
					continue;
				}
			}

			// Unrecognized lines are skipped.
			i++;
		} // end while loop

		//--------------------------------
		// Validate Legacy Board
		//--------------------------------
		// Check for legacy file version.
		if ( result.version==='GLEVNW01' ) {
			// Access level square dimensions (in tiles, e.g. 64s).
    		const grid = this.client.config.levelGrid;
			// Validate legacy BOARD completeness
		    if ( !Array.isArray(result.board) ||
		         result.board.length!==grid ||
		         Array.from({length:grid},(_,i)=>result.board[i])
		             .some(row=>!Array.isArray(row) || row.length!==grid) ) {
				// File data failed parse-check.
		        console.warn( 'Invalid legacy BOARD: incomplete tile data.' );
				return false; // fail
		    }
		}

		//--------------------------------
		// Finish & Return
		//--------------------------------
		// Validate layer count.
		if ( result.version==='JESTNW02' &&
		     (!Array.isArray(result.layers) || result.layers.length===0) ) {
		    console.warn( 'JESTNW02 requires at least one LAYER.' );
			return false; // fail
		}
		// Return result.
		return result; // successfully parsed
	}

	//-------------------------
	// NW File Encoding
	//-------------------------
	// Encodes the provided board + metadata to `.nw` file format.
	// RETURNS: [string] Fully formatted `.nw` file content.
	// * data	- [object] { board, links, signs, npcs, ...pluginData }
	encode( { version, ...data } ) {
		//--------------------------------
		// Validate Version
		//--------------------------------
		// Add initial file version to output.
		version	??= data.layers ? 'JESTNW02' : 'GLEVNW01';
		// Check if level file version is valid.
		if ( !['GLEVNW01','JESTNW02'].includes(version) )
			throw new Error( `Unsupported level version: ${version}` );

		// -------------------------
		// Encode Plugin Keyword Blocks
		// -------------------------
		// Begin return output with level file version.
		let out	  = `${version}\n`;
		// Iterate each registered keyword & compile applicable code.
		for ( const keyword of this.constructor.keywords ) {
			// Grab encoder function, keyword, & value.
			const encoderFn	= this.constructor.keywordEncoders[keyword];
			const key		= keyword==='LAYER' ? 'layers' : keyword.toLowerCase();;
			const value		= data[key];
			// Require encoder function to be a function.
			if ( typeof encoderFn!=='function' || value==null ) continue;
			// Pass lines through encode function.
			const lines		= encoderFn( this, value, version );
			// Iterate each line and compile the output.
			for ( const line of lines ) out += line + '\n';
		}

		//--------------------------------
		// Finish & Return
		//--------------------------------
		// Return encoded data.
		return out; // output
	}
}

// Make JestParserLevel globally accessible for plugins
window.JestParserLevel = JestParserLevel;
