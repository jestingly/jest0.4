//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/jest/loaders/level.plugin.js loaded' );

// Level loader plugin.
(function( window ) {
	// Define the plugin [object]
	var type	= 'loaders';
	var subtype	= 'level';
	var plugin	= {
		// Initialize the plugin.
		init: function( client ) { },

		// Extend the client class.
		extend: function( Klass, proto ) {
			// Render a level's loaded data into a level [object].
			// RETURNS: {level,record,regions} | null.
			// * fileInfo - File information [object].
			proto.renderLevelData = async function( fileInfo ) {
				// Create a new level [object] with filename stem.
				const level = new JestLevel( this, fileInfo.filename );
				await level.setup(); // setup new [object]
				// Create variables that will be loaded in.
				let layers  =
					[{
					id      : 0,
					name    : 'Ground',
					visible : true,
					locked  : false,
					board   : null
					}];
				let regions = {};
				console.log( JestParserLevel.keywords );

				// Keep the parsed record available to both branches & the return value.
				let record  = null; // default empty record

				//--------------------------------
				// Build Empty Level
				//--------------------------------
				// Create empty level if no file opened.
				if ( fileInfo.network==='none' ) {
					console.log( 'No File Data Supplied: Generating level using empty file data...' );
					// Choose base generic tile @ index (0,0)
					const baseTile   = { ts: 0, tx: 0, ty: 0 };
					// level is your JestLevel instance
					const levelGrid  = this.config.levelGrid; // level WxH
					const board      = this.grapher.createMatrix( levelGrid, levelGrid, baseTile );
					layers[0].board  = board; // add board to base layer
					// Dynamically assign regions via parser keyword registration
					for ( const keyword of JestParserLevel.keywords ) {
						const key    = keyword.toLowerCase();
						if ( key==='board' || key==='layer' ) continue;
						regions[key] = []; // empty region (by default)
					}
				}
				//--------------------------------
				// Generate Level From File Data
				//--------------------------------
				else {
					console.log( 'File Data Supplied: Generating level using file data...' );
					// Attempt to get the file record.
					const secretary   = this.secretary;	  // secretary [object]
					const transmitter = this.transmitter; // transmitter [object]
					const record      = secretary.getRecord( fileInfo.address, fileInfo.network );
			        if ( !record )
			            throw new Error( 'Level file record not found.' );

					// Remove record from secretary & transmitter cache.
					secretary.removeRecord( fileInfo.address, fileInfo.network );
					transmitter.removeFromCache( fileInfo.address, true );

					//--------------------------------
			        // Normalize Level Format
			        //--------------------------------
					// Get tile board data from the read file.
					console.log( record );
		            // Convert legacy board into a single layer.
			        if ( record.version==='GLEVNW01' )
						layers[0].board = record.board; // add board to base layer
					else if ( record.version==='JESTNW02' )
		            	layers = record.layers;
		        	else throw new Error( `Unsupported level version: ${record.version}` );

					//--------------------------------
					// Debug Parsed Layer Records
					//--------------------------------
					// Verify that the parser supplied layer definitions
					// before converting them into JestLevelLayer objects.
					console.log( '[JEST Layers] Version:', record.version );
					console.log( '[JEST Layers] Parsed layers:', record.layers );
					console.log( '[JEST Layers] Selected layer records:', layers );

			        //--------------------------------
			        // Load Other Keyword Regions
			        //--------------------------------
					// Dynamically assign regions via parser keyword registration
					for ( const keyword of JestParserLevel.keywords ) {
						const key    = keyword.toLowerCase();
						if ( key==='board' || key==='layer' ) continue;
						regions[key] = record[key] ?? [];
					}
				}
				console.log( regions );

				//--------------------------------
			    // Create Level Layers
			    //--------------------------------
				// Iterate each layer & add to level.
				for ( const layer of layers ) {
			        await level.addLayer(
						layer.name,
						{
			            id      : layer.id,
			            visible : layer.visible,
			            locked  : layer.locked,
			            tilemap : layer.board
			        	});
			    }

				//--------------------------------
				// Render Tilemap Into Level
				//--------------------------------
				console.log( `Converted "${fileInfo.stem}" successfully into level [object]!` );
				// Load-in retrieved or generated board data & render its bitmap in the level [object].
				console.log( `Rendering "${fileInfo.stem}" level data into level [object]...` );
				// Set new level as this file [object] context.
				try {
					level.render(); // populates level layer tilemaps using blit()
					return { level, regions, record }; // successfully rendered
				}
				catch ( err ) {
					console.error( 'Could not render level using supplied board data.' );
					return null; // failed to render
				}
			};

			// Add level load method.
			// RETURNS: [bool] success.
			// * fileInfo	- File information [object].
			proto.readLevelData = async function( fileInfo ) {
				//--------------------------------
				// Validate Argument(s)
				//--------------------------------
				// Validate argument(s)
				if ( !fileInfo ) {
					console.warn( 'Cannot Read File: Supplied argument is empty!' );
					return false;
				}
				//--------------------------------
				// Attempt to Load Data
				//--------------------------------
				// Use the Secretary to read a local file's data.
				console.log( `Attempting to read local level file data...` );
				console.log( fileInfo );
				const ok	= await this.secretary.readFile( fileInfo );
				if ( !ok ) {
					console.warn( `Could not read level file data.` );
					return false;
				}
				else console.log( `Local level file data read successfully!` );
				return true; // successfully loaded
			};
		}
	};
	// register with application
	if ( window.Jest && typeof window.Jest.use==='function' )
		window.Jest.use( type, plugin );
	else console.error( 'level.plugin.js load error: Jest.use() not found' );
})( window );
