//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/jest/parsers/level/layer.plugin.js loaded' );

//-----------------------------
// LAYER Block Plugin
//-----------------------------
(function( window ) {
	// Define the plugin [object]
	var type	= 'keyword';
	var subtype	= 'LAYER';

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
			// Decoder: Decode LAYER rows.
			//--------------------------------
            // Decode LAYER blocks.
            Klass.registerKeywordParser(
                subtype,
                function( ctx, lines, i, result ) {
					//--------------------------------
					// Validate Version
					//--------------------------------
					// Validate level file version type supports layers.
                    if ( result.version!=='JESTNW02' )
                        throw new Error( 'LAYER requires JESTNW02.' );

					//--------------------------------
					// Access Layer Tokens
					//--------------------------------
					// Split tokens by space character.
                    const tokens = lines[i].trim().split(/\s+/);
					// Validate amount of tokens.
                    if ( tokens.length<5 )
                        throw new Error( `Invalid LAYER header: ${lines[i]}` );

					///--------------------------------
					// Parse Layer Properties
					//--------------------------------
					// Read properties from their fixed token positions.
					const id      = parseInt( tokens[1] );
					const name    = ctx.client.decodeWhitespace( tokens[2] );
					const visible = Number(tokens[3])===1;
					const locked  = Number(tokens[4])===1;

					// Validate token(s).
					if ( !['0','1'].includes(tokens.at(-2)) ||
					     !['0','1'].includes(tokens.at(-1)) )
					    throw new Error( `Invalid LAYER flags: ${lines[i]}` );

					// Validate name & id tokens.
                    if ( !Number.isInteger(id) || id<0 || !name )
                        throw new Error( `Invalid LAYER metadata: ${lines[i]}` );

					//--------------------------------
					// Instantiate Varaible(s)
					//--------------------------------
					// Begin necessary variable(s).
                    const board		= [];
                    const grid		= ctx.client.config.levelGrid;
                    let count		= 0;
                    let closed		= false;

					//--------------------------------
					// Iterate each line and decode.
					//--------------------------------
					i++; // begin counter
					while ( i<lines.length ) {
						// Trime line ends of whitespace.
                        const line = lines[i].trim();

						// Layer is finished.
                        if ( line==='LAYEREND' ) {
                            closed = true;
							i++;   // increment while-loop
							break; // escape & finish
                        }

						// Beginning a board row of tiles.
                        if ( line.startsWith('BOARD ') ) {
                            const {rowIndex,tiles} = ctx.decodeBoard( line );
							// Avoid duplicate board rows.
                            if ( board[rowIndex] )
                                throw new Error( `Duplicate BOARD row ${rowIndex}` );
							// Assign row of tiles to board.
                            board[rowIndex] = tiles;
                            count++;
                        }
						// Line failed to parse.
                        else if ( line!=='' )
                            throw new Error( `Unexpected LAYER content: ${line}` );

						// Continue.
						i++; // increment while-loop
                    }

					//--------------------------------
					// Wrap-Up & Validate
					//--------------------------------
					// Gatekeep if board is finished / out of bounds.
                    if ( !closed || count!==grid )
                        throw new Error( `LAYER ${id}: Expected ${grid} BOARD rows.` );

					// Begin an empty [array] if layers empty.
                    if ( !result.layers ) result.layers = [];

					// Prevent duplicate layer id.
                    if ( result.layers.some(layer=>layer.id===id) )
                        throw new Error( `Duplicate LAYER id ${id}` );

					//--------------------------------
					// Add Layer Into Final Parsed Output
					//--------------------------------
                    result.layers.push( { id, name, visible, locked, board } );
					return i; // next line [int] index
                });

			//--------------------------------
			// Encoder: Write LAYER board.
			//--------------------------------
            // Encode LAYER blocks.
            Klass.registerKeywordEncoder(
                subtype,
                function( ctx, layers, version ) {
					//--------------------------------
					// Validate Version
					//--------------------------------
					// Validate level file version type supports layers.
                    if ( version!=='JESTNW02' ) return [];

					//--------------------------------
					// Encode Each Line
					//--------------------------------
					// Create an [array] for the lines.
                    const lines = [];
					// Iterate each layer & compile.
                    for ( const layer of layers ) {
						// Validate layer name.
                        if ( !layer.name || /\r|\n/.test(layer.name) )
                            throw new Error( 'Invalid LAYER name.' );
						//--------------------------------
						// Serialize Layer Properties
						//--------------------------------
						// Encode the name into a single token.
						// Normalize the ID and boolean flags into numeric values.
						const id      = parseInt( layer.id );
						const name    = ctx.client.encodeWhitespace( layer.name );
						const visible = Number( Boolean(layer.visible) );
						const locked  = Number( Boolean(layer.locked) );
						// Add the serialized layer record.
						// Every property occupies a fixed token position.
						lines.push( `LAYER ${id} ${name} ${visible} ${locked}` );
						// Encode the board lines of tile rows & push into [array].
                        lines.push( ...ctx.encodeBoard(layer.board) );
						lines.push( 'LAYEREND' ); // finish
                    }

					//--------------------------------
					// Finish & Return
					//--------------------------------
					// Return encoded layer.
					return lines; // [array]
                });
		}
	};

	// register with JestParserLevel class
	if ( typeof window.JestParserLevel?.use==='function' )
		window.JestParserLevel.use( type, plugin );
	else console.error( 'layer.plugin.js load error: JestParserLevel.use() not found' );
})( window );
