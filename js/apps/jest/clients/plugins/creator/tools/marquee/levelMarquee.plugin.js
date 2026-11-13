//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/tools/marquee/levelMarquee.plugin.js loaded' );

// Level Marquee plugin.
(function( window ) {
	//-------------------------
	// Setup Form Function(s)
	//-------------------------
	// Generate a warp region text-field editor "form" inside the curator.
	const createEditWarpForm	= function( client, tool ) {
		// Block action if app is busy.
		//if ( client.busy() ) return; // app busy‐gate
		//--------------------------------
		// Create Data Form (for warp info)
		//--------------------------------
		// Create DOM Panel element [object].
		const form		= new JestForm( client );
		form.build(); // build the form
		// Create fields.
		const fields	= {
			x	 : 'Warp X Coordinate',
			y	 : 'Warp Y Coordinate', /*w:'width', h:'height',*/
			level : 'Destination Level',
			dx	: 'Destination X',
			dy	: 'Destination Y'
			};
		for ( const key in fields ) { // iterate & create
			// Create input [object]
			const input	= new JestInputText( client, key, null, null, fields[key] );
			input.build( `input-${key}` );	// build field
			input.panel.addAttribute( 'data-tooltip', fields[key] );
			form.addField( key, input );	// add field to form
		}
		//--------------------------------
		// Manually Modify Some Field(s)
		//--------------------------------
		// Disable some fields.
		form.fields.x.setReadonly(); // read-only
		form.fields.y.setReadonly(); // read-only
		// Return the generated panel form.
		return form; // return form [object]
	};

	// Generate a sign region text-field editor "form" inside the curator.
	const createEditSignForm	= function( client, tool ) {
		// Block action if app is busy.
		//if ( client.busy() ) return; // app busy‐gate
		//--------------------------------
		// Create Data Form (for warp info)
		//--------------------------------
		// Create DOM Panel element [object].
		const form		= new JestForm( client );
		form.build(); // build the form
		// Create fields.
		const fields	= {
			x	 : 'Sign X Coordinate',
			y	 : 'Sign Y Coordinate',
			name  : 'Sign Name' /*w:'width', h:'height',*/
			};
		for ( const key in fields ) { // iterate & create
			// Create input [object]
			const input	= new JestInputText( client, key, null, null, fields[key] );
			input.build( `input-${key}` );	// build field
			input.panel.addAttribute( 'data-tooltip', fields[key] );
			form.addField( key, input );	// add field to form
		}
		//--------------------------------
		// Manually Modify Some Field(s)
		//--------------------------------
		// Disable some fields.
		form.fields.x.setReadonly(); // read-only
		form.fields.y.setReadonly(); // read-only
		//--------------------------------
		// Manually Create Some Field(s)
		//--------------------------------
		// Create dialog text-area input [object]
		const input2	= new JestInputTextarea( client, 'dialog', null, null, 'dialog', 3 );
		input2.build( `input-dialog` );		// build field
		input2.panel.addAttribute( 'data-tooltip', 'Sign Dialogue' );
		form.addField( 'dialog', input2 );	// add field to form
		// Return the generated panel form.
		return form; // return form [object]
	};

	// Define the plugin [object]
	var type	= 'tools';
	var subtype	= 'levelMarquee';
	var plugin	= {
		//--------------------------------
		// Plug Tool Into Tiler Application
		//--------------------------------
		init: async function( client ) {
			//-------------------------
			// Access Necessary Surface(s)
			//-------------------------
			// Grab the workspace for drawing on the editing area.
			const workspace = client.gameboard.display.getCanvas( 'workspace' );
			// Grab the sketchpad for off-screen drawing & rendering.
			const sketchpad = client.gameboard.display.getCanvas( 'sketchpad' );

			// --------------------------------
			// Create Marquee Tool [object]
			// --------------------------------
			// Add a marquee tool to the level canvas board.
			const tool      = new JestToolMarquee( client, subtype );
			client.toolbox.registerTool( subtype, tool );
			tool.build(); // build the tool

			// Match the marquee anchor to native level tile pixels.
			const canvas    = client.gameboard.display.getCanvas( 'workspace' );
			tool.setTarget( canvas ); // set target

			// Simultaneous tools allowed:
			tool.coopt( ['tiledrop'] );

			// Hold-key mapping.
			tool.holdkey( 'Alt', 'eyedropper' );

			//--------------------------------
			// Handle Tool Block Check
			//--------------------------------
			// Determine whether the tool can edit the active layer.
			tool.register(
				'blockCheck', 'marqueeBlocking',
				status => {
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
			// Record Pre-Layer Changes
			//--------------------------------
			// Handle pending event changes to a layer.
			// Layer is about to change visibility.
			client.register(
				'levelLayerPrevisibilityChange', 'layerChanging',
				( changedLayer, pendingCheckedState ) => {
					// Auto-drop the marquee selection.
					if ( pendingCheckedState===false  ) // hide layer
						tool.reset(); // cancel marquee
				});
			// Layer is about to change lock state.
			client.register(
				'levelLayerPrelockChange', 'layerChanging',
				( changedLayer, pendingCheckedState ) => {
					// Auto-drop the marquee selection.
					if ( pendingCheckedState===true  ) // lock layer
						tool.reset(); // cancel marquee
				});

			//--------------------------------
			// Object Selector Panel
			//--------------------------------
			// Create tool curator.
			tool.addCurator( 'primary' );
			const curator = tool.curators.primary; // shorthand

			// Register a marquee history handler for complex
			// marquee state & manipulation undo/redo logging.
			const marqueeMemory = new Map();

			// Add curator item type(s).
			curator.registerType( 'mosaic' );

			// Register the select event to refit the menu to match contents.
			curator.register(
				'displayed', 'curator', ()=>client.sidebar.refit('marquee') );
			//client.sidebar.panel.addPanel( 'objSelect', curator.panel );

			// Add the curator panel to the sidebar.
			client.sidebar.addSection( 'marquee', 'Marquee', curator );

			// --------------------------------
			// Settings Change Listener(s)
			// --------------------------------
			// Create event for when the magnification zoom value changes.
			client.register(
				'levelZoomed', 'levelMarqueeZoom',
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

			// --------------------------------
			// Refresh & Remmber Settings Between Tab Change
			// --------------------------------
			client.tabbarFile.register(
				'pretabChange', 'levelMarqueeRemember',
				() => {
					// Get current file status.
					const s = client.getFileStatus( tool, true );
					if ( !s ) return; // no file state

					// Remember curator dropdown.
					curator.rememberSelection( s.fileKey );
					marqueeMemory.set( s.fileKey, tool.getSelectionState() );
				});

			// Create event for when tab is changed, to switch file.
			client.tabbarFile.register(
				'tabChange', 'levelMarqueeRefresh',
				view => {
					// --------------------------------
					// Get Current File State
					// --------------------------------
					// Get current file status.
					const s = client.getFileStatus( tool, true );

					// --------------------------------
					// Reload Dropdown(s)
					// --------------------------------
					curator.flushVisibleCache();   // flush cache
					curator.refreshOptions();      // refresh list

					// --------------------------------
					// Save / Restore Tab Selection(s)
					// --------------------------------
					// Remember curator dropdown.
					if ( !s ) return tool.restoreSelectionState();

					// --------------------------------
					// Restore Marquee Selection
					// --------------------------------
					// Restore curator dropdown.
					curator.restoreSelection( s.fileKey );
					// Restore the tab's contextual marquee state.
					tool.restoreSelectionState( marqueeMemory.get(s.fileKey) ?? null );
				});

			//--------------------------------
			// Create Curator Button(s)
			//--------------------------------
			// Add toolbar buttons for curator action(s).
			curator.toolbar.createButton( { name: 'insert', text: 'Insert' } );
			curator.toolbar.buttons.insert.register(
				'click', 'insert-object', ()=>curator.emit('btnInsert') );
			curator.toolbar.createButton( { name: 'create', text: 'Create' } );
			curator.toolbar.buttons.create.register(
				'click', 'create-object', ()=>curator.emit('btnCreate') );
			curator.toolbar.createButton( { name: 'apply', text: 'Apply' } );
			curator.toolbar.buttons.apply.register(
				'click', 'apply-object', ()=>curator.emit('btnApply') );
			curator.toolbar.createButton( { name: 'remove', text: 'Remove' } );
			curator.toolbar.buttons.remove.register( 'click', 'remove-object',
				() => {
					// Get selected ID and corresponding object
					const id     = curator.selectBox.getValue();
					const object = curator.objects[id];
					if ( confirm(`Are you sure you want to remove item "${object.data.name}"?`) )
						curator.removeObject( id );
				});

			//-------------------------
			// Toolbar Functionality
			//-------------------------
			// Add "selector" tool (levelMarquee) button to toolbar.
			const button = client.toolbar.createButton( { name: subtype, text:  null /*'Marquee'*/ } );
			button.clicker.addAttribute( 'data-tooltip', 'Marquee' );
			button.clicker.addAttribute( 'data-tooltip-keys', 'M' );
			button.clicker.addElements([
				//-----------------------------
				// Icon Marquee
				//-----------------------------
				{
					name       : 'icon',
					tag        : 'svg',
					attributes :
						{
							xmlns   : "http://www.w3.org/2000/svg",
							viewBox : "0 0 1200 1200",
							width   : "24",
							height  : "24",
							"aria-hidden": "true"
						},
					classes    : [ 'ico-marquee' ],
					elements   :
						[
							{
								name       : 'path',
								tag        : 'path',
								attributes :
									{
										'd': 'm225 374.11c-42.422-6.0469-75-42.516-75-86.625v-49.969c0-48.328 39.188-87.516 87.516-87.516h49.969c44.109 0 80.578 32.578 86.625 75h451.78c6.0469-42.422 42.516-75 86.625-75h49.969c48.328 0 87.516 39.188 87.516 87.516v49.969c0 44.109-32.578 80.578-75 86.625v451.78c42.422 6.0469 75 42.516 75 86.625v49.969c0 48.328-39.188 87.516-87.516 87.516h-49.969c-44.109 0-80.578-32.578-86.625-75h-451.78c-6.0469 42.422-42.516 75-86.625 75h-49.969c-48.328 0-87.516-39.188-87.516-87.516v-49.969c0-44.109 32.578-80.578 75-86.625zm149.11-74.109c-5.4844 38.344-35.766 68.625-74.109 74.109v451.78c38.344 5.4844 68.625 35.766 74.109 74.109h451.78c5.4844-38.344 35.766-68.625 74.109-74.109v-451.78c-38.344-5.4844-68.625-35.766-74.109-74.109z',
										'fill-rule': 'evenodd'
									}
							}
						]
				}]);

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
						client.sidebar.enableSection( 'marquee' );
						// Activate the menu button
						client.toolbar.buttons[name].activate();	// toggle button on
					}
				});

			// Define keyboard shortcut.
			client.io.registerShortcut( 'M', subtype );
			// Keyboard shortcut menu action.
			client.io.register( 'keyboardShortcut', 'levelMarqueeCommand',
				command => {
					// Block input shortcuts while user is typing
					if ( client.io.isTypingInInput() ) return;
					// Affirm shortcut command is for "draw" tool.
					if ( command===subtype )
						client.toolbox.setTool( subtype );
				});

			//-------------------------
			// Options Keyboard Command(s)
			//-------------------------
			// Register "Ctrl+D" deselect keyboard shortcut.
			client.io.registerShortcut( 'Ctrl+D', 'deselect' );
			// Keyboard shortcut for marquee actions.
			client.io.register(
				'keyboardShortcut', 'levelMarqueeShortcut',
				command => {
					//--------------------------------
					// Require Pencil Availability
					//--------------------------------
					// Skip if user is typing
					if ( client.io.isTypingInInput() ) return;
					// Check if active tool is "levelMarquee"
					if ( !tool.enabled() ) return;
					// Validate accepted commands.
					if ( !['deselect'].includes(command) )
						return; // unrecognized command
					//--------------------------------
					// Handle Command(s)
					//--------------------------------
					// Check level-marquee tool mode.
					const mode	= tool.skim( 'mode' );
					// Apply logic
					if ( command==='deselect' ) { // deselect marquee
						// Drop the marquee if it selected or floating.
						if ( mode==='floating' )
							tool.reset(); // full drop marquee
						else if ( mode==='selected' )
							tool.reset( false ); // safe deselect
					}
				});

			// --------------------------------
			// Create Modal(s)
			// --------------------------------
			// Generate the "sign" region modal.
			client.addModal(
				'newSign',
				{
					title   :	'New Sign',
					text	:	'Enter sign dialogue:',
					inputs  :
						[
						{ name: 'name', placeholder: 'e.g. Cathedral Plaque', label: 'name' },
						{ name: 'dialog', type: 'textarea', placeholder: 'Write something...' }
						],
					buttons : {
						cancel : {
							label   :	'Cancel',
							onClick :
								() => {
									// Log the event in console.
									console.log( 'User canceled.' );
									// Play sound-effect signal.
									client.soundboard.playSound( 'jest_close0', 'mp3', 1.05 );
									// Emit cancel event.
									client.modals.newSign.emit( 'cancel', null );
									// Close the modal.
									client.modals.newSign.close();
								}
						},
						confirm: {
							label   :	'Confirm',
							onClick :
								() => {
									// Get curated object type.
									const modal	= client.modals.newSign;
									modal.emit( 'confirm', null, modal.payload );
								}
						}
					}
				});

			// Generate the "warp" region modal.
			client.addModal(
				'newWarp',
				{
					title   :	'New Warp',
					text	:	'Enter target coordinates:',
					inputs  :
						[
						{ name: 'level', placeholder: 'e.g. house1.nw', label: 'level' },
						{ name: 'dx', placeholder: 'X', label: 'X Coord' },
						{ name: 'dy', placeholder: 'Y', label: 'Y Coord' }
						],
					buttons : {
						cancel : {
							label   :	'Cancel',
							onClick :
								() => {
									// Log the event in console.
									console.log( 'User canceled.' );
									// Play sound-effect signal.
									client.soundboard.playSound( 'jest_close0', 'mp3', 1.05 );
									// Emit cancel event.
									client.modals.newWarp.emit( 'cancel', null );
									// Close the modal.
									client.modals.newWarp.close();
								}
						},
						confirm : {
							label   :	'Confirm',
							onClick :
								() => {
									// Get curated object type.
									const modal	= client.modals.newWarp;
									modal.emit( 'confirm', null, modal.payload );
								}
						}
					}
				});

			// Generate the tilemap modal.
			client.addModal(
				'newMosaic',
				{
					title   :	'Create Mosaic',
					text	:	'Name your reusable tilemap region:',
					inputs  :
						[
						{ name: 'title', placeholder: 'e.g. Castle Corner', label: 'name' }
						],
					buttons : {
						cancel : {
							label   :	'Cancel',
							onClick :
								() => {
									// Log the event in console.
									console.log( 'User canceled.' );
									// Play sound-effect signal.
									client.soundboard.playSound( 'jest_close0', 'mp3', 1.05 );
									// Emit cancel event.
									client.modals.newMosaic.emit( 'cancel', null );
									// Close the modal.
									client.modals.newMosaic.close();
								}
						},
						confirm : {
							label   :	'Confirm',
							onClick :
								() => {
									// Get curated object type.
									const modal	= client.modals.newMosaic;
									modal.emit( 'confirm', null, modal.payload );
								}
						}
					}
				});

			// Wire all modal(s) to reset inputs when opening.
			client.modals.newSign.register(
				'preopen', 'reset', e=>client.modals.newSign.resetInputs() );
			client.modals.newWarp.register(
				'preopen', 'reset', e=>client.modals.newWarp.resetInputs() );
			client.modals.newMosaic.register(
				'preopen', 'reset', e=>client.modals.newMosaic.resetInputs() );

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
					switch ( type ) {
						case 'mosaic': {
							// Get user input from modal.
							modal			= client.modals.newMosaic;
							const name		= modal.inputs.title.getValue().trim();
							/*if ( name.length===0 ) {
								alert( 'Invalid name. Object not added.')
								return;
							}*/
							data.name		= name;				// capture object name
							// Clone the marquee selected matrix & store in data.
							const matrix	= tileset.cloneMatrix( region.matrix );
							data.region		= { matrix };		// capture region
							break; }
						case 'warp': {
							// Store coordinates of marquee region in data.
							data.x			= region.x;			// assign region x
							data.y			= region.y;			// assign region y
							// Get location & coordinates of warp-to region from user input in the modal.
							modal			= client.modals.newWarp;
							const level		= modal.inputs.level.getValue().trim();
							const dx		= modal.inputs.dx.getValue().trim();
							const dy		= modal.inputs.dy.getValue().trim();
							// Ensure dx & dy are numbers.
							/*if ( !client.isNumber(dx) ) dx = 0;
							if ( !client.isNumber(dy) ) dy = 0;*/
							// Assign the input to the data.
							data.name		= level;			// use level filename as dropdown label
							data.level		= level;			// assign level filename
							data.dx			= dx;				// assign warp-to x
							data.dy			= dy;				// assign warp-to y
							data.file		= levelView.file.skey; // reference file system key
							// Log undo/redo action.
							const log		= {
								action : 'warpAdd',
								type   : 'warp',
								id	 : data.id,
								object : structuredClone( data )
							};
							// Label the action for history panel.
							levelView.governor.enqueue(
								'edit', { history: `Add ${type} region.` } );
							// Log inside governor.
							levelView.governor.log( 'edit', log );
							levelView.file.jot( "changed", true );
							break; }
						case 'sign': {
							// Store coordinates of marquee region in data.
							data.x			= region.x;			// assign region x
							data.y			= region.y;			// assign region y
							// Get dialog from user input in the modal.
							modal			= client.modals.newSign;
							const name		= modal.inputs.name.getValue().trim();
							const dialog	= modal.inputs.dialog.getValue().trim();
							// Assign the input to the data.
							data.name		= name;				// sign name
							data.dialog		= dialog;			// access sign dialogue
							data.file		= levelView.file.skey; // reference file system key
							// Log undo/redo action.
							const log		= {
								action : 'signAdd',
								type   : 'sign',
								id	 : data.id,
								object : structuredClone( data )
								};
							// Label the action for history panel.
							levelView.governor.enqueue(
								'edit', { history: `Add ${type} region.` } );
							// Log inside governor.
							levelView.governor.log( 'edit', log );
							levelView.file.jot( "changed", true );
							break; }
						default: return; // unknown
					}
					//--------------------------------
					// Add Object & Finish [object]
					//--------------------------------
					// Play sound-effect to signal.
					client.soundboard.playSound( 'jest_success', 'mp3', 1.1 );
					// Add data [object] to object selector.
					curator.addObject( type, data );
					// Close the modal.
					modal.close();
				});

			//-------------------------
			// File Menu Functionality
			//-------------------------
			// Register copy/delete button enabling.
			client.register(
				'update', subtype,
				( e, state, enabled, mode ) => {
					// Block action if app is busy.
					if ( client.busy() ) return; // app busy‐gate
					//--------------------------------
					// Check If Update Possible
					//--------------------------------
					// Only if client is running.
					if ( mode!=='running' ) return;
					// Ignore menu updates when this tool is inactive.
					if ( !tool.enabled() ) return;
					// Attempt to enable copy/delete buttons.
					const toolMode	= tool.skim( 'mode' );
					if ( toolMode==='selected' || toolMode==='floating' ) {
						client.filemenu.toggle( 'copy', true );		// copy is allowed
						client.filemenu.toggle( 'cut', true );		// cut is allowed
						client.filemenu.toggle( 'delete', true );	// delete is allowed
					}
				});

			//-------------------------
			// Curator Update Functionality
			//-------------------------
			client.statusbar.register(
				'parsed', 'levelMarqueeSelecting',
				( message ) => {
					// Block action if app is busy.
					if ( client.busy() ) return; // app busy‐gate
					//--------------------------------
					// Check If Update Possible
					//--------------------------------
					// Only if client is running.
					const mode	= client.skim( 'mode' );
					if ( mode!=='running' ) return;
					//--------------------------------
					// Check If Selection Made
					//--------------------------------
					// Determine if tool is enabled.
					if ( !tool.skim('enabled') ) return; // inactive
					// Only parse status if mode is selected
					const toolMode	= tool.skim( 'mode' );
					if ( ['selecting','selected','floating','dragging'].includes(toolMode) ) {
						const bounds	= tool.getBounds();
						// Draw marquee rectangle.
						if ( bounds!==null && bounds.w>0 && bounds.h>0 ) {
							// Grab bounds.
							const { x, y, w, h } = bounds;
							const units	= tool.anchor.units;
							let parsed	= message;
							if ( message!=='' ) parsed += `  →  `;
							parsed += `<strong>marquee</strong> (${x/units},${y/units})`;
							parsed += `  →  <strong>selection</strong> ${w/units} x ${h/units}`;
							client.statusbar.jot( 'parsed', parsed ); // update statusbar
						}
					}
				});

			//-------------------------
			// Toolbox Event(s)
			//-------------------------
			// Register tool pre-wield event.
			/*tool.register(
				'prewield', 'allowSubtractSelect',
				( name ) => {
					// Check if attempting to hold-key wield the eyedropper.
					if ( name==="eyedropper" ) {
						// Get tool's active mode.
						const mode	= tool.skim( 'mode' );
						// Intercept the Opt/Alt hold-key event.
						// NOTE: Allows subtracting selectio using Opt/Alt.
						if ( mode==='selecting' )
							client.toolbox.jot( 'wielding', false );
					}
				});*/

			//-------------------------
			// Curator Update Functionality
			//-------------------------
			// Curator ticker "update" hook (for enabling/disabling buttons).
			curator.register(
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
					// Get curator object item information.
					const form		= object ? object.display.target : null;
					const data		= object ? object.data : null;
					// Check to toggle various button(s).
					let toggle		= false; // reusable toggle [bool]
					switch ( type ) {
						case 'mosaic':
							// Buttons only available if a file is open.
							if ( view!==null ) {
								// Create mosaic is allowed if selection made.
								if ( toolMode==='selected' || toolMode==='floating' )
									if ( tool.rects.length===1 ) // only 1 rect
										toolbar.toggle( 'create', true ); // create allowed
								// Handle insert button.
								toolbar.toggle( 'insert', true /*enabled*/ ); // insert allowed
							}
							// Require an item to be selected for remove to be valid.
							if ( visible.length>0 )
								toolbar.toggle( 'remove', true );
							break;
						case 'sign':
						case 'warp':
							// Buttons only available if a file is open.
							if ( view!==null ) {
								// Create warp is allowed if selection made.
								if ( toolMode==='selected' || toolMode==='floating' )
									if ( tool.rects.length===1 ) // only 1 rect
										toolbar.toggle( 'create', true ); // create allowed
								// Handle save button allowed if item selected.
								if ( visible.length>0 ) {
									toggle			= false; // cannot save (until checks)
									// Iterate all fields & toggle if changed.
									let compare;
									if ( type==='warp' )
										compare	= {
											dx: 'dx', dy: 'dy', level: 'level'
											};
									else if ( type==='sign' )
										compare	= {
											name: 'name', dialog: 'dialog'
											};
									// Compare live fields to saved data.
									// Toggle "apply" button if fields changed.
									if ( form && form.checkFieldInput(data,compare) )
										toolbar.toggle( 'apply', true );
								}
								// Require an item to be selected for remove to be valid.
								if ( visible.length>0 )
									toolbar.toggle( 'remove', true );
							}
							break;
						default: break;
					}
				});

			//-------------------------
			// Copy/Paste & Delete Functionality
			//-------------------------
			// Register marquee copy event.
			client.register(
				'copy', subtype,
				() => {
					//--------------------------------
					// Check If Copy Possible
					//--------------------------------
					// Block unavailable application states.
					if ( client.busy() ) return;
					if ( client.skim('mode')!=='running' ) return;
					//--------------------------------
					// Attempt to Copy
					//--------------------------------
					// Attempt to copy various copiable selection(s).
					client.copyLevelMarquee( tool ); // marquee level section
				});

			// Register marquee paste event.
			client.register(
				'paste', subtype,
				( snapshot ) => {
					// Only handle marquee clipboard data.
					if ( snapshot?.action!=='levelMarquee' ) return;
					//--------------------------------
					// Check If Paste Possible
					//--------------------------------
					// Block unavailable application states.
					if ( client.busy() ) return;
					if ( client.skim('mode')!=='running' ) return;
					//--------------------------------
					// Validate Marquee Availability
					//--------------------------------
					// Explain why the paste operation is blocked.
					if ( client.alertToolBlocked(tool,'paste the marquee selection') )
						return; // block action
					//--------------------------------
					// Attempt to Paste
					//--------------------------------
					// Attempt to paste a marquee.
					client.pasteLevelMarquee( tool, snapshot );
				});

			// Register event to delete an active selection.
			client.register(
				'delete', subtype,
				() => {
					//--------------------------------
					// Check If Delete Possible
					//--------------------------------
					// Block unavailable application states.
					if ( client.busy() ) return;
					if ( client.skim('mode')!=='running' ) return;
					//--------------------------------
					// Validate Marquee Availability
					//--------------------------------
					// Explain why the delete operation is blocked.
					if ( client.alertToolBlocked(tool,'delete the marquee selection') )
						return; // block action
					//--------------------------------
					// Attempt to Delete
					//--------------------------------
					// Attempt to delete a marquee.
					client.deleteLevelMarquee( tool );
				});

			//-------------------------
			// Level Selection Hook(s)
			//-------------------------
			// Register event listener callback(s).
			tool.register(
				['selecting','selected','floated'], 'divertHoldkey',
				// Divert hold-key mapping.
				() => {
					//console.log('diverting');
					tool.holdkey( 'Alt', null );
				});

			// Register marquee selection callback for undo/redo.
			tool.register(
				'selected', 'marqueeHistorySelect',
				() => {
					// Capture before & after marquee state.
					const before = tool.lastState;
					const after  = tool.getSelectionState();
					// Record new marquee selection history.
					client.recordMarqueeHistory(
						'marqueeSelect',
						before, after,
						'Select marquee.'
						);
				});

			// Register marquee move callback for undo/redo.
			tool.register(
				'moved', 'marqueeHistoryMove',
				() => {
					// Record the marquee history.
					client.recordMarqueeHistory(
						'marqueeMove', tool.lastState,
						tool.getSelectionState(),
						'Move marquee.'
						);
				});

			// Record each completed handle drag as one marquee history action.
			tool.register(
				'transformed', 'marqueeHistoryTransform',
				( marquee ) => {
					client.recordMarqueeHistory(
						'marqueeMove', marquee.lastState,
						marquee.getSelectionState(),
						'Transform marquee.'
						);
				});

			// Register marquee deselect callback for undo/redo.
			tool.register(
				'selectionCleared', 'marqueeHistoryDeselect',
				before => {
					// Attempt to get current selection state.
					const after = tool.getSelectionState();
					client.recordMarqueeHistory(
						'marqueeDeselect',
						before, after,
						'Deselect marquee.'
						);
				});

			//--------------------------------
			// Subtract Empty Level Tiles
			//--------------------------------
			// Refine a completed manual marquee selection into tiles.
			// The finalized mask will be captured by the history event.
			tool.register(
				'maskFinalized', 'subtractEmptyTiles',
				marquee => {
					//--------------------------------
					// Resolve Original Selection Layer
					//--------------------------------
					// Use the layer the selection belongs to.
					// Never sample the composite or underlying layers.
					const level = client.getState().levelView?.file?.context;
					const layer = level?.getLayer( marquee.layerId );

					// Require a valid level layer, selection mask and origin.
					if ( !layer || !Array.isArray(marquee.mask) || !marquee.bounds )
						return;

					//--------------------------------
					// Subtract Empty Cells
					//--------------------------------
					// Each mask cell corresponds to one tile on the source layer.
					// Keep already-subtracted cells unchanged.
					const mask = marquee.mask;
					const { x, y } = marquee.bounds;

					for ( let my=0; my<mask.length; my++ ) {
						for ( let mx=0; mx<mask[my].length; mx++ ) {
							// A manually excluded cell must stay excluded.
							if ( !mask[my][mx] ) continue; // skip

							// Determine the tile's absolute level coordinates.
							const lx = x + mx;
							const ly = y + my;

							// Null means this level layer has no tile here.
							// Subtract that cell from the marquee.
							if ( layer.getTile(lx,ly)==null )
								mask[my][mx] = false;
						}
					}

					//--------------------------------
					// Tighten Bounds Around Included Tiles
					//--------------------------------
					// Find the outermost included cells in the refined mask.
					let minX = mask[0]?.length ?? 0;
					let minY = mask.length;
					let maxX = -1;
					let maxY = -1;

					for ( let my=0; my<mask.length; my++ ) {
						for ( let mx=0; mx<mask[my].length; mx++ ) {
							if ( !mask[my][mx] ) continue; // skip empty or excluded tile
							minX = Math.min( minX, mx );
							minY = Math.min( minY, my );
							maxX = Math.max( maxX, mx );
							maxY = Math.max( maxY, my );
						}
					}

					// Leave an empty mask for endDrawSelection() to reject.
					if ( maxX<minX || maxY<minY ) return; // abort

					//--------------------------------
					// Crop Mask and Move Its Origin
					//--------------------------------
					// Preserve interior holes while removing empty outer rows and columns.
					marquee.mask =
						mask.slice( minY, maxY+1 )
							.map( row => row.slice(minX,maxX+1) );

					// Keep the cropped mask aligned with its original level position.
					marquee.bounds = {
						x : x + minX,
						y : y + minY,
						w : maxX - minX + 1,
						h : maxY - minY + 1
						};
				});

			//-------------------------
			// Begin Marquee Selection
			//-------------------------
			// Register marquee pen-down selection start.
			tool.register(
				'pendown', 'levelMarqueeSelectionStart',
				( status ) => {
					//--------------------------------
					// Set Tool Target Layer
					//--------------------------------
					// Access the current level.
					const level = client.getState().levelView?.file?.context;
					// Check if the selection is empty. If so, begin.
					if ( tool.layerId===null )
						tool.layerId = level?.getActiveLayer()?.id ?? null;
				});

			// Revert hold-key to eyedropper.
			tool.register(
				['deselected','reset','canceled'], 'revertHoldkey',
				// Revert hold-key mapping.
				() => {
					// Allow Opt+Click Eyedropper if no marquee drawn.
					// NOTE: If marquee is drawn, Opt+Click = subtract.
					tool.holdkey( 'Alt', 'eyedropper' );
				});

			// Register event listener callback(s).
			tool.register(
				'floated', 'grabMatrix',
				( tool ) => {
					// Play sound-effect to signal.
					client.soundboard.playSound( 'jest_float', 'wav', 1.02 );
					// Copy matrix region & clear underneath.
					client.toolLevelMarqueeFloat( tool );
					// A subsequent drag starts from the already-floated state.
					tool.lastState = tool.getSelectionState();
				});

			tool.register(
				'dropped', 'dropMatrix',
				( tool ) => {
					// Play sound-effect to signal.
					client.soundboard.playSound( 'jest_unfloat', 'wav', 1.01 );
					// Lay tile matrix onto level surface.
					client.toolLevelMarqueeDropRegion( tool );
				});

			// Rebuild the floating canvas whenever a transform preview changes.
			tool.register(
				'transformPreview', 'refreshTransformStamp',
				( marquee ) => {
					// The current tileset creates the canvas used by the draw hook.
					const tileset = client.getState().tilesetView?.file?.context;
					if ( !tileset || !marquee.contents?.matrix )
						return; // abort

					// Rebuild from the preview matrix, which was resampled from
					// the immutable source matrix by the tool.
					marquee.contents.stamp =
						tileset.createStamp( marquee.contents.matrix );
				});

			// Register event listener callback(s).
			tool.register(
				'duplicate', 'dupeMatrix',
				( tool ) => {
					// Play sound-effect to signal.
					client.soundboard.playSound( 'jest_dupe', 'wav', 1.02 );
					// Drop the region first.
					client.toolLevelMarqueeDropRegion( tool );
					//// Copy matrix region & clear underneath.
					//client.toolLevelMarqueeFloat( tool );
				});

			//-------------------------
			// Predefined Objects Hook(s)
			//-------------------------
			// Create a curated object type known as "warp" (for selection warp-to zones).
			curator.registerType( 'warp' ); // register "warp" zone type
			// Create a curated object type known as "sign" (for selection dialogue zones).
			curator.registerType( 'sign' ); // register "sign" zone type
			// Create initial filtering mechanism for region type registration.
			curator.register(
				'filter', 'levelMarqueeRegion',
				( type, data, object ) => {
					// Validate item type.
					if ( type==='warp' || type==='sign' ) {
						// Check for open view & tool.
						const state	= client.getState(); // get program state
						if ( !state.levelView )
							return object.jot( 'visible', false );
						// Check current level being viewed.
						const view	= state.levelView;
						const key	= state.levelViewKey;
						// Require object to refer to the current level.
						if ( data.file!==view.file.skey )
							object.jot( 'visible', false );
					}
				});

			// Intercept objects panel creation event.
			curator.register(
				'btnCreate', subtype,
				() => {
					// Block action if app is busy.
					if ( client.busy() ) return; // app busy‐gate
					// Determine type.
					const type	= curator.typeSelected;
					let modal;
					switch ( type ) {
						case 'mosaic':
							// Get tilemap object definer modal.
							modal	= client.modals.newMosaic;
							// Open the modal.
							modal.open( type );
							break;
						case 'warp':
							// Get warp region definer modal.
							modal	= client.modals.newWarp;
							// Open the modal.
							modal.open( type );
							break;
						case 'sign':
							// Get sign region definer modal.
							modal	= client.modals.newSign;
							// Open the modal.
							modal.open( type );
							break;
						default: break;
					}
				});

			// Register Mosaic Selector Hook(s)
			client.modals.newMosaic.register(
				'confirm', 'levelMarqueeAdd',
				( type ) => {
					// Attempt to define marquee region.
					client.defineLevelMarqueeRegion( type );
				});

			// Register Warp Selector Hook(s)
			client.modals.newWarp.register(
				'confirm', 'levelMarqueeAdd',
				( type ) => {
					// Attempt to define marquee region.
					client.defineLevelMarqueeRegion( type );
				});

			// Register Sign Selector Hook(s)
			client.modals.newSign.register(
				'confirm', 'levelMarqueeAdd',
				( type ) => {
					// Attempt to define marquee region.
					client.defineLevelMarqueeRegion( type );
				});

			// Register curator add hook.
			curator.register(
				'add', subtype,
				( object ) => { // * object - [JestCuratorObject]
					// Determine type.
					switch ( object.data.type ) {
						case 'mosaic':
							// Attempt to get a stamp of the region.
							const stamp	= client.getMatrixStamp( object.data.region.matrix );
							// Add the [object] matrix's stamp inside its display.
							object.display.addCanvas( 'stamp' );		// add a canvas for drawing
							object.display.render( 'stamp', stamp );	// draw the tile matrix snapshot
							break;
						case 'warp': {
							// Insert an editable field(s) form.
							const form	= createEditWarpForm( client, tool );
							object.display.setTarget( form ); // set target
							break; }
						case 'sign': {
							// Insert an editable field(s) form.
							const form	= createEditSignForm( client, tool );
							object.display.setTarget( form ); // set target
							break; }
						default: break;
					}
				});

			// Register curator remove item hook.curator.register(
			curator.register(
				'remove', subtype,
				( object ) => { // * object - [JestCuratorObject]
					//--------------------------------
					// Check If Paste Possible
					//--------------------------------
					// Validate an active view is open.
					const state	= client.getState(); // get current program state
					if ( !state.tilesetView ) return false;	// no active level
					// Convert the region to a stamp.
					const view	= state.levelView;
					const key	= state.levelViewKey;
					//--------------------------------
					// Handle Marquee Curated Object Type
					//--------------------------------
					// Determine type.
					const type	= object.data.type;
					switch ( type ) {
						//case 'mosaic': break;
						case 'sign': // remove a sign field.
						case 'warp': // remove a warp field.
							// Log undo/redo action.
							const log	= {
								action : `${type}Remove`,
								type   : type,
								id	 : object.data.id,
								object : structuredClone( object.data )
								};
							// Label the action for history panel.
							view.governor.enqueue(
								'edit', { history: `Remove ${type} region.` } );
							// Log inside governor.
							view.governor.log( 'edit', log );
							view.file.jot( "changed", true );
							break;
						default: break;
					}
				});

			// When the user clicks “Copy” in the curator panel.
			curator.register(
				'copy', subtype,
				( object ) => {
					// Block action if app is busy.
					if ( client.busy() ) return; // app busy‐gate
					// Require predefined [object] data to be of type marquee.
					if ( object.data.action!==subtype ) return;
					//--------------------------------
					// Create Snapshot For Copy/Paste
					//--------------------------------
					// use your existing clipboard logic:
					const { x,y,w,h, region } = object.data;
					// Attempt to get a stamp of the region.
					const stamp		= client.getMatrixStamp( region.matrix );
					const log		= {
						action:	subtype,
						x:		x,
						y:		y,
						w:		w,
						h:		h,
						region: { matrix: region.matrix, stamp }
						};
					// Log item to clipboard.
					client.governor.log( 'clipboard', log );
					// Enable pasting.
					client.filemenu.toggle( 'paste', true );
				});

			// When the user clicks “Insert” in the curator panel.
			curator.register(
				'btnInsert', subtype,
				() => {
					// Block action if app is busy.
					if ( client.busy() ) return; // app busy‐gate
					//--------------------------------
					// Check If Update Possible
					//--------------------------------
					// Only if client is running.
					const mode		= client.skim( 'mode' );
					if ( mode!=='running' ) return;
					// Perform action based upon object type.
					const object	= curator.getSelectedObject();
					switch ( object.data.type ) {
						// Attempt to paste the object data.
						case 'mosaic':
							// Determine if tool is enabled.
							if ( !tool.skim('enabled') ) {
								// Attempt to switch tool.
								client.toolbox.setTool( subtype );
								// Determine if tool successfully switched.
								if ( !tool.skim('enabled') ) return; // failed
							}
							// Only insert if mode is not 'dragging'.
							const toolMode	= tool.skim( 'mode' );
							if ( toolMode==='dragging' ) return;
							// Proceed to paste the mosaic as a marquee floating selection.
							client.pasteLevelMarquee( object.data );
							break;
						// Unknown object type.
						default: break;
					}
				});

			// When the user selects a new item in the curator panel.
			curator.register(
				'display', subtype,
				( object ) => {
					if ( !object) return; // no argument
					// Get propert(ies).
					const display	= object.display;
					const data		= object.data;
					const type		= data.type;
					// Perform action based upon object type.
					switch ( type ) {
						case 'warp': {
							// Access input stack.
							const form	= display.target;
							// Change field input to reflect data.
							form.setValue( 'x', data.x );
							form.setValue( 'y', data.y );
							form.setValue( 'level', data.level );
							form.setValue( 'dx', data.dx );
							form.setValue( 'dy', data.dy );
							break; }
						case 'sign': {
							// Access input stack.
							const form	= display.target;
							// Change field input to reflect data.
							form.setValue( 'x', data.x );
							form.setValue( 'y', data.y );
							form.setValue( 'name', data.name );
							form.setValue( 'dialog', data.dialog );
							break; }
						// Unknown object type.
						default: break;
					}
				});

			// When the user saves an item in the curator panel.
			curator.register(
				'btnApply', subtype,
				() => {
					//--------------------------------
					// Initial Gatekeep
					//--------------------------------
					// Block action if app is busy.
					if ( client.busy() ) return; // app busy‐gate

					//--------------------------------
					// Require File to Be Open
					//--------------------------------
					// Check for open view & tool.
					const state   = client.getState(); // get program state
					const view    = state.levelView;
					const key     = state.levelViewKey;

					//--------------------------------
					// Check If Update Possible
					//--------------------------------
					// Get propert(ies).
					const object  = curator.getSelectedObject();
					if ( !object ) return; // no object
					const display = object.display;
					const data    = object.data;
					const type    = data.type;

					// Perform action based upon object type.
					switch ( type ) {
						case 'warp': {
							// Access input stack.
							const form	= display.target;
							// Update warp data to reflect input data.
							const prev	=
								{
								level : data.level,
								dx	  : data.dx,
								dy	  : data.dy
								};
							const next	=
								{
								level : form.getValue('level').toString(),
								dx	  : form.getValue('dx').toString(),
								dy	  : form.getValue('dy').toString()
								};
							// Only log if something changed.
							if ( prev.level !== next.level ||
								 prev.dx !== next.dx ||
								 prev.dy !== next.dy ) {
								// Update data
								data.level = next.level;
								data.dx    = next.dx;
								data.dy    = next.dy;
								// Update visual display of the name.
								curator.updateOptionLabel( data.id, data.level );
								// Play sound-effect to signal.
								client.soundboard.playSound( 'jest_success', 'mp3', 1.1 );
								// Log snapshot
								const log  = {
									action : 'warpEdit',
									type   : 'warp',
									id     : data.id,
									old    : prev,
									neu	   : { ...next }
									};
								// Label the action for history panel.
								view.governor.enqueue(
									'edit', { history: `Edit ${type} region.` } );
								// Log inside governor.
								view.governor.log( 'edit', log );
								view.file.jot( "changed", true );
							}
							break; }
						case 'sign': {
							// Access input stack.
							const form	= display.target;
							// Update warp data to reflect input data.
							const prev	= { name: data.name, dialog: data.dialog };
							const next	= {
								name   : form.getValue('name').toString(),
								dialog : form.getValue('dialog').toString()
								};
							// Only log if something changed.
							if ( prev.name !== next.name
								 || prev.dialog !== next.dialog ) {
								// Update data
								data.name	= next.name;
								data.dialog	= next.dialog;
								// Update visual display of the name.
								curator.updateOptionLabel( data.id, data.name );
								// Play sound-effect to signal.
								client.soundboard.playSound( 'jest_success', 'mp3', 1.1 );
								// Log snapshot
								const log	= {
									action  : 'signEdit',
									type	: 'sign',
									id	  : data.id,
									old	 : prev,
									neu	 : { ...next }
									};
								// Label the action for history panel.
								view.governor.enqueue(
									'edit', { history: `Edit ${type} region.` } );
								// Log inside governor.
								view.governor.log( 'edit', log );
								view.file.jot( "changed", true );
							}
							break; }
						// Unknown object type.
						default: break;
					}
				});

			//-------------------------
			// Marquee Visual Rendering
			//-------------------------
			// Register marquee drawing visual.
			client.register(
				'draw', subtype,
				( e, state, enabled, mode, editor, palette ) => {
					// Block action if app is busy.
					if ( client.busy() ) return; // app busy‐gate
					// Only if client is running.
					if ( mode!=='running' ) return;
					// Get canvas context(s).
					const editorCtx  = editor.el.getContext( '2d' );
					const paletteCtx = palette.el.getContext( '2d' );

					// --------------------------------
					// Draw Tool Visual(s)
					// --------------------------------
					// Get level marquee tool mode.
					const toolMode = tool.skim( 'mode' );
					// Do not draw if nothing to draw.
					if ( toolMode!=='selecting' && toolMode!=='selected'
						 && toolMode!=='floating' && toolMode!=='dragging'
						 && toolMode!=='transforming' ) return;

					 // -----------------------------
					 // Validate Marquee Mask/Trace
					 // -----------------------------
					 // Get tile measurements.
					 const units  = tool.anchor.units;
					 // Check if current marquee has either valid mask or traced rectangle.
					 const bounds = tool.anchor?.getBounds?.() ?? null;
					 const mask   = tool.mask;
					 const tracer = tool.tracer;
					 const trace  = tracer?.getBounds?.() ?? null;

					 let masked	  = false;
					 let traced   = false;

					 // Validate mask area
					 if ( bounds && bounds.w>0 && bounds.h>0
						  && Array.isArray(mask) && mask.length>0 )
					 	masked    = true;

					 // Validate traced area
					 if ( trace && trace.w>0 && trace.h>0 )
					 	traced    = true;

					 // Exit if nothing to process
					 if ( !masked && !traced ) return;

					// -------------------------------
					// Mode: selected / selecting
					// Draw irregular marquee outline
					// -------------------------------
					if ( toolMode==='selected' || toolMode==='selecting' ) {
						// Determine dashed outline.
						const dashSpeed  = 0.5;
						const offset     = ( e.tickCount*dashSpeed ) % 10;

						// Check if a composite selection exists.
						if ( masked ) {
							// Calculate dimensions.
							const cols   = tool.target.width  / units;
							const rows   = tool.target.height / units;

							// Composite stroke style(s).
							editorCtx.save();
							editorCtx.globalCompositeOperation = 'difference';
							const stroke =
								[{
									color  : 'rgba( 255, 255, 255, 1 )',
									weight : 1.5,
									dash   : [ 6, 4 ],
									offset : offset
								}];

							// Draw a composite rect using merged-region mask.
							client.drawCompositeRect(
								editorCtx, {units,cols,rows},
								bounds.x, bounds.y, mask,
								null, //"rgba( 50, 0, 0, 0.2 )", // fill
								stroke, null, null // stroke
								);
							// Unset the "difference" marquee color mode.
							editorCtx.restore(); // restore drawing mode
						}

						// Check if a new selection is being traced.
						if ( traced ) {
							// Calculate dimensions.
							const cols = trace.w;  // trace region width
							const rows = trace.h;  // trace region height
							// Composite stroke style(s).
							editorCtx.save();
							editorCtx.globalCompositeOperation = 'difference';
							const stroke =
								[{
									color  : 'rgba( 255, 255, 255, 1 )',
									weight : 1.5,
									dash   : [ 6, 4 ],
									offset : offset
								}];
							// Create a temporary mask of the active tracer.
							const mask2	= client.grapher.createMatrix( trace.w, trace.h, true );
							// Draw active tracer rect.
							client.drawCompositeRect(
								editorCtx, {units,cols,rows},
								trace.x, trace.y, mask2,
								null, //"rgba( 50, 0, 0, 0.2 )", // fill
								stroke, null, null // stroke
								);
							// Unset the "difference" marquee color mode.
							editorCtx.restore(); // restore drawing mode
						}
					}
					//------------------------------
					// Tool Mode: Floating / Dragging
					//------------------------------
					else if ( (toolMode==='floating' || toolMode==='dragging'
						    || toolMode==='transforming') && masked ) {
						//--------------------------
						// Draw Composite Region
						//--------------------------
						// Get stroke offset from tick count.
						const offset = e.tickCount % 20;

						// Composite stroke style(s).
						const stroke =
							[
								{
									color  : 'rgba( 155, 0, 0, 0.5 )',
									weight : 3,
									dash   : [ 6, 4 ],
									offset : offset
								},
								{
									color  : 'rgba( 255, 255, 255, 0.5 )',
									weight : 3,
									dash   : [ 6, 4 ],
									offset : ( offset+5 ) % 10
								}
							];

						//--------------------------
						// Configure Floating Stamp
						//--------------------------
						// Retrieve the actual floating tile stamp.
						// Null tiles remain transparent in the stamp canvas.
						const contents =
							( tool.contents!==null && tool.contents.stamp ) ?
								{
									img :	tool.contents.stamp.el,
									x   :	bounds.x * units,
									y   :	bounds.y * units,
									w   :	tool.contents.w * units,
									h   :	tool.contents.h * units
								} : null;

							//--------------------------
							// Draw Floating Stamp With Shadow
							//--------------------------
							// Draw the stamp with a drop shadow derived from its actual
							// nontransparent pixels, rather than filling the marquee area.
							// This preserves transparent gaps and null tiles.
							if ( contents ) {
								// Preserve the current canvas rendering state.
								editorCtx.save();

								// Configure a soft, slightly offset drop shadow.
								editorCtx.shadowColor   = 'rgba( 0, 0, 0, 0.75 )';
								editorCtx.shadowBlur    = 6;
								editorCtx.shadowOffsetX = 3;
								editorCtx.shadowOffsetY = 3;

								// Draw the floating stamp and its shadow together.
								// Canvas uses the image's alpha channel to shape the shadow.
								editorCtx.drawImage(
									contents.img,
									contents.x,
									contents.y,
									contents.w,
									contents.h
									);

								// Restore the original state so the shadow doesn't
								// accidentally affect the marquee outline.
								editorCtx.restore();
							}

						//--------------------------
						// Draw Floating Marquee Outline
						//--------------------------
						// Preserve the animated red/white selection boundary.
						// Do not redraw the stamp or add a filled shadow.
						client.drawCompositeRect(
							editorCtx,
							{
								units : units,
								cols  : tool.target.width / units,
								rows  : tool.target.height / units
							},
							bounds.x, bounds.y, mask,
							null,               // no background fill
							stroke, null, null  // outline only; stamp already drawn
							);

						// Show resize handles for a floating marquee.
						if ( ['floating','transforming'].includes(toolMode) && bounds ) {
							// Convert the tile bounds to editor canvas coordinates.
							const left   = bounds.x * units;
							const top    = bounds.y * units;
							const right  = (bounds.x+bounds.w) * units;
							const bottom = (bounds.y+bounds.h) * units;
							const midX   = (left+right) / 2;
							const midY   = (top+bottom) / 2;
							const size   = 8;

							// Place handles at the four corners and four side centers.
							const handles = [
								{ x:left,  y:top    },
								{ x:midX,  y:top    },
								{ x:right, y:top    },
								{ x:right, y:midY   },
								{ x:right, y:bottom },
								{ x:midX,  y:bottom },
								{ x:left,  y:bottom },
								{ x:left,  y:midY   }
								];

							// Keep handle drawing isolated from the marquee outline style.
							editorCtx.save();
							editorCtx.lineWidth   = 1;
							editorCtx.fillStyle   = '#ff0000';
							editorCtx.strokeStyle = '#202020';

							// Drag transform controls.
							for ( const handle of handles ) {
								editorCtx.fillRect(
									handle.x-size/2,
									handle.y-size/2,
									size, size
									);
								editorCtx.strokeRect(
									handle.x-size/2,
									handle.y-size/2,
									size, size
									);
							}
							// Release the canvas.
							editorCtx.restore();
						}
					}
				});

			//-------------------------
			// Curator Region Visual Rendering
			//-------------------------
			// Register marquee drawing visual.
			client.register(
				'draw', 'levelMarqueeCuratorRegions',
				( e, state, enabled, mode, editor, palette ) => {
					// Block action if app is busy.
					if ( client.busy() ) return; // app busy‐gate
					// Only if client is running.
					if ( mode!=='running' ) return;
					const type	     = curator.typeSelected;
					// Get canvas context(s).
					const editorCtx  = editor.el.getContext( '2d' );
					const paletteCtx = palette.el.getContext( '2d' );
					// Tool must be selected.
					if ( !tool.skim('enabled') ) return;
					// Require curator seleted type to be 'warp'.
					switch ( type ) {
						case "sign":
						case "warp":
							// Get all visible warp objects.
							const units     = tool.anchor.units;
							const items     = curator.getVisibleObjects( type );
							const selected  = curator.getSelectedObject();
							for ( const item of items ) {
								let { x, y, w=4, h=4 } = item.data;
								let stroke      = 2;
								const dashSpeed = 0.5; // px per frame (try 0.5, 1, 2, etc.)
								const offset    = (e.tickCount * dashSpeed) % 10;
								// Convert dimensions to tile-grid.
								x *= units; // x coordinate on tile grid
								y *= units; // y coordinate on tile grid
								w *= units; // width in tiles on grid
								h *= units; // height in tiles on grid
								// Draw opaque warpzone rectangle.
								editorCtx.save();
								editorCtx.globalAlpha	= 1;
								editorCtx.lineWidth		= stroke; // set line width
								// Animate the selected item.
								if ( item===selected ) {
									editorCtx.setLineDash( [ 6, 4 ] );
									editorCtx.lineDashOffset	= (offset + 5) % 10;
									editorCtx.shadowColor		= 'rgba(255,255,255,0.1)';
									// Change composite operation
									editorCtx.globalCompositeOperation = 'color-dodge';
									editorCtx.shadowBlur		= 6;	// glow intensity
									editorCtx.shadowOffsetX		= 0;	// no horizontal offset
									editorCtx.shadowOffsetY		= 0;	// no vertical offset
									editorCtx.fillStyle			= 'rgba(0,0,0,0.01)';
									editorCtx.fillRect( x, y, w, h );
									editorCtx.globalCompositeOperation = 'source-over';
								}
								// Handle color of zones by object type.
								if ( type==='warp' ) {
									// Draw opaque warpzone rectangle.
									editorCtx.strokeStyle	= 'rgba(255,145,0,1)';
									editorCtx.strokeRect( x, y, w, h );
									// Create stroke outline(s).
									editorCtx.strokeStyle	= 'rgba(255,200,0,1)';
									editorCtx.strokeRect( x-1, y-1, w+2, h+2 );
									editorCtx.strokeStyle	= 'rgba(255,255,0,1)';
									editorCtx.strokeRect( x-2, y-2, w+4, h+4 );
								}
								else if ( type==='sign' ) {
									// Draw opaque warpzone rectangle.
									editorCtx.strokeStyle		= 'rgba(145,0,0,1)';
									editorCtx.strokeRect( x, y, w, h );
									// Create stroke outline(s).
									editorCtx.strokeStyle		= 'rgba(200,0,0,1)';
									editorCtx.strokeRect( x-1, y-1, w+2, h+2 );
									editorCtx.strokeStyle		= 'rgba(255,0,0,1)';
									editorCtx.strokeRect( x-2, y-2, w+4, h+4 );
								}
								// Restore the context.
								editorCtx.restore();
							}
							break;
					}
				});


			//-------------------------
			// Curator Region Visual Rendering
			//-------------------------
			// Register marquee drawing visual.
			client.register(
				'revert', 'levelMarqueeCuratorRegions',
				( dir, snapshot ) => {
					//--------------------------------
					// Initial Gatekeep
					//--------------------------------
					// Block action if app is busy.
					if ( client.busy() ) return; // app busy‐gate
					// Only if client is running.
					if ( client.skim('mode')!=='running' ) return;
					//--------------------------------
					// Require File to Be Open
					//--------------------------------
					// Check for open view & tool.
					const state	= client.getState(); // get program state
					const view	= state.levelView;
					const key	= state.levelViewKey;
					// Turn "reverting" mode on in level view governor.
					view.governor.jot( 'reverting', true );
					switch ( snapshot.action ) {
						case 'signAdd':
						case 'warpAdd':
							// Undo = remove the object
							if ( dir==='undo' )
								curator.removeObject( snapshot.id );
							// Redo = re-add the object
							else curator.addObject( snapshot.type, structuredClone(snapshot.object) );
							view.file.jot( "changed", true ); // enable "save"
							break;
						case 'signRemove':
						case 'warpRemove':
							// Undo = re-add the removed warp
							if ( dir==='undo' )
								curator.addObject( snapshot.type, structuredClone(snapshot.object) );
							// Redo = remove again
							else curator.removeObject( snapshot.id );
							view.file.jot( "changed", true ); // enable "save"
							break;
						case 'signEdit':
						case 'warpEdit':
							// Get the curator item.
							const item		= curator.objects[ snapshot.id ];
							const form		= item.display.target;
							const data		= snapshot[ dir==='undo' ? 'old' : 'neu' ];
							if ( snapshot.type==='warp' ) {
								item.data.level	= data.level;
								item.data.dx	= data.dx;
								item.data.dy	= data.dy;
								// Update visual display of the name.
								curator.updateOptionLabel( item.id, data.level );
								// Check for the form to update editable data.
								if ( form ) {
									form.setValue( 'level', data.level );
									form.setValue( 'x', data.dx );
									form.setValue( 'y', data.dy );
								}
							}
							else if ( snapshot.type==='sign' ) {
								item.data.name		= data.name;
								item.data.dialog	= data.dialog;
								// Update visual display of the name.
								curator.updateOptionLabel( item.id, data.name );
								// Check for the form to update editable data.
								if ( form ) {
									form.setValue( 'name', data.name );
									form.setValue( 'dialog', data.dialog );
								}
							}
							// Update the display.
							curator.display(); // refresh display
							view.file.jot( "changed", true ); // enable "save"
							break;
						// Marquee drawing tool state.
						// e.g. mode, coordinates, size, etc.
						case 'marqueeSelect':
						case 'marqueeDeselect':
						case 'marqueeMove':
						case 'marqueeFloat':
						case 'marqueeDrop':
							tool.restoreSelectionState(
								dir==='undo' ? snapshot.before : snapshot.after
								);
							break;
						default: break;
					}
					// Turn "reverting" mode off in level view governor.
					view.governor.jot( 'reverting', false );
				});

			//-----------------------------
			// Level File Loading Event(s)
			//-----------------------------
			// Attach an open-file event listener to handle data callback.
			client.register(
				'loadFileData', 'loadObjects',
				( file, { board, link, sign } ) => {
					//-----------------------------
					// Add All Warp Regions from Links
					//-----------------------------
					//console.log( link );
					link.forEach( ( item, index ) => {
						// Get default object name.
						const name	= item.level ?? 'unknown';	// Target level
						// Add warp region to curator
						curator.addObject(
							'warp',
							{
							action  : 'levelMarquee',	// Action type
							file	: file.skey,		// Use file's skey
							name	: name,				// Name with index
							level   : name,				// Target level
							w	   : item.w ?? 4,		// Width (default 4)
							h	   : item.h ?? 4,		// Height (default 4)
							x	   : item.x ?? 0,		// X coordinate
							y	   : item.y ?? 0,		// Y coordinate
							dx	  : item.dx ?? 0,		// Delta X (default 0)
							dy	  : item.dy ?? 0		// Delta Y (default 0)
							});
						});
					//-----------------------------
					// Add All Sign Regions from Signs
					//-----------------------------
					//console.log( sign );
					sign.forEach( ( item, index ) => {
						// Add sign region to curator
						curator.addObject(
							'sign',
							{
							action  : 'levelMarquee',	// Action type
							file	: file.skey,		// Use file's skey
							name	: item.name,		// Name the sign
							dialog  : item.dialog,		// Sign message
							w	   : item.w ?? 4,		// Width (default 4)
							h	   : item.h ?? 4,		// Height (default 4)
							x	   : item.x ?? 0,		// X coordinate
							y	   : item.y ?? 0,		// Y coordinate
							});
						});
				});

			//--------------------------------
			// Preload "Pre-defined Tile Object" Mosaic(s)
			// NOTE: Loaded after tool plugin events defined.
			//--------------------------------
			// Use secretary to download pre-defined tile objects a.k.a. mosaics
			await client.secretary.loadFile( 'json/mosaics.json' )
				.catch(
					( err ) => {
						console.warn( `Predefined objects failed to load: ${err.message}` );
					});
			const record	= client.secretary.getRecord( 'json/mosaics.json' );
			console.log( record );
			curator.importObjects( record ); // import json [objects]
		},

		//--------------------------------
		// New Method(s) In Tiler Application
		//--------------------------------
		extend: function( Klass, proto ) {
			// -----------------------------
			// Get Composite Marquee Region
			// -----------------------------
			// Copy a composite masked region (not just rectangular).
			// RETURNS: [object|null] contents data, or null if invalid.]
			// * x,y		- [int] Values of mask top-left x,y coordinates on canvas.
			// * mask		- 2d [array<boolean>] of add/subtract regions to draw.
			proto.getLevelMarqueeRegion = function( x, y, mask ) {
				// Block action if app is busy.
				if ( this.busy() ) return; // app busy‐gate

				//--------------------------------
				// Check If Paste Possible
				//--------------------------------
				// Validate an active view is open.
				const state       = this.getState();                // get current program state
				const tool        = this.toolbox.tools.levelMarquee;
				// Convert the region to a stamp.
				const levelView   = state.levelView;
				const tilesetView = state.tilesetView;
				if ( !levelView || !tilesetView ) return false;     // no active level or tileset
				const level       = levelView.file.context;         // access current level
				const layer       = level.getLayer( tool.layerId ); // get active level layer
				if ( !layer ) return false;                         // can't find layer
				const tileset     = tilesetView.file.context;

				//--------------------------------
				// Copy Level Tiles-Matrix From Mask
				//--------------------------------
				// Build new matrix from mask.
				const matrix      = [];
				const h = mask.length, w = mask[0].length;
				for ( let my=0; my<h; my++ ) {
					const row     = [];
					for ( let mx=0; mx<w; mx++ ) {
						if ( mask[my][mx] ) {
							// Calculate level coordinates to access tile on level.
							const lx = x + mx;
							const ly = y + my;
							row.push( layer.cloneTile(lx,ly) ); // store x,y tile data
						}
						else row.push( null ); // preserve shape with blank
					}
					matrix.push( row ); // push row into matrix
				}

				//--------------------------------
				// Generate Stamp Using Matrix
				//--------------------------------
				// Build stamp canvas.
				const stamp		= tileset.createStamp( matrix );

				//--------------------------------
				// Return Data
				//--------------------------------
				// Return contents data.
				return { matrix, stamp, x, y, w, h };
			}

			//--------------------------------
			// Marquee Method(s)
			//--------------------------------
			// Raise a matrix region in a level.
			// RETURNS: [boolean] `true` on success else `false` on fail.
			// * tool	- [object] JestToolMarquee emitting the event.
			proto.toolLevelMarqueeFloat = function( tool ) {
				// Block action if app is busy.
				if ( this.busy() ) return; // app busy‐gate

				//--------------------------------
				// Access the Active Level
				//--------------------------------
				// Validate an active view is open.
				const state		= this.getState();			// get current program state
				// Convert the region to a stamp.
				const levelView	= state.levelView;
				if ( !levelView ) return false;				// no active level
				const level		= levelView.file.context;	// access current level
				const layer		= level.getLayer( tool.layerId ); // get active level layer
				if ( !layer || layer.locked ) return false;	// can't find / edit layer

				//--------------------------------
				// Get Mask-Matrix From Level
				//--------------------------------
				// Get origin x,y from marquee anchor.
				const { x, y }	= tool.anchor.getBounds();	// extract properties from region
				// Validate marquee tool and active view.
				const region	= layer.cloneMaskRegion( x, y, tool.mask );
				if ( !region ) return false;
				// Set marquee contents.
				tool.contents	= region; // store region in tool contents
				tool.contents.layerId = layer.id; // add layer id to contents

				//--------------------------------
				// Delete Tiles Under Mask
				//--------------------------------
				// One history item owns both the tile change and marquee state.
				const tiles = this.toolLevelFillMask( x, y, tool.mask, false, layer.id );
				if ( !tiles ) return false;
				levelView.governor.enqueue( 'edit', { history: 'Float marquee.' } );
				levelView.governor.log(
					'edit',
					{
					action  : 'marqueeFloat',
					layerId : layer.id,
					old     : tiles.old,
					neu     : tiles.neu,
					before  : tool.lastState,
					after   : tool.getSelectionState()
					});
				levelView.governor.dequeue( 'edit' );
				return true; // success
			}

			// Drop a matrix region in a level.
			// RETURNS: [boolean] `true` on success else `false` on fail.
			// * tool	- [object] JestToolMarquee emitting the event.
			proto.toolLevelMarqueeDropRegion = function( tool ) {
				// Block action if app is busy.
				if ( this.busy() ) return; // app busy‐gate
				//--------------------------------
				// Access the Active Level
				//--------------------------------
				// Validate an active view is open.
				const state		= this.getState();			// get current program state
				// Convert the region to a stamp.
				const view		= state.levelView;
				if ( !view ) return false;					// no active level view
				const level		= view.file.context;		// access current level

				//--------------------------------
				// Get Mask Level-Region Inside Tool Contents
				//--------------------------------
				// Validate marquee tool and activeView.
				const region	= tool.contents;
				if ( !region ) return false;

				//--------------------------------
				// Get Region Localized Data
				//--------------------------------
				// Resolve level layer.
				const layer		= level.getLayer( region.layerId );
				if ( !layer || layer.locked ) return false;	// can't find / edit layer
				const { x, y }	= tool.bounds; // extract coordinates

				//--------------------------------
				// Replace Level Region With Mask Level-Region
				//--------------------------------
				// Replace the tiles in the region.
				const tiles		=
					this.toolLevelReplaceRegion(
						x, y, region.matrix, region.stamp, false, layer.id );
				if ( !tiles ) return false;

				//--------------------------------
				// Log for Undo/Redo
				//--------------------------------
				view.governor.enqueue( 'edit', { history: 'Drop marquee.' } );
				view.governor.log(
					'edit',
					{
					action  : 'marqueeDrop',
					layerId : layer.id,
					old     : tiles.old,
					neu     : tiles.neu,
					before  : tool.getSelectionState(),
					after   : null
					});
				view.governor.dequeue( 'edit' );
				return true; // success
			}

			// Attempt to copy the marquee selection.
			// Copy some [object] or regional selected content.
			// * tool	- [object] JestToolMarquee emitting the event.
			proto.copyLevelMarquee = function( tool ) {
				// Block action if app is busy.
				if ( this.busy() ) return; // app busy‐gate

				//--------------------------------
				// Check If Copy Possible
				//--------------------------------
				// Validate an active view is open.
				const state			= this.getState();			// get current program state
				// Convert the region to a stamp.
				const levelView		= state.levelView;
				const tilesetView	= state.tilesetView;
				if ( !levelView || !tilesetView ) return false; // no active level or tileset view
				const level			= levelView.file.context;
				const layer			= level.getLayer( tool.layerId ); // get active level layer
				if ( !layer ) return false;						// can't find layer

				//--------------------------------
				// Get Marquee Region(s)
				//--------------------------------
				// Get origin x,y & dimensions from marquee anchor.
				const { x, y, w, h } = tool.anchor.getBounds(); // extract properties from region
				const anchor		= tool.anchor.getBounds();
				const rawRects		= tool.rects?.length ? tool.rects : [ tool.createRect(x,y,w,h,'add') ];
				const rects			=
					rawRects.map(
						r => ({
							x    : r.x - anchor.x,	// normalize relative to anchor
							y    : r.y - anchor.y,
							w    : r.w,
							h    : r.h,
							type : r.type
						}));
				//--------------------------------
				// Get Mask-Matrix From Level
				//--------------------------------
				// Validate marquee tool and active view.
				const region	= tool.contents ?? layer.cloneMaskRegion( x, y, tool.mask );
				if ( !region ) return false;

				//--------------------------------
				// Create Snapshot For Copy/Paste
				//--------------------------------
				// Create log of data for the governor log.
				const log		= { action:	"levelMarquee", x, y, w, h, rects, region };
				this.governor.log( 'clipboard', log ); // log as clipboard
				// Enable paste button.
				this.filemenu.toggle( 'paste', true );
				console.log( 'Copied region:', region );
			}

			// Paste contents of a matrix into a marquee.
			// * snapshot	- [object] With action, region matrix tile data, etc.
			// * tool		- [object] JestToolMarquee emitting the event.
			proto.pasteLevelMarquee = function( tool, snapshot ) {
				// Block action if app is busy.
				if ( this.busy() ) return; // app busy‐gate
				// Only if this is running.
				if ( this.skim('mode')!=='running' ) return;

				//--------------------------------
				// Check If Paste Possible
				//--------------------------------
				// Validate an active view is open.
				const state		= this.getState(); // get current program state
				if ( !state.levelView ) return false; // no active level
				// Snapshot must be of type "marquee".
				if ( snapshot?.action!=="levelMarquee" ) return;

				//--------------------------------
				// Determine Drop Location
				//--------------------------------
				// Determine paste location.
				const { w, h }	= snapshot;
				const level		= state.levelView.file.context;
				// Calculate viewport visible level canvas center.
				const units		= tool.anchor.units;
				const center	= this.getVisibleLevelCenter( units );
				center.x -= Math.floor( w / 2 );
				center.y -= Math.floor( h / 2 );

				//--------------------------------
				// Insert Marquee Selection
				//--------------------------------
				// Insert matrix at location.
				this.insertLevelMarqueeSelection(
					center.x, center.y, snapshot.region.matrix, snapshot.rects );

				//--------------------------------
				// Realign mask & bounds
				//--------------------------------
				// Emit pasted event(s).
				this.emit( 'pasted' ); // send signal
			}

			// Insert contents of a matrix into a marquee.
			// * x,y	- [int] Values of origin (in tile units) to insert selection @.
			// * matrix	- 2d [array] of matrix tile data.
			// rects	- [array] of rect data for selection boundaries.
			proto.insertLevelMarqueeSelection = function( lx, ly, matrix, rects=null ) {
				// Block action if app is busy.
				if ( this.busy() ) return; // app busy‐gate
				// Only if this is running.
				if ( this.skim('mode')!=='running' ) return;

				//--------------------------------
				// Check If Paste Possible
				//--------------------------------
				// Validate an active view is open.
				const state       = this.getState();            // get current program state
				// Convert the region to a stamp.
				const levelView   = state.levelView;
				const tilesetView = state.tilesetView;
				if ( !levelView || !tilesetView ) return false; // no active level or tileset
				const level       = levelView.file.context;
				const layer       = level.getActiveLayer();     // get active level layer
				if ( !layer || layer.locked ) return false;     // can't find / edit layer
				const tileset     = tilesetView.file.context;

				//--------------------------------
				// Validate Matrix Dimensions
				//--------------------------------
				// Determine dimensions of matrix.
				if ( !Array.isArray(matrix) || !matrix.length ) return;
				const w    = matrix[0].length;	// width
				const h    = matrix.length;	// height
				if ( w<1 || h<1 ) return; // no selection

				//--------------------------------
				// Check For Tool Selection If Floating
				//--------------------------------
				// Switch to the level marquee tool.
				this.toolbox.setTool( 'levelMarquee' );
				const tool = this.toolbox.tools.levelMarquee; // level marquee tool
				// If marquee is floating, drop its contents.
				const mode = tool.skim( 'mode' );
				if ( mode==='floating' ) tool.reset(); // drop marquee
				else tool.reset( false ); // no need to drop

				//--------------------------------
				// Capture Empty State Before Insertion
				//--------------------------------
				// A pasted selection starts a new history transition.
				// Do not reuse the previous marquee's lastState.
				tool.lastState  = tool.getSelectionState();

				//--------------------------------
				// Grab Stamp & Insert Region (as floating selection)
				//--------------------------------
				// Generate rect logic if none stored (legacy fallback)
				const usedRects	= rects?.length ? rects : [ tool.createRect(0,0,w,h,'add') ];
				// Adjust each rect’s origin based on drop offset (lx, ly)
				const shiftedRects =
					usedRects.map(
						r => ({
							x    : lx + r.x,
							y    : ly + r.y,
							w    : r.w,
							h    : r.h,
							type : r.type
						}));

				//--------------------------------
				// Generate Stamp Using Matrix
				//--------------------------------
				// Build stamp canvas.
				const stamp		= tileset.createStamp( matrix );

				//--------------------------------
				// Insert Region (as floating selection)
				//--------------------------------
				// Create the floating selection with its owning layer.
				tool.select( lx, ly, w, h, matrix, stamp, shiftedRects, layer.id );
				if ( tool.contents ) tool.contents.layerId = layer.id;
				// Emit pasted event(s).
				this.emit( 'levelMarqueeInserted' ); // send signal
			}

			// Delete contents of an active marquee selection.
			// * tool	- [object] JestToolMarquee emitting the event.
			proto.deleteLevelMarquee = function( tool ) {
				// Block action if app is busy.
				if ( this.busy() ) return false; // app busy‐gate

				//--------------------------------
				// Check If Delete Possible
				//--------------------------------
				// Check for open view & tool.
				const state		= this.getState(); // get program state
				if ( !state.levelView ) return false;
				const view		= state.levelView;
				const key		= state.levelViewKey;
				const level		= view.file.context;
				const layer		= level.getLayer( tool.layerId );
				if ( !layer || layer.locked ) return false;

				//--------------------------------
				// Check to Snapshot Marquee
				//--------------------------------
				// Require an active marquee selection.
				const mode		= tool.skim( 'mode' );
				if ( mode!=='floating' && mode!=='selected' ) return false;
				// Check selection bounds.
				const { x, y, w, h } = tool.anchor.getBounds();
				if ( w<=0 || h<=0 ) return false; // empty selection

				//--------------------------------
				// Clear the Selected Region & Marquee
				//--------------------------------
				// Label the action for history panel.
				view.governor.enqueue( 'edit', { history: `Delete marquee tiles.` } );
				// Clear the area that is selected.
				if ( mode==='selected' ) { // clear region underneath
					if ( !this.toolLevelFillMask(x, y, tool.mask, true, layer.id) ) {
						view.governor.dequeue( 'edit' );
						return false; // fail
					}
				}
				// Deselect the marquee.
				tool.reset( false );				// reset marquee tool
				view.governor.dequeue( 'edit' );	// fallback if fail
				// Emit deleted event(s).
				this.emit( 'deleted', null );		// send signal
				return true;
			}

			// Define a marquee region as an [object] inside the curator.
			proto.defineLevelMarqueeRegion = function( type ) {
				// Block action if app is busy.
				if ( this.busy() ) return; // app busy‐gate

				//--------------------------------
				// Check If Paste Possible
				//--------------------------------
				// Validate an active view is open.
				const state			= this.getState();			// get current program state
				// Convert the region to a stamp.
				const levelView		= state.levelView;
				const tool			= this.toolbox.tools.levelMarquee; // level marquee tool
				if ( !levelView ) return false;					// no active level
				const level			= levelView.file.context;
				const layer			= level.getLayer( tool.layerId ); // get active level layer
				if ( !layer || layer.locked ) return false;		// can't find / edit layer

				//--------------------------------
				// Check If Selection is Made
				//--------------------------------
				// Require tool mode to be either "selected" or "floating".
				const toolMode		= tool.skim( 'mode' );
				if ( toolMode!=='selected' && toolMode!=='floating' )
					return; // nothing to add

				//--------------------------------
				// Begin Data [object]
				//--------------------------------
				// Generate initial data [object].
				let data		=  { created: Date.now() };
				// Get coordinates of region on level to clone.
				const { x, y }	= tool.anchor.getBounds();
				// Only one region may be selected (a simple rectangle).
				if ( tool.rects.length!==1 ) {
					console.warn( '[JestTiler] defineLevelMarqueeRegion() incorrect selection.' );
					return; // escape
				}
				// Get the marquee selected content(s) (from level).
				const region	= layer.cloneMaskRegion( x, y, tool.mask );
				data.action		= subtype;			// object is type marquee
				data.w			= region.w;			// assign width
				data.h			= region.h;			// assign height
				// Emit event to define the region.
				this.emit( 'defineRegion', null, type, data, region );
			}

			// Define a marquee region as an [object] inside the curator.
			// * action	- [string] Value of action taking place: e.g. 'marqueeSelect'
			// * before	- [object] Marquee history state of marquee.
			// * after	- [object] Suspected altered marquee state (to compare to before).
			// * label	- [string] Value of history state label for undo/redo action log.
			proto.recordMarqueeHistory = function( action, before, after, label ) {
				// Block action if app is busy.
				if ( this.busy() ) return; // app busy‐gate

				//--------------------------------
				// Check If Paste Possible
				//--------------------------------
				// Validate an active view is open.
				const state			= this.getState(); // get current program state
				// Convert the region to a stamp.
				const levelView		= state.levelView;
				if ( !levelView ) return false; // no active level
				// Mode gatekeep.
				if ( !levelView || levelView.governor.skim('reverting') ) return;

				//--------------------------------
				// Compare Meaningful Marquee State
				//--------------------------------
				// Include the exact effective mask in the comparison.
				// A mask can change even when the outer bounds stay the same.
				// The governor still records the complete before/after snapshots.
				const comparable =
					state =>
						state ? {
							mode     : state.mode,
							rects    : state.rects,
							bounds   : state.bounds,
							layerId  : state.layerId,
							mask     : state.mask,
							anchor   : state.anchor,
							contents :
								state.contents ?
									{
									w      : state.contents.w,
									h      : state.contents.h,
									matrix : state.contents.matrix
									}
									: null,
							} : null;
				// If the marquee hasn't changed, don't log for undo/redo.
				if ( JSON.stringify(comparable(before))===JSON.stringify(comparable(after)) )
					return false; // no need to log

				//--------------------------------
				// Log Marquee Undo/Redo State
				//--------------------------------
				// Enqueue the edit, log & return.
				levelView.governor.enqueue( 'edit', { history: label } );
				levelView.governor.log(
					'edit',
					{
						action,
						layerId : after?.layerId ?? before?.layerId ?? null,
						before,
						after
					});
				levelView.governor.dequeue( 'edit' );
			}
		}
	};

	// register with JestTiler
	if ( window.JestTiler && typeof window.JestTiler.use==='function' )
		window.JestTiler.use( type, plugin );
	else console.error( 'marquee/select.plugin.js load error: JestTiler.use() not found' );
})( window );
