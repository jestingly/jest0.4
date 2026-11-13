//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/tools/entities/entities.tool.js loaded' );

//-------------------------
// Entities Plugin
//-------------------------
(function( window ) {
	// Generate an entity hook edit form inside the curator.
	// * client		- [object] parent reference
	// * tool		- [JestToolEntities] instance
	// * object		- [JestCuratorObject] for hook group data
	const createHookForm	= function( client, tool ) {
		// Block action if app is busy.
		//if ( client.busy() ) return; // app busy‐gate
		//--------------------------------
		// Create Data Form (to edit entity hook)
		//--------------------------------
		// Create DOM Panel element [object].
		const form		= new JestForm( client );
		form.build(); // build the form

		//--------------------------------
		// Create String Input Fields
		//--------------------------------
		// Create fields.
		const fields	= {
			path	: 'Path',
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
		// Create Numeric Input Fields
		//--------------------------------
		// Create coordinate fields for positioning hooks.
		const numFields	= {
			x	: 'X Position',
			y	: 'Y Position'
			};
		for ( const key in numFields ) {
			// Create numeric input.
			const input	=
				new JestInputNumber(
					client, key, null,
					0,					// default value
					numFields[key],		// placeholder
					null,				// no label
					null, null, 0.25	// min, max, step
					);

			input.build( `input-${key}` );
			input.panel.addAttribute( 'data-tooltip', numFields[key] );
			form.addField( key, input );
		}

		//--------------------------------
		// Manually Modify Some Field(s)
		//--------------------------------
		// Disable some fields.
		//form.fields.x.setReadonly(); // read-only
		//form.fields.y.setReadonly(); // read-only

		//--------------------------------
		// Manually Create a Textarea
		//--------------------------------
		// Create script text-area input [object]
		const input2	= new JestInputTextarea( client, 'script', null, null, 'script', 3 );
		input2.build( `input-script` );		// build field
		input2.panel.addAttribute( 'data-tooltip', 'Hook Script' );
		form.addField( 'script', input2 );	// add field to form

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
	const subtype	= 'entities';

	//--------------------------------
	// Plugin Definition
	//--------------------------------
	const plugin = {
		//--------------------------------
		// Initialize Plugin
		//--------------------------------
		// Called once when plugin is registered.
		// * client - [object] reference to JestTiler
		init: function( client ) {
			//-------------------------
			// Create Entities Tool
			//-------------------------
			// Instantiate marquee tool
			const tool = new JestToolEntities( client, subtype );
			client.toolbox.registerTool( subtype, tool );
			tool.build(); // build the tool

			//-------------------------
			// Entities Toolbar Button
			//-------------------------
			// Add a tool button for selecting and moving hooks.
			const button = client.toolbar.createButton(
				{ name : subtype, text : null /*'Entities'*/ } );
			button.clicker.addAttribute( 'data-tooltip', 'Entities' );
			button.clicker.addAttribute( 'data-tooltip-keys', 'N' );
			//-----------------------------
			// Icon Entities
			//-----------------------------
			button.clicker.addElements([
				//-----------------------------
				// Icon Marquee
				//-----------------------------
				{
					name       : 'icon',
					tag        : 'svg',
					attributes : {
						xmlns        : "http://www.w3.org/2000/svg",
						viewBox      : "-5.0 -10.0 110.0 135.0",
						width        : "24",
						height       : "24",
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
										'd': 'm55.211 76.527c10.035-1.9609 18.094-9.4688 20.848-19.191 0.67188-2.3711 2.9141-3.9492 5.3711-3.7812 2.4609 0.17187 4.4609 2.0469 4.8008 4.4883l1.2188 8.8008-4.2773 0.59375c-6.2891 11.891-18.793 20.004-33.168 20.004-14.379 0-26.879-8.1094-33.168-20.004l-4.2812-0.59375 1.2188-8.8008c0.33984-2.4414 2.3438-4.3164 4.8008-4.4883 2.457-0.16797 4.6992 1.4102 5.3711 3.7812 0.48828 1.7148 1.1367 3.3594 1.9336 4.9141 3.7266 7.2812 10.648 12.66 18.914 14.277v-21.316h-12.914v-10.418h12.914v-6.2344c-4.9844-2.0547-8.4922-6.9609-8.4922-12.676 0-7.5664 6.1367-13.707 13.703-13.707 7.5625 0 13.699 6.1406 13.699 13.707 0 5.7148-3.5078 10.621-8.4922 12.676v6.2344h12.914v10.418h-12.914zm-5.207-53.934c-1.8125 0-3.2891 1.4727-3.2891 3.2891 0 1.8125 1.4766 3.2852 3.2891 3.2852s3.2891-1.4727 3.2891-3.2852c0-1.8164-1.4766-3.2891-3.2891-3.2891z',
										'fill-rule': 'evenodd'
									}
							}
						]
				}]);

			// Activate the Entities tool when selected.
			client.register(
				'equip', subtype,
				( name ) => {
					// Require matching tool.
					if ( name!==subtype ) return;
					// Block action if application is busy.
					if ( client.busy() ) return;

					// Equip the tool.
					client.toolbox.setTool( tool );
					// Enable the Entities sidebar.
					client.sidebar.enableSection( subtype );
					// Activate the toolbar button.
					client.toolbar.buttons[name].activate();
				});

			// Define keyboard shortcut.
			client.io.registerShortcut( 'N', subtype );
			// Keyboard shortcut menu action.
			client.io.register( 'keyboardShortcut', 'entitiesCommand',
				command => {
					// Block input shortcuts while user is typing
					if ( client.io.isTypingInInput() ) return;
					// Affirm shortcut command is for "draw" tool.
					if ( command===subtype )
						client.toolbox.setTool( subtype );
				});

			//--------------------------------
			// Assign Workspace Canvas
			//--------------------------------
			// Connect entity interactions to the level canvas.
			const canvas = client.gameboard.display.getCanvas( 'workspace' );
			tool.setTarget( canvas );

			//--------------------------------
			// Create the Entities Curator
			//--------------------------------
			// Create tool curator.
			tool.addCurator( 'primary' );
			const curator	= tool.curators.primary; // shorthand

			// Register a sticker type in the curator.
			curator.registerType( 'hook' );

			//--------------------------------
			// Entity Hit-Test Provider
			//--------------------------------
			// Supply visible entity hooks for mouse interaction.
			tool.register(
				'getEntities', 'curatorHooks',
				( items ) => {
					// Require an active level.
					const s = client.getFileStatus( tool, true );
					if ( !s ) return;
					// Retrieve visible hook objects.
					const hooks = curator.getVisibleObjects( 'hook' );
					// Include only hooks belonging to the active level.
					for ( const object of hooks ) {
						if ( object.data.file!==s.fileKey ) continue;
						items.push( object );
					}
				});

			//--------------------------------
			// Entity Canvas Selection
			//--------------------------------
			// Select the clicked entity in the curator.
			tool.register(
				'selected', 'curatorSelect',
				( object ) => {
					// Require a valid object.
					if ( !object ) return;
					// Select the matching curator item.
					curator.select( object.data.id );
				});

			//-------------------------
			// Entity Undo / Redo
			//-------------------------
			// Handle undo and redo operations for entity hooks.
			client.register(
				'revert', 'levelEntitiesCuratorHooks',
				( dir, snapshot ) => {
					//--------------------------------
					// Validate Snapshot
					//--------------------------------
					if ( !snapshot ) return;
					if ( !['undo','redo'].includes(dir) ) return;

					// Require an active level.
					const s = client.getFileStatus( tool, true );
					if ( !s ) return;

					//--------------------------------
					// Identify Entity Action
					//--------------------------------
					const action = snapshot.action;
					const id	 = snapshot.id;

					// Retrieve the affected curator object.
					const object = curator.objects[id] ?? null;

					// Determine which state to restore.
					const state = dir==='undo'
						? snapshot.before
						: snapshot.after;

					//--------------------------------
					// Revert Entity Operation
					//--------------------------------
					switch ( action ) {
						//-----------------------------
						// Move Hook
						//-----------------------------
						case 'hookMove': {
							// Require an existing entity.
							if ( !object ) return;
							if ( object.data.file!==s.fileKey ) return;
							if ( !state ) return;

							// Restore entity coordinates.
							object.updateData( 'x', state.x );
							object.updateData( 'y', state.y );

							// Synchronize curator fields.
							const form = object.display?.target;
							if ( form ) {
								form.setValue( 'x', state.x );
								form.setValue( 'y', state.y );
							}
							break;
						}

						//-----------------------------
						// Add Hook
						//-----------------------------
						case 'hookAdd': {
							// Future implementation:
							// undo -> remove hook
							// redo -> recreate hook
							break;
						}

						//-----------------------------
						// Remove Hook
						//-----------------------------
						case 'hookRemove': {
							// Future implementation:
							// undo -> recreate hook
							// redo -> remove hook
							break;
						}

						//-----------------------------
						// Edit Hook
						//-----------------------------
						case 'hookEdit': {
							// Future implementation:
							// undo -> restore previous properties
							// redo -> restore edited properties
							break;
						}

						//-----------------------------
						// Unknown Action
						//-----------------------------
						default: return;
					}

					//--------------------------------
					// Finish Reversion
					//--------------------------------
					// Mark the level as modified.
					s.file.jot( 'changed', true );
				}
			);

			//--------------------------------
			// Live Entity Position Updates
			//--------------------------------
			// Update the curator's coordinate fields while dragging.
			tool.register(
				'dragging', 'updateCoordinates',
				( info ) => {
					// Get the selected entity.
					const object = info.object;
					if ( !object ) return;
					// Access the entity editing form.
					const form = object.display?.target;
					if ( !form ) return;
					// Update numeric fields without emitting input events.
					form.fields.x.setValue( info.x, false );
					form.fields.y.setValue( info.y, false );
				});

			//--------------------------------
			// Entity Drag Completion
			//--------------------------------
			// Record completed movements in the level governor.
			tool.register(
				'dragged', 'recordMovement',
				( info ) => {
					//--------------------------------
					// Validate File State
					//--------------------------------
					// Require file tab state to be ready.
					const s = client.getFileStatus( tool, true );
					if ( !s ) return;

					// Access the object being dragged.
					const object = info.object;
					if ( !object ) return;
					// Object must belong to current tab.
					if ( object.data.file!==s.fileKey ) return;

					//--------------------------------
					// Validate Movement
					//--------------------------------
					// Register the movement A -> B coordinates.
					const before = info.before;
					const after  = info.after;
					// Object did not move, abort.
					if ( before.x===after.x && before.y===after.y ) return;

					//--------------------------------
					// Log Movement
					//--------------------------------
					// Log the movement for the undo/redo handler.
					const log = {
						action : 'hookMove',
						type   : 'hook',
						id	 : object.data.id,
						before,
						after
						};
					// Actually register it inside the handler.
					s.levelView.governor.enqueue( 'edit', { history: 'Move hook.' } );
					s.levelView.governor.log( 'edit', log );
					s.levelView.governor.dequeue( 'edit' );

					//--------------------------------
					// Mark File as Modified
					//--------------------------------
					// Let the application know file needs savd.
					s.file.jot( 'changed', true );
				});

			//--------------------------------
			// Curator Main Filtering Event
			//--------------------------------
			// Only display hooks belonging to the active level.
			curator.register(
				'filter', 'tabObjects',
				( type, data, object ) => {
					//--------------------------------
					// Check Program Availability
					//--------------------------------
					let s; if ( !(s=client.getFileStatus(tool,true)) ) return false;

					//--------------------------------
					// Filter Curator Objects By File
					//--------------------------------
					if ( type==='hook' ) {
						if ( data.file!==s.fileKey )
							object.jot( 'visible', false );
					}
				});

			//--------------------------------
			// Create Entities Sidebar Menu
			//--------------------------------
			// Add the entities panel to the sidebar.
			client.sidebar.addDisableExclusion( subtype ); // prevent forced collapse
			client.sidebar.addSection( subtype, 'Entities', null );
			client.sidebar.refit( subtype ); // resize to fit contents
			const entitiesMenu	= client.sidebar.getSection( subtype );

			//-------------------------
			// Add Entities Curator
			//-------------------------
			// Add curator panel to the entities sidebar menu.
			entitiesMenu.addItem( 'curator', curator.panel );
			// Register the select event to refit the menu to match contents.
			curator.register(
				'displayed', 'curator',
				() => client.sidebar.refit(subtype)
				);

			//-------------------------
			// Add Entities Controller Form
			//-------------------------
			// Add create button to curator.
			curator.toolbar.createButton( { name: 'create', text: '+ Entity' } );
			curator.toolbar.buttons.create.register(
				'click', 'create-entity',
				() => curator.emit( 'btnCreate' )
				);

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
						case 'hook':
							// Get hook object definer modal.
							modal	= client.modals.newHook;
							// Open the modal.
							modal.open( type );
							break;
						default: break;
					}
				});

			//--------------------------------
			// Expanded Hook Script Editor
			//--------------------------------
			// Open the selected hook's script in a larger modal editor.
			// Changes return to the curator form; Apply still saves them.
			client.addModal(
				'editHookScript',
				{
					title : 'Hook Script',
					text  : 'Edit the script below. Click "Apply" to automatically update the hook script.',
					inputs :
						[
						{
							name		: 'script',
							type		: 'textarea',
							label		: 'Script',
							placeholder	: 'Hook script'
						}
						],
					buttons : {
						cancel :
							{
								label	: 'Cancel',
								onClick	: () => client.modals.editHookScript.close()
							},
						confirm		: {
							label	: 'Apply',
							onClick	:
								() => {
									// Access the modal.
									const modal		= client.modals.editHookScript;
									const object	= modal.payload; // get hook data
									// Do not edit a readonly or no-longer-existing hook.
									if ( !object || object.data.readonly===true ) return;

									// Access the hook's curator form.
									const form	= object.display?.target;
									if ( !form ) return;

									// Copy back to the original form without saving the level.
									form.setValue( 'script', modal.inputs.script.getValue() );

									// Apply the changes automatically to the hook.
									curator.emit( 'btnApply' );
									modal.close(); // close the modal
								}
						}
					}
				});

			// Set a large, but viewport-constrained, editing area.
			const scriptModal	= client.modals.editHookScript;
			scriptModal.box.el.style.width		= 'min(1000px, 92vw)';
			scriptModal.box.el.style.maxWidth	= '92vw';
			scriptModal.box.el.style.maxHeight	= '92vh';
			// Modify the NPC "code box" editing area.
			const scriptArea	= scriptModal.inputs.script.panel.el.querySelector('textarea');
			if ( scriptArea ) {
				scriptArea.style.width		= '100%';
				scriptArea.style.boxSizing	= 'border-box';
				scriptArea.style.height		= 'min(65vh, 680px)';
				scriptArea.style.resize		= 'vertical';
				scriptArea.style.fontFamily	= 'monospace';
				scriptArea.style.tabSize	= '4';
			}

			// Add the "Expand Script" button to the curator.
			curator.toolbar.createButton( { name: 'expand', text: 'Script' } );
			// Open a modal when user clicks button to expand script editing.
			curator.toolbar.buttons.expand.register(
				'click', 'expandHookScript',
				() => {
					// Get current selected object in the curator.
					const object	= curator.getSelectedObject();
					if ( !object || object.data.type!=='hook' ) return;
					if ( object.data.readonly===true ) return;
					// Get the item form.
					const form		= object.display?.target;
					if ( !form ) return;
					// Always load the current *unsaved* form value.
					scriptModal.inputs.script.setValue( form.getValue('script') ?? '' );
					scriptModal.open( object );
				});

			//-------------------------
			// Add Entity Apply Button
			//-------------------------
			// Create a button to apply entity changes.
			curator.toolbar.createButton( { name: 'apply', text: 'Apply' } );
			// Register the apply button event.
			curator.toolbar.buttons.apply.register(
				'click', 'apply-entity',
				() => curator.emit( 'btnApply' )
				);

			//-------------------------
			// Apply Entity Hook Changes
			//-------------------------
			// Apply edited values from the curator form.
			curator.register(
				'btnApply', subtype,
				async () => {
					// Gatekeep with file status check.
					let s; if ( !(s=client.getFileStatus(tool)) ) return false;

					//--------------------------------
					// Access Selected Object
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

					// Perform action based upon object type.
					switch ( type ) {
						case 'hook': {
							// Access input stack.
							const form	= display.target;
							//--------------------------------
							// Capture Edited Values
							//--------------------------------
							// Read the current form fields.
							const path		= form.getValue('path').toString();
							const script	= form.getValue('script').toString();

							// Read the coordinates.
							const x			= Number( form.getValue('x') );
							const y			= Number( form.getValue('y') );

							// Validate coordinates.
							if ( !Number.isFinite(x) || !Number.isFinite(y) )
								return false;

							//--------------------------------
							// Update Hook Image
							//--------------------------------
							// Load a new image if its path changed.
							if ( data.path!==path ) {
								const success	= await client.setHookImage( tool, object, path );
								if ( !success )
									console.log( 'Failed to set requested image for hook: '+path );
							}

							//--------------------------------
							// Update Hook Data
							//--------------------------------
							// Store the edited values.
							object.updateData( 'script', script );
							// Store the coordinates.
							object.updateData( 'x', x );
							object.updateData( 'y', y );

							// Update the curator dropdown label.
							s.curator.updateOptionLabel( data.id, path || '' );
							// Mark the level as modified.
							s.file.jot( 'changed', true );

							// Play sound-effect to signal.
							client.soundboard.playSound( 'jest_success', 'mp3', 1.1 );

							// Refresh curator.
							curator.emit( 'changed', null, object );
							break; }
						// Unknown object type.
						default: break;
					}
				});

			// --------------------------------
			// Create New Hook Modal
			// --------------------------------
			// Generate the hook modal.
			client.addModal(
				'newHook',
				{
					title   :	'Create Hook',
					text	:	'Name your hook entity:',
					inputs  :
						[
						{
							name		: 'path',
							placeholder : 'e.g. misc/antagokilledpachuka.png',
							label	   : 'path'
						},
						{ name: 'x', placeholder: 'X', label: 'X Coord', default: 0 },
						{ name: 'y', placeholder: 'Y', label: 'Y Coord', default: 0 },
						{
							label	   : 'script',
							name		: 'script',
							type		: 'textarea',
							placeholder :
								`if ( condition ) {\n\tsomeCommand1();\n}\nelse {\n\tsomeCommand12();\n}`
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
									client.modals.newHook.emit( 'cancel', null );
									// Close the modal.
									client.modals.newHook.close();
								}
						},
						confirm : {
							label   :	'Confirm',
							onClick :
								() => {
									// Get curated object type.
									const modal	= client.modals.newHook;
									modal.emit( 'confirm', null, modal.payload );
								}
						}
					}
				});

			// Wire modal to reset inputs when opening.
			client.modals.newHook.register(
				'preopen', 'reset', e=>client.modals.newHook.resetInputs() );

			// Register hook definition listener (sent via modal button).
			// NOTE: This creates an object in the curator entities list.
			client.modals.newHook.register(
				'confirm', 'createHook',
				async ( type ) => {
					//--------------------------------
					// Check Program Availability
					//--------------------------------
					// Gatekeep with file status check.
					let s; if ( !(s=client.getFileStatus(tool)) ) return false; // abort

					//--------------------------------
					// Get Input Value(s) (from modal)
					//--------------------------------
					// Get user input from modal.
					const modal		= client.modals.newHook;
					// Check hook script input.
					const path		= String(modal.inputs.path.getValue() ?? '').trim();
					const rawX		= String(modal.inputs.x.getValue() ?? '').trim();
					const rawY		= String(modal.inputs.y.getValue() ?? '').trim();
					const script	= String(modal.inputs.script.getValue() ?? '').trim();

					//--------------------------------
					// Resolve Input Image Path
					//--------------------------------
					// Validate input field value(s).
					let image = null;
					if ( path ) {
						// Validate path file information.
						const fileInfo	= client.getFileInfo( path, null, null, null, 'remote' );
						if ( !fileInfo || !client.imager.filetypes.includes(fileInfo.extension) ) {
							alert( 'Enter a supported image path.' );
							return false;
						}

						// Resolve the image before creating the hook so failed paths
						// do not leave a broken object or history entry behind.
						try {
							image = await client.imager.loadFile( fileInfo.address, 'remote' );
						}
						catch ( error ) {
							console.warn( 'Could not load hook image:', error );
						}

						// If the image did not load, alert user.
						if ( !image )
							alert( 'Could not load the image. Check the path.' );
					}
					/*else {
						alert( 'Enter an image path for the hook.' );
						return false;
					}*/

					//--------------------------------
					// Validate Input Value(s)
					//--------------------------------
					// Convert coordinates to numbers.
					const x		= Number( rawX );
					const y		= Number( rawY );
					if ( !rawX || !rawY || !Number.isFinite(x) || !Number.isFinite(y) ) {
						alert( 'Enter valid numeric X and Y coordinates.' );
						return false;
					}

					// An asynchronous load can finish after the user changes tabs.
					if ( client.getFileStatus(tool)?.fileKey!==s.fileKey ) return false;

					//--------------------------------
					// Begin Data For New Curator Object
					//--------------------------------
					// Store data for curator hook object.
					const data		= {};		// new curator [object] data
					data.path		= path;		// capture hook image path
					data.x			= x;		// capture hook X coordinate
					data.y			= y;		// capture hook Y coordinate
					data.script		= script;	// capture hook script
					data.readonly	= false;	// can be edited

					// --------------------------------
					// Create Curator Object
					// --------------------------------
					// Create a new hook.
					const object	= client.addHook( tool, data );
					if ( !object ) return false;

					// --------------------------------
					// Create Custom Dropdown Label
					// --------------------------------
					// Item label should match the image path.
					curator.updateOptionLabel( object.data.id, path );

					// --------------------------------
					// Preload Image Into Hook
					// --------------------------------
					// If an image was set & exists, load its preview.
					if ( image ) {
						// addHook initializes image to null; attach the resolved image.
						object.updateData( 'image', image );
						// Refresh the image for display.
						await client.refreshHookImage( tool, object );
						// Refresh the curator hooks dropdown list.
						client.reloadHooks( tool );
					}

					// --------------------------------
					// Log Action Inside Editing File Governor
					// --------------------------------
					// Log undo/redo action.
					const log	= {
						action  : `hookAdd`,
						type	: 'hook',
						id	  : object.data.id,
						object  : { ...object.data, image: null }
						};
					// Label the action for history panel.
					s.levelView.governor.enqueue(
						'edit', { history: `Add hook.` }
						);
					// Log inside governor.
					const snapshot	= s.levelView.governor.log( 'edit', log );
					s.file.jot( 'changed', true );

					//--------------------------------
					// Emit Added Event & Finish
					//--------------------------------
					// Emit event signaling hook was manually created by user.
					s.curator.emit( 'manual:hook:added', null, snapshot, object );
					// Play sound-effect to signal.
					client.soundboard.playSound( 'jest_success', 'mp3', 1.1 );
					// Force-close modal just in case.
					modal.close();
				});

			// --------------------------------
			// Refresh & Remmber Settings Between Tab Change
			// --------------------------------
			client.tabbarFile.register(
				'pretabChange', 'entitiesRemember',
				() => {
					const s = client.getFileStatus( tool, true );
					if ( s ) curator.rememberSelection( s.fileKey );
				});

			// Create event for when tab is changed, to switch file.
			client.tabbarFile.register(
				'tabChange', 'entitiesRefresh',
				( view ) => {
					// --------------------------------
					// Reload Dropdown(s)
					// --------------------------------
					client.reloadHooks( tool );
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
			curator.toolbar.panel.addPanel( 'imagine', tool.panel );
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

			/*// Create action when an image file is selected.
			tool.imageSelect.register(
				'select', 'openFile',
				async ( fileInfo ) => {
					// Gatekeep with file status check.
					let s; if ( !(s=client.getFileStatus(tool)) ) return false; // abort

					//--------------------------------
					// Get Selected Group Curator Object
					//--------------------------------
					// Get selected hook in curator.
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
						type	: 'group',
						id	  : data.id,
						old	 : oldImage,
						neu	 : newImage
						};

					// Play sound-effect to signal.
					client.soundboard.playSound( 'jest_success', 'mp3', 1.1 );
				});*/

			// Add an item to curator.
			curator.register(
				'add', subtype,
				( object ) => { // * object - [JestCuratorObject]
					//--------------------------------
					// Check Program Availability
					//--------------------------------
					// Gatekeep with file status check.
					const s = client.getFileStatus( tool, true );
					if ( !(s) ) return false; // abort

					//--------------------------------
					// Add an Entity Hook
					//--------------------------------
					// Determine type.
					const type	= object.data.type; // object type
					switch ( type ) {
						case 'hook': {
							// Create a canvas for drawing the entity hook image.
							object.display.addCanvas( 'preview' );	// add canvas
							// Insert an editable field(s) form.
							const form	= createHookForm( client, tool );
							object.display.setTarget( form );		// add form
							// Live-update NPC coordinates "arrow-buttons" listener.
							for ( const axis of ['x','y'] ) {
								form.fields[axis].register(
									'input', 'liveMove',
									( value ) => {
										// Require hook to belong to current tab.
										const s = client.getFileStatus( tool, true );
										if ( !s || object.data.file!==s.fileKey ) return;
										// Validate numeric field value.
										if ( !Number.isFinite(value) ) return;
										// Update the NPC coordinates.
										object.updateData( axis, value );
										// Mark the file as changed / altered.
										s.file.jot( 'changed', true );
									});
							}
							// Update hook dropdowns.
							client.reloadHooks( tool );
							break; }
						default: break;
					}
				});

			//-------------------------
			// Curator Object Display
			//-------------------------
			// Populate the form when an entity hook is selected.
			curator.register(
				'display', subtype,
				( object ) => {
					// Require a valid hook object.
					if ( !object || object.data.type!=='hook' ) return;

					//--------------------------------
					// Populate Hook Form
					//--------------------------------
					// Access the entity's form and data.
					const form	= object.display.target;
					const data	= object.data;

					// Populate the form fields.
					form.setValue( 'path', data.path ?? '' );
					form.setValue( 'script', data.script ?? '' );
					form.setValue( 'x', data.x ?? 0 );
					form.setValue( 'y', data.y ?? 0 );

					//--------------------------------
					// Handle Readonly State
					//--------------------------------
					// Enable or disable editing.
					const readonly	= data.readonly===true;

					form.fields.path.setReadonly( readonly );
					form.fields.script.setReadonly( readonly );
					form.fields.x.setReadonly( readonly );
					form.fields.y.setReadonly( readonly );
				});

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
					const visible	= curator.getVisibleOptions();	// get visible items
					const selected	= curator.getSelectedObject();	// get selected item
					// Get curator object item information.
					const form		= object ? object.display.target : null;
					const data		= object ? object.data : null;
					// Check to toggle various button(s).
					let toggle		= false; // reusable toggle [bool]
					switch ( type ) {
						// Handle hook items list dropdown selected.
						case 'hook':
							//--------------------------------
							// Enable Script Editor Box
							//--------------------------------
							// If an item is selected, allow script box.
							if ( selected )
								toolbar.toggle( 'expand', true );

							//--------------------------------
							// Enable Create
							//--------------------------------
							// Always allow creating a new hook.
							toolbar.toggle( 'create', true );

							//--------------------------------
							// Enable Apply Only If Modified
							//--------------------------------
							if ( selected ) {
								// Compare editable fields against saved hook data.
								const compare	= {
									path	: 'path',
									script	: 'script',
									x		: 'x',
									y		: 'y'
									};

								// Enable Apply only when an editable hook has changes.
								const changed	=
									form && data && data.readonly!==true
									&& form.checkFieldInput( data, compare );
								// Enable the apply button.
								toolbar.toggle( 'apply', Boolean(changed) );
							}

							//--------------------------------
							// Handle File Menu Button(s)
							//--------------------------------
							// Allow copy, cut and delete.
							if ( selected && tool.enabled() ) {
								client.filemenu.toggle( 'copy', true );		// copy is allowed
								client.filemenu.toggle( 'cut', true );		// cut is allowed
								client.filemenu.toggle( 'delete', true );	// delete is allowed
							}
							break;

						// Unknown dropdown list selected.
						default:
							// Disable the apply button.
							toolbar.toggle( 'apply', false );
							break;
					}
				});

			//-------------------------
			// Entity Copy/Paste/Cut/Delete Functionality
			//-------------------------
			// Register entity clipboard operations through
			// the application's existing file menu events.
			//-------------------------
			// Copy the selected hook into JEST's clipboard.
			client.register(
				'copy', subtype,
				() => {
					//--------------------------------
					// Check If Delete Possible
					//--------------------------------
					// Block unavailable application states.
					if ( client.busy() ) return;
					if ( client.skim('mode')!=='running' ) return;
					// Only copy when the entities tool is active.
					if ( !tool.enabled() ) return;
					//--------------------------------
					// Attempt to Copy
					//--------------------------------
					// Copy the currently selected entity.
					client.copySelectedHook( tool );
				});

			// Paste a previously copied entity into the
			// center of the visible level viewport.
			client.register(
				'paste', subtype,
				( snapshot ) => {
					// Only handle entity clipboard data.
					if ( snapshot?.action!=='levelHook' ) return;
					//--------------------------------
					// Check If Paste Possible
					//--------------------------------
					// Block unavailable application states.
					if ( client.busy() ) return;
					if ( client.skim('mode')!=='running' ) return;
					//--------------------------------
					// Attempt to Paste
					//--------------------------------
					// Paste the entity using its stored properties.
					client.pasteCopiedHook( tool, snapshot );
				});

			// Remove the selected hook from the active level.
			client.register(
				'delete', subtype,
				() => {
					//--------------------------------
					// Check If Delete Possible
					//--------------------------------
					// Block unavailable application states.
					if ( client.busy() ) return;
					if ( client.skim('mode')!=='running' ) return;
					// Only delete when the entities tool is active.
					if ( !tool.enabled() ) return;
					//--------------------------------
					// Attempt to Delete
					//--------------------------------
					// Remove the currently selected entity.
					client.removeSelectedHook( tool );
				});

			//-------------------------
			// Curator Entity Visual Rendering
			//-------------------------
			// Default NPC placeholder graphic.
			const npcPlaceholder = {
			    path : 'ui/opps.gif',
			    x    : 9,
			    y    : 182,
			    w    : 45,
			    h    : 48
				};

			// Resolve the remote address once.
			npcPlaceholder.address =
				client.getFileInfo( npcPlaceholder.path, null, null, null, 'remote' ).address;

			// Attempt to resolve the fallback image before the draw loop.
			const fallback	= client.imager.getFile( npcPlaceholder.address );

			// Register entity hook drawing on the level editor.
			client.register(
				'draw', 'levelEntitiesCuratorHooks',
				( e, state, enabled, mode, editor, palette ) => {
					//--------------------------------
					// Validate Editor State
					//--------------------------------
					// Block action if app is busy.
					if ( client.busy() ) return;
					// Only if client is running.
					if ( mode!=='running' ) return;
					// Require Entities curator.
					if ( curator.typeSelected!=='hook' ) return;
					// Get canvas context(s).
					const editorCtx  = editor.el.getContext( '2d' );
					const paletteCtx = palette.el.getContext( '2d' );

					//--------------------------------
					// Access Entity Hooks
					//--------------------------------
					// Get all visible entity hook objects.
					const items      = curator.getVisibleObjects( 'hook' );
					const selected   = curator.getSelectedObject();
					const units      = tool.anchor.units;
					const zoom       = state.levelView.anchor.getZoom();

					//--------------------------------
					// Resolve Default NPC Placeholder
					//--------------------------------
					// Retrieve the placeholder if it wasn't cached during initialization.
					fallback ??= client.imager.getFile( fileInfo.address );
					const fallbackReady	= Boolean( fallback?.canvas && fallback.skim('image')==='drawn' );

					//--------------------------------
					// Render Entity Hooks
					//--------------------------------
					for ( const item of items ) {
						//--------------------------------
						// Resolve Entity Image
						//--------------------------------
						const data   = item.data;
						const image  = data.image;

						// Determine whether the hook image is ready.
						const valid  = Boolean( image?.canvas && image.skim('image')==='drawn' );

					    // Skip if neither image is available.
					    if ( !valid && !fallbackReady ) continue;

						//--------------------------------
						// Calculate Entity Dimensions
						//--------------------------------
						// Convert tile coordinates to canvas coordinates.
						const x = Number(data.x) * units;
						const y = Number(data.y) * units;

						// Use actual dimensions or placeholder dimensions.
						const w = valid ? image.canvas.width  : npcPlaceholder.w;
						const h = valid ? image.canvas.height : npcPlaceholder.h;

						//--------------------------------
						// Draw Entity Image
						//--------------------------------
						editorCtx.save();
						editorCtx.globalAlpha = 1;
						editorCtx.globalCompositeOperation = 'source-over';
						// Draw the actual hook image.
						if ( valid )
						    editor.draw(
								image.canvas,
								false, // do not clear
								false, // do not resize
								x, y, 0, 0,
								w, h, w*zoom, h*zoom
								);
						// Draw the default NPC sprite from ui/opps.gif.
						else editor.draw(
					        fallback.canvas,
							false, // do not clear
							false, // do not resize
							x, y, npcPlaceholder.x, npcPlaceholder.y,
							npcPlaceholder.w, npcPlaceholder.h, w*zoom, h*zoom
							);

						//--------------------------------
						// Highlight Selected Entity
						//--------------------------------
						if ( tool.skim('enabled') && item===selected ) {
							const dashSpeed = 0.5;
							const offset    = (e.tickCount * dashSpeed) % 10;
							editorCtx.lineWidth      = 2;
							editorCtx.strokeStyle    = 'rgba(0,255,255,0.9)';
							editorCtx.setLineDash( [6,4] );
							editorCtx.lineDashOffset = offset;
							editorCtx.strokeRect( x-2, y-2, w*zoom+4, h*zoom+4 );
						}

						//--------------------------------
						// Highlight Hovered Entity
						//--------------------------------
						// Draw marching ants around the NPC beneath the mouse.
						if ( tool.skim('enabled') && item===tool.hovered ) {
							const offset = (e.tickCount * 0.5) % 8;
							editorCtx.lineWidth      = 1;
							editorCtx.setLineDash( [4,4] );
							// Black dashes.
							editorCtx.strokeStyle    = '#000';
							editorCtx.lineDashOffset = -offset;
							editorCtx.strokeRect( x-3, y-3, w*zoom+6, h*zoom+6 );
							// White dashes.
							editorCtx.strokeStyle    = '#fff';
							editorCtx.lineDashOffset = -(offset+4);
							editorCtx.strokeRect( x-3, y-3, w*zoom+6, h*zoom+6 );
						}

						// Restore the canvas editor.
						editorCtx.restore();
					}
				});

			//-----------------------------
			// Level File Loading Event(s)
			//-----------------------------
			// Populate the Entities curator with NPCs from loaded levels.
			//-----------------------------
			// Level File Loading Event(s)
			//-----------------------------
			// Add NPCs from loaded levels to the Entities curator.
			client.register(
				'loadFileData', 'loadEntities',
				async ( file, { npc=[] } ) => {
					for ( const item of npc ) {
						// Add NPC to curator.
						const object =
							curator.addObject(
								'hook',
								{
								file     : file.skey,
								path     : item.path ?? '',
								script   : item.script ?? '',
								x        : item.x ?? 0,
								y        : item.y ?? 0,
								readonly : false
								});

						// Update the dropdown item label.
						curator.updateOptionLabel( object.data.id, object.data.path || '' );

						// Load image if available.
						if ( item.path && object )
							await client.setHookImage( tool, object, item.path );
					}
				});

			// --------------------------------
			// Settings Change Listener(s)
			// --------------------------------
			// Create event for when the magnification zoom value changes.
			client.register(
				'levelZoomed', 'entitiesZoom',
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
		// New Method(s) In Animator Application
		//--------------------------------
		extend: function( Klass, proto ) {
			// Define a sticker as an [object] inside the curator.
			// RETURNS: Sticker curator [object] or [null].
			// * tool	- [object] JestToolEntities emitting the event.
			// * data	- [object] Data to use for sticker.
			/*proto.defineEntitiesSticker = function( tool, data ) {
				//--------------------------------
				// Check Program Availability
				//--------------------------------
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool)) ) return null; // abort
				return true; // success
			}*/

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

			// Add a hook entity object.
			// RETURNS: [JestCuratorObject|null].
			// * tool	- [object] JestToolEntities emitting the event.
			// * data	- [JestCuratorObject] hook data to load as new object.
			proto.addHook = function( tool, data ) {
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool)) ) return null; // abort

				//--------------------------------
				// Proceed to Add Hook
				//--------------------------------
				// Store data for curator hook object.
				data.file	= s.fileKey;				// active tab's level file key
				data.path	= data?.path ? data.path : '';
				data.image	= null;						// by default image is null
				// Set default entity script.
				data.script	= data.script ?? '';		// executable hook script
				// Default hook coordinates.
				data.x		= Number( data.x ?? 0 );
				data.y		= Number( data.y ?? 0 );

				// --------------------------------
				// Create Curator Object
				// --------------------------------
				// Add the hook to the curator.
				//if ( true ) {
					// Add the hook to the curator.
					const object	= s.curator.addObject( 'hook', data );
					// Emit hook added event.
					this.emit( 'hook:added', null, object );
					return object; // [JestCuratorObject] instance
				/*}
				else {
					console.warn( `A hook with the name "${data.name}" already exists.` );
					return null; // abort
				}*/
			}

			// Remove a hook.
			// RETURNS: [JestCuratorObject|null].
			// * tool	- [object] JestToolScrapbook emitting the event.
			// * id		- [JestCuratorObject] hook id being removed.
			proto.removeHook = function( tool, id ) {
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool)) ) return null; // abort

				//--------------------------------
				// Proceed to Remove Hook
				//--------------------------------
				// Remove item from curator.
				console.log( `Attempting to remove hook: ${id}` );
				const object	= s.curator.removeObjectByType( 'hook', id );
				if ( !object ) {
					console.warn( `client.removeHook(): object missing or not removed!` );
					return null; // failed
				}

				//--------------------------------
				// Emit Event & Return Curator Object
				//--------------------------------
				// Emit hook removed event.
				this.emit( 'hook:removed', null, object );
				return object; // [JestCuratorObject] data instance
			}

			// Get a hook's image [object] (if hook group has an image).
			// RETURNS: [ElementImage|null] if available.
			// * tool	- [JestToolEntities] emitting the event.
			// * object	- [JestCuratorObject] entity hook.
			proto.getHookImage = function( tool, object ) {
				//--------------------------------
				// Check Program Availability
				//--------------------------------
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool)) ) return null; // abort
				//--------------------------------
				// Validate Curator Hook Object
				//--------------------------------
				// Require an entity hook.
				if ( !object || object.data.type!=='hook' )
					return null; // invalid object
				// Require the hook to belong to the active file.
				if ( object.data.file!==s.fileKey )
					return null; // different file
				//--------------------------------
				// Return Loaded Image
				//--------------------------------
				// The hook owns its image directly.
				return object.data.image ?? null;
			}

			// Set the image associated with an entity hook.
			// RETURNS: [boolean] `true` on success else `false`.
			// * tool		- [JestToolEntities] emitting the event.
			// * object		- [JestCuratorObject] entity hook.
			// * path		- [string] Image file path.
			proto.setHookImage = async function( tool, object, path ) {
				//--------------------------------
				// Check Program Availability
				//--------------------------------
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool)) ) return false; // abort

				//--------------------------------
				// Validate Entity Hook
				//--------------------------------
				// Require a valid hook curator object.
				if ( !object || object.data.type!=='hook' )
					return false; // abort

				//--------------------------------
				// Resolve Image Path
				//--------------------------------
				// Normalize the supplied image path.
				path	= String( path ?? '' ).trim();

				// Allow clearing the entity image.
				if ( path.length===0 ) {
					// Clear the image reference and path.
					object.updateData( 'path', '' );
					object.updateData( 'image', null );
					// Refresh the curator image preview.
					await this.refreshHookImage( tool, object );
					return true; // success
				}

				// Store the persistent image path.
				object.updateData( 'path', path );

				//--------------------------------
				// Clear Previous Image
				//--------------------------------
				// Invalidate the previous image without changing the path.
				object.updateData( 'image', null );

				// Clear the existing preview.
				await this.refreshHookImage( tool, object );

				//--------------------------------
				// Validate Image File Information
				//--------------------------------
				// Parse the path using the existing JEST file resolver.
				const network	= 'remote';
				const fileInfo	= this.getFileInfo( path, null, null, null, network );
				// Require a supported image file extension.
				if ( !fileInfo || !this.imager.filetypes.includes(fileInfo.extension) ) {
					console.warn( `Unsupported entity image: ${path}` );
					return false; // invalid image
				}

				//--------------------------------
				// Load Entity Image
				//--------------------------------
				// Check whether image is already registered.
				let image	= await this.imager.loadFile( fileInfo.address, 'remote' );
				if ( object.data.path!==path ) return false;
				// Require a successfully loaded image.
				if ( !image ) {
					console.warn( `Entity image could not be loaded: ${fileInfo.address}` );
					return false;
				}

				//--------------------------------
				// Assign Image To Entity Hook
				//--------------------------------
				// Store the runtime ElementImage reference.
				object.updateData( 'image', image );

				//--------------------------------
				// Refresh Entity Preview
				//--------------------------------
				// Update the curator's image preview.
				await this.refreshHookImage( tool, object );
				return true; // success
			}

			// Render an entity hook image inside the curator.
			// RETURNS: [boolean] `true` on success else `false`.
			// * tool	- [JestToolEntities] emitting the event.
			// * object	- [JestCuratorObject] entity hook.
			proto.renderHookImage = function( tool, object ) {
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool)) ) return false; // abort

				//--------------------------------
				// Access Hook Image
				//--------------------------------
				// Retrieve the image assigned to the hook.
				const image	= this.getHookImage( tool, object );
				if ( !image ) return false; // abort
				// Require image data to be ready.
				if ( image.skim('image')!=='drawn' )
					return false; // image not ready

				//--------------------------------
				// Access Preview Canvas
				//--------------------------------
				// Get the hook's preview canvas.
				const canvas	= object.display.getCanvas( 'preview' );
				if ( !canvas ) return false; // abort

				//--------------------------------
				// Render Hook Image
				//--------------------------------
				// Draw the complete image without sprite cropping.
				const sx	= 0;
				const sy	= 0;
				const sw	= Number( image.canvas.width );
				const sh	= Number( image.canvas.height );
				canvas.draw( image.canvas, true, true, 0, 0, sx, sy, sw, sh );

				//--------------------------------
				// Refresh Entities Sidebar
				//--------------------------------
				// Refit the sidebar to match the preview.
				this.sidebar.refit( 'entities' );
				// Emit event signaling successful rendering.
				this.emit( 'hook:rendered', null, object );

				//--------------------------------
				// Cleanup Image Callback
				//--------------------------------
				// Remove completed callback.
				const ukey	= `displayHook:${object.skey}`;
				if ( image.isRegistered('drawn',ukey) )
					image.unregister( 'drawn', ukey );
				return true; // success
			}

			// Refresh an entity hook's image preview.
			// RETURNS: [boolean] `true` on success else `false`.
			// * tool		- [JestToolEntities] emitting the event.
			// * object		- [JestCuratorObject] hook being rendered.
			proto.refreshHookImage = async function( tool, object ) {
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool)) ) return false; // abort

				//--------------------------------
				// Skip Inapplicable Objects
				//--------------------------------
				// Require a valid hook object.
				if ( !object || object.data.type!=='hook' )
					return false; // abort
				// Require the hook to belong to the active file.
				if ( object.data.file!==s.fileKey )
					return false; // different tab

				//--------------------------------
				// Access Hook Image
				//--------------------------------
				// Retrieve the image assigned to this hook.
				const image		= object.data.image;
				// Get the curator preview canvas.
				const canvas	= object.display.getCanvas( 'preview' );
				if ( !canvas ) return false; // abort
				// Clear the preview when no image is assigned.
				if ( !image ) {
					canvas.clear();
					return true; // cleared
				}

				//--------------------------------
				// Register Image Loading Callback
				//--------------------------------
				// Generate a unique callback identifier.
				const ukey	= `displayHook:${object.skey}`;
				// Register a callback for when the image is ready.
				if ( !image.isRegistered('drawn',ukey) ) {
					image.register(
						'drawn', ukey,
						() => {
							// Ignore an image that has since been replaced.
							if ( object.data.image!==image ) return;
							// Render the loaded image.
							this.renderHookImage( tool, object );
						});
				}

				//--------------------------------
				// Render Image If Already Loaded
				//--------------------------------
				// Check whether image drawing is complete.
				const status	= image.skim( 'image' );
				// Render immediately if already available.
				if ( status==='drawn' ) {
					// Remove the unnecessary loading callback.
					image.unregister( 'drawn', ukey );
					// Render the image.
					return this.renderHookImage( tool, object );
				}

				// Image will render when loading finishes.
				return true;
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
				// Restore selection if requested.
				if ( bookmark && s.curator.objects[id] ) {
					s.curator.setType( type );	// retain type selection
					s.curator.select( id );		// retain object selection
				}
				else s.curator.select();		// auto-select (if needed)
			}

			// Update hook dropdown options.
			// * tool	- [JestToolScrapbook] emitting the event.
			proto.reloadHooks = function( tool ) {
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool,true)) ) return false; // abort

				//--------------------------------
				// Refresh Curator Display(s)
				//--------------------------------
				// First reload curator to ensure an up-to-date query.
				this.refreshCurator( tool ); // refresh curator

				/*//--------------------------------
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
					);

				//--------------------------------
				// Refresh Curator Display(s)
				//--------------------------------
				// Force curator to reflect freshly filtered group(s).
				this.refreshCurator( tool ); // refresh curator*/
			}


			//--------------------------------
			// Get Selected Entity
			//--------------------------------
			// Resolve the selected entity against the active level.
			// Prevent editing entities belonging to another file.
			// RETURNS: [JestCuratorObject|null].
			// * tool		- [JestToolEntities] emitting the event.
			proto.getSelectedHook = function( tool ) {
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool,true)) ) return false; // abort

				//--------------------------------
				// Get Select Curator Hook Item(s)
				//--------------------------------
				// Prefer the canvas selection, falling back to the sidebar.
				const id		= tool.selected?.data?.id ?? s.curator.selectBox.getValue();
				const object	= s.curator.objects[id] ?? null;
				// Require an entity belonging to the active level.
				if ( !object || object.data.file!==s.fileKey ) return null;
				// Do not modify read-only entities.
				if ( object.data.readonly===true ) return null;
				return object; // return selected item
			}

			//--------------------------------
			// Mark Entity Changes
			//--------------------------------
			// Notify the level that its contents have changed.
			// RETURNS: [void].
			// * tool		- [JestToolEntities] emitting the event.
			proto.markEntityChanged = function( tool ) {
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool,true)) ) return false; // abort

				//--------------------------------
				// Mark File as Changed (for saveability)
				//--------------------------------
				// Mark the level as modified.
				s.file.jot( 'changed', true );
			}

			//--------------------------------
			// Remove Selected Entity
			//--------------------------------
			// Delete the selected entity using the existing
			// hook removal system.
			// RETURNS: [boolean].
			// * tool		- [JestToolEntities] emitting the event.
			proto.removeSelectedHook = function( tool ) {
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool,true)) ) return false; // abort

				//--------------------------------
				// Access Selected Hook Item
				//--------------------------------
				// Retrieve the selected hook using the active tool.
				const object	= this.getSelectedHook( tool );
				if ( !object ) return false; // fail

				//--------------------------------
				// Remove Hook Via Curator
				//--------------------------------
				// Remove the entity through the existing API.
				const removed	= this.removeHook( tool, object.data.id );
				if ( !removed ) return false; // fail

				//--------------------------------
				// Deselect Deleted Item
				//--------------------------------
				// Clear the selection through the tool's existing API.
				// This also emits the 'deselected' event for listeners.
				tool.deselect();

				//--------------------------------
				// Refresh Curator & Mark Changed
				//--------------------------------
				// Refresh the sidebar.
				this.refreshCurator( tool, false );
				// Mark the active level as modified.
				this.markEntityChanged( tool );
				return true; // success
			}

			//--------------------------------
			// Copy Selected Entity
			//--------------------------------
			// Copy the selected entity's editable properties.
			// Excludes its unique ID and runtime image object.
			// RETURNS: [boolean].
			// * tool		- [JestToolEntities] emitting the event.
			proto.copySelectedHook = function( tool ) {
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool,true)) ) return false; // abort

				//--------------------------------
				// Access Selected Hook Item
				//--------------------------------
				// Retrieve the selected hook using the active tool.
				const object	= this.getSelectedHook( tool );
				if ( !object ) return false;
				// Retrieve entity properties.
				const data		= object.data;

				//--------------------------------
				// Log Essential Data For Clipboard
				//--------------------------------
				// Create log of entity data.
				const log		= {
					action : "levelHook",
					path   : data.path   ?? '',
					script : data.script ?? '',
					x: Number(data.x) || 0,
					y: Number(data.y) || 0
					};

				//--------------------------------
				// Log Clipboard Data For Paste
				//--------------------------------
				// Log item to application clipboard.
				this.governor.log( 'clipboard', log );
				// Enable application pasting.
				this.filemenu.toggle( 'paste', true );

				//--------------------------------
				// Log Entity Clipboard Operation
				//--------------------------------
				// Report the copied entity's identity, location,
				// script length, and clipboard snapshot.
				console.groupCollapsed(
					`📋 JEST Entities: Copied Hook #${data.id} (${data.path||'No Image'})` );
				// Identify the source entity.
				console.log( 'Entity ID:', data.id );
				console.log( 'Source Level:', data.file );
				// Report the entity's original position.
				console.log( 'Position:', { x: log.x, y: log.y } );
				// Report the copied properties.
				console.log( 'Image Path:', log.path );
				console.log( 'Script Length:', log.script.length, 'characters' );
				// Display the actual clipboard snapshot.
				console.log( 'Clipboard Snapshot:', log );
				// Close the grouped console output.
				console.groupEnd();
				// Save a copy of its editable data.
				return true; // success
			}

			//--------------------------------
			// Paste Copied Entity
			//--------------------------------
			// Create a new entity using the copied properties.
			// Offset its position by one tile so that the
			// duplicate is distinguishable from the original.
			// RETURNS: [Promise<boolean>].
			// * tool		- [JestToolEntities] emitting the event.
			// * snapshot	- [object] With action, region matrix tile data, etc.
			proto.pasteCopiedHook = async function( tool, snapshot ) {
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(tool,true)) ) return false; // abort

				//--------------------------------
				// Access Selected Hook Item
				//--------------------------------
				// Only accept entity clipboard snapshots.
				// Return false when another editor tool owns the clipboard.
				if ( snapshot?.action!=='levelHook' ) return false;

				//--------------------------------
				// Calculate Visible Canvas Center
				//--------------------------------
				// Retrieve the center of the currently visible
				// level viewport in logical tile coordinates.
				const units  = tool.anchor.units;
				const center = this.getVisibleLevelCenter( units );

				//--------------------------------
				// Prepare Pasted Entity
				//--------------------------------
				// Position the new entity at the visible center.
				// Preserve its copied script and image path.
				const data   = {
					path	: snapshot.path ?? '',
					script	: snapshot.script ?? '',
					x		: Math.round( center.x*4 ) / 4,
					y		: Math.round( center.y*4 ) / 4
					};

				//--------------------------------
				// Create New Hook Item
				//--------------------------------
				// Create a new entity with its own ID.
				const object = this.addHook( tool, data );
				if ( !object ) return false;
				// Rebuild the entity's image preview.
				if ( data.path )
					await this.setHookImage( tool, object, data.path );
				// Update the curator's displayed label.
				s.curator.updateOptionLabel( object.data.id, data.path || '' );

				//--------------------------------
				// Refresh Curator & Autoselect
				//--------------------------------
				// Refresh the entity list.
				this.refreshCurator( tool, false );
				// Select the newly pasted entity.
				s.curator.select( object.data.id );
				tool.select( null, object );

				//--------------------------------
				// Switch to Entities Tool (for convenience)
				//--------------------------------
				// Switch to the entities tool.
				this.toolbox.setTool( 'entities' );

				//--------------------------------
				// Mark Entity Changed
				//--------------------------------
				// Mark the active level as modified.
				this.markEntityChanged( tool ) ;

				//--------------------------------
				// Emit Event & Return
				//--------------------------------
				// Emit pasted event(s).
				this.emit( 'pasted' ); // send signal
				return true; // susccess
			}
		}
	};

	//--------------------------------
	// Register With Animator
	//--------------------------------
	if ( window.JestTiler && typeof window.JestTiler.use==='function' )
		window.JestTiler.use( type, plugin );
	else console.error( 'entities.plugin.js load error: JestTiler.use() not found' );
})( window );
