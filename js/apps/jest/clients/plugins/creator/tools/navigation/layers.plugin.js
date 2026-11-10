//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/tools/navigation/layers.plugin.js loaded' );

//-------------------------
// Layers Plugin
//-------------------------
(function( window ) {
	//--------------------------------
	// Plugin Metadata
	//--------------------------------
	const type		= 'tools';
	const subtype	= 'layers';

	//--------------------------------
	// Plugin Definition
	//--------------------------------
	const plugin = {
		//--------------------------------
		// Initialize Plugin
		//--------------------------------
		// Called once when the plugin is registered.
		// * client - [JestTiler] parent application reference.
		init: function( client ) {
			//-------------------------
			// Create Layers Tool
			//-------------------------
			// The tool supplies the file-status context; the layer panel
			// does not install mouse handlers on the level canvas.
			const tool    = new JestToolLayers( client, subtype );
			client.toolbox.registerTool( subtype, tool );
			tool.build(); // initialize tool

			//--------------------------------
			// Create Layers Sidebar Menu
			//--------------------------------
			// Create layers sidebar panel menu.
			client.sidebar.addDisableExclusion( subtype );
			client.sidebar.addSection( subtype, 'Layers', null );

			//--------------------------------
			// Construct Layers Sidebar
			//--------------------------------
			// Retrieve the existing Layers sidebar section.
			const menu = client.sidebar.getSection( subtype );
			// Display the layer list.
			//menu.addItem( 'layers', tool.list.panel );
			// Display the selected layer's editing form.
			//menu.addItem( 'editor', tool.form.panel );
			// Display the dedicated layer action toolbar.
			//menu.addItem( 'toolbar', tool.toolbar.panel );
			// Display the tool internal element inside sidebar.
			menu.addItem( 'layers', tool.panel );

			//--------------------------------
			// Create Layer Action Buttons
			//--------------------------------
			// Create actions through JestToolbar instead of JestForm.
			// [JestToolbar] uses [JestButtonToolbar] internally.
			const createButton = tool.toolbar.createButton( { name: 'create', text: '+ Layer' } );
			const removeButton = tool.toolbar.createButton( { name: 'remove', text: '- Layer' } );
			const applyButton  = tool.toolbar.createButton( { name: 'apply', text: 'Apply' } );

			//--------------------------------
			// Resolve Selected Layer
			//--------------------------------
			// RETURNS: [JestLevelLayer|null].
			const selected = function() {
				// Get current program state.
				const s = client.getFileStatus( tool, true );
				if ( !s || !tool.list.selectedItem ) return null;
				// Always validate against the current file's actual layers.
				return s.level.getLayer( tool.list.selectedItem.layer.id ) ?? null;
			};

			//--------------------------------
			// Update Layer Button States
			//--------------------------------
			// Synchronize layer controls with the application ticker.
			client.register(
				'update', subtype,
				( e, state, enabled, mode ) => {
					//--------------------------------
					// Resolve Current State
					//--------------------------------
					// Retrieve the current level and selected layer.
					const s         = client.getFileStatus( tool, true );
					const layer     = selected();

					// Editing requires an available level and idle application.
					const available = Boolean( s && !client.busy() );

					//--------------------------------
					// Compare Layer Name
					//--------------------------------
					// Read the current name entered in the editor.
					const name      = String( tool.form.getValue('name') ?? '' ).trim();
					// Enable apply button only when name field input changes.
					const compare	= { name: 'name' };
					// Only compare the name when an actual layer is selected.
					// Determine whether the selected layer has been renamed.
					// NOTE: checkFieldInput() highlights altered fields red.
					const changed   =
						layer ? tool.form.checkFieldInput( { name: layer.name }, compare )
							: false;

					//--------------------------------
					// Synchronize Button States
					//--------------------------------
					// Creating requires an available level.
					tool.toolbar.toggle( 'create', available );
					// Removing requires a selected layer and multiple layers.
					tool.toolbar.toggle( 'remove',
						available && !!layer && s.level.getLayers().length>1 );
					// Applying requires an actual name change.
					tool.toolbar.toggle( 'apply', available && changed );
				});

			//--------------------------------
			// Handle Layer Selection
			//--------------------------------
			// Receive the clicked list item from JestList's
			// existing clickedItem event.
			// * item - [JestListLayerItem] clicked layer item.
			tool.list.register(
				'clickedItem', 'selectLayer',
				( item ) => {
					// Synchronize the selected layer with the level.
					client.selectLayerItem( item );
				});

			//--------------------------------
			// Handle Layer Reordering
			//--------------------------------
			// Record old and new layer orders in the same edit history.
			tool.list.register(
				'reordered', 'layersReordered',
				() => {
					//--------------------------------
					// Resolve Level and History
					//--------------------------------
					const s = client.getFileStatus( tool, true );
					if ( !s || client.busy() ) return;

					// Capture the current file's history view.
					const view   = s.levelView;

					//--------------------------------
					// Capture Previous Layer Order
					//--------------------------------
					// Level order is bottom-to-top.
					const before = s.level.getLayers().map( layer=>layer.id );

					//--------------------------------
					// Apply New Layer Order
					//--------------------------------
					// UI order is top-to-bottom, so reverse it.
					const after = tool.list.items.map( item => item.layer.id ).reverse();

					// Stop when the order is unchanged or invalid.
					if ( !s.level.reorderLayers(after) ) return;

					//--------------------------------
					// Record History and Refresh
					//--------------------------------
					client.recordLayerHistory( view, 'layerReorder', before, after, 'Reorder layers.' );

					// Notify the editor that the level changed.
					client.markChanged( s );
					// Refresh the level's drawing view after reordering.
					view.refreshCanvas();
				});

			//--------------------------------
			// Create New Layer Modal
			//--------------------------------
			// Define a new popup modal for adding a level layer.
			client.addModal(
				'newLayer',
				{
					title   : 'Create Layer',
					text    : 'Name the new layer:',
					inputs  :
						[{
							name        : 'name',
							label       : 'Name',
							placeholder : 'Layer name'
						}],
					buttons :
						{
							cancel:
								{
									label   : 'Cancel',
									onClick : () => client.modals.newLayer.close()
								},
							confirm:
								{
									label   : 'Create',
									onClick :
										async () => {
											//--------------------------------
											// Use New Layer Modal
											//--------------------------------
											// Access the new layer modal.
											const modal = client.modals.newLayer;
											modal.emit( 'confirm', null, modal.payload );
										}
								}
						}
				});

			// Reset the modal field whenever it is reopened.
			client.modals.newLayer.register(
				'preopen', 'reset', ()=>client.modals.newLayer.resetInputs() );

			// Register layer creation listener (sent via modal button).
			client.modals.newLayer.register(
				'confirm', 'newLayer',
				async ( type ) => {
					//--------------------------------
					// Check Program Availability
					//--------------------------------
					// Gatekeep with file status check.
					let s; if ( !(s=client.getFileStatus(tool)) ) return false; // abort

					// Capture the owning view before asynchronous setup.
					const view  = s.levelView;

					// Preserve the previous active-layer selection.
					const activeBefore = s.level.activeLayerId;

					//--------------------------------
					// Get Input Value(s) (from modal)
					//--------------------------------
					// Get user input from modal.
					const modal = client.modals.newLayer;
					// Get the name from the form.
					const name  = String( modal.inputs.name.getValue() ?? '' ).trim();
					// Require a valid name to be entered.
					if ( !name ) {
						// Alert user an invalid name was entered.
						alert( 'Enter a layer name.' );
						return false; // do not close modal
					}

					//--------------------------------
					// Create Level Layer
					//--------------------------------
					// Use the existing JestLevel method.
					const layer = await s.level.addLayer( name );

					// Select it only if its original tab is still active.
					if ( client.getFileStatus()?.fileKey===s.fileKey )
						s.level.setActiveLayer( layer.id );

					//--------------------------------
					// Capture Created Layer
					//--------------------------------
					// Preserve the exact new ID, contents and position.
					const after       = s.level.snapshotLayer( layer.id );
					const activeAfter = s.level.activeLayerId;

					//--------------------------------
					// Record History
					//--------------------------------
					// Record a layer undo/redo action.
					client.recordLayerHistory(
						view, 'layerAdd', null, after, `Add layer "${layer.name}".`,
						{ activeBefore, activeAfter }
						);

					//--------------------------------
					// Finish Layer Creation
					//--------------------------------
					// Mark the original level file as modified.
					client.markChanged( s );

					// Only refresh the sidebar if the original file is still active.
					// Prevent an asynchronous layer creation from affecting another tab.
					if ( client.getFileStatus()?.fileKey===s.fileKey )
						client.refreshLayers( layer.id ); // rebuild layers list

					// Play sound-effect to signal.
					client.soundboard.playSound( 'jest_success', 'mp3', 1.1 );
					// Force-close modal just in case.
					modal.close(); // close modal
					return true;   // success
				});

			//--------------------------------
			// Add Layer Button
			//--------------------------------
			createButton.register(
				'click', 'addLayer',
				() => {
					//--------------------------------
					// Check If Program Busy
					//--------------------------------
					// Block action if app is busy.
					const s = client.getFileStatus( tool, true );
					if ( !s || client.busy() ) return;
					//--------------------------------
					// Proceed to Open Modal
					//--------------------------------
					// Open the new layer modal.
					client.modals.newLayer.open();
				});

			//--------------------------------
			// Rename Layer and Record History
			//--------------------------------
			// Preserve the previous and new names.
			applyButton.register(
				'click', 'renameLayer',
				() => {
					//--------------------------------
					// Check If Program Busy
					//--------------------------------
					// Block action if app is busy.
					const s     = client.getFileStatus( tool, true );
					if ( !s || client.busy() ) return;
					// Access the current selected layer.
					const layer = selected();
					if ( !s || !layer || client.busy() ) return false;

					//--------------------------------
					// Validate New Name
					//--------------------------------
					// Retrieve the name entered in the layer editing form.
					const name  = String( tool.form.getValue('name') ?? '' ).trim();
					// Require a valid name to be entered.
					if ( !name ) {
						// Alert user an invalid name was entered.
						alert( 'Enter a layer name.' );
						return false; // do not close modal
					}

					// A no-op should not create an undo step.
					if ( name===layer.name ) return false;

					//--------------------------------
					// Capture and Apply Rename
					//--------------------------------
					// Log layer state before mutation.
					const before = {
						id   : layer.id,
						name : layer.name
						};

					// Apply the actual new name.
					layer.name = name;

					// Log layer state after mutation.
					const after = {
						id   : layer.id,
						name : layer.name
						};

					//--------------------------------
					// Record and Refresh
					//--------------------------------
					// Record an undo/redo history state.
					client.recordLayerHistory(
						client.getState()?.levelView,
						'layerRename', before, after,
						`Rename layer "${before.name}" to "${after.name}".`
						);

					// Synchronize layer list item display to name change.
					tool.list.selectedItem.refresh();

					//--------------------------------
					// Wrap-up Finishing Procedures
					//--------------------------------
					// Mark file as changed (can be saved).
					client.markChanged( s );
					// Play a sound effect to audible signal the successful name change.
					client.soundboard.playSound( 'jest_success', 'mp3', 1.1 );
					return true; // success
				});

			//--------------------------------
			// Remove Layer Button
			//--------------------------------
			// Handle "Remove Layer" button.
			removeButton.register(
				'click', 'removeLayer',
				() => {
					//--------------------------------
					// Check If Program Busy
					//--------------------------------
					// Get current program state.
					const s     = client.getFileStatus( tool, true );
					const layer = selected();
					if ( !s || !layer || client.busy() ) return;
					//--------------------------------
					// Clamp Level Layers to N>0
					//--------------------------------
					// Never delete the final layer in a level.
					if ( s.level.getLayers().length<=1 ) {
						alert( 'A level must retain at least one layer.' );
						return; // abort
					}

					//--------------------------------
					// Snapshot Layer Before Deletion
					//--------------------------------
					// Preserve the layer's ID, name, tilemap, position,
					// visibility, and locking state before destroying it.
					const view         = s.levelView;
					const before       = s.level.snapshotLayer( layer.id );
					const activeBefore = s.level.activeLayerId;

					//--------------------------------
					// Delete the Actual Layer
					//--------------------------------
					// Abort if the layer could not be removed.
					if ( !before || !s.level.removeLayer(layer.id) )
						return false;

					// Remember the active layer after deletion.
					const activeAfter = s.level.activeLayerId;

					//--------------------------------
					// Record Reversible Deletion
					//--------------------------------
					// Match the before/after structure used by fileReverted().
					client.recordLayerHistory(
						view, 'layerDelete', before, null,
						`Delete layer "${before.name}".`,
						{ activeBefore, activeAfter }
						);

					// Mark file as having unsaved changes.
					client.markChanged( s );
					client.refreshLayers(); // refresh layer
					// Update the drawing canvas after changing the active layer.
					view.refreshCanvas();
				});

			//--------------------------------
			// Record Layer Visibility History
			//--------------------------------
			// The row already applied the new visibility value.
			// Store its previous and next states.
			client.register(
				'levelLayerVisibilityChange', 'layersChanged',
				( changedLayer, before, after ) => {
					//--------------------------------
					// Resolve Current App State
					//--------------------------------
					// Retrieve the active level file.
					const s = client.getFileStatus( null, true );
					if ( !s ) return false; // busy

					//--------------------------------
					// Create Old & New History Log
					//--------------------------------
					// Prevent redundant history entries.
					if ( before===after ) return;

					// Capture the before/after state.
					const oldState = {
						id      : changedLayer.id,
						visible : before
						};
					const newState = {
						id      : changedLayer.id,
						visible : after
						};

					//--------------------------------
					// Log History
					//--------------------------------
					// Record the visibility change.
					client.recordLayerHistory(
						s.levelView, 'layerVisibility',
						oldState, newState,
						after ? 'Show layer.' : 'Hide layer.'
						);

					//--------------------------------
					// Mark File Saveable & Refresh
					//--------------------------------
					// Save and refresh the visible composite.
					client.markChanged( s );
					// Refresh the level preview after showing or hiding a layer.
					s.levelView.refreshCanvas();
				});

			//--------------------------------
			// Record Layer Locking History
			//--------------------------------
			// Capture the old/new editing permission for this layer.
			client.register(
				'levelLayerLockChange', 'layersChanged',
				( changedLayer, before, after ) => {
					//--------------------------------
					// Resolve Current App State
					//--------------------------------
					// Retrieve the active level file.
					const s = client.getFileStatus( null, true );
					if ( !s ) return false; // busy

					//--------------------------------
					// Create Old & New History Log
					//--------------------------------
					// Prevent redundant history entries.
					if ( before===after ) return;

					// Capture the before/after state.
					const oldState = {
						id     : changedLayer.id,
						locked : before
						};
					const newState = {
						id     : changedLayer.id,
						locked : after
						};

					//--------------------------------
					// Log History
					//--------------------------------
					// Record the locking change.
					client.recordLayerHistory(
						s.levelView,
						'layerLock',
						oldState, newState,
						after ? 'Lock layer.' : 'Unlock layer.'
						);

					//--------------------------------
					// Mark File Saveable & Refresh
					//--------------------------------
					// Locking affects editing, not the bitmap.
					client.markChanged( s );
				});

			//--------------------------------
			// Refresh Between File Tabs
			//--------------------------------
			client.tabbarFile.register(
				'tabChange', 'layersRefresh',
				() => client.refreshLayers()
				);
			client.register( 'loadFileData', 'layersLoaded', ()=>client.refreshLayers() );
			client.refreshLayers(); // initialize list for the active file
		},

		//--------------------------------
		// Extend Application
		//--------------------------------
		// No additional client prototype methods are required.
		extend: function( Klass, proto ) {
			//--------------------------------
			// Record Level Layer History
			//--------------------------------
			// Adds a layer operation to the existing per-file JestGovernor.
			// Both before and after are independent data snapshots.
			// RETURNS: [boolean] whether the action was recorded.
			// * view   - [JestFileViewEditor] owning level file view.
			// * action - [string] layer history action.
			// * before - [object|array|null] state before modification.
			// * after  - [object|array|null] state after modification.
			// * label  - [string] readable history entry description.
			//   extra  - [object] optional active-layer selection metadata.
			proto.recordLayerHistory = function(
				view, action, before, after, label, extra={} ) {
				//--------------------------------
				// Validate History Availability
				//--------------------------------
				// Do not create new history while another action is replaying.
				if ( !view?.governor || view.governor.skim('reverting') )
					return false; // can't log

				//--------------------------------
				// Record Reversible Action
				//--------------------------------
				// Add the readable description to the upcoming history item.
				view.governor.enqueue( 'edit', { history: label } );

				// Store both directions of the operation.
				const result = view.governor.log( 'edit', {
					action	: action,
					layerId	: after?.id ?? before?.id ?? null,
					before	: before,
					after	: after,
					...extra
					});

				// Clear any metadata that was not consumed.
				view.governor.dequeue( 'edit' );
				return result!==null; // return success or fail
			};

			//--------------------------------
			// Refresh Layer List
			//--------------------------------
			// Rebuild the layer list for the currently active level.
			// * preferredId - [int|null] layer ID to select.
			proto.refreshLayers = function( preferredId=null ) {
				//--------------------------------
				// Resolve Current Level
				//--------------------------------
				// Retrieve the active level's file status.
				const s    = this.getFileStatus( null, true );
				// Access the Layers tool through the application.
				const tool = this.toolbox.tools.layers;

				//--------------------------------
				// Clear Existing List
				//--------------------------------
				// Remove rows belonging to the previous level.
				tool.list.clear();
				// Clear the current selection.
				tool.list.selectedItem = null;

				// Handle an unavailable level.
				if ( !s ) {
					tool.form.setValue( 'name', '' );
					this.sidebar.refit( 'layers' );
					return false; // abort
				}

				//--------------------------------
				// Debug Loaded Layer States
				//--------------------------------
				// Inspect layer properties before the sidebar constructs checkboxes.
				/*console.table(
					s.level.getLayers().map(
						layer=>({
							id		: layer.id,
							name	: layer.name,
							visible	: layer.visible,
							locked	: layer.locked
						}))
					);*/

				//--------------------------------
				// Populate Layer List
				//--------------------------------
				// Display layers from topmost to bottommost.
				for ( const layer of [...s.level.getLayers()].reverse() )
					tool.list.addLayer( layer );

				//--------------------------------
				// Restore Active Selection
				//--------------------------------
				// Prefer the requested layer or the level's active layer.
				const id   = preferredId ?? s.level.activeLayerId;
				// Find the matching list item.
				const item = tool.list.items.find( row=>row.layer.id===id ) ?? null;
				// Synchronize the selected layer.
				this.selectLayerItem( item );
				// Recalculate sidebar dimensions.
				this.sidebar.refit( 'layers' );
				return true; // success
			};

			//--------------------------------
			// Select Active Layer
			//--------------------------------
			// Synchronize the selected list item with the level.
			// * item - [JestListLayerItem|null] target layer.
			proto.selectLayerItem = function( item ) {
				//--------------------------------
				// Resolve Current Level
				//--------------------------------
				// Retrieve the active level file.
				const s     = this.getFileStatus( null, true );
				if ( !s ) return false; // busy

				// Access the Layers tool.
				const tool  = this.toolbox.tools.layers;

				//--------------------------------
				// Validate Selected Layer
				//--------------------------------
				// Retrieve the corresponding level layer.
				const layer = item ? s.level.getLayer(item.layer.id) : null;

				// Handle a cleared selection.
				if ( !layer ) {
					tool.list.selectItemAt( -1 );
					tool.form.setValue( 'name', '' );
					return false; // abort
				}

				//--------------------------------
				// Synchronize Selection
				//--------------------------------
				// Access the matching list item.
				const index = tool.list.items.indexOf( item );
				if ( index<0 ) return false; // validate index

				// Actually select the layer list item.
				tool.list.selectItemAt( index );
				// Update the level's active layer.
				s.level.setActiveLayer( layer.id );

				// Update the layer name editor form.
				tool.form.setValue( 'name', layer.name );
				return true; // susccess
			};
		}
	};

	//--------------------------------
	// Register Plugin
	//--------------------------------
	if ( window.JestTiler && typeof window.JestTiler.use==='function' )
		window.JestTiler.use( type, plugin );
	else console.error( 'layers.plugin.js load error: JestTiler.use() not found' );
})( window );
