//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/tools/floodfill/floodfill.plugin.js loaded' );

//-------------------------
// Floodfill Plugin
//-------------------------
// Adds a “Fill” tool using floodfill logic.
// Uses JestToolFloodfill base class.
// Registers toolbar button, click behavior, and undo snapshot.
(function( window ) {
	//--------------------------------
	// Plugin Metadata
	//--------------------------------
	const type		= 'tools';
	const subtype	= 'floodfill';

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
			//-------------------------
			// Create Tool
			//-------------------------
			const tool = new JestToolFloodfill( client, subtype );
			client.toolbox.registerTool( subtype, tool );
			tool.build();					// build the floodfill tool
			// Wire into the grid.
			tool.anchor.graticulate( client.config.tileGrid );

			// Simultaneous tools allowed:
			tool.coopt( 'tiledrop' );

			// Hold-key mapping.
			tool.holdkey( 'Alt', 'eyedropper' );

			//-------------------------
			// Setup Toolbar Button
			//-------------------------
			const button	= client.toolbar.createButton( { name: subtype, text:  null /*'Floodfill'*/ } );
			button.clicker.addAttribute( 'data-tooltip', 'Floodfill' );
			button.clicker.addAttribute( 'data-tooltip-keys', 'F' );
			//-----------------------------
			// Icon Floodfill
			//-----------------------------
			button.clicker.addElements([
				{
					name       : 'icon',
					tag        : 'svg',
					attributes : {
						xmlns        : "http://www.w3.org/2000/svg",
						viewBox      : "0 0 1200 1200",
						width        : "24",
						height       : "24",
						"aria-hidden": "true"
						},
					classes    : [ 'ico-floodfill' ],
					elements   :
						[
							{
								name       : 'path',
								tag        : 'path',
								attributes :
									{
										'd': 'M118.63,766.4c40.21,43.92,81.51,87.05,123.96,129.5,42.45,42.45,85.59,83.76,129.5,123.92v.05s.09.09.18.14c36.64,33.2,85.82,51.47,138.47,51.47s101.8-18.32,138.44-51.47l.18-.18-.05.05,350.98-363.83c13.83-16.3,13.83-40.16,0-56.42l-461.42-461.37v-.05c-16.21-13.83-40.12-13.83-56.37,0L118.63,489.18l-.18.18c-33.11,36.64-51.43,85.82-51.43,138.47s18.32,101.76,51.47,138.39l.13.18ZM510.72,228.69l396.38,395.97H154.01c.64-28.26,10.26-56.23,28.85-76.8L510.71,228.69h0Z'
									}
							},
							{
								name       : 'path',
								tag        : 'path',
								attributes :
									{
										'd': 'M1019.68,767.97c-.27-.37-.55-.73-.87-1.05-1.97-2.2-4.76-3.48-7.69-3.53-2.93-.09-5.82,1.05-7.88,3.16-30.09,30.27-56.92,63.61-80.14,99.42-9.25,13.97-17.45,28.67-24.45,43.92l-.18.37v.05c-4.85,12.59-7.28,25.97-7.14,39.52.41,30.82,14.06,60.45,37.09,83.99,23.03,23.54,51.84,37.09,82.43,37.05h.82c62.01-1.01,117.15-58.89,118.7-120.67.23-13.65-2.15-27.2-7.05-39.89v-.18c-.32-1.92-25.46-58.34-103.63-142.15h0Z'
									}
							}
						]
				}]);

			// Register toolbar button action.
			client.register(
				'equip', 'setFloodfill',
				( name ) => {
					// Block action if app is busy.
					if ( client.busy() ) return; // app busy‐gate
					// Check current button action.
					if ( name===subtype ) {
						client.toolbox.setTool( tool ); // enable new tool
						// Enable side panel options.
						client.sidebar.enableSection( subtype );
						// Enable side panel options.
						client.sidebar.enableSection( 'patterns' );
						// Activate the menu button
						client.toolbar.buttons[name].activate();	// toggle button on
					}
				});

			// Define keyboard shortcut.
			client.io.registerShortcut( 'F', subtype );
			// Keyboard shortcut menu action.
			client.io.register( 'keyboardShortcut', 'floodfillCommand',
				command => {
					// Block input shortcuts while user is typing
					if ( client.io.isTypingInInput() ) return;
					// Affirm shortcut command is for "floodfill" tool.
					if ( command===subtype )
						client.toolbox.setTool( subtype );
				});

			//--------------------------------
			// Handle Tool Block Check
			//--------------------------------
			// Determine whether the tool can edit the active layer.
			tool.register(
				'blockCheck', 'floodfillBlocking',
				( status ) => {
					//--------------------------------
					// Validate Level Availability
					//--------------------------------
					// A level must exist before its layers can be edited.
					if ( !status.level ) {
						status.reasons.push( 'noLevel' );
						return; // blocked
					}

					//--------------------------------
					// Validate Active Layer
					//--------------------------------
					// Editing requires an active layer.
					const layer = status.layer;
					if ( !layer ) {
						status.reasons.push( 'noLayer' );
						return; // blocked
					}

					//--------------------------------
					// Validate Layer Properties
					//--------------------------------
					// Hidden layers are not eligible for direct editing.
					if ( !layer.visible )
						status.reasons.push( 'layerHidden' );

					// Locked layers prohibit modifying their contents.
					if ( layer.locked )
						status.reasons.push( 'layerLocked' );
				});

			//--------------------------------
			// Paintbrush Options State
			//--------------------------------
			let useSwatch		= null;
			let patternId		= null;

			//-------------------------
			// Create Control Panel
			//-------------------------
			// Generate a "form" inside the sidebar.
			const optsPanel	= new JestForm( client );		// create DOM Panel element [object].
			optsPanel.build( 'options', ['floodfill-options'] ); // build the form

			// Create the "foreground" swatch option (as a checkbox).
			const inputFg	= new JestInputCheckbox( client, 'foreground', null, false, 'Use Swatch' );
			inputFg.build( `input-foreground` );			// build field
			inputFg.register( // create input toggle event
				'change', 'foreground',
				( val ) => {
					// Store the checked value.
					useSwatch = val;
					// If checked, hide the pattern-select field (else, show).
					if ( val===true )
						pattSelect.hide();
					else pattSelect.show();
					// Refit the menu to fit dropdown toggle.
					client.sidebar.refit( subtype ); // resize to fit contents
				});
			optsPanel.addField( 'foreground', inputFg );	// add field to form
			inputFg.showLabel(); // show the label

			// Create the "pattern" floodfill select dropdown.
			const pattSelect	= new JestInputSelect( client, 'pattern', null, null, null, 'Fill Pattern' );
			pattSelect.build( `input-pattern` );			// build field
			pattSelect.register( 'change', 'pattern', id => patternId=id );
			pattSelect.field.addAttribute( 'data-tooltip', 'Fill Pattern' );
			optsPanel.addField( 'pattern', pattSelect );
			inputFg.setChecked( true ); // toggle input foreground

			// Create the "contiguous" option (as a checkbox).
			const input1	= new JestInputCheckbox( client, 'contiguous', null, true, 'Contiguous' );
			input1.build( `input-contiguous` );				// build field
			optsPanel.addField( 'contiguous', input1 );		// add field to form
			input1.showLabel(); // show the label

			// Create the "contiguous" option (as a range/slider).
			const input2	= new JestInputRange( client, 'Scatter', null, 0, 'Scatter' );
			input2.build( `input-scatter` );				// build field
			optsPanel.addField( 'scatter', input2 );		// add field to form
			input2.showLabel(); // show the label

			// Create horiztonal spacing slider.
			const xSpacing = new JestInputRange( client, 'xSpacing', null, 1, 'X Spacing' );
			xSpacing.build(); // build field
			xSpacing.setMin( 0 );
			xSpacing.setMax( 10 );
			xSpacing.setStep( 1 );
			xSpacing.setValue( 0 ); // default: no spacing
			optsPanel.addField( 'xSpacing', xSpacing );
			xSpacing.showLabel();

			// Create vertical spacing slider.
			const ySpacing = new JestInputRange( client, 'ySpacing', null, 1, 'Y Spacing' );
			ySpacing.build(); // build field
			ySpacing.setMin( 0 );
			ySpacing.setMax( 10 );
			ySpacing.setStep( 1 );
			ySpacing.setValue( 0 );
			optsPanel.addField( 'ySpacing', ySpacing );
			ySpacing.showLabel();

			// Horizontal Offset
			const xOffset = new JestInputRange( client, 'xOffset', null, 0, 'X Offset' );
			xOffset.build(); // build field
			xOffset.setMin( 0 );
			xOffset.setMax( 10 );
			xOffset.setStep( 1 );
			xOffset.setValue( 0 );
			optsPanel.addField( 'xOffset', xOffset );
			xOffset.showLabel();

			// Vertical Offset
			const yOffset = new JestInputRange( client, 'yOffset', null, 0, 'Y Offset' );
			yOffset.build(); // build field
			yOffset.setMin( 0 );
			yOffset.setMax( 10 );
			yOffset.setStep( 1 );
			yOffset.setValue( 0 );
			optsPanel.addField( 'yOffset', yOffset );
			yOffset.showLabel();


			// Add the curator panel to the sidebar.
			client.sidebar.addSection( subtype, 'Floodfill', optsPanel.panel, {}, optsPanel );
			client.sidebar.refit( subtype ); // resize to fit contents

			//--------------------------------
			// Object Selector Panel
			//--------------------------------
			// Create tool curator.
			tool.addCurator( 'primary' );
			const curator	= tool.curators.primary;
			tool.curators.primary.registerType( 'pattern' );
			//--------------------------------
			// Create Curator Button(s)
			//--------------------------------
			// Add export button to curator.
			tool.curators.primary.toolbar.createButton( { name: 'export', text: 'Export' } );
			tool.curators.primary.toolbar.buttons.export.register(
				'click', 'export-objects',
				() => {
					// Emit an export event.
					tool.curators.primary.emit( 'btnExport' );
					// Export the currrent [objects] list.
					tool.curators.primary.exportObjects();
				});
			// Add import button to curator.
			tool.curators.primary.toolbar.createButton( { name: 'import', text: 'Import' } );
			tool.curators.primary.toolbar.buttons.import.register(
				'click', 'import-objects',
				() => {
					// Emit an import event.
					tool.curators.primary.emit( 'btnImport' );
					// Import the currrent [objects] list.
					tool.curators.primary.openImportDialog();
				});
			// Add remove button to curator.
			tool.curators.primary.toolbar.createButton( { name: 'remove', text: 'Remove' } );
			tool.curators.primary.toolbar.buttons.remove.register(
				'click', 'remove-object',
				() => {
					// Verify user wants to remove the [object].
					if ( !confirm("You are about to remove a floodfill pattern. Remove anyway?") ) return;
					// Remove [object] from curator.
					tool.curators.primary.removeObject();
				});
			//--------------------------------
			// Create Curator Event(s)
			//--------------------------------
			// Register the dropdown select-item event to refit the menu to match contents.
			tool.curators.primary.register(
				'displayed', 'curator', ()=>client.sidebar.refit('marquee') );
			client.sidebar.addSection( 'patterns', 'Patterns', tool.curators.primary );
			client.sidebar.refit( 'patterns' ); // resize menu to match new content

			//--------------------------------
			// Create I/O "Add" Modal(s)
			//--------------------------------
			// Generate the "pattern" modal.
			client.addModal(
				'newPattern',
				{
					title   :	'Define Pattern Preset',
					text    :	'Name your new pattern:',
					inputs  :
						[
							{ name: 'title', placeholder: 'e.g. Flower Patch', label: 'name' }
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
											client.modals.newPattern.emit( 'cancel', null );
											// Close the modal.
											client.modals.newPattern.close();
										}
								},
							confirm  :
								{
									label   : 'Confirm',
									onClick :
										() => {
											// Get curated object type.
											const modal	= client.modals.newPattern;
											modal.emit( 'confirm', null, modal.payload );
										}
								}
						}
				});

			// Wire all modal(s) to reset inputs when opening.
			client.modals.newPattern.register(
				'preopen', 'reset', e=>client.modals.newPattern.resetInputs() );

			//--------------------------------
			// Floodify Button: LevelMarquee Integration
			//--------------------------------
			// Grab level marquee tool.
			const marqueeTool	= client.toolbox.getTool( 'levelMarquee' );
			// Insert button.
			const floodify		= client.actionbar.createButton( { name: 'floodify', text: 'Create Pattern' } );
			// Register floodify button click event.
			floodify.register(
				'click', 'insert-object',
				() => {
					// Get fill definer modal.
					modal	= client.modals.newPattern;
					// Open the modal.
					modal.open();
				});

			//-------------------------
			// Predefined Objects Hook(s)
			//-------------------------
			// Register Mosaic Selector Hook(s)
			client.modals.newPattern.register(
				'confirm', 'floodfillAdd',
				() => {
					// Attempt to define marquee region.
					client.defineLevelMarqueeRegion( 'pattern' );
				});

			//-------------------------
			// Define Region
			//-------------------------
			// Register region definition listener (to define a region).
			// NOTE: This is emitted by client.defineLevelMarqueeRegion()
			client.register(
				'defineRegion', subtype,
				( type, data, region ) => {
					// Block action if app is busy.
					if ( client.busy() ) return; // app busy‐gate
					//--------------------------------
					// Check If Paste Possible
					//--------------------------------
					// Validate an active view is open.
					const state		= client.getState();	// get current program state
					if ( !state.tilesetView ) return false;	// no active level
					// Convert the region to a stamp.
					const levelView	= state.levelView;
					const levelKey	= state.levelViewKey;
					const tileset	= state.tilesetView.file.context;
					//--------------------------------
					// Get Input Value(s) (from modal)
					//--------------------------------
					// Get the value of the input text field(s).
					let modal, log;
					// Handle new preset definition request.
					switch ( type ) {
						case 'pattern': {
							// Get user input from modal.
							modal			= client.modals.newPattern;
							const name		= modal.inputs.title.getValue().trim();
							// Require fill name to be created.
							if ( name.length===0 ) {
								alert( 'Invalid name. Pattern preset not created.')
								return;
							}
							data.name		= name;			// capture object name
							// Clone the marquee selected matrix & store in data.
							const matrix	= tileset.cloneMatrix( region.matrix );
							data.region		= { matrix };	// capture region
							break; }
						default: return; // unknown
					}
					//--------------------------------
					// Add Object & Finish [object]
					//--------------------------------
					// Play sound-effect to signal.
					client.soundboard.playSound( 'jest_success', 'mp3', 1.1 );
					// Add data [object] to object selector.
					tool.curators.primary.addObject( type, data );
					// Close the modal.
					modal.close();
				});

			// Add a mosaic as a "fill".
			tool.curators.primary.register(
				'add', subtype,
				( object ) => { // * object - [JestCuratorObject]
					//--------------------------------
					// Add a Pattern
					//--------------------------------
					// Determine type.
					const type	= object.data.type; // object type
					switch ( type ) {
						case 'pattern': {
							// Attempt to get a stamp of the region.
							const stamp		= client.getMatrixStamp( object.data.region.matrix );
							// Add the [object] matrix's stamp inside its display.
							object.display.addCanvas( 'stamp' );		// add a canvas for drawing
							object.display.render( 'stamp', stamp );	// draw the tile matrix snapshot
							pattSelect.addOption( object.data.id, object.data.name );
							break; }
						default: break;
					}
				});

			// Add a mosaic as a "fill".
			tool.curators.primary.register(
				'remove', subtype,
				( object ) => { // * object - [JestCuratorObject]
					//--------------------------------
					// Delete a Pattern
					//--------------------------------
					// Determine type.
					switch ( object.data.type ) {
						case 'pattern':
							// Attempt to remove stamp.
							pattSelect.removeOption( object.data.id );
							break;
						default: break;
					}
				});

			//-------------------------
			// Curator Update Functionality
			//-------------------------
			// Curator ticker "update" hook (for enabling/disabling buttons).
			client.register(
				'update', subtype,
				( e, state, enabled, mode ) => {
					//--------------------------------
					// Check Program Availability
					//--------------------------------
					// Block action if app is busy.
					if ( client.busy() ) return; // app busy‐gate
					// Only if client is running.
					if ( mode!=='running' ) return;
					//--------------------------------
					// Check If File Open
					//--------------------------------
					// Check for open view & tool.
					const view  = state.levelView;
					const key   = state.levelViewKey;
					//--------------------------------
					// Check If Update Possible
					//--------------------------------
					// Attempt to enable button(s).
					const levelMarquee      = client.toolbox.tools.levelMarquee;
					const levelMarqueeMode  = levelMarquee.skim( 'mode' );
					const floodfillMode     = tool.skim( 'mode' );
					const floodfillEnabled  = tool.skim( 'enabled' );
					const actionbar         = client.actionbar;
					let toggle              = false; // reusable toggle [bool]
					if ( levelMarquee.skim('enabled')===true ) {
						if ( levelMarqueeMode==='selected' || levelMarqueeMode==='floating' )
							if ( levelMarquee.rects.length===1 ) // perfect rectangle
								actionbar.toggle( 'floodify', true ); // create allowed
					}
				});

			//-------------------------
			// Curator Update Functionality
			//-------------------------
			// Curator ticker "update" hook (for enabling/disabling buttons).
			tool.curators.primary.register(
				'update', subtype,
				( type, object ) => {
					//--------------------------------
					// Check Program Availability
					//--------------------------------
					// Block action if app is busy.
					if ( client.busy() ) return; // app busy‐gate
					// Only if client is running.
					const mode     = client.skim( 'mode' );
					if ( mode!=='running' ) return;
					//--------------------------------
					// Check If File Open
					//--------------------------------
					// Check for open view & tool.
					const state    = client.getState(); // get program state
					const view     = state.levelView;
					const key      = state.levelViewKey;
					//--------------------------------
					// Check If Update Possible
					//--------------------------------x
					// Attempt to enable button(s).
					const toolMode = tool.skim( 'mode' );
					const enabled  = tool.skim( 'enabled' );
					const toolbar  = curator.toolbar;
					const visible  = curator.getVisibleOptions(); // get visible items
					let toggle     = false; // reusable toggle [bool]
					switch ( type ) {
						case 'pattern':
							// Buttons available.
							toolbar.toggle( 'export', true );
							toolbar.toggle( 'import', true );
							// Require an item to be selected for remove to be valid.
							if ( visible.length>0 )
								toolbar.toggle( 'remove', true );
							break;
					}
				});

			//-------------------------
			// Register Canvas Handler
			//-------------------------
			// Get active tab's rendering canvas.
			const canvas = client.gameboard.display.getCanvas( 'workspace' );
			tool.setTarget( canvas ); // set canvas as the target for mouse event(s)
			// Register a mouse click event for the canvas.
			tool.register(
				'start', 'floodfillClick',
				( e ) => {
					//-------------------------
					// Reset Floodfill Propert(ies)
					//-------------------------
					// Reset target layer id.
					tool.layerId = null; // clear layer id
					//-------------------------
					// Begin Floodfill
					//-------------------------
					// Call flood-fill method for level.
					client.toolFloodfillLevel( e );
				});

			// Validate-hook, whether to replace a tile within floodfill tool.
			tool.register(
				'checkReplace', 'tileCompare',
				( tile ) => {
					// Compare tile data to see if it is the same tile.
					const target = tool._targetTile;
					let should   =
						Boolean(
							// Both tiles are transparent.
							( target===null && tile===null )
							||
							// Both tiles are same tile.
							(
							  target!==null && tile!==null &&
							  tile.ts===target.ts &&
							  tile.tx===target.tx &&
							  tile.ty===target.ty
						 	));
					// Update replace-mode signal.
					tool.jot( 'replacing', should ); // signal to replace
				});

			// Replace tile hook, within floodfill tool.
			tool.register(
				'applyReplace', 'replaceTile',
				( tile ) => {
					// Block action if app is busy.
					if ( client.busy() ) return; // app busy‐gate
					//--------------------------------
					// Validate State
					//--------------------------------
					// Check for open view & tool.
					const state		= this.getState(); // get program state
					if ( !state?.levelView ) return;

					//--------------------------------
					// Resolve Target Level Layer
					//--------------------------------
					// Require level view & level [object].
					const view		= state.levelView;
					const level     = view.file.context;
					const layer     = level.getLayer( tool.layerId, true ); // get layer
					if ( !layer || layer.locked ) return false;        // can't find / edit layer

					//--------------------------------
					// Attempt to Replace Tile
					//--------------------------------
					// Grab x,y coordinates from tile checking data.
					const { x, y }	= tile;
					const oldTile	= layer.getTile( x, y );

					// Relative deltas from origin
					const dx	= x - tool._floodOriginX;
					const dy	= y - tool._floodOriginY;

					//-------------------------
					// Determine New Tile
					//-------------------------
					let newTile;

					//----------------------------------------
					// Swatch Fill Mode (Single Tile, Optional Spacing)
					//----------------------------------------
					if ( tool._useSwatch ) {
						//----------------------------------------
						// Swatch Fill Mode (Single Tile Repeating)
						// Supports spacing and offset per tile.
						//----------------------------------------
						const dx = x - tool._floodOriginX;
						const dy = y - tool._floodOriginY;

						// Apply brick-style stagger based on *relative* flood position
						const staggerX = (dy%2) * tool._offsetX;
						const staggerY = (dx%2) * tool._offsetY;

						const relX = dx - staggerX;
						const relY = dy - staggerY;

						// Apply spacing logic on RELATIVE coords
						if ( tool._spacingX>0 && relX%(1+tool._spacingX)!==0 ) return;
						if ( tool._spacingY>0 && relY%(1+tool._spacingY)!==0 ) return;

						// Passed spacing rules → draw tile
						newTile = tool._newTile;
					}
					//----------------------------------------
					// Pattern Fill Mode (With Brick Offsets)
					//----------------------------------------
					else if ( tool._floodPattern ) {
						// Get pattern + spacing dimensions
						const pattern	= tool._floodPattern;
						const pRows		= pattern.length;
						const pCols		= pattern[0].length;
						const blockW	= pCols + tool._spacingX;
						const blockH	= pRows + tool._spacingY;

						// Determine which row of pattern block we’re in
						const blockRow	= Math.floor( dy/blockH );
						const blockCol	= Math.floor( dx/blockW );

						//----------------------------------------
						// Brick / Checkered Offset Application
						//----------------------------------------
						// Apply horizontal offset to every other row (brick-style)
						const staggerX = (blockRow%2) * tool._offsetX;
						// Apply vertical offset if needed (comment out if not used)
						const staggerY = (blockCol%2) * tool._offsetY;

						// Subtract staggered offset
						const relX = dx - staggerX;
						const relY = dy - staggerY;

						//----------------------------------------
						// Fold Into Pattern Block
						//----------------------------------------
						const modX = ((relX % blockW) + blockW) % blockW;
						const modY = ((relY % blockH) + blockH) % blockH;

						// Skip if in spacing zone
						if ( modX>=pCols || modY>=pRows ) return;

						// Pick tile from pattern
						newTile = pattern[modY][modX];
					}

					//----------------------------------------
					// Fallback Mode
					//----------------------------------------
					else newTile = tool._newTile;

					//----------------------------------------
					// Scatter Chance Check
					//----------------------------------------
					if ( tool.scatter>0 ) {
						const chance = 1 - (tool.scatter/100);
						if ( Math.random()>chance ) newTile = { ...oldTile };
					}
					//console.log( 'applyReplace8' );

					//----------------------------------------
					// Apply Tile & Log Change
					//----------------------------------------
					tool.changed.push({
						x, y,
						oldTile : { ...oldTile },
						newTile : { ...newTile }
						});

					//console.log( 'applyReplace9' );
					layer.fillRegion( x, y, 1, 1, newTile );
					client.soundboard.playSound( 'jest_pour', 'mp3', 1.05 );
				});

			//--------------------------------
			// Preload Pattern(s)
			// NOTE: Loaded after tool plugin events defined.
			//--------------------------------
			// Use secretary to download pre-defined patterns.
			await client.secretary.loadFile( 'json/patterns.json' )
				.catch(
					( err ) => {
						console.warn( `Predefined patterns failed to load: ${err.message}` );
					});
			const record	= client.secretary.getRecord( 'json/patterns.json' );
			tool.curators.primary.importObjects( record ); // import json [objects]

			// --------------------------------
			// Settings Change Listener(s)
			// --------------------------------
			// Create event for when the magnification zoom value changes.
			client.register(
				'levelZoomed', 'floodfillZoom',
				zoom => {
					// --------------------------------
					// Get Current File State
					// --------------------------------
					// Get current file status.
					const s = client.getFileStatus( tool, true );
					// --------------------------------
					// Recalibrate to Zoomed Grid-Size
					// --------------------------------
					// Match the tool grid to the active level view zoom.
					tool.anchor.graticulate( s.levelView.anchor.getUnitsZoomed() );
				});
		},

		//--------------------------------
		// New Method(s) In Tiler Application
		//--------------------------------
		extend: function( Klass, proto ) {
			// Attempts to perform a flood fill action.
			// RETURNS: [boolean].
			// * e	- [object] MouseEvent event listener data.
			proto.toolFloodfillLevel = function( e ) {
				//--------------------------------
				// Validate State
				//--------------------------------
				// Check for open view & tool.
				const state		= this.getState(); // get program state
				if ( !state?.levelView ) return false;
				// Require level view & level [object].
				const view		= state.levelView;
				const key		= view.skey
				const tool		= this.toolbox.tools.floodfill;

				//--------------------------------
				// Resolve Target Level Layer
				//--------------------------------
				// Acesss active tab level.
				const level     = state.levelView.file.context;
				const layer     = level.getLayer( tool.layerId, true ); // get layer
				if ( !layer || layer.locked ) return false;        // can't find / edit layer
				if ( tool.layerId==null ) tool.layerId = layer.id; // change tool target layer
				const tilemap	= layer.tilemap;

				//--------------------------------
				// Get Click Location
				//--------------------------------
				// Get the click position on the level.
				const canvas	= this.gameboard.display.getCanvas( 'workspace' ); // get rendering canvas
				const pos		= canvas.mousePos( e );
				const units		= tool.anchor.units; // tile units
				const x			= Math.floor( pos.x / units );
				const y			= Math.floor( pos.y / units );

				//--------------------------------
				// Capture Flood Parameters
				//--------------------------------
				// Capture tile type data at click location.
				const target	= layer.getTile( x, y );
				const newTile	= { ...this.swatches.foreground.contents }; // clone background tile
				// Whether or not the floodfill is contiguous or global.
				const optsPanel	= this.sidebar.getSection( subtype );
				const form		= optsPanel.getContents();
				tool.setContiguous( form.getField('contiguous').getChecked() );
				tool.setScatter( form.getField('scatter').getValue() );

				//--------------------------------
				// Execute Floodfill
				//--------------------------------
				// Store pattern offsets (horizontal & vertical offsets).
				tool._offsetX		= form.getField('xOffset').getValue();
				tool._offsetY		= form.getField('yOffset').getValue();
				// Store pattern spacing (horizontal & vertical spacing).
				tool._spacingX		= form.getField('xSpacing').getValue();
				tool._spacingY		= form.getField('ySpacing').getValue();
				// Store pattern origin and matrix for tiling (if Use Swatch is false)
				tool._floodOriginX	= x; // store click x
				tool._floodOriginY	= y; // store click y
				// Check Use Swatch toggle
				const useSwatch		= form.getField('foreground').getChecked();
				tool._useSwatch		= useSwatch;
				// Load pattern matrix if swatch is disabled
				if ( !useSwatch ) {
					const pattId	= form.getField('pattern').getValue();
					const pattObj	= tool.curators.primary.getObject( pattId );
					if ( pattObj && pattObj.data.region?.matrix ) {
						const baseMatrix	= pattObj.data.region.matrix;
						// Deep clone the matrix
						tool._floodPattern	= baseMatrix.map( r=>r.map( t=>({ ...t }) ) );
					}
					else tool._floodPattern	= null; // fallback if invalid
				}

				//--------------------------------
				// Execute Floodfill
				//--------------------------------
				// Count how many tiles to change.
				tool.setContext( target, newTile );
				const count = tool.fill( tilemap, x, y );

				//--------------------------------
				// Log Undo Snapshot
				//--------------------------------
				// If any tiles are changing, log undo/redo state.
				if ( count>0 ) {
					// Generate redo state.
					const undo =
						tool.changed.map(
							( { x, y, oldTile } ) =>
								( { x, y, ts: oldTile.ts, tx: oldTile.tx, ty: oldTile.ty } )
							);
					const redo =
						tool.changed.map(
							( { x, y, newTile } ) =>
								( { x, y, ts: newTile.ts, tx: newTile.tx, ty: newTile.ty } )
							);
					// Generate change log inside view's governor.
					const log = {
						action  : 'sparseRegion',
						layerId : layer.id,
						old     : undo,
						neu     : redo
						};
					// Label the action for history panel.
					view.governor.enqueue( 'edit', { history: `Floodfill region.` } );
					// Log changes in governor.
					view.governor.log( 'edit', log );
				}

				//--------------------------------
				// Reset Tool Propert(ies)
				//--------------------------------
				// Clear the target layer id.
				tool.layerId = null; // clear layer id
				return true; // success
			}
		}
	};

	//--------------------------------
	// Register With Tiler
	//--------------------------------
	if ( window.JestTiler && typeof window.JestTiler.use==='function' )
		window.JestTiler.use( type, plugin );
	else console.error( 'floodfill.plugin.js load error: JestTiler.use() not found' );
})( window );
