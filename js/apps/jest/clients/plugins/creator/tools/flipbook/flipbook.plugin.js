//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/tools/flipbook/flipbook.tool.js loaded' );

//-------------------------
// Flipbook Plugin
//-------------------------
(function( window ) {
	//--------------------------------
	// Plugin Metadata
	//--------------------------------
	const type		= 'tools';
	const subtype	= 'flipbook';

	//--------------------------------
	// Plugin Definition
	//--------------------------------
	const plugin = {
		//--------------------------------
		// Initialize Plugin
		//--------------------------------
		// Called once when plugin is registered.
		// * client - [object] reference to JestAnimator
		init: function( client ) {
			//-------------------------
			// Create Flipbook Tool
			//-------------------------
			// Instantiate marquee tool
			const tool = new JestToolFlipbook( client, subtype );
			client.toolbox.registerTool( subtype, tool );
			tool.build(); // build the tool

			//--------------------------------
			// Create the Flipbook Curator
			//--------------------------------
			// Create tool curator.
			tool.addCurator( 'primary' );
			const curator	= tool.curators.primary; // shorthand

			// Register a sticker type in the curator.
			curator.registerType( 'sticker' );

			// Create a spriteCache to bind sprite selector.
			const spriteCache	=
				new JestLiveOptionCache( client, 'update-sprites' )
					.setFormatter(
						arr => {
							//console.log( arr );
							return Array.isArray(arr) ?
								arr.map(
									g => ({
										label: g.data.name,
										value: g.data.sid,
									}))
								: []
						});

			//--------------------------------
			// Curator Main Filtering Event
			//--------------------------------
			// Create initial filtering mechanism for type registration.
			curator.register(
				'filter', 'filterObjects',
				( type, data, object ) => {
					//--------------------------------
					// Check Program Availability
					//--------------------------------
					// Gatekeep with file status check.
					let s; if ( !(s=client.getFileStatus(tool)) ) return false; // abort

					//--------------------------------
					// Apply Action by Type
					//--------------------------------
					// Validate item type.
					if ( type==='sticker' ) {
						// Require object to refer to the current jani,
						// the current frame, & current layer.
						if ( data.file!==s.fileKey
							 || data.frame!==s.frame
							 || data.layer!==s.layer )
							object.jot( 'visible', false );
					}
				});

			//--------------------------------
			// Create Flipbook Sidebar Menu
			//--------------------------------
			// Add the flipbook panel to the sidebar.
			client.sidebar.addDisableExclusion( subtype ); // prevent forced collapse
			client.sidebar.addSection( subtype, 'Flipbook', null );
			client.sidebar.refit( subtype ); // resize to fit contents
			const flipbookMenu	= client.sidebar.getSection( subtype );

			//-------------------------
			// Add Flipbook Curator
			//-------------------------
			// Add curator panel to the flipbook sidebar menu.
			flipbookMenu.addItem( 'curator', curator.panel );
			// Register the select event to refit the menu to match contents.
			curator.register(
				'displayed', 'curator',
				() => client.sidebar.refit(subtype)
				);

			//-------------------------
			// Add Flipbook Controller Form
			//-------------------------
			// Add controller panel to the flipbook sidebar menu.
			flipbookMenu.addItem( 'control', tool.stickerForm.panel );
			// Add create button to curator.
			curator.toolbar.createButton( { name: 'create', text: '+ Sticker' } );
			curator.toolbar.buttons.create.register(
				'click', 'create-object', () => curator.emit('btnCreate') );

			//---------------------------------
			// Edit/Undo Event(s)
			//---------------------------------
			// Handle edit / undo event(s).
			client.register(
				'revert', 'flipbookTool',
				async ( dir, snapshot ) => {
					//--------------------------------
					// Check Program Availability
					//--------------------------------
					// Gatekeep with file status check.
					let s; if ( !(s=client.getFileStatus(tool)) ) return false; // abort

					//--------------------------------
					// Check If Edit/Undo Possible
					//--------------------------------
					// Match scrapbook-related actions
					let object; // reusables
					switch ( snapshot.action ) {
						// Undo a frame add.
						case 'frameAdd': {
							//--------------------------------
							// Gather Undo/Redo Log Data
							//--------------------------------
							// Setup required data variable(s).
							const data		= snapshot.data;
							const frame		= data.frame;
							const findex	= frame.getIndex();
							// Revert frame add.
							if ( dir==='undo' ) { // undo
								client.removeFrame( tool, frame );
							}
							else if ( dir==='redo' ) { // redo
								// Insert frame at frame's original index.
								s.ani._insertFrameAt( frame, findex );
							}
							// Log file as changed.
							s.file.jot( "changed", true ); // enable "save"
							break; };

						// Undo a frame remove.
						case 'frameRemove': {
							//--------------------------------
							// Gather Undo/Redo Log Data
							//--------------------------------
							// Setup required data variable(s).
							const data		= snapshot.data;
							const frame		= data.frame;
							const findex	= frame.getIndex();
							const stickers	= data.stickers;
							// Revert frame remove.
							if ( dir==='undo' ) { // undo
								// Insert frame at its cached index.
								s.ani._insertFrameAt( frame, findex );
								// Restore all stickers associated with the sprite.
								await client.restoreStickers( tool, stickers );
								// Select the re-inserted frame in viewport.
								s.aniView.setFrameIndex( findex );
							}
							else if ( dir==='redo' ) { // redo
								// Call removeFrame method in client.
								client.removeFrame( tool, frame );
							}
							// Log file as changed.
							s.file.jot( "changed", true ); // enable "save"
							break; };

						// Undo a layer add.
						case 'layerAdd': {
							//--------------------------------
							// Gather Undo/Redo Log Data
							//--------------------------------
							// Setup required data variable(s).
							const data		= snapshot.data;
							const layer		= data.layer;
							// Revert frame add.
							if ( dir==='undo' ) { // undo
								// Call removeLayer method in client.
								client.removeLayer( tool, layer );
							}
							else if ( dir==='redo' ) { // redo
								// Insert frame at frame's original index.
								const frame		= layer.getFrame();
								const lindex	= layer.getIndex();
								frame._insertLayerAt( layer, lindex );
							}
							// Log file as changed.
							s.file.jot( "changed", true ); // enable "save"
							break; };

						// Undo a layer remove.
						case 'layerRemove': {
							//--------------------------------
							// Gather Undo/Redo Log Data
							//--------------------------------
							// Setup required data variable(s).
							const data		= snapshot.data;
							const layer		= data.layer;
							const stickers	= data.stickers;
							console.log( stickers );
							// Revert layer removal.
							if ( dir==='undo' ) { // undo
								// Restore layer.
								const frame		= layer.getFrame();
								const lindex	= layer.getIndex();
								frame._insertLayerAt( layer, lindex );
								// Restore all stickers associated with the layer.
								await client.restoreStickers( tool, stickers );
							}
							else if ( dir==='redo' ) { // redo
								// Call removeLayer method in client.
								client.removeLayer( tool, layer );
							}
							// Log file as changed.
							s.file.jot( "changed", true ); // enable "save"
							break; };

						// Undo adding a sticker.
						case 'stickerAdd': {
							if ( dir==='undo' )
								client.clearSticker( tool, snapshot.sticker );
							else client.restoreStickers( tool, [snapshot.sticker] );
							// Log file as changed.
							s.file.jot( "changed", true ); // enable "save"
							break; };

						// Undo removing a sticker.
						case 'stickerRemove': {
							if ( dir==='undo' )
								client.restoreStickers( tool, [snapshot.sticker] );
							else client.clearSticker( tool, snapshot.sticker );
							// Log file as changed.
							s.file.jot( "changed", true ); // enable "save"
							break; };

						// Undo editing a sticker.
						case 'stickerEdit': {
							//--------------------------------
							// Gather Undo/Redo Log Data
							//--------------------------------
							const object	= snapshot.sticker;
							if ( !object ) break; // object not found
							const data		= snapshot[ dir==='undo' ? 'old' : 'neu' ];

							//--------------------------------
							// Populate Curator Object
							//--------------------------------
							// Change object name & coordinate(s).
							//object.data.name	= data.name;	// sprite name
							object.data.x	= data.x;	// sticker x
							object.data.y	= data.y;	// sticker y
							object.data.z	= data.z;	// sticker z

							//--------------------------------
							// Move Animation Sticker
							//--------------------------------
							// Move sticker to (x,y) coordinate.
							//console.log( data.x, data.y, data.z );
							client.moveSticker( tool, object, data.x, data.y, data.z, false );

							// Update the display.
							s.curator.display(); // refresh display
							s.file.jot( "changed", true ); // enable "save"
							break; }

						default: break;
					}

					//---------------------------------
					// Refresh Sidebar
					//---------------------------------
					// Hard refresh the flipbook sidebar panel.
					client.flipbookHardRefresh( tool );
				});

			//-------------------------
			// Add Flipbook Navigator Form
			//-------------------------
			// Add frame navigator panel to the flipbook sidebar menu.
			flipbookMenu.addItem( 'navigator', tool.frameForm.panel );
			// Add button events to navigator.
			tool.register(
				'btnAddFrame', 'flipbookPlugin',
				( dir ) => {
					//--------------------------------
					// Check Program Availability
					//--------------------------------
					// Gatekeep with file status check.
					let s; if ( !(s=this.getFileStatus(tool)) ) return false; // abort

					//--------------------------------
					// Call to Add Frame
					//--------------------------------
					// Call addFrame method in client.
					let findex	= s.findex;
					if ( dir===1 ) findex ++;
					const frame	= client.addFrame( tool, findex );

					//---------------------------------
					// Log Action for Undo/Redo
					//---------------------------------
					// Log undo/redo action.
					const log	= {
						action : 'frameAdd',
						type   : 'frame',
						data   : { frame }
						};
					// Label the action for history panel.
					s.janiView.governor.enqueue(
						'edit', { history: `Added frame.` } );
					// Log inside governor.
					const snapshot	= s.janiView.governor.log( 'edit', log );
					s.file.jot( 'changed', true );

					//--------------------------------
					// Emit Added Event & Finish
					//--------------------------------
					// Emit event signaling frame was manually added by user.
					s.curator.emit( 'manual:frame:added', null, snapshot );
					// Play sound-effect to signal.
					client.soundboard.playSound( 'jest_success', 'mp3', 1.1 );
				});

			tool.register(
				'btnRemoveFrame', 'flipbookPlugin',
				() => {
					//--------------------------------
					// Check Program Availability
					//--------------------------------
					// Gatekeep with file status check.
					let s; if ( !(s=this.getFileStatus(tool)) ) return false; // abort

					//--------------------------------
					// Verify User Wishes to Remove Frame
					//--------------------------------
					// Confirm if the user wishes to proceed to remove.
					if ( !confirm(`Are you sure you want to remove frame "${s.findex}" with all its layers & stickers?`) )
						return false; // user aborted

					//--------------------------------
					// Remove Frame & Collect Remove Data
					//--------------------------------
					// Call removeFrame method in client.
					const findex	= s.findex;
					const frame		= s.ani.getFrameAt( findex );
					const data		= client.removeFrame( tool, frame );

					//---------------------------------
					// Log Action for Undo/Redo
					//---------------------------------
					// Log undo/redo action.
					const log	= {
						action  : 'frameRemove',
						type    : 'frame',
						data    : data // removed frame data
						};
					// Label the action for history panel.
					s.janiView.governor.enqueue(
						'edit', { history: `Removed frame.` } );
					// Log inside governor.
					const snapshot	= s.janiView.governor.log( 'edit', log );
					s.file.jot( 'changed', true );

					//--------------------------------
					// Emit Removed Event & Finish
					//--------------------------------
					// Emit event signaling frame was manually removed by user.
					s.curator.emit( 'manual:frame:removed', null, snapshot );
					// Play sound-effect to signal.
					client.soundboard.playSound( 'jest_success', 'mp3', 1.1 );
				});

			// Add layer navigator panel to the flipbook sidebar menu.
			flipbookMenu.addItem( 'navigator', tool.layerForm.panel );
			// Add button events to navigator.
			tool.register(
				'btnAddLayer', 'flipbookPlugin',
				( dir ) => {
					//--------------------------------
					// Check Program Availability
					//--------------------------------
					// Gatekeep with file status check.
					let s; if ( !(s=this.getFileStatus(tool)) ) return false; // abort

					//--------------------------------
					// Call to Add Layer
					//--------------------------------
					// Call addLayer method in client.
					let lindex	= s.lindex;
					if ( dir===1 ) lindex ++;
					const layer		= client.addLayer( tool, s.frame, lindex );

					//---------------------------------
					// Log Action for Undo/Redo
					//---------------------------------
					// Log undo/redo action.
					const log	= {
						action : 'layerAdd',
						type   : 'layer',
						data   : { layer }
						};
					// Label the action for history panel.
					s.janiView.governor.enqueue(
						'edit', { history: `Added layer.` } );
					// Log inside governor.
					const snapshot	= s.janiView.governor.log( 'edit', log );
					s.file.jot( 'changed', true );

					//--------------------------------
					// Emit Added Event & Finish
					//--------------------------------
					// Emit event signaling layer was manually added by user.
					s.curator.emit( 'manual:layer:added', null, snapshot );
					// Play sound-effect to signal.
					client.soundboard.playSound( 'jest_success', 'mp3', 1.1 );
				});

			tool.register(
				'btnRemoveLayer', 'flipbookPlugin',
				() => {
					//--------------------------------
					// Check Program Availability
					//--------------------------------
					// Gatekeep with file status check.
					let s; if ( !(s=this.getFileStatus(tool)) ) return false; // abort

					//--------------------------------
					// Verify User Wishes to Remove Layer
					//--------------------------------
					// Confirm if the user wishes to proceed to remove.
					let warning = `Are you sure you want to remove layer "${s.lindex}" and all its stickers?`;
					warning += ` ⚠️WARNING: Note this will also remove layer  "${s.lindex}" from all frames.`;
					if ( !confirm(warning) ) return false; // user aborted

					//--------------------------------
					// Remove Layer & Collect Remove Data
					//--------------------------------
					// Get active viewing frame.
					const findex	= s.findex;
					const frame		= s.ani.getFrameAt( findex );
					// Get active viewing layer.
					const lindex	= s.lindex;
					const layer		= frame.getLayerAt( lindex );
					// Call removeLayer method in client.
					const data		= client.removeLayer( tool, layer );

					//---------------------------------
					// Log Action for Undo/Redo
					//---------------------------------
					// Log undo/redo action.
					const log	= {
						action : 'layerRemove',
						type   : 'layer',
						data   : data
						};
					// Label the action for history panel.
					s.janiView.governor.enqueue(
						'edit', { history: `Removed layer.` } );
					// Log inside governor.
					const snapshot	= s.janiView.governor.log( 'edit', log );
					s.file.jot( 'changed', true );

					//--------------------------------
					// Emit Removed Event & Finish
					//--------------------------------
					// Emit event signaling layer was manually removed by user.
					s.curator.emit( 'manual:layer:removed', null, snapshot );
					// Play sound-effect to signal.
					client.soundboard.playSound( 'jest_success', 'mp3', 1.1 );
				});

			// Refresh sidebar control(s) & menu(s).
			curator.register(
				[
					'manual:layer:removed',
					'manual:layer:added',
					'manual:frame:removed',
					'manual:frame:added',,
					'manual:sticker:added',
					'manual:sticker:removed'
				],
				'flipbookPlugin',
				() => {
					//---------------------------------
					// Hard Refresh Curator Display(s)
					//---------------------------------
					// Recalculate control(s) in the curator.
					client.flipbookHardRefresh( tool );
				});

			//---------------------------------
			// Apply Changes to Field(s) Button
			//---------------------------------
			/*// Add apply button to curator.
			curator.toolbar.createButton( { name: 'apply', text: 'Apply' } );
			curator.toolbar.buttons.apply.register(
				'click', 'apply-object', ()=>curator.emit('btnApply') );*/

			/*// When the user applies changes to a sprite in the curator panel.
			curator.register(
				'btnApply', subtype,
				() => {
					//--------------------------------
					// Check Program Availability
					//--------------------------------
					// Gatekeep with file status check.
					let s; if ( !(s=client.getFileStatus(tool)) ) return false; // abort

					//--------------------------------
					// Apply Action by Type
					//--------------------------------
					// Get propert(ies).
					const object	= s.curator.getSelectedObject();
					if ( !object) return; // no object
					const display	= object.display;
					const data		= object.data;
					const type		= data.type;
					// Perform action based upon object type.
					switch ( type ) {
						case 'sticker': {
							// Access input stack.
							const form	= display.target;
							// Update warp data to reflect input data.
							const prev	= {
								//gid   : data.gid,
								x    : x,
								y    : y,
								z    : z
								};
							const next	= {
								x    : form.getValue('x').toString(),
								y    : form.getValue('y').toString(),
								z    : form.getValue('z').toString()
								};
							// Only log if something changed.
							if ( prev.x !== next.x
								|| prev.y !== next.y
								|| prev.z !== next.z ) {
								// Update data.
								data.x	= next.x;	// sticker x
								data.y	= next.y;	// sticker y
								data.z	= next.z;	// sticker z

								// Get the sprite sticker instance.
								const sticker	= s.aniView.getSticker( data.z );
								const sprite	= s.ani.getSpriteById( data.sid );
								s.aniView.moveToZ( sticker, z );

								//--------------------------------
								// Log Action for Undo/Redo
								//--------------------------------
								// Log snapshot
								const log	= {
									action  : 'stickerEdit',
									type    : 'sticker',
									id      : data.z,
									old     : prev,
									neu     : { ...next }
									};
								// Label the action for history panel.
								s.janiView.governor.enqueue(
									'edit', { history: `Edit ${type} region.` } );
								// Log inside governor.
								const snapshot	= s.janiView.governor.log( 'edit', log );
								s.file.jot( 'changed', true );

								//--------------------------------
								// Emit Added Event & Finish
								//--------------------------------
								// Emit event signaling sticker was manually created by user.
								s.curator.emit( 'manual:sticker:added', null, snapshot, object );
								// Play sound-effect to signal.
								client.soundboard.playSound( 'jest_success', 'mp3', 1.1 );
							}
							break; }
						// Unknown object type.
						default: break;
					}
				});*/

			//-------------------------
			// Tool Form Event(s)
			//-------------------------
			// Add listener to all 3 fields to handle moving coordinate(s).
			for ( const key of ['x', 'y', 'z'] ) {
				// Access sticker edit form field.
				const field = tool.stickerForm.fields[key];

				// Begin logging undo/redo movement.
				field.register(
					'mousedown', 'changeValue',
					( pos ) => {
						// Save initial sticker position.
						const object	= curator.getSelectedObject();
						if ( object && object.data?.type==='sticker' ) {
							const data	= object.data;
							data.coordCache = { x: data.x, y: data.y, z: data.z };
						}
					});

				// Register events when sticker coordinates change.
				field.register(
					'input', 'movePosition',
					( pos ) => {
						// Gatekeep with file status check.
						let s; if ( !(s=client.getFileStatus(tool)) ) return false; // abort
						//--------------------------------
						// Move Sticker Using Curator Object
						//--------------------------------
						// Get propert(ies).
						const object	= s.curator.getSelectedObject();
						if ( !object ) return; // no object
						client.moveStickerCoordinate( tool, object, key, pos, false );
					});

				// Log final coordinate change for undo/redo.
				field.register(
					'mouseup', 'movePosition',
					( pos ) => {
						// Gatekeep with file status check.
						let s; if ( !(s=client.getFileStatus(tool)) ) return false; // abort
						//--------------------------------
						// Move Sticker Using Curator Object
						//--------------------------------
						// Get propert(ies).
						const object	= s.curator.getSelectedObject();
						if ( !object ) return; // no object
						client.moveStickerCoordinate( tool, object, key, pos, true );
					});
			}

			//-------------------------
			// Navigation Form Event(s)
			//-------------------------
			// Register an event when viewport "frame" index is changed.
			tool.frameForm.fields.frameRange.register(
				'input', 'changeFrame',
				( value ) => {
					//--------------------------------
					// Check Program Availability
					//--------------------------------
					// Gatekeep with file status check.
					let s; if ( !(s=client.getFileStatus(tool,true)) ) return false; // abort

					//---------------------------------
					// Refresh Curator Object List(s)
					//---------------------------------
					// Change the active frame being viewed.
					s.aniView.setFrameIndex( value );
					// Recalculate layer(s) within frame.
					client.recalculateLayers( tool );
				});

			// Register an event when viewer "layer" index is changed.
			tool.layerForm.fields.layerRange.register(
				'input', 'changeLayer',
				( value ) => {
 					//--------------------------------
					// Check Program Availability
					//--------------------------------
					// Gatekeep with file status check.
					let s; if ( !(s=client.getFileStatus(tool)) ) return false; // abort

					//---------------------------------
					// Refresh Curator Object List(s)
					//---------------------------------
					// Change the active layer being viewed.
					s.aniView.setLayerIndex( value );
					this.refreshCurator( tool ); // refresh curator
				});

			//---------------------------------
			// Create New Sticker Modal
			//---------------------------------
			// Generate the sticker modal.
			client.addModal(
				'newSticker',
				{
					title   :	'Create Sticker',
					text    :	'Insert a new movable sprite:',
					inputs  :
						[
						{
							name      : 'sprite',
							type      : 'select',
							label     : 'Choose Sprite',
							cacheBind : spriteCache, // [JestLiveOptionCache]
							//filter    : ( opt, input ) => opt.label.startsWith('Room')
						}
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
									client.modals.newSticker.emit( 'cancel', null );
									// Close the modal.
									client.modals.newSticker.close();
								}
						},
						confirm : {
							label   :	'Confirm',
							onClick :
								() => {
									// Get curated object type.
									const modal	= client.modals.newSticker;
									modal.emit( 'confirm', null, modal.payload );
								}
						}
					}
				});

			// Wire all modal(s) to reset inputs when opening.
			client.modals.newSticker.register(
				'preopen', 'reset',
				e=>client.modals.newSticker.resetInputs()
				);

			//-------------------------
			// Define Sprite Sticker
			//-------------------------
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
						case 'sticker':
							// Get sticker object definer modal.
							modal	= client.modals.newSticker;
							// Open the modal.
							modal.open( type );
							break;
						default: break;
					}
				});

			// Register Sticker Creation Hook(s)
			client.modals.newSticker.register(
				'confirm', 'stickerCreate',
				( type ) => {
					//--------------------------------
					// Check Program Availability
					//--------------------------------
					// Gatekeep with file status check.
					let s; if ( !(s=client.getFileStatus(tool)) ) return false; // abort

					//---------------------------------
					// Create a New Sticker
					//---------------------------------
					// Render data to pass to deinition method.
					const data		= {}; // generic [object]
					// Attempt to define a sticker.
					const object	= client.defineFlipbookSticker( tool, data );

					//---------------------------------
					// Log Action for Undo/Redo
					//---------------------------------
					// Log undo/redo action.
					const log	= {
						action  : 'stickerAdd',
						type    : 'sticker',
						sticker : object
						};
					// Label the action for history panel.
					s.janiView.governor.enqueue(
						'edit', { history: `Added sticker.` } );
					// Log inside governor.
					const snapshot	= s.janiView.governor.log( 'edit', log );
					s.file.jot( 'changed', true );

					//--------------------------------
					// Emit Added Event & Finish
					//--------------------------------
					// Emit event signaling sticker was manually created by user.
					s.curator.emit( 'manual:sticker:added', null, snapshot, object );
					// Play sound-effect to signal.
					client.soundboard.playSound( 'jest_success', 'mp3', 1.1 );
				});

			//-------------------------
			// Remove Curator Object
			//-------------------------
			// Create "remove" button.
			curator.toolbar.createButton( { name: 'remove', text: '- Sticker' } );
			curator.toolbar.buttons.remove.register(
				'click', 'remove-object', () => curator.emit('btnRemove') );

			// Intercept objects panel remove event.
			curator.register(
				'btnRemove', subtype,
				() => {
					//--------------------------------
					// Check Program Availability
					//--------------------------------
					// Gatekeep with file status check.
					let s; if ( !(s=client.getFileStatus(tool)) ) return false; // abort

					//--------------------------------
					// Get Curator Object Information
					//--------------------------------
					// Get selected ID and corresponding object.
					const id		= s.curator.selectBox.getValue();
					const object	= s.curator.getObject( id );
					const data		= object.data;
					const name		= data.name;
					const type		= s.curator.typeSelected;

					//--------------------------------
					// Confirm User Wants to Remove Object
					//--------------------------------
					// Confirm if the user wishes to proceed to remove.
					if ( !confirm(`Are you sure you want to remove ${type} "${name}"?`) )
						return; // user aborted

					//---------------------------------
					// Create a New Sticker
					//---------------------------------
					// Remove a sticker from the layer.
					s.layer.removeSticker( data.sticker.z );

					//---------------------------------
					// Log Action for Undo/Redo
					//---------------------------------
					// Log undo/redo action.
					const log	= {
						action  : 'stickerRemove',
						type    : 'sticker',
						sticker : object
						};
					// Label the action for history panel.
					s.janiView.governor.enqueue(
						'edit', { history: `Removed sticker.` } );
					// Log inside governor.
					const snapshot	= s.janiView.governor.log( 'edit', log );
					s.file.jot( 'changed', true );

					//--------------------------------
					// Emit Removed Event & Finish
					//--------------------------------
					// Emit event signaling sticker was manually removed by user.
					s.curator.emit( 'manual:sticker:removed', null, snapshot, object );
					// Play sound-effect to signal.
					client.soundboard.playSound( 'jest_success', 'mp3', 1.1 );
				});

			//-------------------------
			// Define Scrapbook Curator Object
			//-------------------------
			// Grab scrapbook tool curator.
			const scrapbookTool	= client.toolbox.getTool( 'scrapbook' );
			const sbCurator		= scrapbookTool.curators.primary;

			//-------------------------
			// Scrapbook Undo/Redo Event(s)
			//-------------------------
			/*// A frame was added in the flipbook curator.
			curator.register(
				[
					'governor:frameRemove:undo'
				],
				subtype,
				async ( snapshot, object ) => { // * object - [JestCuratorObject]
					//--------------------------------
					// Check Program Availability
					//--------------------------------
					// Gatekeep with file status check.
					let s; if ( !(s=client.getFileStatus(tool)) ) return false; // abort

					//--------------------------------
					// Remove Associated Sprite Group(s)
					//--------------------------------
					// Restore animation group & associated sprite group references.
					client.restoreGroupReferences( tool, object, snapshot?.sprites ?? [] );
				});*/

			/*// A frame was removed in the flipbook curator.
			curator.register(
				[
					'manual:frame:removed',
					'governor:frameRemove:redo'
				],
				subtype,
				( snapshot, object ) => { // * object - [JestCuratorObject]
					//--------------------------------
					// Check Program Availability
					//--------------------------------
					// Gatekeep with file status check.
					let s; if ( !(s=client.getFileStatus(tool)) ) return false; // abort

					//--------------------------------
					// Handling Removing Sprite Group
					//--------------------------------
					// Clear group from animation & save referenced sprites to governor.
					const sprites	= client.removeGroupReferences( tool, object );

					//--------------------------------
					// Append Sprites to Governor
					//--------------------------------
					// Add scrapbook sprites into the active snapshot.
					snapshot.sprites = sprites;
					console.log( snapshot );
					console.log( s.janiView.governor );
				});*/

			//-------------------------
			// Scrapbook Undo/Redo Event(s)
			//-------------------------
			// A sprite was added in the scrapbook curator.
			sbCurator.register(
				[
					'governor:spriteAdd:redo',
					'governor:spriteRemove:undo'
				],
				subtype,
				async ( snapshot, object ) => { // * object - [JestCuratorObject]
					//--------------------------------
					// Check Program Availability
					//--------------------------------
					// Gatekeep with file status check.
					let s; if ( !(s=client.getFileStatus(tool)) ) return false; // abort

					//--------------------------------
					// Restore All Sprite Sticker(s)
					//--------------------------------
					// Restore all stickers associated with the sprite.
					await client.restoreStickers( tool, snapshot?.stickers ?? null );
				});

			// A sprite was removed in the scrapbook curator.
			sbCurator.register(
				[
					'manual:sprite:removed',
					'governor:spriteAdd:undo',
					'governor:spriteRemove:redo'
				],
				subtype,
				( snapshot, object ) => { // * object - [JestCuratorObject]
					//--------------------------------
					// Check Program Availability
					//--------------------------------
					// Gatekeep with file status check.
					let s; if ( !(s=client.getFileStatus(tool)) ) return false; // abort

					//--------------------------------
					// Remove All Sprite Sticker(s)
					//--------------------------------
					// Clear all stickers associated with the sprite.
					const stickers	= client.clearSpriteStickers( tool, object );

					//--------------------------------
					// Append Stickers to Governor
					//--------------------------------
					// Add flipbook stickers into the active snapshot.
					snapshot.stickers = stickers;
					console.log( snapshot );
					console.log( s.janiView.governor );
				});

			// Sprite was rendered, update sticker visual.
			client.register(
				'sprite:rendered', 'renderSticker',
				( object ) => { // * object - [JestCuratorObject]
					// Gatekeep with file status check.
					let s; if ( !(s=this.getFileStatus(tool)) ) return false; // abort
					//--------------------------------
					// Get Image File [object]
					//--------------------------------
					// Check for sticker group.
					const stickers	=
						curator.getByTypeAndProps(
							'sticker',
							{
							file : s.fileKey,
							sid  : object.data.sid
							});
					// Abort if no sprite stickers exist.
					if ( stickers.length<1 ) return;
					// Iterate each sticker in the layer & render preview.
					for ( const sticker of stickers )
						client.renderStickerImage( tool, sticker );
				});

			//-------------------------
			// Sprite / Sticker Add Event(s)
			//-------------------------
			// Add an item to scrapbook curator.
			sbCurator.register(
				['auto:load','manual:sprite:added'], subtype,
				( object ) => { // * object - [JestCuratorObject]
					//--------------------------------
					// Update Modal Sticker Dropdown
					//--------------------------------
					// Update sprite select on each sticker & in modal.
					const sprites	= sbCurator.getVisibleObjects( 'sprite' );
					spriteCache.emit( 'update-sprites', null, sprites );
				});

			// Check if a sprite name has changed.
			sbCurator.register(
				'sprite:name:changed', 'updateStickerName',
				( object ) => {
					//--------------------------------
					// Check Program Availability
					//--------------------------------
					// Gatekeep with file status check.
					let s; if ( !(s=client.getFileStatus(tool)) ) return false; // abort

					//--------------------------------
					// Update Modal Sticker Dropdown
					//--------------------------------
					// Update sprite select on each sticker & in modal.
					const sprites	= sbCurator.getVisibleObjects( 'sprite' );
					spriteCache.emit( 'update-sprites', null, sprites );

					//--------------------------------
					// Get Scrapbook Curator Sprite Object
					//--------------------------------
					// Check for sticker group.
					const sid		= parseInt( object.data.sid );
					const name		= object.data.name;
					const stickers	=
						curator.getByTypeAndProps(
							'sticker',
							{
							file : s.fileKey,
							sid  : sid
							});
					// Abort if there is no sticker.
					if ( stickers.length<0 ) return;
					for ( const sticker of stickers ) {
						// Update label to match sprite's new name.
						sticker.label = name;
						// Update the dropdown label of the sticker.
						const data	= sticker.data;
						curator.updateOption( data.id, data.id, name );
					}
				});

			// Add an item to scrapbook curator.
			curator.register(
				'add', subtype,
				( object ) => { // * object - [JestCuratorObject]
					//--------------------------------
					// Check Program Availability
					//--------------------------------
					// Gatekeep with file status check.
					let s; if ( !(s=client.getFileStatus(tool)) ) return false; // abort

					//--------------------------------
					// Add a Sticker
					//--------------------------------
					// Check if object exists.
					if ( !object) return; // no argument
					// Get propert(ies).
					const display	= object.display;
					const data		= object.data;
					const type		= data.type;
					// Perform action based upon object type.
					switch ( type ) {
						case 'sticker': {
							// Create a canvas for drawing the sprite group image.
							object.display.addCanvas( 'preview' ); // add canvas
							// Render the sticker image preview.
							client.renderStickerImage( tool, object );
							/*// Update sticker select(s).
							const stickers	= sbCurator.getVisibleObjects( 'sticker' );
							spriteCache.emit( 'update-stickers', null, stickers );*/
							break; }
						default: break;
					}
				});

			// An item was updated in the scrapbook curator.
			sbCurator.register(
				'changed', subtype,
				( object ) => { // * object - [JestCuratorObject]
					//--------------------------------
					// Check Program Availability
					//--------------------------------
					// Gatekeep with file status check.
					let s; if ( !(s=client.getFileStatus(tool)) ) return false; // abort

					//--------------------------------
					// Edit a Sprite Group or Sprite
					//--------------------------------
					// Determine type.
					const type	= object.data.type; // object type
					// Handle by type.
					switch ( type ) {
						case 'sprite': {

							break; }
						default: break;
					}
				});

			// Remove an item from curator.
			curator.register(
				'remove', subtype,
				( object ) => { // * object - [JestCuratorObject]
					//--------------------------------
					// Check Program Availability
					//--------------------------------
					// Gatekeep with file status check.
					let s; if ( !(s=client.getFileStatus(tool)) ) return false; // abort

					//--------------------------------
					// Remove a Sticker
					//--------------------------------
					// Check if object exists.
					if ( !object) return; // no argument
					// Get propert(ies).
					const display	= object.display;
					const data		= object.data;
					const type		= data.type;
					// Perform action based upon object type.
					switch ( type ) {
						case 'sticker':
							// Remove a sticker from the layer.
							//const removed = layer.removeSticker( data.sticker.z );
							// Auto-select sprite group for all sprite(s).
							//const objects	= curator.getVisibleObjects( 'sprite' );
							//client.autoselectSpriteGroup( tool, objects );
							break;
						default: break;
					}
				});

			// When the user selects a new item in the curator panel.
			curator.register(
				'display', subtype,
				( object ) => { // * object - [JestCuratorObject]
					//---------------------------------
					// Recalibrate Control(s)
					//---------------------------------
					// Update the flipbook controls.
					client.updateFlipbookControls( tool );

					//--------------------------------
					// Display a Sticker
					//--------------------------------
					// Check if object exists.
					if ( !object) return; // no argument
					// Get propert(ies).
					const display	= object.display;
					const data		= object.data;
					const type		= data.type;
					// Perform action based upon object type.
					switch ( type ) {
						case 'sticker': {
							break; }
						// Unknown object type.
						default: break;
					}
				});

			//-------------------------
			// Curator Update Functionality
			//-------------------------
			// Curator ticker "update" hook (for enabling/disabling buttons).
			curator.register(
				'update', subtype,
				( selectedType, object ) => { // * object - [JestCuratorObject]
					//--------------------------------
					// Check Program Availability
					//--------------------------------
					// Gatekeep with file status check.
					let s; if ( !(s=client.getFileStatus(tool)) ) return false; // abort

					//--------------------------------
					// Check If Update Possible
					//--------------------------------x
					// Attempt to enable button(s).
					const toolMode	= tool.skim( 'mode' );
					const enabled	= tool.skim( 'enabled' );
					const toolbar	= s.curator.toolbar;
					const visible	= s.curator.getVisibleOptions(); // get visible items

					//--------------------------------
					// Check Scrapbook [JestCuratorObject]
					//--------------------------------
					// Get sprite group & sprite name.
					const sprites	=
						sbCurator.getByTypeAndProps(
							'sprite', { file : s.fileKey });

					//--------------------------------
					// Begin Handling Forms, etc.
					//--------------------------------
					// Get curator object item information.
					const form		= object?.display?.target;
					const data		= object?.data;
					// Check to toggle various button(s).
					let toggle		= false; // reusable toggle [bool]
					switch ( selectedType ) {
						case 'sticker':
							// Buttons only available if a file is open.
							if ( s.janiView!==null ) {
								// Handle fields & buttons.
								if ( visible.length>0 ) {
									// Allow remove sticker.
									toolbar.toggle( 'remove', true );
								}
								// Check if a sticker can be added.
								if ( sprites.length>0 )
									toolbar.toggle( 'create', true );

								// Check for animation frame count.
								toggle	= s.ani.frames.length<2 ? false : true;
								tool.frameToolbar.toggle( 'removeFrame', toggle );

								// Check for frame layer count.
								toggle	= s.frame.layers.length<2 ? false : true;
								tool.layerToolbar.toggle( 'removeLayer', toggle );
							}
							break;
						// Unknown type.
						default: break;
					}
				});

			//---------------------------------
			// Refresh & Remmber Settings Between Tab Change
			//---------------------------------
			client.tabbarFile.register(
				'pretabChange', 'flipbookRemember',
				() => {
					const s = client.getFileStatus( tool, true );
					if ( s ) curator.rememberSelection( s.fileKey );
				});
				
			// Create event for when tab is changed, to switch file.
			client.tabbarFile.register(
				'tabChange', 'flipbookRefresh',
				( view ) => {
					//---------------------------------
					// Reload Dropdown(s)
					//---------------------------------
					client.flipbookHardRefresh( tool );
					//---------------------------------
					// Save / Restore Tab Selection(s)
					//---------------------------------
					const s = client.getFileStatus( tool, true );
					if ( s ) curator.restoreSelection( s.fileKey );
				});

			//-----------------------------
			// Jani File Loading Event(s)
			//-----------------------------
			// Attach an open-file event listener to handle data callback.
			client.register(
				'openedFile', 'loadFlipbookObjects',
				async () => {
					//--------------------------------
					// Check Program Availability
					//--------------------------------
					// Gatekeep with file status check.
					let s; if ( !(s=client.getFileStatus(tool,true)) ) return false; // abort

					//-----------------------------
					// Add All Sprite Sticker(s)
					//-----------------------------
					// Iterate all frame layers' stickers & generate.
					let findex	= 0; // track frame index
					for ( const frame of s.ani.frames ) {
						let lindex	= 0; // track layer index
						// Iterate each layer in the frame.
						for ( const layer of frame.layers ) {
							// Iterate each sticker in the layer.
							for ( const sticker of layer.stickers ) {
								// Access the sprite here, using sid.
								const sprite	= s.ani.getSpriteByID( sticker.sid );
								// Sample access
								//console.log( `Frame[${findex}] Layer[${lindex}] Z[${sticker.z}] → Sprite[${sprite?.id}]` );
								const object	=
									curator.addObject(
										'sticker',
										{
										action  : 'sticker',		// Action type
										file    : s.fileKey,		// Use file's skey
										sid     : parseInt(sticker.sid), // Sprite unique ID
										name    : sprite.label,		// Sprite label
										frame   : frame,			// Frame index
										layer   : layer,			// Layer index
										sticker : sticker,			// Sticker instance
										x       : sticker.x ?? 0,	// x coordinate
										y       : sticker.y ?? 0,	// y coordinate
										z       : sticker.z ?? 0	// z coordinate
										}, false );
								curator.emit( 'auto:add', null, 'sticker' );
							}
							lindex ++;
						}
						findex ++;
					}
					// Emit custom "loaded all stickers" event.
					curator.emit( 'auto:load', null, 'sticker' );
					curator.selectTopObject(); // autoselect first sticker

					//---------------------------------
					// Refresh Sidebar
					//---------------------------------
					// Hard refresh the flipbook sidebar panel.
					client.flipbookHardRefresh( tool );
					// Recalculate layer(s) within frame.
					client.recalculateLayers( tool );
				});
		},

		//--------------------------------
		// New Method(s) In Animator Application
		//--------------------------------
		extend: function( Klass, proto ) {
			// Define a sticker as an [object] inside the curator.
			// RETURNS: Sticker curator [object] or [null].
			// * tool	- [object] JestToolFlipbook emitting the event.
			// * data	- [object] Data to use for sticker.
			proto.defineFlipbookSticker = function( tool, data ) {
				//--------------------------------
				// Check Program Availability
				//--------------------------------
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool)) ) return null; // abort

				//--------------------------------
				// Get Input Value(s) (from modal)
				//--------------------------------
				// Get user input from modal.
				const modal	= this.modals.newSticker;
				// Require sprite group input.
				const sid	= modal.inputs.sprite.getValue().trim();
				if ( sid.length===0 ) {
					alert( 'Invalid sprite. Sticker not created.');
					return null; // abort
				}
				const sprite	= s.ani.getSpriteByID( sid );

				//---------------------------------
				// Setup Curator [object] Data
				//---------------------------------
				// Store data for curator sprite object.
				data.file		= s.fileKey;
				// Add next sprite id to curator sprite data.
				data.name		= sprite.label;	// sprite title
				data.sid		= sid;			// sprite id
				data.frame		= s.frame;		// frame index
				data.layer		= s.layer;		// layer index

				//---------------------------------
				// Create New Sticker
				//---------------------------------
				// Default coordinates.
				const { x, y }	= 0;
				// Create a sticker of the sprite & add to layer.
				const sticker	= s.layer.createSticker( data.sid, x, y );
				data.sticker	= sticker;		// store ref in data

				//---------------------------------
				// Create Sticker's Curator Object
				//---------------------------------
				// Add the sticker to the curator.
				const object	= s.curator.addObject( 'sticker', data );
				// Update sprite select on each sticker & in modal.
				const stickers	= s.curator.getVisibleObjects( 'sticker' );
				// Auto move the sticker (to toggle auto-resort).
				this.moveSticker( tool, object );
				return object; // sticker curator object
			}

			// Re-calculate all flipbook layer control(s) & display(s).
			// * tool	- [object] JestToolFlipbook emitting the event.
			proto.recalculateLayers = function( tool ) {
				//--------------------------------
				// Check Program Availability
				//--------------------------------
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool,true)) ) return false; // abort

				//---------------------------------
				// Clamp Layer Selection(s) (safety fallback)
				//---------------------------------
				// Clamp all views' selected layer index.
				s.ani._clampAllViews();

				//---------------------------------
				// Reset JANI Layer Slider
				//---------------------------------
				// Rescale the layer selector to match layer count.
				const layerRange	= tool.layerForm.fields.layerRange;
				const layersCount	= s.frame.getLayerCount();
				layerRange.setRange( 0, layersCount-1 );
				layerRange.setValue( s.lindex ); // set to layer index

				//--------------------------------
				// Refresh Curator Options
				//--------------------------------
				// Refresh the curator dropdown(s).
				this.refreshCurator( tool ); // refresh curator
			}

			// Update all flipbook panel control(s) & display(s).
			// * tool	- [object] JestToolFlipbook emitting the event.
			proto.flipbookHardRefresh = function( tool ) {
				//--------------------------------
				// Check Program Availability
				//--------------------------------
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool,true)) ) return false; // abort

				//--------------------------------
				// Refresh Curator Options
				//--------------------------------
				// Refresh the curator dropdown(s).
				this.refreshCurator( tool ); // refresh curator

				//---------------------------------
				// Recalibrate Control(s)
				//---------------------------------
				// Hard-refresh update flipbook controls.
				this.updateFlipbookControls( tool );

				//---------------------------------
				// Refresh Curator Display(s)
				//---------------------------------
				// Recalculate layer(s) within frame.
				this.recalculateLayers( tool );
			}

			// Set the flipbook controls to selection(s): tab, sticker, etc.
			// * tool			- [object] JestToolFlipbook emitting the event.
			// * hardRefresh	- [boolean] whether to force refresh ranges even if values unchanged.
			proto.updateFlipbookControls = function( tool, hardRefresh=false ) {
				//--------------------------------
				// Check Program Availability
				//--------------------------------
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool,true)) ) return false; // abort

				//---------------------------------
				// Reset JANI Frame Slider
				//---------------------------------
				// Rescale the frame selector to match frame count.
				const frameRange	= tool.frameForm.fields.frameRange;
				const framesCount	= s.jani.animation.frames.length;
				frameRange.setRange( 0, framesCount-1 );
				frameRange.setValue( s.findex, hardRefresh ); // set to frame index

				//-------------------------
				// Determine Z Indice(s)
				//-------------------------
				// Update sprite select on each sticker & in modal.
				const stickers	= s.curator.getVisibleObjects( 'sticker' );
				// Rescale the z selector to match z count.
				tool.stickerForm.fields.z.setRange( 0, stickers.length-1 );

				//-------------------------
				// Acquire Selected Object
				//-------------------------
				// Get selected sticker using curator object.
				const object	= s.curator.getSelectedObject();
				const sticker	= object?.data?.sticker ?? { x:0, y:0, z:0 };
				// Update GUI form data.
				tool.stickerForm.fields.x.setValue( sticker.x, hardRefresh );
				tool.stickerForm.fields.y.setValue( sticker.y, hardRefresh );
				tool.stickerForm.fields.z.setValue( sticker.z, hardRefresh );
			}

			// Remove all sticker objects by matching file + sid
			// RETURNS: [object] containing removed animation & curator stickers.
			// * tool		- [object] JestToolFlipbook emitting the event.
			// * object		- [JestCuratorObject] sprite attached to curator.
			proto.clearSpriteStickers = function( tool, object ) {
				//--------------------------------
				// Check Program Availability
				//--------------------------------
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool)) ) return false; // abort

				//--------------------------------
				// Setup Variable(S)
				//--------------------------------
				// Get selected ID and corresponding object.
				const data		= object.data;	// curator object data
				const sid		= data.sid;		// sprite ID

				//--------------------------------
				// Lookup Matching Sticker Objects
				//--------------------------------
				// Find all sticker curator object(s).
				const objects	=
					s.curator.getByTypeAndProps(
						'sticker',
						{
						file : s.fileKey,
						sid  : sid
						});

				// Remove curator objects attached to reference stickers.
				let count = 0;
				for ( const obj of objects )
					if ( s.curator.removeObject(obj.id) ) count++;

				//--------------------------------
				// Remove All Sprite Sticker Reference(s)
				//--------------------------------
				// Iterate all frame layer(s) & remove all sticker refs by sprite id.
				for ( const frame of s.ani.frames )
					for ( const layer of frame.layers )
						layer.extractStickersByID( sid );

				//--------------------------------
				// Return Removed Sticker(s)
				//--------------------------------
				// Return removed flipbook curator sticker objects.
				return objects; // curator sticker [object(s)]
			}

			// Remove a sticker object by matching file + sticker id
			// RETURNS: [object] removed animation curator sticker.
			// * tool		- [object] JestToolFlipbook emitting the event.
			// * object		- [JestCuratorObject] sticker attached to curator.
			proto.clearSticker = function( tool, object ) {
				//--------------------------------
				// Check Program Availability
				//--------------------------------
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool)) ) return false; // abort

				//--------------------------------
				// Setup Variable(S)
				//--------------------------------
				// Get selected ID and corresponding object.
				const data		= object.data;		// curator object data
				const sid		= data.sid;			// sticker ID
				const sticker	= data.sticker;		// ani sticker [object]

				//--------------------------------
				// Remove Sticker Reference
				//--------------------------------
				// Remove the sticker from its layer.
				const layer	= sticker.getLayer();	// layer sticker belongs to
				const index	= sticker.z;			// index of sticker in layer
				layer.removeSticker( index );		// remove sticker @ same index

				//--------------------------------
				// Remove Curator Sticker Object
				//--------------------------------
				// Remove the sticker curator object.
				s.curator.removeObject( object.id );

				//--------------------------------
				// Return Removed Sticker
				//--------------------------------
				// Return removed sticker object.
				return object; // animation sticker [object]
			}

			//-------------------------
			// Restore Sprite Stickers
			//-------------------------
			// Re-inserts sprite sticker [objects] into the animation + curator.
			// RETURNS: [void].
			// * tool		- [object] JestToolFlipbook emitting the event.
			// * stickers	- [array] of curator sticker objects.
			proto.restoreStickers = async function( tool, stickers ) {
				//--------------------------------
				// Check Program Availability
				//--------------------------------
				// Ensure the file data exists.
				let s; if ( !(s=this.getFileStatus(tool)) ) return false; // abort

				//--------------------------------
				// Extract Saved Sticker Data
				//--------------------------------
				// Access sprite stickers from the last sprite removed.
				if ( !stickers ) return false; // nothing to restore

				//--------------------------------
				// Restore Animation Stickers
				//--------------------------------
				// Iterate [AnimationStickers] & add to layer at original index.
				let restored	= 0;
				for ( const obj of stickers ) {
					// Get [AnimationSticker] object.
					const sticker	= obj.data.sticker;
					// Get destination frame + layer index.
					const layer		= sticker.getLayer();
					if ( !layer ) continue; // ⚠️ not found
					// Add sticker back into the proper layer.
					layer.insertAtZ( sticker, sticker.z );
					// Add curator object back into curator.
					s.curator.addObject( 'sticker', obj.data );
					restored++;
				}
			}

			// Move a sticker to a location.
			// NOTE: pass [null] to coordinate to remain untouched.
			// * tool	- [object] JestToolFlipbook emitting the event.
			// * object	- [object] curator sticker object to move.
			//   coord	- [string] value of coordinate to move: 'x', 'y', 'z'
			//   pos	- [float] value of coordinate position.
			//   log	- [boolean] whether to log change for undo/redo.
			proto.moveStickerCoordinate = function( tool, object, coord='x', pos=0, log=false ) {
				//--------------------------------
				// Check Program Availability
				//--------------------------------
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool)) ) return;

				//--------------------------------
				// Move a Sticker's Coordinate
				//--------------------------------
				// Move the sticker's position.
				switch ( coord ) {
					case 'x':
						this.moveSticker( tool, object, pos, null, null, log );
						break;
					case 'y':
						this.moveSticker( tool, object, null, pos, null, log );
						break;
					case 'z':
						this.moveSticker( tool, object, null, null, pos, log );
						break;
					default:
						console.warn( `moveStickerCoordinate(): Unknown arg 'coord', given "${coord}"` );
						break;
				}
			}

			// Move a sticker to a location.
			// NOTE: pass [null] to coordinate to remain untouched.
			// * tool	- [object] JestToolFlipbook emitting the event.
			// * object	- [object] curator sticker object to move.
			//   x		- [int] value of horizontal offset relative to parent(s)
			//   y		- [int] value of vertical offset relative to parent(s)
			//   z		- [int] value of z-index within layer.
			//   log	- [boolean] whether to log change for undo/redo.
			proto.moveSticker = function( tool, object, x=null, y=null, z=null, log=false ) {
				//--------------------------------
				// Check Program Availability
				//--------------------------------
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool,true)) ) return false; // abort

				//--------------------------------
				// Selected Curator Variable(s)
				//--------------------------------
				// Get propert(ies).
				if ( !object ) return; // no object
				const display	= object.display;	// image display
				const data		= object.data;		// sticker curator data
				const type		= data.type;		// object type "sticker"
				// Attempt to get sticker.
				if ( type!=='sticker' ) return;
				const sticker	= data.sticker;

				//---------------------------------
				// Calculate Coordinates
				//---------------------------------
				// Capture existing coordinates.
				//const old	= { x:sticker.x, y:sticker.y, z:sticker.z };
				// Change the x-value of the sticker.
				x	= x===null ? sticker.x : x;
				y	= y===null ? sticker.y : y;
				z	= z===null ? sticker.z : z;

				/*console.warn( z, sticker.z );
				console.log( '........' );
				for ( const st of s.layer.stickers ) {
					const sp = s.ani.getSpriteByID( st.sid );
					console.log( sp.label, st.z );
				}
				console.log( '........' );*/

				//---------------------------------
				// Update Coordinates
				//---------------------------------
				// Move sticker to (x,y) coordinate.
				sticker.move( x, y );
				// Rearrange sticker z-coordinate.
				s.layer.moveToZ( sticker, z );

				//--------------------------------
				// Update Coordinates Form to Match
				//--------------------------------
				// Check for the form to update editable data.
				const form	= object.display.target;
				if ( form ) {
					//form.setValue( 'name', data.name );
					form.setValue( 'x', data.x );
					form.setValue( 'y', data.y );
					form.setValue( 'z', data.z );
				}

				//---------------------------------
				// Sort Curator Stickers (by Z-coordinate)
				//---------------------------------
				// Resort the sticker dropdown.
				s.curator.resortOptions(
					( a, b ) => {
						// Compare sticker z-coordinates.
						const aZ = a?.data?.sticker.z;
						const bZ = b?.data?.sticker.z;
						return (aZ ?? 0) - (bZ ?? 0);
					});

				//--------------------------------
				// Log Change(s) for Undo/Redo
				//--------------------------------
				// Capture new coordinates.
				const neu	= { x:sticker.x, y:sticker.y, z:sticker.z };
				// Determine if logging action for undo/redo.
				if ( log===true ) {
					// Log snapshot
					const log	= {
						action  : 'stickerEdit',
						type    : 'sticker',
						sticker : object,
						old     : object.data.coordCache,
						neu     : neu
						};
					// Label the action for history panel.
					s.janiView.governor.enqueue(
						'edit', { history: `Edit sticker region.` } );
					// Log inside governor.
					s.janiView.governor.log( 'edit', log );
					s.file.jot( "changed", true );
				}
			}

			// Insert a new layer (defaults to current layer index).
			// RETURNS: Created [AnimationLayer] instance or [null].
			// * tool	- [object] JestToolScrapbook emitting the event.
			// * frame	- [AnimationFrame] instance to add layer to.
			// * index	- [int] value of layer index to add layer @ in frame layer(s).
			proto.addLayer = function( tool, frame, index=null ) {
				//--------------------------------
				// Check Program Availability
				//--------------------------------
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool)) ) return false; // abort

				//--------------------------------
				// Validate Argument(s)
				//--------------------------------
				// Ensure frame is an animation frame.
				if ( !(frame instanceof AnimationFrame) ) return false;

				//--------------------------------
				// Add Layer At Current Index
				//--------------------------------
				// Ensure the insertion index is set.
				if ( index===null ) index = s.lindex;
				// Adjust the animation view's selected layer to accomodate addition.
				s.aniView.adjustSelectedLayerIndex( index, true );
				// Create a layer using active layer's index.
				const layer	= frame._createLayerAt( index );

				//---------------------------------
				// Refresh Sidebar
				//---------------------------------
				// Hard refresh the flipbook sidebar panel.
				this.flipbookHardRefresh( tool );
				return layer; // [AnimationLayer] instance
			}

			// Remove a layer (defaults to selected layer).
			// RETURNS: Remove layer data [object] container or [null].
			// * tool	- [object] JestToolScrapbook emitting the event.
			// * layer	- [AnimationLayer] instance being removed from frame layer(s).
			proto.removeLayer = function( tool, layer ) {
				//--------------------------------
				// Check Program Availability
				//--------------------------------
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool)) ) return false; // abort

				//--------------------------------
				// Validate Argument(s)
				//--------------------------------
				// Ensure layer argument is correct type.
				if ( !(layer instanceof AnimationLayer) ) {
					console.warn( `client.removeLayer(): invalid argument for "layer"` );
					return null; // abort
				}
				// Forbid removing the last layer in a frame.
				if ( s.frame.layers.length<1 ) {
					console.warn( `client.removeLayer(): cannot remove last layer. Must have at least 1 layer.` );
					return null; // abort
				}
				// Get frame index in animation.
				const lindex	= layer.getIndex();

				//--------------------------------
				// Begin Layer Reconstuct Data
				//--------------------------------
				// Create container for removed curator sticker objects.
				let stickers	= []; // begin curator stickers [array]

				//--------------------------------
				// Remove Each Matching Object
				//--------------------------------
				// Iterate all sticker(s).
				for ( const sticker of layer.stickers ) {
					// Check for corresponding curator object.
					const objects	=
						s.curator.getByTypeAndProps(
							'sticker', { sticker }
							);
					// Remove item from curator (if found).
					if ( objects.length>0 ) {
						// Get curator sticker object.
						const object	= objects[0];
						// Add curator object to curator sticker container.
						stickers.push( object );
						// Remove sticker curator object.
						s.curator.removeObject( object.data.id );
					}
				}
				// Adjust the animation view's selected layer to accomodate removal.
				s.aniView.adjustSelectedLayerIndex( lindex, false );
				// Remove layer from animation.
				const frame	= layer.getFrame();
				frame._removeLayerAt( lindex );

				//---------------------------------
				// Refresh Sidebar
				//---------------------------------
				// Hard refresh the flipbook sidebar panel.
				this.flipbookHardRefresh( tool );

				//--------------------------------
				// Return Removed Layer Data
				//--------------------------------
				// Create flipbook layer reconstruct & return it.
				const data		=
					{
					layer,		// [AnimationLayer] instance
					stickers	// [array] of curator sticker objects
					};
				return data; // removed data
			}

			// Insert a new frame (defaults to current frame index).
			// RETURNS: Created [AnimationFrame] instance or [null].
			// * tool	- [object] JestToolScrapbook emitting the event.
			// * index	- [int] value of index to add frame @ in animation frame(s).
			proto.addFrame = function( tool, index=null ) {
				//--------------------------------
				// Check Program Availability
				//--------------------------------
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool)) ) return false; // abort

				//--------------------------------
				// Add Frame At Current Index
				//--------------------------------
				// Create a frame using active frame's index.
				if ( index===null ) index = s.findex;
				const frame	= s.ani.createFrameAt( index );

				//---------------------------------
				// Refresh Sidebar
				//---------------------------------
				// Hard refresh the flipbook sidebar panel.
				this.flipbookHardRefresh( tool );
				return frame; // [AnimationFrame] instance
			}

			// Remove a frame (defaults to selected frame).
			// RETURNS: Removed frame data [object] container or [null].
			// * tool	- [object] JestToolScrapbook emitting the event.
			// * frame	- [AnimationFrame] instance being removed from animation.
			proto.removeFrame = function( tool, frame ) {
				//--------------------------------
				// Check Program Availability
				//--------------------------------
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool)) ) return false; // abort

				//--------------------------------
				// Validate Argument(s)
				//--------------------------------
				// Ensure frame argument is correct type.
				if ( !(frame instanceof AnimationFrame) ) {
					console.warn( `client.removeFrame(): invalid argument for "frame"` );
					return null; // abort
				}
				// Forbid removing the last frame in an animation.
				if ( s.ani.frames.length<2 ) {
					alert( `client.removeFrame(): cannot remove last frame. Must have at least 1 frame.` );
					return null; // abort
				}
				// Get frame index in animation.
				const findex		= frame.getIndex();

				//--------------------------------
				// Begin Layer Reconstuct Data
				//--------------------------------
				// Create container for removed layer(s).
				let layers		= [];	// [array] of removed animation layer(s)
				// Create containers for removed animation & curator sticker objects.
				let stickers	= [];	// begin curator stickers [array]

				//--------------------------------
				// Remove Each Matching Object
				//--------------------------------
				// Iterate each frame layer & remove all stickers.
				for ( const layer of frame.layers ) {
					//--------------------------------
					// Iterate & Unload Curator Object(s)
					//--------------------------------
					// Iterate all sticker(s).
					for ( const sticker of layer.stickers ) {
						// Check for corresponding curator object.
						const objects	=
							s.curator.getByTypeAndProps(
								'sticker', { sticker }
								);
						// Remove item from curator (if found).
						if ( objects.length>0 ) {
							// Get curator sticker object.
							const object	= objects[0];
							// Add curator object to curator sticker container.
							stickers.push( object );
							// Remove sticker curator object.
							s.curator.removeObject( object.data.id );
						}
					}
					// Preserve layer (for undo/redo).
					layers.push( layer );
				}

				//--------------------------------
				// Remove Frame From Animation
				//--------------------------------
				// Remove frame from animation.
				s.ani.removeFrameAt( findex );

				//---------------------------------
				// Refresh Sidebar
				//---------------------------------
				// Hard refresh the flipbook sidebar panel.
				this.flipbookHardRefresh( tool );

				//--------------------------------
				// Return Removed Frame Data
				//--------------------------------
				// Create flipbook frame reconstruct & return it.
				const data		=
					{
					frame,		// [AnimationFrame] instance
					layers,		// [array] of layer(s)
					stickers	// [array] of curator sticker objects
					};
				return data; // removed data
			}

			// Render a sprite image preview inside the sticker curator.
			// RETURNS: [boolean] `true` on success else `false` on fail.
			// * tool	- [object] JestToolScrapbook emitting the event.
			// * object	- [JestCuratorObject] being rendered.
			proto.renderStickerImage = async function( tool, object ) {
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool)) ) return false; // abort

				//--------------------------------
				// Skip Inapplicable Objects
				//--------------------------------
				// Check if object belongs to current tab.
				if ( object.data.file!=s.fileKey )
					return; // item in different tab
				// Require curator object to be of type "sticker".
				if ( object.data.type!=='sticker' ) {
					console.error( `Curator object must be of type "sticker".` );
					return false; // abort
				}

				//--------------------------------
				// Get Scrapbook Curator Sprite Object
				//--------------------------------
				// Grab scrapbook tool curator.
				const sbTool	= this.toolbox.getTool( 'scrapbook' );
				const sbCurator	= sbTool.curators.primary;
				// Check for sticker group.
				const sid		= parseInt( object.data.sid );
				const sprites	=
					sbCurator.getByTypeAndProps(
						'sprite',
						{
						file : s.fileKey,
						sid  : sid
						});
				// Abort if there is no sprite.
				if ( sprites.length<0 ) return;
				const sprite	= sprites[0];
				if ( !this.getSpriteImage(sbTool,sid) ) {
					console.warn( 'Sprite image is missing!' );
					return false; // abort
				}

				//--------------------------------
				// Proceed to Render Sprite In Sticker Curator
				//--------------------------------
				// Get rendering sticker canvas.
				const stCanvas	= object.display.getCanvas( 'preview' );
				if ( !stCanvas ) {
					console.warn( 'Canvas is missing!' );
					return false; // abort
				}
				// Render sprite inside sticker's curator preview canvas.
				const sw	= Number( sprite.data.sw );
				const sh	= Number( sprite.data.sh );
				// Get rendering sprite canvas.
				const spCanvas	= sprite.display.getCanvas( 'preview' );
				// Attempt to render the canvas preview.
				try {
					// Check if canvas is empty.
					if ( this.isCanvasEmpty(spCanvas.el) )
						throw new Error( "Canvas width or height is 0!" );
					// Try to draw on canvas.
					stCanvas.draw( spCanvas, true, true, 0, 0, 0, 0, sw, sh );
					//console.log( sprite.data.name );
				}
				catch ( err ) {
					// Throw error.
					console.error( "Canvas Unready:", err.message );
					//console.log( sprite.data.name );
				}
				// Refit the sidebar to match sticker canvas.
				this.sidebar.refit( 'scrapbook' );
				// Emit event to update any canvases reflecting the rendering.
				this.emit( 'sticker:rendered', null, object );
				return true; // success
			}
		}
	};

	//--------------------------------
	// Register With Animator
	//--------------------------------
	if ( window.JestAnimator && typeof window.JestAnimator.use==='function' )
		window.JestAnimator.use( type, plugin );
	else console.error( 'flipbook.plugin.js load error: JestAnimator.use() not found' );
})( window );
