//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/tools/swatches/swatches.plugin.js loaded' );

//-------------------------
// Swatches Plugin
//-------------------------
// Adds a “Swatches" tool for handling tiles as swatches.
(function( window ) {
	//--------------------------------
	// Plugin Metadata
	//--------------------------------
	const type		= 'tools';
	const subtype	= 'swatches';

	//--------------------------------
	// Plugin Definition
	//--------------------------------
	const plugin = {
		//--------------------------------
		// Initialize Plugin
		//--------------------------------
		// Called once when plugin is registered.
		// * client - [object] reference to JestTiler
		init: async function( client ) {
			//---------------------------------
			// Create Swatch Panel
			//---------------------------------
			// Create swatch panel [object].
			const tool	= new JestSwatches( this );
			client.swatchPanel	= tool;
			//client.toolbox.registerTool( subtype, tool );
			tool.build(); // build DOM
			// Register event(s).
			tool.register(
				'select', 'setSwatch',
				( tile ) => {
					// Switch foreground tile to swatch tile.
					client.toolSetTileSwatch( { tx: tile.tx, ty: tile.ty }, 'foreground' );
				});
			// Register event(s).
			tool.register(
				['added','removed'], 'refitMenu', data => client.sidebar.refit('swatches') );
			// Create sidebar collapsible menu with swatches.
			client.sidebar.addDisableExclusion( 'swatches' ); // prevent forced collapse
			client.sidebar.addSection( 'swatches', 'Swatches', tool, {} );
			client.sidebar.refit( 'swatches' ); // resize menu to match new content

			//--------------------------------
			// Create I/O "Add" Modal(s)
			//--------------------------------
			// Generate the "pattern" modal.
			client.addModal(
				'newSwatch',
				{
					title   :	'Define Swatch',
					text    :	'Name your new swatch:',
					inputs  :
						[
							{ name: 'title', placeholder: 'e.g. Grass Tile', label: 'name' }
						],
					buttons :
						{
							cancel  :
								{
									label   : 'Cancel',
									onClick :
										() => {
											// Log the event in console.
											console.log( 'User canceled.' );
											// Play sound-effect signal.
											client.soundboard.playSound( 'jest_close0', 'mp3', 1.05 );
											// Emit cancel event.
											client.modals.newSwatch.emit( 'cancel', null );
											// Close the modal.
											client.modals.newSwatch.close();
										}
								},
							confirm  :
								{
									label   : 'Confirm',
									onClick :
										() => {
											// Get curated object type.
											const modal	= client.modals.newSwatch;
											modal.emit( 'confirm', null, modal.payload );
										}
								}
						}
				});

			//--------------------------------
			// Swatch Panel Button Modal Integration
			//--------------------------------
			// Register "Add Swatch" button click event.
			tool.register(
				'addForeground', 'addSwatch',
				() => {
					// Access foreground tile
					const tile	= client.swatches.foreground?.contents;
					if ( !tile ) return; // no tiler
					// Prompt for user to name swatch.
					client.modals.newSwatch.inputs.title.setValue( '' );
					client.modals.newSwatch.open( tile );
				});

			// Register Mosaic Selector Hook(s)
			client.modals.newSwatch.register(
				'confirm', 'swatchAdd',
				( tile ) => {
					// Switch foreground tile to swatch tile.
					const label	= client.modals.newSwatch.inputs.title.getValue().trim();
					tool.addSwatch( label, tile );
				});

			//--------------------------------
			// Preload Swatch(es)
			// NOTE: Loaded after tool plugin events defined.
			//--------------------------------
			// Use secretary to download pre-defined swatches.
			await client.secretary.loadFile( 'json/swatches.json' )
				.catch(
					( err ) => {
						console.warn( `Predefined swatches failed to load: ${err.message}` );
					});
			const record	= client.secretary.getRecord( 'json/swatches.json' );
			tool.importSwatches( record ); // import json [objects]
		}
	};

	//--------------------------------
	// Register With Tiler
	//--------------------------------
	if ( window.JestTiler && typeof window.JestTiler.use==='function' )
		window.JestTiler.use( type, plugin );
	else console.error( 'swatches.plugin.js load error: JestTiler.use() not found' );
})( window );
