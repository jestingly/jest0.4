//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/jest/parsers/level/link.plugin.js loaded' );

//-----------------------------
// LINK Block Plugin
//-----------------------------
// JSON parser plugin.
(function( window ) {
	// Define the plugin [object]
	var type	= 'keyword';
	var subtype	= 'LINK';

	// Plugin definition
	var plugin	= {
		// Initialize the plugin.
		init: function( parser ) {
			// Get the client from parser.
			const client	= parser.client;
			if ( !client.is('tiler') ) return; // for tiler app
			// Register a pre-save event (level "save" file event) for preloading save data.
			client.cabinet.register(
				'presave', 'levelMarqueeCuratorLinkItems',
				( file ) => {
					// Get the level marquee's curator.
					const curator	= client.toolbox.tools.levelMarquee.curators.primary;
					// Queue warp zone regions (to save to file).
					const warpObjs	= curator.getVisibleObjects( 'warp' );
					file.enqueue( 'link', warpObjs );
				});
		},

		// Extend the client class.
		extend: function( Klass, proto ) {
			//--------------------------------
			// Decoder: Parse LINK block
			//--------------------------------
			Klass.registerKeywordParser(
				subtype,
				function( ctx, lines, i, result ) {
					const tokens = lines[i].trim().split( /\s+/ );
					if ( tokens.length<8 ) {
						console.warn( `${subtype} parse error: Invalid LINK line: ${lines[i]}` );
						return i + 1;
					}

					//--------------------------------
					// Decode LINK Properties
					//--------------------------------
					// Decode the destination level name.
					// Convert coordinates and dimensions into numeric values.
					// Preserve special player-position keywords.
					const link =
						{
						level : ctx.client.decodeWhitespace( tokens[1] ),
						x     : Number( tokens[2] ),
						y     : Number( tokens[3] ),
						w     : Number( tokens[4] ),
						h     : Number( tokens[5] ),
						dx    : tokens[6]==='playerx' ? 'playerx' : Number(tokens[6]),
						dy    : tokens[7]==='playery' ? 'playery' : Number(tokens[7])
						};

					// Decode whitespace (for file parsing integrity)
					const keys = [ 'level', 'x', 'y', 'w', 'h', 'dx', 'dy' ];
					for ( const key of keys )
						link[key] = ctx.client.decodeWhitespace( link[key] );

					const key = subtype.toLowerCase(); // "link"
					if ( !result[key] ) result[key] = [];
					result[key].push( link );

					return i + 1;
				});

			//--------------------------------
			// Encoder: Write LINK block
			//--------------------------------
			Klass.registerKeywordEncoder(
				subtype,
				function( ctx, links=[] ) {
					const lines = [];
					//--------------------------------
					// Encode LINK Properties
					//--------------------------------
					// Encode only the destination level name.
					// Normalize coordinates and dimensions as numbers.
					for ( const item of links ) {
						// Retrieve the link data.
						const link  = item.data ?? item;

						// Encode text and normalize numeric properties.
						const level = ctx.client.encodeWhitespace( link.level );
						const x     = Number( link.x );
						const y     = Number( link.y );
						const w     = Number( link.w );
						const h     = Number( link.h );

						// Preserve special player-position keywords.
						const dx    = link.dx==='playerx' ? 'playerx' : Number( link.dx );
						const dy    = link.dy==='playery' ? 'playery' : Number( link.dy );

						// Append the LINK record.
						lines.push( `LINK ${level} ${x} ${y} ${w} ${h} ${dx} ${dy}` );
					}
					// Add LINK line.
					return lines;
				});
		}
	};

	// Register plugin with JestParserLevel
	if ( typeof window.JestParserLevel?.use==='function' )
		window.JestParserLevel.use( type, plugin );
	else console.error( 'link.plugin.js load error: JestParserLevel.use() not found' );
})( window );
