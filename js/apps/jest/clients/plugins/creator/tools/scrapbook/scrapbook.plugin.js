//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/tools/scrapbook/scrapbook.tool.js loaded' );

//-------------------------
// Scrapbook Plugin
//-------------------------
(function( window ) {
	//-------------------------
	// Private Utility Functions
	//-------------------------
	// Generate a sprite edit form inside the curator.
	// * client		- [object] parent reference
	// * tool		- [JestToolScrapbook] instance
	// * object		- [JestCuratorObject] for sprite data
	const createSpriteForm	= function( client, tool, object ) {
		// Block action if app is busy.
		//if ( client.busy() ) return; // app busy‐gate

		//--------------------------------
		// Create Data Form (to edit sprite)
		//--------------------------------
		// Create DOM Panel element [object].
		const form		= new JestForm( client );
		form.build(); // build the form

		//--------------------------------
		// Create Group Select Dropdown Field
		//--------------------------------
		// Create a sprite group select form.
		const groupSelect = new JestInputSelect( client, 'group', 'group', null, 'Group' );
		groupSelect.build( 'group-dropdown' );	// build
		groupSelect.panel.addAttribute( 'data-tooltip', 'Sprite Group' );
		// System manually changes the sprite group.
		groupSelect.register(
			'select', `groupSelect`,
			val => client.updateSpriteImage(tool,object) );
		// User manually changed the sprite group.
		groupSelect.register(
			'user:change', `groupSelect`,
			val => client.changeSpriteGroup(tool,object) );
		form.addField( 'group', groupSelect );	// add to form

		//--------------------------------
		// Create Text Input Field(s)
		//--------------------------------
		// Create text fields.
		const txtFields	= {
			name	: 'Name'
			};
		for ( const key in txtFields ) { // iterate & create
			// Create input [object]
			const input	=
				new JestInputText(
					client, key, null, null, txtFields[key]
					);
			input.build( `input-${key}` );	// build field
			input.panel.addAttribute( 'data-tooltip', txtFields[key] );
			form.addField( key, input );	// add field to form
		}

		//--------------------------------
		// Create Numeric Input Fields
		//--------------------------------
		// Create number fields.
		const numFields	= {
			sx		: 'Source X',
			sy		: 'Source Y',
			sw		: 'Crop Width',
			sh		: 'Crop Height'
			};
		for ( const key in numFields ) { // iterate & create
			// Create input [object]
			const input	=
				new JestInputNumber(
					client, key, null,
					0,				// default value
					numFields[key],	// placeholder
					null,			// no label
					0, 500, 1		// min=1, max=∞, step=1
					);
			input.build( `input-${key}` );	// build field
			input.panel.addAttribute( 'data-tooltip', numFields[key] );
			form.addField( key, input );	// add field to form
		}

		//--------------------------------
		// Manually Modify Some Field(s)
		//--------------------------------
		// Disable some fields.
		//form.fields.x.setReadonly(); // read-only
		//form.fields.y.setReadonly(); // read-only
		// Return the generated panel form.
		return form; // return form [object]
	};

	// Generate a sprite group edit form inside the curator.
	// * client		- [object] parent reference
	// * tool		- [JestToolScrapbook] instance
	// * object		- [JestCuratorObject] for sprite group data
	const createGroupForm	= function( client, tool ) {
		// Block action if app is busy.
		//if ( client.busy() ) return; // app busy‐gate
		//--------------------------------
		// Create Data Form (to edit sprite group)
		//--------------------------------
		// Create DOM Panel element [object].
		const form		= new JestForm( client );
		form.build(); // build the form
		// Create fields.
		const fields	= {
			name	: 'Name',
			path	: 'Path'
			};
		for ( const key in fields ) { // iterate & create
			// Create input [object]
			const input	=
				new JestInputText(
					client, key, null, null, fields[key]
					);
			input.build( `input-${key}` );	// build field
			input.panel.addAttribute( 'data-tooltip', fields[key] );
			form.addField( key, input );	// add field to form
		}
		//--------------------------------
		// Manually Modify Some Field(s)
		//--------------------------------
		// Return the generated panel form.
		return form; // return form [object]
	};

	//--------------------------------
	// Plugin Metadata
	//--------------------------------
	const type		= 'tools';
	const subtype	= 'scrapbook';

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
			// Create Scrapbook Tool
			//-------------------------
			// Instantiate marquee tool
			const tool = new JestToolScrapbook( client, subtype );
			client.toolbox.registerTool( subtype, tool );
			tool.build(); // build the tool

			//--------------------------------
			// Create Validation Expression(s)
			//--------------------------------
			// Expression used to validate sprite source crop x & y.
			client.parser.registerTest( 'min0', v => client.parser.hasNumericMin(v,0) );
			// Expression used to validate sprite width and height.
			const janiFullSpan	= client.config.janiFullSpan;
			client.parser.registerTest(
				'numJaniFullSpan',
				val => {
					// Require value to be within numeric range.
					return client.parser.hasNumericRange( val, 0, janiFullSpan );
				});
			// Expression used to validate sprite width and height.
			client.parser.registerTest(
				'numDiametricJaniFullSpan',
				val => {
					// Require value to be within numeric range.
					return client.parser.hasNumericRange( val, 0-janiFullSpan/2, janiFullSpan/2 );
				});

			//--------------------------------
			// Create the Scrapbook Curator
			//--------------------------------
			// Create tool curator.
			tool.addCurator( 'primary' );
			const curator	= tool.curators.primary; // shorthand

			// Register a sprite type in the curator.
			curator.registerType( 'group' );
			// Register a sprite type in the curator.
			curator.registerType( 'sprite' );

			// Create a groupcache to bind sprite group selector.
			const groupCache	=
				new JestLiveOptionCache( client, 'update-groups' )
					.setFormatter(
						arr => {
							//console.log( arr );
							return Array.isArray(arr) ?
								arr.map(
									g => ({
										label: g.data.name,
										value: g.data.id,
									}))
								: []
						});
			// Store group cache inside curator.
			curator.jot( 'groupCache', groupCache );

			//--------------------------------
			// Curator Main Filtering Event
			//--------------------------------©
			// Create initial filtering mechanism for type registration.
			curator.register(
				'filter', 'tabObjects',
				( type, data, object ) => {
					//--------------------------------
					// Check Program Availability
					//--------------------------------
					// Gatekeep with file status check.
					let s; if ( !(s=client.getFileStatus(tool,true)) ) return false; // abort

					//--------------------------------
					// Filter Curator Dropdown List(s)
					//--------------------------------
					// Validate item type.
					switch ( type ) {
						case 'group': {
							// Require object to refer to the current jani.
							if ( data.file!==s.fileKey )
								object.jot( 'visible', false );
							break; }
						case 'sprite': {
							// Require object to refer to the current jani.
							if ( data.file!==s.fileKey )
								object.jot( 'visible', false );
							break; }
						default: break;
					}
				});

			//--------------------------------
			// Create Scrapbook Sidebar Menu
			//--------------------------------
			client.sidebar.addDisableExclusion( 'scrapbook' ); // prevent forced collapse
			client.sidebar.addSection( 'scrapbook', 'Scrapbook', curator );
			client.sidebar.refit( 'scrapbook' ); // resize menu to match new content
			const spriteMenu	= client.sidebar.getSection( 'scrapbook' );

			// Register the select event to refit the menu to match contents.
			curator.register(
				'displayed', 'curator',
				() => {
					client.sidebar.refit( 'scrapbook' );
				});

			// --------------------------------
			// Create New Group Modal
			// --------------------------------
			// Generate the sprite group modal.
			client.addModal(
				'newGroup',
				{
					title   :	'Create Sprite Group',
					text    :	'Name your reusable sprite group:',
					inputs  :
						[
						{
							name        : 'title',
							placeholder : 'e.g. BODY',
							label       : 'name'
						},
						{
							name        : 'path',
							placeholder : 'e.g. heads/head104.png',
							labe        : 'path'
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
									client.modals.newGroup.emit( 'cancel', null );
									// Close the modal.
									client.modals.newGroup.close();
								}
						},
						confirm : {
							label   :	'Confirm',
							onClick :
								() => {
									// Get curated object type.
									const modal	= client.modals.newGroup;
									modal.emit( 'confirm', null, modal.payload );
								}
						}
					}
				});

			// Wire modal to reset inputs when opening.
			client.modals.newGroup.register(
				'preopen', 'reset', e=>client.modals.newGroup.resetInputs() );

			// --------------------------------
			// Create New Sprite Modal
			// --------------------------------
			// Generate the sprite modal.
			client.addModal(
				'newSprite',
				{
					title   :	'Create Sprite',
					text    :	'Name your reusable sprite:',
					inputs  :
						[
						{
							name        : 'group',
							type        : 'select',
							label       : 'Choose Group',
							cacheBind   : groupCache // [JestLiveOptionCache]
						},
						{
							name        : 'title',
							placeholder : 'e.g. head front view',
							label       : 'name'
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
									client.modals.newSprite.emit( 'cancel', null );
									// Close the modal.
									client.modals.newSprite.close();
								}
						},
						confirm : {
							label   :	'Confirm',
							onClick :
								() => {
									// Get curated object type.
									const modal	= client.modals.newSprite;
									modal.emit( 'confirm', null, modal.payload );
								}
						}
					}
				});

			// Wire modal to reset inputs when opening.
			client.modals.newSprite.register(
				'preopen', 'reset', e=>client.modals.newSprite.resetInputs() );

			// --------------------------------
			// Refresh & Remmber Settings Between Tab Change
			// --------------------------------
			client.tabbarFile.register(
				'pretabChange', 'scrapbookRemember',
				() => {
					const s = client.getFileStatus( tool, true );
					if ( s ) curator.rememberSelection( s.fileKey );
				});

			// Create event for when tab is changed, to switch file.
			client.tabbarFile.register(
				'tabChange', 'scrapbookRefresh',
				( view ) => {
					// --------------------------------
					// Reload Dropdown(s)
					// --------------------------------
					// --------------------------------
					// Reload Dropdown(s)
					// --------------------------------
					client.reloadGroups( tool );
					// --------------------------------
					// Save / Restore Tab Selection(s)
					// --------------------------------
					const s = client.getFileStatus( tool, true );
					if ( s ) curator.restoreSelection( s.fileKey );
				});

			// --------------------------------
			// Image File Select [object] Event(s)
			// --------------------------------
			// Add hidden image file select input to curator toolbar.
			curator.toolbar.panel.addPanel( 'flipbooker', tool.panel );
			// Add image button to curator.
			curator.toolbar.createButton( { name: 'image', text: 'Image' } );
			curator.toolbar.buttons.image.panel.hide();
			// Create action when "open image" button is clicked.
			curator.toolbar.buttons.image.register(
				'click', 'chooseImage',
				() => {
					// Call the image select action method.
					this.imageSelectAction( tool, 'open' );
				});

			// Create action when an image file is selected.
			tool.imageSelect.register(
				'select', 'openFile',
				async ( fileInfo ) => {
					// Gatekeep with file status check.
					let s; if ( !(s=client.getFileStatus(tool)) ) return false; // abort

					//--------------------------------
					// Get Selected Group Curator Object
					//--------------------------------
					// Get selected sprite in curator.
					const object	= client.getCuratorGroup( tool, null );
					if ( !object ) return false; // no group found
					// Quick-access to object data.
					const data		= object.data;

					//--------------------------------
					// Open Image & Set For Group
					//--------------------------------
					// Open the image as the file for selected group.
					const oldImage	= data?.image ? data.image : null;
					const newImage	= await this.openGroupImage( tool, data.id, fileInfo );
					if ( !newImage ) {
						console.warn( 'Could not change group image.' );
						return false; // abort
					}
					// Nothing was changed if new image is identical to previous image.
					if ( oldImage===newImage ) return false; // no need

					//--------------------------------
					// Log Change(s) for Undo/Redo
					//--------------------------------
					// Log snapshot
					const log	= {
						action  : 'groupImageChange',
						type    : 'group',
						id      : data.id,
						old     : oldImage,
						neu     : newImage
						};
					// Label the action for history panel.
					s.janiView.governor.enqueue(
						'edit', { history: `Changed group image.` } );
					// Log inside governor.
					s.janiView.governor.log( 'edit', log );
					s.file.jot( "changed", true );

					// Play sound-effect to signal.
					client.soundboard.playSound( 'jest_success', 'mp3', 1.1 );
				});

			// --------------------------------
			// Edit/Undo Event(s)
			// --------------------------------
			// Handle edit / undo event(s).
			client.register(
				'revert', 'scrapbookTool',
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
						// Undo a sprite group change.
						case 'spriteGroupChange': {
							//--------------------------------
							// Gather Undo/Redo Log Data
							//--------------------------------
							// Access curator group object.
							const object	= s.curator.objects[ snapshot.id ];
							if ( !object ) break; // item not found
							const gid		= snapshot[ dir==='undo' ? 'old' : 'neu' ];
							//--------------------------------
							// Simply Select Group Value
							//--------------------------------
							// Toggle back to the specific group id.
							const form		= object.display.target;
							form.fields.group.selectOption( gid, 'system' );
							// Log file as changed.
							s.file.jot( "changed", true ); // enable "save"
							break; };

						// Undo a group image change.
						case 'groupImageChange': {
							//--------------------------------
							// Gather Undo/Redo Log Data
							//--------------------------------
							// Access curator group object.
							const object	= s.curator.objects[ snapshot.id ];
							if ( !object ) break; // item not found
							const image		= snapshot[ dir==='undo' ? 'old' : 'neu' ];
							//--------------------------------
							// Keep Image Ref Inside Curator Object Data
							//--------------------------------
							object.updateData( 'image', image ); // store image [object]
							console.log( `Sprite group "${object.data.name}" reverted image.` );
							// Try to reresh group curator image preview.
							await this.refreshGroupImage( tool, object );
							// Log file as changed.
							s.file.jot( "changed", true ); // enable "save"
							break; };

						// Undo a manually created sprite event.
						case 'spriteAdd': {
							// Extract logged data.
							const data	= snapshot.data;
							// Undo = remove the object.
							if ( dir==='undo' ) { // ❌ REMOVE ADDED SPRITE
								console.log( 'Undoing added sprite...' );
								// Remove sprite curator object.
								object	= client.removeSprite( tool, data.id );
								// Emit event signaling sprite was removed via undo.
								s.curator.emit( 'governor:spriteAdd:undo', null, snapshot, object );
							}
							// Redo = re-add the object.
							else { // ✅ RE-ADD UNDO-REMOVED SPRITE
								console.log( 'Redoing added sprite...' );
								// Add sprite curator object.
								object	= client.addSprite( tool, {...data} );
								// Emit event signaling sprite was re-added via redo.
								s.curator.emit( 'governor:spriteAdd:redo', null, snapshot, object );
							}
							// Log file as changed.
							s.file.jot( "changed", true ); // enable "save"
							break; }

						// Undo a manually deleted sprite event.
						case 'spriteRemove': {
							// Extract logged data.
							const data	= snapshot.data;
							// Undo = remove the object.
							if ( dir==='undo' ) { // ✅ RE-ADD UNDO-REMOVED SPRITE
								console.log( 'Undoing removed sprite...' );
								// Add sprite curator object.
								object	= client.addSprite( tool, {...data} );
								// Emit event signaling sprite was re-added via undo.
								s.curator.emit( 'governor:spriteRemove:undo', null, snapshot, object );
							}
							// Redo = re-add the object.
							else { // ❌ REMOVE ADDED SPRITE
								console.log( 'Redoing removed sprite...' );
								// Remove sprite curator object.
								object	= client.removeSprite( tool, data.id );
								// Emit event signaling sprite was removed via redo.
								s.curator.emit( 'governor:spriteRemove:redo', null, snapshot, object );
							}
							// Log file as changed.
							s.file.jot( "changed", true ); // enable "save"
							break; }

						// Undo a manually created group event.
						case 'groupAdd': {
							// Extract logged data.
							const data	= snapshot.data;
							// Undo = remove the object.
							if ( dir==='undo' ) { // ❌ REMOVE ADDED GROUP
								console.log( 'Undoing added group...' );
								// Remove group curator object.
								object	= client.removeGroup( tool, data.id );
								// Emit event signaling group was removed via undo.
								s.curator.emit( 'governor:groupAdd:undo', null, snapshot, object );
							}
							// Redo = re-add the object.
							else { // ✅ RE-ADD UNDO-REMOVED GROUP
								console.log( 'Redoing added group...' );
								// Add group curator object.
								object	= await client.addGroup( tool, {...data} );
								// Emit event signaling group was re-added via redo.
								s.curator.emit( 'governor:groupAdd:redo', null, snapshot, object );
							}
							// Log file as changed.
							s.file.jot( "changed", true ); // enable "save"
							break; }

						// Undo a manually deleted group event.
						case 'groupRemove': {
							// Extract logged data.
							const data	= snapshot.data;
							// Undo = remove the object.
							if ( dir==='undo' ) { // ✅ RE-ADD UNDO-REMOVED GROUP
								console.log( 'Undoing removed group...' );
								// Add group curator object.
								object	= await client.addGroup( tool, {...data} );
								// Emit event signaling group was re-added via undo.
								s.curator.emit( 'governor:groupRemove:undo', null, snapshot, data );
							}
							// Redo = re-add the object.
							else { // ❌ REMOVE ADDED GROUP
								console.log( 'Redoing removed group...' );
								// Remove group curator object.
								object	= client.removeGroup( tool, data.id );
								// Emit event signaling group was removed via redo.
								s.curator.emit( 'governor:groupRemove:redo', null, snapshot, data );
							}
							// Log file as changed.
							s.file.jot( "changed", true ); // enable "save"
							break; }

						case 'groupEdit':
						case 'spriteEdit': {
							//--------------------------------
							// Gather Undo/Redo Log Data
							//--------------------------------
							const item		= s.curator.objects[ snapshot.id ];
							if ( !item ) break; // item not found
							//Object.assign( item.data, dir==='undo' ? snapshot.old : snapshot.neu );
							const form		= item.display.target;
							const data		= snapshot[ dir==='undo' ? 'old' : 'neu' ];
							if ( snapshot.type==='sprite' ) {
								//--------------------------------
								// Populate Data With Input
								//--------------------------------
								// Change item name & sprite crop back.
								item.data.name	= data.name;	// sprite name
								item.data.sx	= data.sx;		// source x
								item.data.sy	= data.sy;		// source y
								item.data.sw	= data.sw;		// sprite width
								item.data.sh	= data.sh;		// sprite height
								// Check for the form to update editable data.
								form.setValue( 'name', data.name );
								form.setValue( 'sx', data.sx );
								form.setValue( 'sy', data.sy );
								form.setValue( 'sw', data.sw );
								form.setValue( 'sh', data.sh );

								//--------------------------------
								// Create Animation Sprite & Update Curator Display(s)
								//--------------------------------
								// Update the animation sprite crop region.
								const sprite	= s.ani.getSpriteByID( item.data.sid );
								sprite.crop( data.sx, data.sy, data.sw, data.sh );

								// Update display label of the curator sprite item.
								s.curator.updateOptionLabel( item.data.id, item.data.name );
								// Re-crop sprite preview if image exists.
								client.renderSpriteImage( tool, item );
							}
							else if ( snapshot.type==='group' ) {
								//--------------------------------
								// Populate Data With Input
								//--------------------------------
								// Capture current name & id.
								const prevName		= item.data.name;
								const prevPath		= item.data.path;
								const gid			= item.data.id;
								// Revert item name back to what it was before edit.
								item.data.name		= data.name;
								form.setValue( 'name', data.name );

								//--------------------------------
								// Proceed to Update Image
								//--------------------------------
								// Check if path to image changed.
								if ( prevName!==data.path )
									await client.setGroupImage( tool, item, data.path );

								//--------------------------------
								// Create Animation Group & Change Curator Label
								//--------------------------------
								// Update the animation sprite group.
								s.ani.renameGroup( prevName, data.name );		// rename group
								s.curator.updateOptionLabel( gid, data.name );	// update label
								// Update all group dropdown cache display(s).
								groupCache.updateOption( gid, gid, data.name );
								client.reloadGroups( tool ); // reload
							}
							// Update the display.
							s.curator.display(); // refresh display
							s.file.jot( "changed", true ); // enable "save"
							break; }
						default: break;
					}
				});

			// --------------------------------
			// Apply Changes to Field(s) Button
			// --------------------------------
			// Add apply button to curator.
			curator.toolbar.createButton( { name: 'apply', text: 'Apply' } );
			curator.toolbar.buttons.apply.register(
				'click', 'apply-object', ()=>curator.emit('btnApply') );

			// When the user applies changes to a sprite in the curator panel.
			curator.register(
				'btnApply', subtype,
				async () => {
					//--------------------------------
					// Check Program Availability
					//--------------------------------
					// Gatekeep with file status check.
					let s; if ( !(s=client.getFileStatus(tool)) ) return false; // abort

					//--------------------------------
					// Check If Update Possible
					//--------------------------------
					// Get propert(ies).
					const object	= s.curator.getSelectedObject();
					if ( !object) return; // no object
					const display	= object.display;
					const data		= object.data;
					const type		= data.type;
					const readonly	= data?.readonly ? true : false;

					//--------------------------------
					// Disable Readonly Editing
					//--------------------------------
					// Disable editing for readonly fields.
					if ( readonly ) {
						alert( 'Cannot edit readonly items.' );
						return false; // abort
					}

					//--------------------------------
					// Continue to Update Item
					//--------------------------------
					// Perform action based upon object type.
					switch ( type ) {
						case 'group': {
							// Access input stack.
							const form	= display.target;
							// Update group data to reflect input data.
							const prev	= {
								name : data.name,
								path : data.path
								};
							const next	= {
								name : form.getValue('name').toString(),
								path : form.getValue('path').toString()
								};
							// Only log if something changed.
							if ( prev.name !== next.name
								 || prev.path !== next.path ) {
								//--------------------------------
								// Prevent Duplicate Group Names
								//--------------------------------
								// Find all group curator object(s).
								const groups	=
									s.curator.getByTypeAndProps(
										'group', { file: s.fileKey, name: next.name } );
								// Forbid creation if group name already exists.
								if ( prev.name!==next.name && groups.length>0 ) {
									console.warn( `Group with name "${next.name}" already exists!` );
									return; // abort
								}

								//--------------------------------
								// Validate Input Value(s)
								//--------------------------------
								// Ensure the name is alphanumeric (letters & numbers).
								// Validate the name is 2 - 10 characters long.
								if ( !client.parser.runTests(['caps','len3to10'],next.name) ) {
									alert( `Name must be all caps, between 3 - 10 characters long!` );
									return false; // abort
								}

								//--------------------------------
								// Proceed to Update Name Data
								//--------------------------------
								// Update sprite group data.
								data.name	= next.name;	// change group name

								//--------------------------------
								// Create Animation Group & Change Curator Label
								//--------------------------------
								// Update the animation sprite group.
								s.ani.renameGroup( prev.name, next.name );			// rename group
								s.curator.updateOptionLabel( data.id, data.name );	// update label
								// Update all group dropdown cache display(s).
								groupCache.updateOption( data.id, data.id, data.name );
								client.reloadGroups( tool ); // reload

								//--------------------------------
								// Proceed to Update Image
								//--------------------------------
								// Check if path to image changed.
								if ( prev.path!==next.path )
									await client.setGroupImage( tool, object, next.path );

								//--------------------------------
								// Emit Event(s)
								//--------------------------------
								// Emit object update event.
								curator.emit( 'changed', null, object );

								//--------------------------------
								// Log Change(s) for Undo/Redo
								//--------------------------------
								// Log snapshot
								const log	= {
									action  : 'groupEdit',
									type    : 'group',
									id      : data.id,
									old     : prev,
									neu     : { ...next }
									};
								// Label the action for history panel.
								s.janiView.governor.enqueue(
									'edit', { history: `Edit ${type} region.` } );
								// Log inside governor.
								s.janiView.governor.log( 'edit', log );
								s.file.jot( "changed", true );

								// Play sound-effect to signal.
								client.soundboard.playSound( 'jest_success', 'mp3', 1.1 );
							}
						break; }

						case 'sprite': {
							// Access input stack.
							const form	= display.target;
							// Update warp data to reflect input data.
							const prev	= {
								//gid  : data.gid,
								name : data.name,
								sx   : data.sx,
								sy   : data.sy,
								sw   : data.sw,
								sh   : data.sh
								};
							const next	= {
								name : form.getValue('name').toString(),
								sx   : parseInt( form.getValue('sx').toString() ),
								sy   : parseInt( form.getValue('sy').toString() ),
								sw   : parseInt( form.getValue('sw').toString() ),
								sh   : parseInt( form.getValue('sh').toString() )
								};

							// Only log if something changed.
							if ( prev.name !== next.name
								|| prev.sx !== next.sx
								|| prev.sy !== next.sy
								|| prev.sw !== next.sw
								|| prev.sh !== next.sh ) {
								//--------------------------------
								// Validate Input Value(s)
								//--------------------------------
								// Ensure the name is alphanumeric (letters & numbers).
								// Validate the name is 2 - 10 characters long.
								if ( !client.parser.runTests(['alphanumericS','len3to20'],next.name) ) {
									alert( `Name must be alphanumeric (spaces permitted), between 3 - 10 characters long!` );
									return false; // abort
								}

								// Validate numeric field(s).
								const failures0	=
									client.parser.getFailures(
										[ 'isNumber' ],
										[
											next.sx,		// source x
											next.sy,		// source y
											next.sw,		// sprite width
											next.sh			// sprite height
										]);
								if ( failures0.length>0 ) {
									alert( `Source coordinates & dimensions must be a numeric value!` );
									return false; // abort
								}

								// Validate crop cooridinates on sprite sheet.
								const failures1	=
									client.parser.getFailures(
										[ 'min0' ],
										[
											next.sx,	// source x
											next.sy		// source y
										]);
								if ( failures1.length>0 ) {
									alert( `Source X & Y must be a value equal to 0 or greater!` );
									return false; // abort
								}

								// Validate crop sprite width & height.
								const failures2	=
									client.parser.getFailures(
										[ 'numDiametricJaniFullSpan' ],
										[
											next.sw,	// sprite width
											next.sh		// sprite height
										]);
								if ( failures2.length>0 ) {
									const jhfs	= client.config.janiFullSpan / 2;
									alert( `Sprite width & height must be a value between -${jhfs} to ${jhfs}!` );
									return false; // abort
								}

								//--------------------------------
								// Populate Data With Input
								//--------------------------------
								// Update data.
								//data.gid	= data.gid;			// sprite group id
								data.name	= next.name;		// sprite name
								data.sx		= next.sx;			// source x
								data.sy		= next.sy;			// source y
								data.sw		= next.sw;			// sprite width
								data.sh		= next.sh;			// sprite height

								//--------------------------------
								// Create Animation Sprite & Update Curator Display(s)
								//--------------------------------
								// Update the animation sprite crop region.
								const sprite	= s.ani.getSpriteByID( data.sid );
								sprite.crop( data.sx, data.sy, data.sw, data.sh );

								// Update display label of the curator sprite item.
								curator.updateOptionLabel( data.id, data.name );
								// Re-crop sprite preview if image exists.
								client.renderSpriteImage( tool, object );

								// Emit object update event.
								curator.emit( 'changed', null, object );
								// Emit name change event.
								if ( prev.name!==next.name )
									curator.emit( 'sprite:name:changed', null, object );

								//--------------------------------
								// Log Change(s) for Undo/Redo
								//--------------------------------
								// Log snapshot
								const log	= {
									action  : 'spriteEdit',
									type    : 'sprite',
									id      : data.id,
									old     : prev,
									neu     : { ...next }
									};
								// Label the action for history panel.
								s.janiView.governor.enqueue(
									'edit', { history: `Edit ${type} region.` } );
								// Log inside governor.
								s.janiView.governor.log( 'edit', log );
								s.file.jot( "changed", true );

								// Play sound-effect to signal.
								client.soundboard.playSound( 'jest_success', 'mp3', 1.1 );
							}
							break; }
						// Unknown object type.
						default: break;
					}
				});

			// --------------------------------
			// Other Action Button(s)
			// --------------------------------
			// Add create button to curator.
			curator.toolbar.createButton( { name: 'create', text: 'Create' } );
			curator.toolbar.buttons.create.register(
				'click', 'create-object', ()=>curator.emit('btnCreate') );

			//-------------------------
			// Define New Object
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
						case 'group':
							// Get sprite group object definer modal.
							modal	= client.modals.newGroup;
							// Open the modal.
							modal.open( type );
							break;
						case 'sprite':
							// Get sprite object definer modal.
							modal	= client.modals.newSprite;
							// Open the modal.
							modal.open( type );
							break;
						default: break;
					}
				});

			// Register sprite group definition listener (sent via modal button).
			// NOTE: This creates an object in the curator & sets an animation group.
			client.modals.newGroup.register(
				'confirm', 'createGroup',
				async ( type ) => {
					//--------------------------------
					// Check Program Availability
					//--------------------------------
					// Gatekeep with file status check.
					let s; if ( !(s=client.getFileStatus(tool)) ) return false; // abort

					//--------------------------------
					// Get Input Value(s) (from modal)
					//--------------------------------
					// Get the value of the input text field(s).
					const modal	= client.modals.newGroup;
					// Require sprite group name input.
					const name	= modal.inputs.title.getValue().trim();
					if ( name.length===0 ) {
						alert( `Invalid name. Group not created.` );
						return; // abort
					}
					// Get web image path input.
					const path	= modal.inputs.path.getValue().trim();

					//--------------------------------
					// Prevent Duplicate Group Names
					//--------------------------------
					// Find all group curator object(s).
					const groups	=
						s.curator.getByTypeAndProps(
							'group', { file : s.fileKey, name : name } );
					// Forbid creation if group name already exists.
					if ( groups.length>0 ) {
						alert( `Group with name "${name}" already exists!` );
						return; // abort
					}

					//--------------------------------
					// Proceed to Assign Data
					//--------------------------------
					// Store data for curator sprite object.
					const data		= {};		// new curator [object] data
					data.name		= name;		// capture name
					data.path		= path;		// capture path
					data.readonly	= false;	// can be edited

					// --------------------------------
					// Begin Data For New Curator Object
					// --------------------------------
					// Create a new sprite group.
					const object	= await client.addGroup( tool, data );
					if ( object===null ) return false;

					// --------------------------------
					// Log Action Inside Editing File Governor
					// --------------------------------
					// Log undo/redo action.
					const log	= {
						action  : `groupAdd`,
						type    : 'group',
						id      : object.data.id,
						data    : { ...object.data }
						};
					// Label the action for history panel.
					s.janiView.governor.enqueue(
						'edit', { history: `Add sprite group.` }
						);
					// Log inside governor.
					const snapshot	= s.janiView.governor.log( 'edit', log );
					s.file.jot( 'changed', true );

					//--------------------------------
					// Emit Added Event & Finish
					//--------------------------------
					// Emit event signaling sprite group was manually created by user.
					s.curator.emit( 'manual:group:added', null, snapshot, object );
					// Play sound-effect to signal.
					client.soundboard.playSound( 'jest_success', 'mp3', 1.1 );
				});

			// Register sprite definition listener (sent via modal button).
			// NOTE: This creates an object in the curator & animation.
			client.modals.newSprite.register(
				'confirm', 'createSprite',
				( type ) => {
					//--------------------------------
					// Check Program Availability
					//--------------------------------
					// Gatekeep with file status check.
					let s; if ( !(s=client.getFileStatus(tool)) ) return false; // abort

					//--------------------------------
					// Get Input Value(s) (from modal)
					//--------------------------------
					// Get user input from modal.
					const modal	= client.modals.newSprite;
					// Require sprite group input.
					const gid	= modal.inputs.group.getValue().trim();
					if ( gid.length===0 ) {
						alert( 'Invalid group. Sprite not created.');
						return; // abort
					}
					// Require sprite name input.
					const name	= modal.inputs.title.getValue().trim();
					if ( name.length===0 ) {
						alert( 'Invalid name. Sprite not created.');
						return; // abort
					}

					//--------------------------------
					// Begin Data For New Curator Object
					//--------------------------------
					// Store data for curator sprite object.
					const data		= {};		// new curator [object] data
					data.gid		= gid;		// capture sprite group
					data.name		= name;		// capture sprite name
					data.readonly	= false;	// can be edited

					// --------------------------------
					// Create Curator Object
					// --------------------------------
					// Create a new sprite.
					const object	= client.addSprite( tool, data );
					if ( object===null ) return false;

					// --------------------------------
					// Log Action Inside Editing File Governor
					// --------------------------------
					// Log undo/redo action.
					const log	= {
						action  : `spriteAdd`,
						type    : 'sprite',
						id      : object.data.id,
						object  : { ...object.data }
						};
					// Label the action for history panel.
					s.janiView.governor.enqueue(
						'edit', { history: `Add sprite.` }
						);
					// Log inside governor.
					const snapshot	= s.janiView.governor.log( 'edit', log );
					s.file.jot( 'changed', true );

					//--------------------------------
					// Emit Added Event & Finish
					//--------------------------------
					// Emit event signaling sprite was manually created by user.
					s.curator.emit( 'manual:sprite:added', null, snapshot, object );
					// Play sound-effect to signal.
					client.soundboard.playSound( 'jest_success', 'mp3', 1.1 );
				});

			// Add an item to curator.
			curator.register(
				'add', subtype,
				( object ) => { // * object - [JestCuratorObject]
					//--------------------------------
					// Check Program Availability
					//--------------------------------
					// Gatekeep with file status check.
					const s=client.getFileStatus(tool,true);
					if ( !(s) ) return false; // abort

					//--------------------------------
					// Add a Sprite Group or Sprite
					//--------------------------------
					// Determine type.
					const type	= object.data.type; // object type
					switch ( type ) {
						case 'group': {
							// Create a canvas for drawing the sprite group image.
							object.display.addCanvas( 'preview' );	// add canvas
							// Insert an editable field(s) form.
							const form	= createGroupForm( client, tool );
							object.display.setTarget( form );		// add form
							// Update group dropdowns.
							client.reloadGroups( tool );
							break; }

						case 'sprite': {
							// Create a canvas for drawing the sprite crop preview.
							object.display.addCanvas( 'preview' );	// add canvas
							// Insert an editable field(s) form.
							const form	= createSpriteForm( client, tool, object );
							object.display.setTarget( form );		// add form
							// Add updater to populate group dropdown.
							const gid	= object.data.gid;			// save group item id
							const fkey	= s.fileKey;
							groupCache.bind(
								form.fields.group,
								// Ensure only sprite group dropdowns
								// from sprites in the same open tab are refreshed.
								input => {
									// Get unique file key.
									const s	= client.getFileStatus( tool, true );
									return fkey===s.fileKey ? true : false;
								}); // populate dropdown
							form.fields.group.selectOption( gid );	// select group
							// Auto-select sprite group.
							//client.autoselectGroup( tool, object );
							break; }
						default: break;
					}
				});

			//-------------------------
			// Remove Curator Object
			//-------------------------
			// Create "remove" button.
			curator.toolbar.createButton( { name: 'remove', text: 'Remove' } );
			curator.toolbar.buttons.remove.register(
				'click', 'remove-object', ()=>curator.emit('btnRemove') );

			// Intercept objects panel creation event.
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
					// Check if any items are selected.
					const visible	= curator.getVisibleOptions(); // get visible item(s)
					if ( !visible.length===0 ) { // require at least one item
						console.warn( 'No items to remove.' );
						return; // abort;
					}

					// Get selected ID and corresponding object.
					const id		= s.curator.selectBox.getValue();
					const object	= s.curator.getObject( id );
					const data		= object.data;
					const type		= data.type;
					const readonly	= data?.readonly ? true : false;

					//--------------------------------
					// Disable Readonly Editing
					//--------------------------------
					// Disable editing for readonly fields.
					if ( readonly ) {
						alert( 'Cannot edit readonly items.' );
						return false; // abort
					}

					//--------------------------------
					// Verify User Wishes to Remove Item
					//--------------------------------
					// Confirm if the user wishes to proceed to remove.
					if ( !confirm(`Are you sure you want to remove ${type} "${data.name}"?`) )
						return; // user aborted

					// --------------------------------
					// Emit Item Pre-Remove Event
					// --------------------------------
					// Emit event signaling item was manually removed by user.
					//s.curator.emit( `manual:${type}:pre:remove`, null, snapshot, object );

					//--------------------------------
					// Proceed to Remove ItemΩ                            
					//--------------------------------
					// Remove item, handling by its type.
					switch ( type ) {
						case 'group': // Remove the sprite group.
							client.removeGroup( tool, object.data.id );
							break;

						case 'sprite': // Remove the sprite.
							client.removeSprite( tool, object.data.id );
							break;
						default: break;
					}

					// --------------------------------
					// Log Action Inside Editing File Governor
					// --------------------------------
					// Log undo/redo action.
					const log	= {
						action  : `${type}Remove`,
						type    : type,
						id      : object.data.id,
						data    : { ...data }
						};

					// Label the action for history panel.
					s.janiView.governor.enqueue(
						'edit', { history: `Remove ${type}.` }
						);

					// Log inside governor.
					const snapshot	= s.janiView.governor.log( 'edit', log );
					s.file.jot( 'changed', true );

					// --------------------------------
					// Emit Item Removed Event
					// --------------------------------
					// Emit event signaling item was manually removed by user.
					s.curator.emit( `manual:${type}:removed`, null, snapshot, object );
				});

			// Remove an item from curator.
			/*curator.register(
				'remove', subtype,
				( object ) => { // * object - [JestCuratorObject]
					//--------------------------------
					// Delete a Sprite Group or Sprite
					//--------------------------------
					// Determine type.
					switch ( object.data.type ) {
						case 'group':
							break;

						case 'sprite':
							break;
						default: break;
					}
				});*/

			//-------------------------
			// Scrapbook Undo/Redo Event(s)
			//-------------------------
			// A group was added in the scrapbook curator.
			curator.register(
				[
					'governor:groupAdd:redo',
					'governor:groupRemove:undo'
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
				});

			// A group was removed in the scrapbook curator.
			curator.register(
				[
					'manual:group:removed',
					'governor:groupAdd:undo',
					'governor:groupRemove:redo'
				],
				subtype,
				( snapshot, object ) => { // * object - [JestCuratorObject]
					//--------------------------------
					// Check Program Availability
					//--------------------------------
					// Gatekeep with file status check.
					let s; if ( !(s=client.getFileStatus(tool)) ) return false; // abort

					//--------------------------------
					// Access All Sprites Using Group
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
				});

			//-------------------------
			// Curator Object Display / Rendering
			//-------------------------
			// When the user selects a new item in the curator panel.
			curator.register(
				'display', subtype,
				( object ) => {
					// Validate argument(s).
					if ( !object) return; // no argument
					// Get propert(ies).
					const display	= object.display;
					const data		= object.data;
					const type		= data.type;
					const name		= data.name;
					const readonly	= data?.readonly ? true : false;
					// Perform action based upon object type.
					switch ( type ) {
						case 'group': {
							// Access input stack.
							const form	= display.target;
							// Change field input(s) to reflect data.
							form.setValue( 'name', name );
							form.setValue( 'path', data.path ?? '' );
							// Disable fields from being editable if readonly.
							form.fields.name.setReadonly( readonly );
							form.fields.path.setReadonly( readonly );
							break; }

						case 'sprite': {
							// Access input stack.
							const form	= display.target;
							// Change field input(s) to reflect data.
							form.setValue( 'name', name );
							form.setValue( 'sx', parseInt(data.sx) );
							form.setValue( 'sy', parseInt(data.sy) );
							form.setValue( 'sw', parseInt(data.sw) );
							form.setValue( 'sh', parseInt(data.sh) );
							// Disable fields from being editable if readonly.
							form.fields.name.setReadonly( readonly );
							form.fields.sx.setReadonly( readonly );
							form.fields.sy.setReadonly( readonly );
							form.fields.sw.setReadonly( readonly );
							form.fields.sh.setReadonly( readonly );
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
				( selectedType, object ) => {
					//--------------------------------
					// Check Program Availability
					//--------------------------------
					// Gatekeep with file status check.
					let s; if ( !(s=client.getFileStatus(tool)) ) return false; // abort
					// Only if client is running.
					if ( client.skim('mode')!=='running' ) return;

					//--------------------------------
					// Check If Update Possible
					//--------------------------------
					// Attempt to enable button(s).
					const toolMode	= tool.skim( 'mode' );
					const enabled	= tool.skim( 'enabled' );
					const toolbar	= curator.toolbar;
					const visible	= curator.getVisibleOptions(); // get visible item(s)
					// Get curator object item information.
					const form		= object?.display?.target;
					const data		= object?.data;
					const readonly	= data?.readonly ? true : false;
					// Check to toggle various button(s).
					let toggle		= false; // reusable toggle [bool]
					switch ( selectedType ) {
						case 'group':
							// Buttons only available if a file is open.
							if ( s.janiView!==null ) {
								// Handle fields & buttons.
								if ( visible.length>0 ) {
									// Only enable editing for non-readonly fields.
									if ( !readonly ) {
										// Iterate all fields & toggle if changed.
										let compare		= {
											name : 'name',
											path : 'path'
											};
										// Compare live fields to saved data.
										// Toggle "apply" button if fields changed.
										if ( form.checkFieldInput(data,compare) )
											toolbar.toggle( 'apply', true );
										// Enable image swap button.
										toolbar.toggle( 'image', true );
										// Enable group remove button.
										toolbar.toggle( 'remove', true );
									}
								}
							}
							// Allow new group creation.
							toolbar.toggle( 'create', true );
							break;

						case 'sprite':
							// Buttons only available if a file is open.
							if ( s.janiView!==null ) {
								// Handle fields & buttons.
								if ( visible.length>0 ) {
									// Iterate all fields & toggle if changed.
									let compare		= {
										name: 'name',
										sx: 'sx', sy: 'sy',
										sw: 'sw', sh: 'sh'
										};
									// Compare live fields to saved data.
									// Toggle "apply" button if fields changed.
									if ( form.checkFieldInput(data,compare) )
										toolbar.toggle( 'apply', true );
									// Enable sprite remove button.
									toolbar.toggle( 'remove', true );
								}
							}
							// Allow new sprite creation.
							toolbar.toggle( 'create', true );
							break;
						default: break;
					}
				});

			//-----------------------------
			// Jani File Loading Event(s)
			//-----------------------------
			// Attach an open-file event listener to handle data callback.
			client.register(
				'openedFile', 'loadScrapbookObjects',
				async () => {
					//--------------------------------
					// Check Program Availability
					//--------------------------------
					// Gatekeep with file status check.
					let s; if ( !(s=client.getFileStatus(tool,true)) ) return false; // abort

					// --------------------------------
					// Create Blank Group
					// --------------------------------
					// Create [JestCuratorObject] instance.
					const data		=
						{
						action   : 'group',		// Action type
						file     : s.fileKey,	// Use file's skey
						id       : `group_${jsos.generateKey()}`,
						name     : 'DEFAULT',	// Empty name
						image    : null,		// Default image
						readonly : true			// Cannot be edited
						};
					const object	= curator.addObject( 'group', data, false );

					// --------------------------------
					// Load Sprite Group(s)
					// --------------------------------
					// Iterate all animation groups.
					const groups	= s.ani.groups;
					for ( const [group,filename] of Object.entries(groups) ) {
						//--------------------------------
						// Define [JestCuratorObject]
						//--------------------------------
						// Get default object name.
						const name		= group;	// sprite group name
						const data		=
							{
							action   : 'group',		// Action type
							file     : s.fileKey,	// Use file's skey
							name     : group,		// Name of group
							path     : filename,	// Path of webfile
							image    : null,		// Default image
							readonly : false		// Can be edited
							};
						// Check if default filename is set & get image.
						if ( filename ) { // default filename
							await s.jani.setGroupImage( 'default', group, filename );
							data.image	= s.jani.getImage( 'default', group );
						}
						// Create [JestCuratorObject] instance.
						const object	= curator.addObject( 'group', data, false );
						curator.emit( 'auto:add', null, 'group' );
						// Plan to update the sprite group image.
						await client.refreshGroupImage( tool, object );
					}
					// Emit custom "loaded all groups" event.
					curator.emit( 'auto:load', null, 'group' );

					//-----------------------------
					// Add All Sprite(s)
					//-----------------------------
					const sprites	= s.ani.sprites; // get sprites container
					Object.entries(sprites).forEach(
						( [ index, sprite ] ) => {
							//--------------------------------
							// Define [JestCuratorObject]
							//--------------------------------
							// Get sprite group & sprite name.
							const groups	=
								curator.getByTypeAndProps(
									'group',
									{
									file : s.fileKey,
									name : sprite.group
									});
							const group		= groups.length>0 ? groups[0] : null;
							const name		= sprite.label ?? 'unknown'; // sprite name
							const object	=
								curator.addObject(
									'sprite',
									{
									action   : 'sprite',			// Action type
									file     : s.fileKey,			// Use file's skey
									gid      : group?.data?.id,	    // Sprite group
									sprite   : sprite,				// [AnimationSprite]
									sid      : sprite.id,			// Sprite unique ID
									name     : sprite.label,		// Name of sprite
									sx       : sprite.sx,			// Source X
									sy       : sprite.sy,			// Source Y
									sw       : sprite.width,		// Sprite width (crop)
									sh       : sprite.height,		// Sprite height (crop)
									readonly : false				// Can be edited
									}, false );
							curator.emit( 'auto:add', null, 'sprite' );
							// Plan to update the sprite image.
							client.updateSpriteImage( tool, object );
						});
					// Emit custom "loaded all sprites" event.
					curator.emit( 'auto:load', null, 'sprite' );

					//-----------------------------
					// Refresh & Reload Display(s)
					//-----------------------------
					// Reload options form to reflect animation setting(s).
					client.refreshAnimationControls();
					// Force curator to reload all group(s).
					client.reloadGroups( tool );	// reload group dropdown(s)
					// Auto-select top items in dropdowns.
					curator.selectTopType();		// autoselect first type
					curator.selectTopObject();		// autoselect first object
				});
		},

		//--------------------------------
		// New Method(s) In Animator Application
		//--------------------------------
		extend: function( Klass, proto ) {
			// Add a sprite group (update(s) previousy affected sprite(s), also).
			// RETURNS: [boolean] `true` on success else `false` on fail.
			// * tool	- [object] JestToolScrapbook emitting the event.
			// * data	- [JestCuratorObject] sprite group data to load as new object.
			proto.addGroup = async function( tool, data ) {
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool)) ) return null; // abort

				//--------------------------------
				// Proceed to Add Sprite Group
				//--------------------------------
				// Setup default data for curator group object.
				data.file	= s.fileKey;
				data.name	= data.name ?? 'unnamed'; // capture name
				data.path	= data?.path ? data.path : '';
				data.image	= null; // by default image is null

				// --------------------------------
				// Create Curator Object
				// --------------------------------
				// Check if group already exists.
				if ( !s.ani.hasGroup(data.name) ) {
					//--------------------------------
					// Set Animation Group
					//--------------------------------
					// Create new group inside [AnimationAnimation].
					s.ani.setGroup( data.name, null );
					//for ( const [name,view] of Object.entries(ani.views) )
						//view.setGroup( data.name, null );
					//--------------------------------
					// Creator Group Curator Object
					//--------------------------------
					// Add the sprite to the curator.
					const object	= s.curator.addObject( 'group', data );
					//--------------------------------
					// Proceed to Load Image
					//--------------------------------
					// Check if path to image changed.
					console.log( `Attempting to set initial sprite group image: ${data.path}` );
					const loaded	= await this.setGroupImage( tool, object, data.path );
					console.log( `Finished initializing sprite group image: ${data.path}` );
					if ( !loaded )
						console.warn( `client.addGroup(): Could not load image "${data.path}".` );
					return object; // [JestCuratorObject] instance
				}
				else {
					console.warn( `A sprite group with the name "${data.name}" already exists.` );
					return null; // abort
				}
			}

			// Remove a sprite group (updates all sprites, also).
			// RETURNS: [JestCuratorObject] or [null] on fail.
			// * tool	- [object] JestToolScrapbook emitting the event.
			// * id		- [JestCuratorObject] sprite id being removed.
			proto.removeGroup = function( tool, id ) {
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool)) ) return null; // abort

				//--------------------------------
				// Setup Variable(S)
				//--------------------------------
				// Get selected ID and corresponding object.
				const object	= s.curator.getObjectByType( 'group', id );
				if ( !object ) {
					console.warn( `client.removeGroup(): object missing!` );
					return null; // failed
				}
				// Get object data.
				const data		= object.data;

				//--------------------------------
				// Proceed to Remove Sprite Group
				//--------------------------------
				// Remove item from curator.
				console.log( `Attempting to remove group: ${id}` );
				s.curator.removeObjectByType( 'group', id );

				//--------------------------------
				// Emit Event & Return Curator Object
				//--------------------------------
				// Emit group removed event.
				this.emit( 'group:removed', null, object );
				return object; // [JestCuratorObject] data instance
			}

			// Remove all sprite references to group.
			// RETURNS: [object] containing removed animation & curator sprites.
			// * tool	- [object] JestToolScrapbook emitting the event.
			// * object - [JestCuratorObject] attached to curator
			proto.removeGroupReferences = function( tool, object ) {
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
				const name		= data.name;		// group name
				const gid		= data.id;			// group curator id

				//--------------------------------
				// Return Removed Sprite(s)
				//--------------------------------
				// Remove group from jani animation.
				s.ani.unsetGroup( name );
				//for ( const [name,view] of Object.entries(s.ani.views) )
					//view.unsetGroup( name );

				//--------------------------------
				// Lookup Matching Sprite Objects
				//--------------------------------
				// Find all sprite curator object(s).
				const curatorSprites =
					s.curator.getByTypeAndProps(
						'sprite',
						{
						file : s.fileKey,
						gid  : gid
						});

				//--------------------------------
				// Switch Sprite Group to Default
				//--------------------------------
				// Auto-select a default group for sprites referencing removed group.
				this.switchSpriteGroup( tool, gid, this.getGID(tool,'DEFAULT') );
				// Finally, update group dropdowns to now remove group from dropdown.
				this.reloadGroups( tool );

				//--------------------------------
				// Return Removed Sprite(s)
				//--------------------------------
				// Return edited scrapbook sprites in a container.
				const sprites	=
					{
					curator   : curatorSprites
					};
				return sprites; // [object] of sprites(s)
			}

			// Re-inserts sprite group references (after a redo).
			// RETURNS: [void].
			// * tool		- [object] JestToolScrapbook emitting the event.
			// * object		- [JestCuratorObject] group attached to curator.
			// * sprites	- [object] { curator:[array] }
			proto.restoreGroupReferences = async function( tool, object, sprites ) {
				//--------------------------------
				// Check Program Availability
				//--------------------------------
				// Ensure the file data exists.
				let s; if ( !(s=this.getFileStatus(tool)) ) return false; // abort

				//--------------------------------
				// Extract Saved Sprite Data
				//--------------------------------
				// Access group sprites from the last group removed.
				if ( !sprites ) return false; // nothing to restore
				const curatorSprites	= sprites.curator || [];

				//--------------------------------
				// Setup Variable(S)
				//--------------------------------
				// Get selected ID and corresponding object.
				const data		= object.data;		// curator object data
				const name		= data.name;		// group name
				const gid		= data.id;			// group curator id
				const image		= data.image;		// group image file

				//--------------------------------
				// Reset Sprite Group Image
				//--------------------------------
				// Return group & its image back to jani animation.
				s.ani.setGroup( name, image );

				//--------------------------------
				// Reset Associated Sprite Groups
				//--------------------------------
				// Reset previously correlated sprite groups.
				for ( const object of curatorSprites ) {
					// Capture curator sprite object sprite id.
					const sid		= object.data.sid; // sprite id
					// Access animation sprite using sprite id.
					const sprite	= s.ani.getSpriteByID( sid );
					// Reset sprite's group to group name.
					sprite.setGroup( name ); // set group name
					// Get the curator sprite object form.
					const form	= object.display.getTarget();
					// Re-select the group that was restored in the dropdown.
					form.fields.group.selectOption( gid ); // select group
				}

				//--------------------------------
				// Switch Sprite Group to Restore Group
				//--------------------------------
				// Update group dropdowns to remove group from dropdown.
				this.reloadGroups( tool );

				//--------------------------------
				// Restore Default View & Curator Image Preview(s)
				//--------------------------------
				// Try to reresh group curator image preview.
				await this.refreshGroupImage( tool, object );
			}

			//--------------------------------
			// File Handling Method(s)
			//--------------------------------
			// Image file change action taking place.
			// RETURNS: [void].
			// * tool	- [object] JestToolScrapbook emitting the event.
			proto.imageSelectAction = async function( tool, name ) {
				// Block action if app is busy.
				if ( this.busy() ) return;	// app busy‐gate
				// Switch between requested action taking place.
				switch ( name ) {
					case 'open': // open image file select
						await tool.imageSelect.openFileDialog();
						break;
					default: break;
				}
			}

			// Gets an animation group curator object.
			// RETURNS: Curator group [object] or [null].
			// * tool	- [object] JestToolScrapbook emitting the event.
			// * gid	- [string] Value of group curator object id; [null] for selected.
			proto.getCuratorGroup = function( tool, gid=null ) {
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool,true)) ) return null; // abort

				//--------------------------------
				// Use Selected Curator Object (if no id supplied)
				//--------------------------------
				let object; // return [object]
				if ( gid===null ) {
					// Get selected sprite in curator.
					object	= s.curator.getSelectedObject();	// get selected object
					if ( !object ) {
						console.warn( `client.getCuratorGroup(): group object missing!`)
						return false; // fail
					}
					if ( object.data.type!=='group' ) {
						console.warn( `Non-Group Selected: Cannot attach image.`)
						return false; // fail
					}
					return object; // curator [object]
				}

				//--------------------------------
				// Setup Variable(S)
				//--------------------------------
				// Get selected ID and corresponding object.
				else {
					object	= s.curator.getObjectByType( 'group', gid );
					if ( !object ) {
						console.warn( `client.getCuratorGroup(): group object missing!` );
						return null; // failed
					}
					return object; // curator [object]
				}
			}

			// Change a sprite's sprite group (e.g. via dropdown).
			// RETURNS: [boolean] `true` on success else `false` on fail.
			// * tool		- [object] JestToolScrapbook emitting the event.
			// * object		- [JestCuratorObject] group attached to curator.
			proto.changeSpriteGroup = async function( tool, object ) {
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool,true)) ) return null; // abort

				//--------------------------------
				// Get Previously Selected Sprite Group
				// NOTE: This is for the undo/redo log.
				//--------------------------------
				// Get current logged sprite group id for sprite.
				const gidOld	= object.data.gid;

				//--------------------------------
				// Change Sprite's Sprite Group
				//--------------------------------
				// Update & re-render sprite image preview.
				this.updateSpriteImage( tool, object );

				//--------------------------------
				// Get New Sprite Group
				//--------------------------------
				// Get new selected sprite group id.
				const form		= object.display.target;
				const gidNew	= form.fields.group.getValue();

				//--------------------------------
				// Log Change(s) for Undo/Redo
				//--------------------------------
				// Log snapshot
				const log	= {
					action  : 'spriteGroupChange',
					type    : 'sprite',
					id      : object.data.id,
					old     : gidOld,
					neu     : gidNew
					};
				// Label the action for history panel.
				s.janiView.governor.enqueue(
					'edit', { history: `Changed sprite group.` } );
				// Log inside governor.
				s.janiView.governor.log( 'edit', log );
				s.file.jot( "changed", true );

				// Play sound-effect to signal.
				this.soundboard.playSound( 'jest_success', 'mp3', 1.1 );
			}

			// Change a sprite group's web image file path.
			// RETURNS: [boolean] `true` on success else `false` on fail.
			// * tool		- [object] JestToolScrapbook emitting the event.
			// * object		- [JestCuratorObject] group being rendered.
			// * path		- [string] Value of path to image; [null] to unset
			proto.setGroupImage = async function( tool, object, path=null ) {
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool,true)) ) return null; // abort

				//--------------------------------
				// Skip Inapplicable Objects
				//--------------------------------
				// Compare curator object system key.
				if ( object.data.file!=s.fileKey )
					return; // item in different tab
				// Require curator object to be of type "group".
				if ( object.data.type!=='group' ) {
					console.error( `Curator object must be of type "group".` );
					return false; // abort
				}
				// Extract data from object.
				const data	= object.data;

				//--------------------------------
				// Attempt to Change Group Image
				//--------------------------------
				if ( data.path!==path || !data?.image ) {
					// Record this request.
					const requestId			= (object.imageRequestId ?? 0) + 1;
					object.imageRequestId	= requestId;

					// Preserve the requested filename.
					data.path		= path;
					// Clear the previous image.
					data.image		= null;

					// Load the requested image.
					const success	= await s.jani.setGroupImage( 'default', data.name, path, 'remote', false );

					// Ignore superseded requests.
					if ( object.imageRequestId!==requestId )
						return false;

					// Store the loaded image, or null on failure.
					data.image = success
						? s.jani.getImage( 'default', data.name )
						: null;
				}

				// Update the animation group's default image path [string].
				s.ani.setGroup( data.name, data.path );

				//--------------------------------
				// Refresh Display(s)
				//--------------------------------
				// Try to reresh group curator image preview.
				await this.refreshGroupImage( tool, object );
				// Simple curator display refresh.
				s.curator.display();
				return true; // success
			}

			// Open an image file.
			// RETURNS: [boolean] `true` on success else `false` on fail.
			// * tool		- [object] JestToolScrapbook emitting the event.
			// * gid		- [string] Value of group curator object id.
			// * fileInfo	- File information [object].
			proto.openGroupImage = async function( tool, gid, fileInfo ) {
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool)) ) return null; // abort

				//--------------------------------
				// Suspend Application to Set Image
				//--------------------------------
				// Suspend the app & attempt to open the image.
				this.suspend( 'openGroupImage' ); // suspend app

				//--------------------------------
				// Get Group Curator Object & Data
				//--------------------------------
				// Get selected ID and corresponding object.
				const object	= this.getCuratorGroup( tool, gid );

				//--------------------------------
				// Continue to Load Image File
				//--------------------------------
				try {
					// Require group object to continue.
					if ( !object ) return null; // abort

					//--------------------------------
					// Create Jani File [object]
					//--------------------------------
					// Attempt to read local file if requested.
					if ( fileInfo.network!=='none' ) { // existing jani
						// Use the Secretary to read a local file's data.
						const ok	= await this.imager.readFile( fileInfo );
						if ( ok===null ) {
							console.warn( 'Image file could not be opened!' );
							return null; // failed
						}
						console.log( `Image file opened: "${fileInfo.filename}"` );
					}

					//--------------------------------
					// Access Newly Loaded Image File [object]
					//--------------------------------
					// Get the image that was loaded.
					const image		= this.imager.getFile( fileInfo.address, 'local' );
					if ( !image ) {
						console.warn( 'Image file not found!' );
						return null; // failed
					}

					//--------------------------------
					// Keep Image Ref Inside Curator Object Data
					//--------------------------------
					object.updateData( 'image', image ); // store image [object]
					console.log( `Sprite group "${object.data.name}" opened new image "${fileInfo.address}".` );
				}
				finally {
					this.resume(); // unlock new actions
				}

				//--------------------------------
				// Attempt to Update Sprite Group Image
				//--------------------------------
				// Try to reresh group curator image preview.
				await this.refreshGroupImage( tool, object );
				return object.data.image; // return [ElementImage] object
			}

			// Update a sprite group image (updates all sprites, also).
			// RETURNS: [boolean] `true` on success else `false` on fail.
			// * tool	- [object] JestToolScrapbook emitting the event.
			// * object	- [JestCuratorObject] group being rendered.
			proto.refreshGroupImage = async function( tool, object ) {
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool)) ) return false; // abort

				//--------------------------------
				// Skip Inapplicable Objects
				//--------------------------------
				// Compare curator object system key.
				if ( object.data.file!=s.fileKey )
					return false; // item in different tab
				// Require curator object to be of type "group".
				if ( object.data.type!=='group' ) {
					console.error( `Curator object must be of type "group".` );
					return false; // abort
				}

				//--------------------------------
				// Access New Image File
				//--------------------------------
				// Grab the image file from curator object.
				const image		= object?.data?.image;
				if ( !image ) {
					console.warn( `Image file not not found for group "${object.data.name}".` );
					// Clear the sprites.
					const view	= s.ani.getView( 'default' );
					if ( view ) view.setGroup( object.data.name, null );
					// Clear the canvas.
					const canvas = object.display.getCanvas( 'preview' );
					if ( canvas ) canvas.clear();
					// Clear previews of sprites belonging to this group.
					const sprites = s.curator.getByTypeAndProps( 'sprite', { file: s.fileKey, gid: object.data.id } );
					for ( const sprite of sprites )
						this.updateSpriteImage( tool, sprite );
					return false;
				}

				// Synchronize the existing image with the JANI view.
				const view = s.ani.getView( 'default' );
				if ( view )
					view.setGroup( object.data.name, image );

				/*// Update image inside the active JANI.
				const loaded	=
					await s.jani.setGroupImage(
						// pass view & group name
						'default', object.data.name,
						// image file address & protocol (local or remote)
						image.address, image.network
						);
				// If the image failed to load, clear it & abort.
				if ( !loaded ) {
					console.warn( `Image file failed to load for group "${object.data.name}".` );
					//console.warn( `Setting image file for group "${object.data.name}" to null.` );
					//this.setGroupImage( tool, object, null ); // nullify group image
					object.updateData( 'image', null );
					const canvas = object.display.getCanvas( 'preview' );
					if ( canvas ) canvas.clear();
					return false; // failed
				}
				console.log( `Sprite group "${object.data.name}" image file changed.` );*/

				//--------------------------------
				// Render Sprite Group Preview
				//--------------------------------
				// Register callback if not already registered.
				const ukey	= `displayGroup:${object.skey}`;
				if ( !image || !image?.isRegistered('drawn',ukey) ) {
					// Callback to render sprite group image when loaded.
					image.register(
						'drawn', ukey,
						() => {
							console.log( 'Sprite group image data finished loading! Proceding to render...')
							this.renderGroupImage( tool, object );
						});
				}
				// If image is ready, draw it now.
				const status	= image.skim( 'image' );
				if ( status==='drawn' )  {
					// Remove fallback load trigger-event.
					image.unregister( 'drawn', ukey );
					// Render sprite image.
					console.log( 'Sprite group image data preloaded! Proceding to render...')
					this.renderGroupImage( tool, object );
				}
				else console.log( 'Awaiting sprite group image data load... ')
			}

			// Render a sprite group image & re-render sprites.
			// RETURNS: [boolean] `true` on success else `false` on fail.
			// * tool	- [object] JestToolScrapbook emitting the event.
			// * object	- [JestCuratorObject] group being rendered.
			proto.renderGroupImage = async function( tool, object ) {
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool)) ) return false; // abort
				console.log( `Sprite group "${object.data.name}" image data ready, refreshing preview...` );

				//--------------------------------
				// Skip Inapplicable Objects
				//--------------------------------
				// Compare curator object system key.
				if ( object.data.file!=s.fileKey )
					return; // item in different tab
				// Require curator object to be of type "group".
				if ( object.data.type!=='group' ) {
					console.error( `Curator object must be of type "group".` );
					return false; // abort
				}

				//--------------------------------
				// Get Image File [object]
				//--------------------------------
				// Get the sprite group's image file.
				const image		= object ? object.data.image : null;
				if ( !image ) { // require image
					console.error( `Image file not found!` );
					return false; // abort
				}

				//--------------------------------
				// Check If Image Data Is Ready
				//--------------------------------
				// Require image status to be ready.
				const status	= image.skim( 'image' );
				if ( status!=='drawn' ) return false; // abort
				console.log( 'Sprite group image is ready, rendering preview...' );

				//--------------------------------
				// Proceed to Render Image In Curator
				//--------------------------------
				// Get rendering preview canvas.
				const canvas	= object.display.getCanvas( 'preview' );
				if ( !canvas ) {
					console.warn( `Canvas is missing.` );
					return false; // abort
				}
				// Render sprite inside item's curator preview canvas.
				const sx	= 0;
				const sy	= 0;
				const sw	= Number( image.canvas.width );
				const sh	= Number( image.canvas.height );
				canvas.draw( image.canvas, true, true, 0, 0, sx, sy, sw, sh );
				// Refit the sidebar to match sprite canvas.
				this.sidebar.refit( 'scrapbook' );

				//--------------------------------
				// Proceed to Render Sprites
				//--------------------------------
				// Iterate all sprites attached to group.
				const sprites	=
					s.curator.getByTypeAndProps(
						'sprite',
						{
						file : s.fileKey,
						gid  : object.data.id
						});
				// Iterate all sprites & update their image.
				for ( const [id,spriteObj] of sprites.entries() )
					this.updateSpriteImage( tool, spriteObj );

				//--------------------------------
				// Cleanup Completed Callback(s)
				//--------------------------------
				// Unregister the callback if not already unregistered.
				const ukey	= `displaySprite:${object.skey}`;
				if ( image.isRegistered('drawn',ukey) )
					image.unregister( 'drawn', ukey );
				return true; // success
			}

			// Add a sprite (update(s) previousy affected objects, also).
			// RETURNS: [JestCuratorObject|null].
			// * tool	- [object] JestToolScrapbook emitting the event.
			// * data	- [JestCuratorObject] sprite data to load as new object.
			proto.addSprite = function( tool, data ) {
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool)) ) return null; // abort

				//--------------------------------
				// Proceed to Add Sprite
				//--------------------------------
				// Store data for curator sprite object.
				data.file	= s.fileKey;
				data.gid	= data.gid ?? null;			// capture sprite group
				data.name	= data.name ?? 'unnamed';	// capture sprite name
				// Default sprite region.
				data.sx		= data.sx ?? 0;	// source X
				data.sy		= data.sy ?? 0;	// source Y
				data.sw		= data.sw ?? 0;	// source width
				data.sh		= data.sh ?? 0;	// source height

				// --------------------------------
				// Create New [AnimationSprite]
				// --------------------------------
				// Create [AnimationSprite] instance.
				if ( !data?.sprite || !(data.sprite instanceof AnimationSprite) ) {
					// Add next sprite id to curator sprite data.
					data.sid	= s.ani.getNextSpriteId();
					// Generate an actual sprite in the animation.
					const sprite	= new AnimationSprite(
						data.sid,	// next ID
						data.gid,	// Group dropdown item id
						data.name,	// Label (e.g., 'shadow')
						data.sx,	// source x
						data.sy,	// source y
						data.sw,	// crop widtŻh
						data.sh,	// crop height
						);
					data.sprite	= sprite; // sprite ref
				}
				// Sprite supplied in data.sprite.
				else {
					// Ensure data "sid" matches sprite id.
					data.sid	= data.sprite.getId();
				}

				// Ensure sprite is in the animation.
				s.ani.addSprite( data.sprite );

				// --------------------------------
				// Create Curator Object
				// --------------------------------
				// Add the sprite to the curator.
				if ( true ) {
					// Add the sprite to the curator.
					const object	= s.curator.addObject( 'sprite', data );
					// Emit sprite added event.
					this.emit( 'sprite:added', null, object );
					return object; // [JestCuratorObject] instance
				}
				else {
					console.warn( `A sprite with the name "${data.name}" already exists.` );
					return null; // abort
				}
			}

			// Remove a sprite.
			// RETURNS: [JestCuratorObject|null].
			// * tool	- [object] JestToolScrapbook emitting the event.
			// * id		- [JestCuratorObject] sprite id being removed.
			proto.removeSprite = function( tool, id ) {
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool)) ) return null; // abort

				//--------------------------------
				// Proceed to Remove Sprite
				//--------------------------------
				// Remove item from curator.
				console.log( `Attempting to remove sprite: ${id}` );
				const object	= s.curator.removeObjectByType( 'sprite', id );
				if ( !object ) {
					console.warn( `client.removeSprite(): object missing or not removed!` );
					return null; // failed
				}

				//--------------------------------
				// Emit Event & Return Curator Object
				//--------------------------------
				// Emit sprite removed event.
				this.emit( 'sprite:removed', null, object );
				return object; // [JestCuratorObject] data instance
			}

			// Update a sprite curator [object] image preview.
			// RETURNS: [boolean] `true` on success else `false` on fail.
			// * tool	- [object] JestToolScrapbook emitting the event.
			// * object	- [JestCuratorObject] sprite being rendered.
			proto.updateSpriteImage = async function( tool, object ) {
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool)) ) return false; // abort

				//--------------------------------
				// Skip Inapplicable Objects
				//--------------------------------
				// Compare curator object system key.
				if ( object.data.file!=s.fileKey )
					return; // item in different tab
				// Require curator object to be of type "sprite".
				if ( object.data.type!=='sprite' ) {
					console.error( `Curator object must be of type "sprite".` );
					return false; // abort
				}

				//--------------------------------
				// Get Group & Update Image
				//--------------------------------
				// Get new selected group id.
				const form		= object.display.target;
				const gid		= form.fields.group.getValue();
				// Get sprite group curator object.
				const groups	=
					s.curator.getByTypeAndProps(
						'group',
						{
						file : s.fileKey,
						id   : gid
						});
				const group		= groups.length>0 ? groups[0] : null;

				//--------------------------------
				// Render Image as Sprite In Curator View
				//--------------------------------
				if ( group ) {
					// Update curator sprite object's group id.
					object.updateData( 'gid', gid ); // curator sprite

					// Update the animation sprite's group name.
					const sprite	= s.ani.getSpriteByID( object.data.sid );
					sprite.setGroup( group.data.name ); // animation sprite

					// Update sprite image if sprite group image exists.
					const image	= group.data.image;
					if ( image ) {
						// Try to render sprite (if already loaded).
						this.renderSpriteImage( tool, object );
						//console.log( group.data.name );
					}
					else {
						// Clear the canvas (no image).
						const canvas	= object.display.getCanvas( 'preview' );
						if ( !canvas ) {
							console.warn( 'Canvas is missing.' );
							return false;	// abort
						}
						canvas.clear();	// clear
						//console.log( group.data.name );
						console.log( "No image." );
					}
				}
				else console.log( "No group." );
			}

			// Get a sprite's image [object] (if sprite group has an image).
			// RETURNS: [ElementImage] or [null] if nonexistent.
			// * tool	- [object] JestToolScrapbook emitting the event.
			// * sid	- [int] value of animation sprite id.
			proto.getSpriteImage = function( tool, sid ) {
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool)) ) return null; // abort

				//--------------------------------
				// Get to Curator Sprite Object
				//--------------------------------
				// Iterate all sprites attached to group.
				const sprites	=
					s.curator.getByTypeAndProps(
						'sprite',
						{
						file : s.fileKey,
						sid  : parseInt(sid)
						});
				if ( sprites.length===0 ) { // require sprite
					console.error( 'Sprite not found!' );
					return null; // abort
				}
				const sprite	= sprites[0];

				//--------------------------------
				// Get Image File [object]
				//--------------------------------
				// Check for sprite group.
				const groups	=
					s.curator.getByTypeAndProps(
						'group',
						{
						file : s.fileKey,
						id   : sprite.data.gid
						});
				if ( groups.length===0 ) { // require group
					console.error( 'Sprite group not found!' );
					return null; // abort
				}
				const group		= groups[0];
				// Get the sprite group's image file.
				const image		= group ? group.data.image : null;
				if ( !image ) { // require image
					console.error( 'Image file not found!' );
					return null; // abort
				}
				// Return the image object.
				else return image; // [ElementImage]
			}

			// Render a sprite image preview inside the curator.
			// RETURNS: [boolean] `true` on success else `false` on fail.
			// * tool	- [object] JestToolScrapbook emitting the event.
			// * object	- [JestCuratorObject] sprite being rendered.
			proto.renderSpriteImage = async function( tool, object ) {
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool)) ) return null; // abort

				//--------------------------------
				// Check If Image Data Is Ready
				//--------------------------------
				// Get image element object.
				const image		= this.getSpriteImage( tool, object.data.sid );
				if ( !image ) return false; // abort
				// Require image status to be ready.
				const status	= image.skim( 'image' );
				if ( status!=='drawn' ) return false; // abort

				//--------------------------------
				// Access Sprite Preview Canvas
				//--------------------------------
				// Get rendering sprite canvas.
				const canvas	= object.display.getCanvas( 'preview' );
				if ( !canvas ) {
					console.warn( 'Canvas is missing.' );
					return false; // abort
				}

				//--------------------------------
				// Proceed to Render Sprite In Curator
				//--------------------------------
				// Render sprite inside item's curator preview canvas.
				const sx	= Number( object.data.sx );
				const sy	= Number( object.data.sy );
				const sw	= Number( object.data.sw );
				const sh	= Number( object.data.sh );
				canvas.draw( image.canvas, true, true, 0, 0, sx, sy, sw, sh );
				// Refit the sidebar to match sprite canvas.
				this.sidebar.refit( 'scrapbook' );
				// Emit event to update any canvases reflecting the rendering.
				this.emit( 'sprite:rendered', null, object );

				//--------------------------------
				// Cleanup Completed Callback(s)
				//--------------------------------
				// Unregister the callback if not already unregistered.
				const ukey	= `displayGroup:${object.skey}`;
				if ( image.isRegistered('drawn',ukey) )
					image.unregister( 'drawn', ukey );
				return true; // success
			}

			// Get curator sprite groups ID [string] using its code name (e.g. "SPRITES").
			// RETURNS: Group id [string] or [null].
			// * tool	- [JestToolScrapbook] emitting the event.
			// * name	- [string] value of group name (e.g. "SPRITES").
			proto.getGID = function( tool, name ) {
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool)) ) return false; // abort

				//--------------------------------
				// Get New Group Curator Object
				//--------------------------------
				// Find default group curator object.
				const groups	=
					s.curator.getByTypeAndProps(
						'group', { file: s.fileKey, name } );
				// Forbid creation if group name already exists.
				if ( groups.length<1 ) {
					console.warn( `Cannot find group "${name}"!` );
					return null; // abort
				}
				// Return group curator object id.
				return groups[0].data.id;
			}

			// Change curator sprite groups from one group to another.
			// * tool	- [JestToolScrapbook] emitting the event.
			// * oldID	- [string] value of group id being changed from.
			// * newID	- [string] value of group id being changed to ([null] for default).
			proto.switchSpriteGroup = function( tool, oldID, newID ) {
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool)) ) return false; // abort

				//--------------------------------
				// Get New Group Curator Object
				//--------------------------------
				// Find default group curator object.
				const groups	=
					s.curator.getByTypeAndProps(
						'group', { file: s.fileKey, id: newID } );
				// Forbid creation if group name already exists.
				if ( groups.length<1 ) {
					console.warn( `Cannot find group "${newID}"!` );
					return; // abort
				}

				//--------------------------------
				// Reset Sprite Groups & Update
				//--------------------------------
				// Get sprite group & sprite name.
				const sprites	=
					s.curator.getByTypeAndProps(
						'sprite',
						{
						file : s.fileKey,
						gid  : parseInt(newID)
						});
				// Iterate sprites & select default option.
				for ( const sprite of sprites ) {
					// Get the curator sprite object form.
					const form	= object.display.getTarget();
					// Select the new group option.
					form.fields.group.selectOption( newID ); // select group
				}
			}

			// Refresh the curator display select, dropdowns, etc.
			// * tool		- [JestToolScrapbook] emitting the event.
			// * bookmark	- [bool] Whether to retain/"bookmark" active selection.
			proto.refreshCurator = function( tool, bookmark=true ) {
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool,true)) ) return false; // abort

				//--------------------------------
				// Refresh Curator Display(s)
				//--------------------------------
				// Preserve current selected id.
				const type	= s.curator.typeBox.getValue();
				const id	= s.curator.selectBox.getValue();
				// Force curator list(s) refresh.
				s.curator.flushVisibleCache();	// flush cache
				s.curator.refreshOptions();		// refresh
				// Restore selection if requested.
				if ( bookmark && s.curator.objects[id] ) {
					s.curator.setType( type );	// retain type selection
					s.curator.select( id );		// retain object selection
				}
				else s.curator.select();		// auto-select (if needed)
			}

			// Update group dropdown options.
			// * tool	- [JestToolScrapbook] emitting the event.
			proto.reloadGroups = function( tool ) {
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool,true)) ) return false; // abort

				//--------------------------------
				// Refresh Curator Display(s)
				//--------------------------------
				// First reload curator to ensure an up-to-date query.
				this.refreshCurator( tool ); // refresh curator

				//--------------------------------
				// Update All Applicable Group
				// Dropdown Select Inputs
				//--------------------------------
				// Access tool's primary curator.
				const groupCache	= s.curator.skim( 'groupCache' );
				// Update all group select-dropdown(s).
				const groups		= s.curator.getVisibleObjects( 'group' );
				groupCache.emit(
					'update-groups', null, groups
					// `option`	- A single option from `this.options` – an [object] like `{ value, label }`
					// `input`	- current bound [JestInputSelect] instance receiving the options
					/*( optionObj, inputSelect ) => {}*/
					);

				//--------------------------------
				// Refresh Curator Display(s)
				//--------------------------------
				// Force curator to reflect freshly filtered group(s).
				this.refreshCurator( tool ); // refresh curator
			}

			// Auto-select a sprite group inside a curator sprite [object].
			// RETURNS: [boolean] `true` on success else `false` on fail.
			// * tool		- [object] JestToolScrapbook emitting the event.
			// * objects	- [array<JestCuratorObject>] being rendered.
			proto.autoselectGroup = async function( tool, objects ) {
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool)) ) return false; // abort

				//--------------------------------
				// Validate Argument(s)
				//--------------------------------
				// Pare & validate argument(s).
				if ( !Array.isArray(objects) ) {
					if ( typeof objects==='object' )
						objects	= [ objects ];
					else {
						console.warn( `autoselectGroup() Invalid Argument "objects".` )
						return false; // bad argument
					}
				}

				//--------------------------------
				// Validate Argument(s)
				//--------------------------------
				// Iterate object(s) & auto-select sprite group.
				for ( const [id,object] of objects.entries() ) {
					// If object is not part of current tab, skip.
					if ( object.data.file!=s.fileKey )
						continue; // item in different tab

					// Select sprite group (if set).
					const gid	= object.data.gid; // sprite group id
					const form	= object.display.getTarget();
					//console.log( `Auto-selecting option: ${group}` );
					form.fields.group.selectOption( gid );
				}
			}
		}
	};

	//--------------------------------
	// Register With Animator
	//--------------------------------
	if ( window.JestAnimator && typeof window.JestAnimator.use==='function' )
		window.JestAnimator.use( type, plugin );
	else console.error( 'scrapbook.plugin.js load error: JestAnimator.use() not found' );
})( window );
