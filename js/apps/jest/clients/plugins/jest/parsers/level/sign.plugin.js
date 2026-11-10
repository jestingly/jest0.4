//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/jest/parsers/level/sign.plugin.js loaded' );

//-----------------------------
// SIGN Block Plugin
//-----------------------------
// JSON parser plugin.
(function( window ) {
	// Define the plugin [object]
	var type	= 'keyword';
	var subtype	= 'SIGN';

	// Plugin definition
	var plugin	= {
		// Initialize the plugin.
		init: function( parser ) {
			// Get the client from parser.
			const client	= parser.client;
			if ( !client.is('tiler') ) return; // for tiler app
			// Register a pre-save event (level "save" file event) for preloading save data.
			client.cabinet.register(
				'presave', 'levelMarqueeCuratorSignItems',
				( file ) => {
					// Get the level marquee's curator.
					const curator	= client.toolbox.tools.levelMarquee.curators.primary;
					// Queue readable sign regions (to save to file).
					const signObjs	= curator.getVisibleObjects( 'sign' );
					file.enqueue( 'sign', signObjs );
				});
		},

		// Extend the client class.
		extend: function( Klass, proto ) {
			//-------------------------
			// Decode NPC Block
			//-------------------------
			// Method to decode CLOUD block data regions from a level file.
			Klass.registerKeywordParser(
				subtype,
				function( ctx, lines, i, result ) {
					const header	= lines[i].trim();
					const tokens	= header.split(/\s+/);
					if ( tokens.length<3 ) {
						console.warn( `${subtype} parse error: Invalid ${subtype} header: ${header}` );
						return i+1;
					}

					//--------------------------------
					// Decode SIGN Properties
					//--------------------------------
					// Parse numeric properties explicitly.
					// Decode the name as a single whitespace-safe token.
					const x    = Number( tokens[1] );
					const y    = Number( tokens[2] );
					const w    = tokens.length>3 ? Number(tokens[3]) : 2;
					const h    = tokens.length>4 ? Number(tokens[4]) : 1;
					const name = tokens.length>5 ? ctx.client.decodeWhitespace(tokens[5]) : 'sign';

					// Read multiline dialog until SIGNEND
					let dialogLines = [];
					i++;
					while ( i<lines.length && lines[i].trim()!==`${subtype}END` ) {
						dialogLines.push( lines[i] );
						i++;
					}
					if ( i<lines.length && lines[i].trim()===`${subtype}END` ) i++; // skip SIGNEND

					// Generate sign data & push into "signs" stack.
					const sign	=
						{
						x, y, w, h, name,
						dialog: dialogLines.join('\n')
						};

					// Push into result
					const key = subtype.toLowerCase(); // "sign"
					if ( !result[key] ) result[key] = [];
					result[key].push( sign );
					return i;
				});

			//-------------------------
			// Encode NPC Block
			//-------------------------
			// Register SIGN encoder
			Klass.registerKeywordEncoder(
				subtype,
				function( ctx, signs=[] ) {
					const lines = [];
					//--------------------------------
					// Encode SIGN Properties
					//--------------------------------
					// Normalize numeric fields and encode the name.
					for ( const item of signs ) {
						// Retrieve the sign data.
						const sign = item.data ?? item;

						// Normalize coordinate and dimension values.
						const x    = Number( sign.x );
						const y    = Number( sign.y );
						const w    = Number( sign.w );
						const h    = Number( sign.h );

						// Encode the name as one whitespace-safe token.
						const name = ctx.client.encodeWhitespace( sign.name ?? 'sign' );

						// Append the SIGN header.
						lines.push( `${subtype} ${x} ${y} ${w} ${h} ${name}` );

						// Preserve multiline dialog text.
						if ( sign.dialog ) {
							const dialogLines = sign.dialog.split( /\r?\n/ );
							lines.push( ...dialogLines );
						}

						// Close the SIGN block.
						lines.push( `${subtype}END` );
					}
					// Return encoded line(s).
					return lines;
				});
		}
	};

	// Register plugin with JestParserLevel
	if ( typeof window.JestParserLevel?.use==='function' )
		window.JestParserLevel.use( type, plugin );
	else console.error( 'sign.plugin.js load error: JestParserLevel.use() not found' );
})( window );
