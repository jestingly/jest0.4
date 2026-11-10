//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/jest/parsers/level/npc.plugin.js loaded' );

//-----------------------------
// NPC Block Plugin
//-----------------------------
// JSON parser plugin.
(function( window ) {
	// Define the plugin [object]
	var type	= 'keyword';
	var subtype	= 'NPC';

	// Plugin definition
	var plugin	= {
		// Initialize the plugin.
		init: function( parser ) {
			// Get the client from parser.
			const client	= parser.client;
			if ( !client.is('tiler') ) return; // for tiler app

			//--------------------------------
			// Register NPC Save Event
			//--------------------------------
			// Queue all entity hooks for level serialization.
			client.cabinet.register(
				'presave', 'levelEntitiesCuratorNPCItems',
				( file ) => {
					// Get the Entities curator.
					const curator	=
						client.toolbox.tools.entities.curators.primary;
					// Get NPC objects belonging to active level.
					const npcObjs	= curator.getVisibleObjects( 'hook' );
					// Queue NPCs for serialization.
					file.enqueue( 'npc', npcObjs );
				});
		},

		// Extend the client class.
		extend: function( Klass, proto ) {
			//-------------------------
			// NPC Parsing (Decoding)
			//-------------------------
			Klass.registerKeywordParser(
				subtype,
				function( ctx, lines, i, result ) {
					const tokens = lines[i].trim().split( /\s+/ );
					if ( tokens.length<4 ) {
						console.warn( `${subtype} parse error: Invalid NPC header: ${lines[i]}` );
						return i + 1;
					}

					// Decode the NPC path as a single token.
					// Parse coordinates explicitly as numbers.
					const path = tokens[1]==='-' ? null : ctx.client.decodeWhitespace( tokens[1] );
					const x    = Number( tokens[2] );
					const y    = Number( tokens[3] );
					i++;

					const codeLines = [];
					while ( i<lines.length && lines[i].trim()!==`${subtype}END` )
						codeLines.push( lines[i++] );
					if ( i<lines.length && lines[i].trim()===`${subtype}END` ) i++;

					const key = subtype.toLowerCase(); // "npc"
					if ( !result[key] ) result[key] = [];
					result[key].push({
						path	: path,
						x		: x,
						y		: y,
						script	: codeLines.join('\n')
						});

					return i;
				});

			//-------------------------
			// Encode NPC Block
			//-------------------------
			Klass.registerKeywordEncoder(
				subtype,
				function( ctx, npcs=[] ) {
					const lines	= [];

					//--------------------------------
					// Serialize NPC Objects
					//--------------------------------
					// Iterate each NPC and encode it.
					for ( const item of npcs ) {
						// Access curator object data.
						const npc  = item.data ?? item;
						// Encode the NPC path to prevent spaces from splitting tokens.
						// Preserve '-' as the placeholder for missing paths.
						const path = npc.path ? ctx.client.encodeWhitespace( npc.path ) : '-';
						// Normalize the NPC coordinates into numeric values.
						const x    = Number( npc.x );
						const y    = Number( npc.y );

						// Serialize the NPC header using fixed token positions.
						lines.push( `NPC ${path} ${x} ${y}` );

						//--------------------------------
						// Serialize NPC Script
						//--------------------------------
						// Get script contents.
						const code	= npc.script ?? '';
						// Write each script line.
						if ( code )
							lines.push( ...code.split(/\r?\n/) );
						// Close NPC block.
						lines.push( 'NPCEND' );
					}

					return lines;
				}
			);
		}
	};

	// Register plugin with JestParserLevel
	if ( typeof window.JestParserLevel?.use==='function' )
		window.JestParserLevel.use( type, plugin );
	else console.error( 'npc.plugin.js load error: JestParserLevel.use() not found' );
})( window );
