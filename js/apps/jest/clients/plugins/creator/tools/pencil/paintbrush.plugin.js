//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/tools/paintbrush/paintbrush.plugin.js loaded' );

// Paintbrush plugin
(function( window ) {
	// Rotate a matrix of tiles.
	function rotateMatrix90( matrix ) {
		// Rotate [matrix] in-place by 90° clockwise.
		const rows = matrix.length, cols = matrix[0]?.length ?? 0;
		const out  = Array.from( { length: cols }, ()=>Array(rows) );
		for ( let i=0; i<rows; i++ )
			for ( let j=0; j<cols; j++ )
				out[j][rows-1-i] = matrix[i][j];
		matrix.length = 0;
		for ( let r of out ) matrix.push( r );
	}

	//-------------------------
	// Register Plugin
	//-------------------------
	const type    = 'tools';
	const subtype = 'paintbrush';
	const plugin  = {
		//--------------------------------
		// Plug Tool Into Tiler Application
		//--------------------------------
		init: async function( client ) {
			// --------------------------------
			// Create Pencil Tool [object]
			// --------------------------------
			// Add a pencil tool to the level canvas board.
			const tool    = new JestToolPencil( client, subtype );
			client.toolbox.registerTool( subtype, tool );
			tool.build(); // build tool
			tool.setSwishThreshold( 5 );	// track every [float] # of tile movements
			tool.setIdleThreshold( 500 );	// reset motion tracking if idle for 500 ms
			// Wire into the grid.
			tool.anchor.graticulate( client.config.tileGrid );
			const canvas  = client.gameboard.display.getCanvas( 'workspace' );
			tool.setTarget( canvas ); // set target

			// Simultaneous tools allowed:
			tool.coopt( 'tiledrop' );

			// Hold-key mapping.
			tool.holdkey( 'Alt', 'eyedropper' );

			//--------------------------------
			// Paintbrush Options State
			//--------------------------------
			let fillBrushId   = null;
			let strokeBrushId = null;
			let step          = 0;
			let rotator       = 0;
			let strokeWeight  = 0;
			let stepCount     = 0;
			let rotationStep  = 0;

			//--------------------------------
			// Sidebar Panel UI (Control Panel)
			//--------------------------------
			// Initialize a form for paintbrush setting(s).
			const form = new JestForm( client );
			form.build( 'options', ['paintbrush-options'] );

			const fillSelect  = new JestInputSelect( client, 'fill', null, null, null, 'Fill Mosaic' );
			fillSelect.build();
			fillSelect.register( 'change', 'paintbrush', id => fillBrushId=id );
			form.addField( 'fill', fillSelect );
			fillSelect.field.addAttribute( 'data-tooltip', 'Brush Fill' );

			const strokeSelect	= new JestInputSelect( client, 'stroke', null, null, null, 'Stroke Mosaic' );
			strokeSelect.build();
			strokeSelect.register( 'change', 'paintbrush', id => strokeBrushId=id );
			form.addField( 'stroke', strokeSelect );
			strokeSelect.field.addAttribute( 'data-tooltip', 'Brush Stroke' );

			// Create the "overlap" option (as a checkbox).
			const overlapCheck	= new JestInputCheckbox( client, 'overlap', null, true, 'Overlap' );
			overlapCheck.build( `input-overlap` );			// build field
			form.addField( 'overlap', overlapCheck );		// add field to form
			overlapCheck.showLabel(); // show the label

			const inputStep	= new JestInputRange( client, 'step', null, 0, 'Step' );
			inputStep.setMin( 0 );
			inputStep.setMax( 10 );
			inputStep.setStep( 1 );
			inputStep.setValue( 1 );
			inputStep.build( 'input-step' );
			inputStep.showLabel();
			inputStep.register( 'change', 'paintbrush', v => step=v );
			form.addField( 'step', inputStep );

			const inputRot = new JestInputRange( client, 'rotator', null, 0, 'Rotator' );
			inputRot.setMin( 0 );
			inputRot.setMax( 10 );
			inputRot.setStep( 1 );
			inputRot.setValue( 0 );
			inputRot.build( 'input-rotator' );
			inputRot.showLabel();
			inputRot.register( 'change', 'paintbrush', v => rotator=v );
			form.addField( 'rotator', inputRot );

			const inputStroke = new JestInputRange( client, 'strokeWeight', null, 0, 'Stroke Weight' );
			inputStroke.setMin( 0 );
			inputStroke.setMax( 5 );
			inputStroke.setStep( 1 );
			inputStroke.setValue( 0 );
			inputStroke.build( 'input-strokeWeight' );
			inputStroke.showLabel();
			inputStroke.register( 'change', 'paintbrush', v => strokeWeight=v );
			form.addField( 'strokeWeight', inputStroke );

			// Add form to a sidebar options collapsible menu.
			client.sidebar.addSection( subtype, 'Paintbrush', form.panel, {}, form );
			client.sidebar.refit( subtype ); // resize menu to match new content

			//--------------------------------
			// Object Selector Panel
			//--------------------------------
			// Create tool curator.
			tool.addCurator( 'primary' );
			const curator = tool.curators.primary;
			tool.curators.primary.registerType( 'fill' );
			tool.curators.primary.registerType( 'stroke' );
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
					if ( !confirm("You are about to remove a brush mosaic. Remove anyway?") ) return;
					// Remove [object] from curator.
					tool.curators.primary.removeObject();
				});
			//--------------------------------
			// Create Curator Event(s)
			//--------------------------------
			// Register the dropdown select-item event to refit the menu to match contents.
			//tool.curators.primary.register(
				//'displayed', 'curator', ()=>client.sidebar.refit('marquee') );
			client.sidebar.addSection( 'brushes', 'Brushes', tool.curators.primary );
			client.sidebar.refit( 'brushes' ); // resize menu to match new content

			// Generate the "brush" modal.
			client.addModal(
				'newPreset',
				{
					title   :	'Define Brush Preset',
					text    :	'Name your new preset:',
					inputs  :
						[
							{ name: 'title', placeholder: 'e.g. Walkway Interior', label: 'name' },
							{
								type    : 'select',		// dropdown select box
								name    : 'type',		// name
								default : 'fill',		// defaultValue
								options :
									[
										{ value: 'fill',   label: 'Fill'   },
										{ value: 'stroke', label: 'Stroke' }
									],
								label   : 'Brush Mode'	// labelText
							}
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
											client.modals.newPreset.emit( 'cancel', null );
											// Close the modal.
											client.modals.newPreset.close();
										}
								},
							confirm  :
								{
									label   : 'Confirm',
									onClick :
										() => {
											// Get curated object type.
											const modal	= client.modals.newPreset;
											modal.emit( 'confirm', null, modal.payload );
										}
								}
						}
				});

			// Wire all modal(s) to reset inputs when opening.
			client.modals.newPreset.register(
				'preopen', 'reset', e=>client.modals.newPreset.resetInputs() );

			//--------------------------------
			// Equip + Shortcut
			//--------------------------------
			/*client.toolbar.createButton({
				name     : subtype,
				text     : null,
				icon     : '🖌️',
				tooltip  : 'Paintbrush',
				tooltipKeys: 'B'
				});*/

			//-------------------------
			// Toolbar Functionality
			//-------------------------
			// Add "selector" tool (levelMarquee) button to toolbar.
			const button = client.toolbar.createButton( { name: subtype } );
			button.clicker.addAttribute( 'data-tooltip', 'Paintbrush' );
			button.clicker.addAttribute( 'data-tooltip-keys', 'B' );
			//-----------------------------
			// Icon Marquee
			//-----------------------------
			button.clicker.addElements([
				{
					name       : 'icon',
					tag        : 'svg',
					attributes : {
						xmlns        : "http://www.w3.org/2000/svg",
						viewBox      : "0 0 1200 1200",
						width        : "1200pt",
						height       : "1200pt",
						"aria-hidden": "true",
						version      : 1.1
						},
					classes    : [ 'ico-marquee' ],
					elements   :
						[
							{
								name       : 'path',
								tag        : 'path',
								attributes :
									{
										'd': 'm487.5 675v-37.5c0-62.156 50.391-112.5 112.5-112.5h337.5c20.719 0 37.5-16.781 37.5-37.5v-112.5c0-20.719-16.781-37.5-37.5-37.5h-37.5v16.219c0 53.203-43.078 96.281-96.281 96.281h-557.44c-53.203 0-96.281-43.078-96.281-96.281v-107.44c0-53.203 43.078-96.281 96.281-96.281h557.44c53.203 0 96.281 43.078 96.281 96.281v16.219h37.5c62.109 0 112.5 50.344 112.5 112.5v112.5c0 62.156-50.391 112.5-112.5 112.5h-337.5c-20.719 0-37.5 16.781-37.5 37.5v37.5h112.5v75h-37.5v187.6c0 29.812-11.859 58.406-32.906 79.5-21.094 21.047-49.688 32.906-79.5 32.906h-0.1875c-29.812 0-58.406-11.859-79.5-32.906-21.047-21.094-32.906-49.688-32.906-79.5v-187.6h-37.5v-75z',
										'fill-rule': 'evenodd'
									}
							}
						]
				}]);

			// Create keyboard shortcut.
			client.io.registerShortcut( 'B', subtype );
			// Keyboard shortcut menu action.
			client.io.register(
				'keyboardShortcut', 'paintbrushCommand',
				command => {
					// Block input shortcuts while user is typing
					if ( client.io.isTypingInInput() ) return;
					// Affirm shortcut command is for "draw" tool.
					if ( command===subtype )
						client.toolbox.setTool( subtype );
				});

			// Register toolbar button action.
			client.register(
				'equip', subtype,
				( name ) => {
					// Block action if app is busy.
					if ( client.busy() ) return; // app busy‐gate
					// Set the active tool to the marquee tool.
					if ( name===subtype ) {
						client.toolbox.setTool( tool ); // enable new tool
						// Enable side panel options.
						client.sidebar.enableSection( subtype );
						// Enable side panel options.
						client.sidebar.enableSection( 'brushes' );
						// Activate the menu button
						client.toolbar.buttons[name].activate();	// toggle button on
					}
				});

			//--------------------------------
			// Handle Tool Block Check
			//--------------------------------
			// Determine whether the tool can edit the active layer.
			tool.register(
				'blockCheck', 'paintbrushBlocking',
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
			// Brushify Button: LevelMarquee Integration
			//--------------------------------
			// Grab level marquee tool.
			const marqueeTool = client.toolbox.getTool( 'levelMarquee' );
			// Insert button.
			const brushify    = client.actionbar.createButton( { name: 'brushify', text: 'Create Brush' } );
			// Register brushify button click event.
			brushify.register(
				'click', 'insert-object',
				() => {
					// Get fill definer modal.
					modal = client.modals.newPreset;
					// Open the modal.
					modal.open();
				});

			//-------------------------
			// Predefined Objects Hook(s)
			//-------------------------
			// Register Mosaic Selector Hook(s)
			client.modals.newPreset.register(
				'confirm', 'paintbrushAdd',
				() => {
					// Check preset type (stroke, fill, etc.)
					const modal		= client.modals.newPreset;
					const type		= modal.inputs.type.getValue().trim();
					// Attempt to define marquee region.
					client.defineLevelMarqueeRegion( type );
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
						case 'fill':
						case 'stroke': {
							// Get user input from modal.
							modal      = client.modals.newPreset;
							const name = modal.inputs.title.getValue().trim();
							// Require fill name input.
							if ( name.length===0 ) {
								alert( 'Invalid name. Brush preset not created.')
								return; // abort
							}
							data.name  = name; // capture object name
							// A floating marquee's tiles are stored in contents.
							const selection =
								marqueeTool.skim('mode')==='floating'
									? marqueeTool.contents
									: region;
							// Copy the selected tiles into the brush preset.
							const matrix = tileset.cloneMatrix( selection.matrix );
							data.region  = { matrix };	// capture region
							break; }
						default: return; // abort
					}
					//--------------------------------
					// Add Curator Object & Finish [object]
					//--------------------------------
					// Play sound-effect to signal.
					client.soundboard.playSound( 'jest_success', 'mp3', 1.1 );
					// Add data [object] to object selector.
					tool.curators.primary.addObject( type, data );
					// Close the modal.
					modal.close();
				});

			// Add an item to curator.
			tool.curators.primary.register(
				'add', subtype,
				( object ) => { // * object - [JestCuratorObject]
					//--------------------------------
					// Add a Fill or Stroke
					//--------------------------------
					// Determine type.
					const type	= object.data.type; // object type
					switch ( type ) {
						case 'fill':
						case 'stroke': {
							// Attempt to get a stamp of the region.
							const stamp		= client.getMatrixStamp( object.data.region.matrix );
							console.log( stamp );
							// Add the [object] matrix's stamp inside its display.
							object.display.addCanvas( 'stamp' );		// add a canvas for drawing
							object.display.render( 'stamp', stamp );	// draw the tile matrix snapshot
							const select	= type==='fill' ? fillSelect : strokeSelect;
							select.addOption( object.data.id, object.data.name );
							break; }
						default: break;
					}
				});

			// Remove an item from curator.
			tool.curators.primary.register(
				'remove', subtype,
				( object ) => { // * object - [JestCuratorObject]
					//--------------------------------
					// Delete a Fill or Stroke
					//--------------------------------
					// Determine type.
					switch ( object.data.type ) {
						case 'fill':
						case 'stroke':
							// Attempt to remove stamp.
							const select	= type==='fill' ? fillSelect : strokeSelect;
							select.removeOption( object.data.id );
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
					const view   = state.levelView;
					const key    = state.levelViewKey;
					//--------------------------------
					// Check If Update Possible
					//--------------------------------
					// Attempt to enable button(s).
					const levelMarquee      = client.toolbox.tools.levelMarquee;
					const levelMarqueeMode  = levelMarquee.skim( 'mode' );
					const paintbrushMode    = tool.skim( 'mode' );
					const paintbrushEnabled = tool.skim( 'enabled' );
					const actionbar         = client.actionbar;
					let toggle              = false; // reusable toggle [bool]
					if ( levelMarquee.skim('enabled')===true ) {
						if ( levelMarqueeMode==='selected' || levelMarqueeMode==='floating' )
							if ( levelMarquee.rects.length===1 ) // perfect rectangle
								actionbar.toggle( 'brushify', true ); // create allowed
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
					const mode		= client.skim( 'mode' );
					if ( mode!=='running' ) return;
					//--------------------------------
					// Check If File Open
					//--------------------------------
					// Check for open view & tool.
					const state		= client.getState(); // get program state
					const view		= state.levelView;
					const key		= state.levelViewKey;
					//--------------------------------
					// Check If Update Possible
					//--------------------------------x
					// Attempt to enable button(s).
					const toolMode	= tool.skim( 'mode' );
					const enabled	= tool.skim( 'enabled' );
					const toolbar	= curator.toolbar;
					const visible	= curator.getVisibleOptions(); // get visible items
					let toggle		= false; // reusable toggle [bool]
					switch ( type ) {
						case 'fill':
						case 'stroke':
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
			// Start Shift-Click Draw
			//-------------------------
			// Register shift-click drawing listener.
			tool.register(
				'startShiftlining', 'showOrigin',
				( e, pos ) => {
					console.log( `Origin: (${pos.x}, ${pos.y})` );
					//-------------------------
					// Reset Draw Log For New Draw
					//-------------------------
					// Reset the drawing buffer.
					tool._undoMap   = new Map();  // fresh log each time
					tool._skipTiles = new Set();  // ← reset skip tiles
					tool.layerId    = null;       // reset target layer id
				});

			//-------------------------
			// Draw a Shift-Click Point-to-Point
			//-------------------------
			// Register shift-click drawing.
			tool.register(
				'drawShiftlining', 'drawLine',
				( e, from, to ) => {
					//--------------------------------
					// Extract Coordinates from Payload
					//--------------------------------
					// Get connected line point(s).
					const points = client.grapher.getLinePoints( from.x, from.y, to.x, to.y );
					//--------------------------------
					// Lay Each Point as a Stamp
					//--------------------------------
					// Iterate each point & atempt to draw.
					for ( const [ lx, ly ] of points )
						// Send the 'draw' event to intercept for drawing.
						tool.emit( 'draw', null, e, { lx, ly }  );
					//--------------------------------
					// Commit Action to Undo Log
					//--------------------------------
					// Log the line drawn for undo/redo.
					client.toolLogPaintbrush();
				});

			//-------------------------
			// Start Drawing Hook(s)
			//-------------------------
			// Initiate draw event.
			tool.register(
				'start', 'startDraw',
				() => {
					// Play drawing sound effect.
					client.soundboard.playSound( 'jest_poke', 'mp3', 1.1 );
					//-------------------------
					// Reset Draw Log For New Draw
					//-------------------------
					// Reset the drawing buffer.
					tool._undoMap   = new Map();  // fresh log each time
					tool._skipTiles = new Set();  // ← reset skip tiles
					tool.layerId    = null;       // reset target layer id
				});

			//-------------------------
			// Motion Tracking Hook(s)
			//-------------------------
			// Initiate swish event (when a large movement is made).
			tool.register(
				'swish', 'swishDraw',
				( e, trackLapse, tracked, pos, distance, swishLapse ) => {
					// Define motion track timeout.
					const trackLapseThreshold	= 400;
					const swishLapseThreshold	= 400;
					const units					= tool.anchor.units;
					// Buffer movement speeds
					if ( trackLapse>=trackLapseThreshold || tracked===0 ) {
						if ( swishLapse / distance <= 20
							 || ( swishLapse>=swishLapseThreshold && distance>=3 ) )
							tool.motionTrack();	// track motion
					}
				});

			// Initiate motion tracking event (when persistent or abrupt motion is made).
			tool.register(
				'motionTracked', 'motionSensitivity',
				() => {
					// Play draw swish sound effect.
					client.soundboard.playSound( 'jest_draw', 'wav', 1.1 );
				});

			// Initiate idle tracking event (pencil down, not moving much).
			tool.register(
				'idle', 'idleDraw',
				() => {
					//console.log( 'idle' );
				});

			//-------------------------
			// Drawing Event(s)
			//-------------------------

			//-------------------------
			// Drawing Matrix Event(s)
			//-------------------------
			tool.register(
				'draw', 'layMatrix',
				( e, pos ) => {
					//--------------------------------
					// Gatekeep Application Status
					//--------------------------------
					// Block if app busy.
					if ( client.busy() ) return;
					// Validate argument(s).
					if ( !pos?.lx ) pos.lx = 0;
					if ( !pos?.ly ) pos.ly = 0;

					//--------------------------------
					// Step Logic
					//--------------------------------
					// Frame‐skip governor.
					stepCount++;
					if ( stepCount<=step ) return;
					stepCount = 0;

					//--------------------------------
					// Obtain User Setting(s)
					//--------------------------------
					// Get user settings.
					const optsPanel = this.sidebar.getSection( subtype );
					const form      = optsPanel.getContents();
					const overlap   = form.getField('overlap').getChecked();
					const fillId    = fillSelect.getValue();	// get selected brush id
					const strokeId  = strokeSelect.getValue();	// get selected value id

					//--------------------------------
					// Access Fill & Stroke Mosaic(s)
					//--------------------------------
					// Retrieve selected fill & stroke mosaic matrices via presets.
					const fillObj   = tool.curators.primary.getObject( fillId );
					const strokeObj = tool.curators.primary.getObject( strokeId );
					if ( !fillObj ) return;
					// Extract raw matrices.
					const fillMatrix   = fillObj.data.region.matrix.map( r => r.slice() );
					const strokeMatrix = strokeObj
					      ? strokeObj.data.region.matrix.map( r => r.slice() )
					      : null;

					//--------------------------------
					// Rotator Logic
					//--------------------------------
					// Periodic rotation of matrix data.
					rotationStep++;
					if ( rotator>0 && rotationStep>=rotator ) {
						//console.log( rotationStep );
						rotateMatrix90( fillMatrix );
						//if ( strokeMatrix ) rotateMatrix90( strokeMatrix );
						rotationStep = 0;
					}

					//--------------------------------
					// Draw Fill & Stroke
					//--------------------------------
					// Stamp the fill and grab this pass’s cells
					const justFilled =
						this.toolLevelDrawMatrix(
							fillMatrix, pos.lx, pos.ly, { overlap }
							);
					// Stamp the stroke perimeters if weight>0.
					if ( strokeMatrix && strokeWeight>0 && justFilled.length>0 )
						this.toolLevelDrawStroke(
							strokeMatrix, fillMatrix, justFilled,
							{
								weight: strokeWeight, overlap, fillMatrix,
								cx: pos.lx, cy: pos.ly
							});
				});

			//-------------------------
			// Stop Drawing Hook(s)
			//-------------------------
			// Log the entire line of tile(s) drawn as one undo/redo action.
			tool.register( 'stop', 'logPaintbrush', ()=>client.toolLogPaintbrush() );

			//--------------------------------
			// Preload Brush(es)
			// NOTE: Loaded after tool plugin events defined.
			//--------------------------------
			// Use secretary to download pre-defined brushes.
			await client.secretary.loadFile( 'json/brushes.json' )
				.catch(
					( err ) => {
						console.warn( `Predefined brushes failed to load: ${err.message}` );
					});
			const record	= client.secretary.getRecord( 'json/brushes.json' );
			tool.curators.primary.importObjects( record ); // import json [objects]

			/*const matrix = [ [0,1,2,3], [4,5,6,7], [8,9,10,11] ];
			console.log( matrix );
			const matrix2 = client.grapher.clone2DArray( matrix );
			console.log( matrix2 );
			const matrix3 = client.grapher.expand2DArray( matrix2, 1, null );
			console.log( matrix3 );
			const matrix4 = client.grapher.fillMatrixPerimeter( matrix3, ['a','b'], 0 );
			console.log( matrix4 );*/

			// --------------------------------
			// Settings Change Listener(s)
			// --------------------------------
			// Create event for when the magnification zoom value changes.
			client.register(
				'levelZoomed', 'paintbrushZoom',
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
		// Extend Tiler with Paintbrush Methods
		//--------------------------------
		extend: function( Klass, proto ) {
			// Stamp a filled matrix of tiles.
			// * matrix – [Array<Array<Object>>] tile data matrix
			// * x,y    – [number] center coord for origin
			// * opts   – [Object] { overlap:[bool], filled:[Set<string>] (optional) }
			proto.toolLevelDrawMatrix = function( matrix, x, y, opts ) {
				//--------------------------------
				// Validate active level & tileset.
				//--------------------------------
				const state = this.getState();
				if ( !state.levelView || !state.tilesetView ) return;

				//--------------------------------
				// Prepare Undo‐Map
				//--------------------------------
				const tool    = this.toolbox.tools[ subtype ];
				const undoMap = tool._undoMap;
				const skipSet = tool._skipTiles ||= new Set(); // track all drawn coords

				//--------------------------------
				// Iterate Matrix Rows & Cols
				//--------------------------------
				const rows    = matrix.length,
					  cols    = matrix[0]?.length ?? 0;
				const limit   = this.config.levelGrid;
				const startX  = x - Math.floor(cols/2);
				const startY  = y - Math.floor(rows/2);

				//--------------------------------
				// Overlap Check Pass
				//--------------------------------
				for ( let i=0; i<rows; i++ ) {
					for ( let j=0; j<cols; j++ ) {
						// Access tile to draw.
						const tile = matrix[i][j];
						if ( !tile ) continue;
						// Get level coordinates.
						const lx   = startX + j;
						const ly   = startY + i;
						// Create undo/redo & logging id.
						const id   = `${lx},${ly}`;
						// Skip empty tiles
						if ( !tile ) continue;
						// Abort draw if overlap is disallowed and destination is filled
						if ( !opts.overlap && skipSet.has(id) ) return [];
						// Abort draw if out-of-bounds
						//if ( lx<0 || ly<0 || lx>=limit || ly>=limit ) return [];
					}
				}

				//--------------------------------
				// Resolve Target Level Layer
				//--------------------------------
				// Acesss active tab level.
				const level   = state.levelView.file.context;
				const layer   = level.getLayer( tool.layerId, true ); // get layer
				if ( !layer || layer.locked ) return false;        // can't find / edit layer
				if ( tool.layerId==null ) tool.layerId = layer.id; // change tool target layer

				//--------------------------------
				// Apply Draw to Level
				//--------------------------------
				const justFilled = []; // collect coordinates this pass

				// Iterate rows & columns & fill tile(s).
				for ( let i=0; i<rows; i++ ) {
					for ( let j=0; j<cols; j++ ) {
						// Access tile to draw.
						const tile = matrix[i][j];   // tile data in region
						if ( !tile ) continue;       // tile data missing
						// Get level coordinates.
						const lx   = startX + j;     // x coordinate on level
						const ly   = startY + i;     // y coordinate on level
						// Abort draw if out-of-bounds
						if ( lx<0 || ly<0 || lx>=limit || ly>=limit ) continue;
						// Create undo/redo & logging id.
						const id   = `${lx},${ly}`;	// tile log id (lx,ly)
						//--------------------------------
						// Draw & log for undo.
						//--------------------------------
						const oldT = layer.cloneTile( lx, ly );
						layer.fillRegion( lx, ly, 1, 1, tile );

						// Store undo log if not yet set.
						if ( !undoMap.has(id) ) {
							undoMap.set(
								id,
								{
								old: { x:lx, y:ly, ...oldT },
								neu: { x:lx, y:ly, ...tile, __source:'fill' }
								});
						}
						else undoMap.get(id).neu = { x:lx, y:ly, ...tile, __source:'fill' };

						// Store filled tile inside filled log.
						justFilled.push( [ lx, ly ] );
						skipSet.add( id );
					}
				}
				return justFilled; // return the fresh fill
			};

			//-------------------------
			// Draw Stroke Around Fill
			//-------------------------
			// Stroke via expand2DArray + fillMatrixPerimeter
			// Draws outer stroke rings around the filled tile region.
			// * strokeMatrix	– [Array<Array<Object>>] stroke tile pattern (each row a ring band)
			// * fillMatrix		– [Array<Array<Object>>] fill tile pattern (inside stroke)
			// * fillCells		– [Array<Array<int>>] list of recently filled [x,y] positions
			// * opts			– [Object] { weight:[int], overlap:[bool], fillMatrix:[2D Array] }
			proto.toolLevelDrawStroke = function( strokeMatrix, fillMatrix, fillCells, opts ) {
				//--------------------------------
				// Prep + State
				//--------------------------------
				const state   = this.getState();
				if (!state.levelView || !state.tilesetView) return;

				//--------------------------------
				// Prepare Undo‐Map
				//--------------------------------
				const tool    = this.toolbox.tools[subtype];
				const undoMap = tool._undoMap ||= new Map();
				const limit   = this.config.levelGrid;
				const skipSet = tool._skipTiles ||= new Set();   // track all drawn coords

				//--------------------------------
				// Resolve Target Level Layer
				//--------------------------------
				// Acesss active tab level.
				const level   = state.levelView.file.context;
				const layer   = level.getLayer( tool.layerId, true ); // get layer
				if ( !layer || layer.locked ) return false;        // can't find / edit layer
				if ( tool.layerId==null ) tool.layerId = layer.id; // change tool target layer

				//--------------------------------
				// Compute Bush Bounds & Fill Matrix
				//--------------------------------
				const xs    = fillCells.map( ([x])=>x ),
				      ys    = fillCells.map( ([_,y])=>y );
				const minX  = Math.min( ...xs ),
				      minY  = Math.min( ...ys );
				// Clone the original fill matrix
				let mat     = this.grapher.clone2DArray( fillMatrix );

				//--------------------------------
				// Build Combined Matrix for strokes
				//--------------------------------
				// Lay each stroke row around the matrix perimeter,
				// tagging each cell with its stroke layer index.
				const rows  = strokeMatrix.length;
				const totalExpansions = rows * opts.weight;
				for ( let layer=0; layer<totalExpansions; layer++ ) {
					// Expand matrix by 1 cell in all directions.
					mat = this.grapher.expand2DArray( mat, 1, null );

					// Select stroke row (bottom-up per pass)
					const rowIndex  = rows - 1 - (layer % rows);
					const rawRow    = strokeMatrix[ rowIndex ];

					// Clone each tile.
					const strokeRow = rawRow.map( tile => tile ? { ...tile, sl: layer } : null );

					// Fill outermost ring with current stroke row
					mat = this.grapher.fillMatrixPerimeter( mat, strokeRow, 0 );
				}

				//--------------------------------
				// Determine Matrix Dimension(s)
				//--------------------------------
				// Get Width x Height (rows/cols count) or NxM of matrix.
				const h = mat.length,
				      w = mat[0]?.length ?? 0;

				//--------------------------------
				// Distance Conflict Check Setup
				//--------------------------------
				// Store closest distances for each [gx,gy] tile already filled
				const stampedDistMap = new Map(); // key = id, value = distance to center
				const centerX  = Math.floor( w/2 );
				const centerY  = Math.floor( h/2 );

				//--------------------------------
				// Stamp Final Matrix to Level
				//--------------------------------
				// Align top-left of matrix.
				//const originX	= minX - totalExpansions;
				//const originY	= minY - totalExpansions;
				const originX  = minX - Math.floor( (w-(fillMatrix[0]?.length??0)) / 2 );
				const originY  = minY - Math.floor( (h-(fillMatrix.length)) / 2 );

				// Iterate each cell in the matrix to lay tile(s).
				for ( let ry=0; ry<h; ry++ ) {
					for ( let cx=0; cx<w; cx++ ) {
						const tile = mat[ry][cx];
						if ( !tile ) continue; // skip nulls

						const gx   = originX + cx;
						const gy   = originY + ry;
						const id   = `${gx},${gy}`;

						// Bounds check
						if ( gx<0 || gy<0 || gx>=limit || gy>=limit ) continue;
						// Skip fill area
						if ( fillCells.some( ([fx,fy])=>fx===gx && fy===gy) ) continue;
						// Skip all filled areas.
						if ( /*!opts.overlap &&*/ skipSet.has(id) ) continue;

						// Check if this tile was already written by an inner stroke layer
						const tileLayer = tile.sl ?? Infinity;
						const existing = undoMap.get( id );
						if ( existing && existing.neu?.__source==='stroke' ) {
							const existingLayer = existing.neu.sl ?? Infinity;
							if ( existingLayer<=tileLayer ) continue; // inner layer wins
						}

						//--------------------------------
						// Distance Conflict Check
						//--------------------------------
						// Compute distance from center of mat
						/*const dist   = Math.abs(cx-centerX) + Math.abs(ry-centerY);
						const existing = stampedDistMap.get(id);
						// Skip if a tile closer to the center already drawn.
						if ( existing!==undefined && existing<=dist ) continue;*/

						// Overlap check (only skip if not allowed).
						//if ( !opts.overlap && undoMap.has(id) ) continue;

						//-------------------------
						// Stamp & log
						//-------------------------
						const oldT  = layer.cloneTile( gx, gy );
						layer.fillRegion( gx, gy, 1, 1, tile );

						// Write or overwrite the undoMap entry with "sl" (stroke layer).
						const neu   = { x:gx, y:gy, ...tile, __source:'stroke', sl: tileLayer };
						if ( !undoMap.has(id) ) {
							undoMap.set(
								id,
								{
								old : { x:gx, y:gy, ...oldT },
								neu : neu
								});
						}
						else undoMap.get(id).neu = neu;

						// Record this tile's distance.
						//stampedDistMap.set( id, dist );
					}
				}
			};

			// Commit all logged matrix stamps to governor.
			proto.toolLogPaintbrush = function() {
				//--------------------------------
				// Gather state & undo entries.
				//--------------------------------
				// Check for app state, level-view & data.
				const state   = this.getState(),
					  view    = state.levelView,
					  key     = state.levelView.skey;
				const tool    = this.toolbox.tools[ subtype ],
					  undoMap = tool._undoMap ?? new Map();

				//--------------------------------
				// Build old/new arrays.
				//--------------------------------
				const oldArr  = [],
					  newArr  = [];
				for ( const [_, pair] of undoMap.entries() ) {
					oldArr.push( pair.old );
					newArr.push( pair.neu );
				}
				if ( oldArr.length===0 ) return false; // fail

				//--------------------------------
				// Submit to governor & reset.
				//--------------------------------
				// Create log for undo/redo.
				const log	= {
					action  : 'sparseRegion',
					layerId : tool.layerId,
					old     : oldArr,
					neu     : newArr
					};
				// Label the action for history panel.
				view.governor.enqueue( 'edit', { history: `Paint tiles.` } );
				// Log change(s) instead open level view's governor.
				view.governor.log( 'edit', log );

				//--------------------------------
				// Clear Undo State
				//--------------------------------
				// Reset undo map & target layer id.
				tool._undoMap = new Map();  // reset for next stroke
				tool.layerId  = null;       // reset target layer id
				return true; // success
			};
		}
	};

	// Register plugin into Jest
	if ( window.JestTiler?.use )
		window.JestTiler.use( type, plugin );
	else console.error( 'paintbrush.plugin.js load error: JestTiler.use() not found' );
})( window );
