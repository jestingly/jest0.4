//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/tools/overworld/overworld.plugin.js loaded' );

//-------------------------
// Overworld Plugin
//-------------------------
// Register the neighbor tool and connect its panel to the editor sidebar.
// Load overworld.css and overworld.tool.js before this plugin initializes.
(function( window ) {
	//--------------------------------
	// Plugin Metadata
	//--------------------------------
	const type    = 'tools';
	const subtype = 'overworld';

	//--------------------------------
	// Plugin Definition
	//--------------------------------
	const plugin  = {
		//--------------------------------
		// Initialize Plugin
		//--------------------------------
		// Create one tool per client and register application-level events.
		// * client - [JestTiler] Application containing the open level tabs.
		init: function( client ) {
			// Avoid duplicate panels and modal registrations for the same client.
			if ( client.toolbox.tools[subtype] ) return; // already installed

			//-------------------------
			// Access Necessary Surface(s)
			//-------------------------
			// Grab the workspace for drawing on the editing area.
			const workspace = client.gameboard.display.getCanvas( 'workspace' );
			// Grab the sketchpad for off-screen drawing & rendering.
			const sketchpad = client.gameboard.display.getCanvas( 'sketchpad' );

			//-------------------------
			// Create Overworld Tool
			//-------------------------
			// Follow the same construct, register, and build order as other tools.
			const tool = new JestToolOverworld( client, subtype );
			client.toolbox.registerTool( subtype, tool );
			tool.build(); // initialize launcher and registered dialogs

			// Preserve access used by the previous standalone popup controller.
			client.overworldNeighbors = tool;

			//-------------------------
			// Create Control Panel
			//-------------------------
			// Generate a "form" inside the sidebar.
			const optsPanel = new JestForm( client ); // create DOM Panel element [object].
			optsPanel.build( 'overworld', ['app-overworld'] ); // build the form

			//-------------------------
			// Add Level-Picker to Sidebar
			//-------------------------
			// Add level-picker launcher to the sidebar form.
			optsPanel.panel.addPanel( 'picker', tool.panel );

			//--------------------------------
			// Overworld Preview Padding
			//--------------------------------
			// Instantiate the settings overworld padding preview variable.
			client.settings.tiler.editor.padding ??= 8;

			// Create the zoom magnifier slider.
			const minPad = 0,
				  maxPad = client.config.levelGrid;
			const inputPadding =
				new JestInputRange(
					client, 'Padding', null,
					client.settings.tiler.editor.padding, 'Padding'
					);
			inputPadding.setMin( minPad );
			inputPadding.setMax( maxPad );
			inputPadding.setStep( 1 );
			inputPadding.build( 'input-padding' );
			optsPanel.addField( 'padding', inputPadding );
			inputPadding.showLabel();

			// Store the selected padding.
			inputPadding.register(
				'change', 'adjustPadding',
				value => {
					//---------------------------------
					// Get Current File State
					//---------------------------------
					// Get current file status.
					const s = client.getFileStatus( null, true );

					//---------------------------------
					// Change Overworld Padding Preview
					//---------------------------------
					// Apply the new padding before any tool reads the workspace bounds.
					client.settings.tiler.editor.padding = Number( value );

					// Automatically update the preview.
					const view = client.tabbarFile.activeView;
					if ( !view ) return; // abort
					client.layoutLevelWorkspace( view, workspace, sketchpad );

					// Resnap a tile that is already being carried.
					client.toolbox.getTool('tiledrop')?.crate?.refreshPosition();
				});

			// Return the same tile value used by the existing padding slider.
			client.getOverworldPadding = ( activeView ) => {
				// Keep this measurement independent of the level's zoom.
				return client.settings.tiler.editor?.padding;
				//return Number( inputPadding.getValue() );
			};

			//--------------------------------
			// Overworld Preview Padding Alpha
			//--------------------------------
			// Instantiate the settings overworld padding preview alpha variable.
			client.settings.tiler.editor.paddingAlpha ??= 1;

			// Create the zoom magnifier slider.
			const minPadAlpha = 0,
				  maxPadAlpha = 1;
			const inputPaddingAlpha =
				new JestInputRange(
					client, 'Transparency', 1,
					client.settings.tiler.editor.paddingAlpha, 'Transparency'
					);
			inputPaddingAlpha.setMin( minPadAlpha );
			inputPaddingAlpha.setMax( maxPadAlpha );
			inputPaddingAlpha.setStep( 0.1 );
			inputPaddingAlpha.build( 'input-padding-alpha' );
			optsPanel.addField( 'paddingAlpha', inputPaddingAlpha );
			inputPaddingAlpha.showLabel();

			// Store the selected padding alpha.
			inputPaddingAlpha.register(
				'change', 'adjustPaddingAlpha',
				value => {
					//---------------------------------
					// Get Current File State
					//---------------------------------
					// Get current file status.
					const s = client.getFileStatus( null, true );

					//---------------------------------
					// Change Overworld Preview Alpha
					//---------------------------------
					// Apply the new padding alpha.
					client.settings.tiler.editor.paddingAlpha = Number( value );
				});

			//--------------------------------
			// Quick Overworld Neighbor Controls
			//--------------------------------
			// Use the same direction table for the dropdown and preview positions.
			const tabbar     = client.tabbarFile;
			const directions = Object.entries( JestFileRelationshipLevel.directions );

			// Choose which compass slot to edit.
			const directionInput = new JestInputSelect( client, 'neighborDirection' );
			directionInput.build( 'neighbor-direction' );
			directionInput.addOptions(
				directions.map(
					( [direction] ) => ({
						value : direction,
						label : direction[0].toUpperCase() + direction.slice(1)
					})
				));
			directionInput.selectOption( 'north' );
			optsPanel.addField( 'neighborDirection', directionInput );
			directionInput.showLabel(); // reveal label
			// Add a hover-over tooltip.
			directionInput.panel.addAttribute( 'data-tooltip', 'Neighbor Direction' );

			// Choose the open level assigned to that slot.
			const targetInput = new JestInputSelect( client, 'neighborLevel' );
			targetInput.build( 'neighbor-level' ); // build it
			optsPanel.addField( 'neighborLevel', targetInput );
			targetInput.showLabel();
			// Add a hover-over tooltip.
			targetInput.panel.addAttribute( 'data-tooltip', 'Neighbor Level' );

			//--------------------------------
			// Refresh Neighbor Choices
			//--------------------------------
			// Show the other open level tabs and the active slot's current target.
			const refreshNeighborTargets = () => {
				// Resolve the current view and selected direction.
				const view      = tabbar.activeView;
				const direction = directionInput.getValue();
				const linked    = view?.relationship?.getView( direction );
				const options   = [ { value: '', label: 'None' } ];

				// List candidates in tab order. The number distinguishes duplicate names.
				tabbar.views.forEach(
					( candidate, index ) => {
						if ( candidate===view || !(candidate instanceof JestFileViewEditorPainterLevel) )
							return; // skip

						options.push({
							value : candidate.skey,
							label : `${index+1}. ${candidate.file.stem}`
							});
					});

				// Restore the active slot's selection after rebuilding the options.
				targetInput.setOptions( options );
				targetInput.selectOption( linked?.skey ?? '' );
				targetInput.field.el.disabled = !view || options.length===1;
			};

			// Refresh when the selected direction or the set of open tabs changes.
			directionInput.register(
				'user:change', 'levelNeighbors',
				()=>refreshNeighborTargets() );

			// Detect when the active tab or view changes.
			tabbar.register(
				['tabChange','viewRemoved','viewRenamed'],
				'refreshNeighborsDropdownLists',
				()=>refreshNeighborTargets() );

			// Apply only user changes. setOptions() can emit a regular change event.
			targetInput.register(
				'user:change', 'setLevelNeighbor',
				skey => {
					// Resolve the chosen tab from the current open views.
					const view      = tabbar.activeView;
					const direction = directionInput.getValue();
					const target    = tabbar.views.find( candidate => candidate.skey===skey ) ?? null;

					// Ignore a selection if its target closed before it was applied.
					if ( !view || (skey && !target) ) return;
					view.relationship.setView( direction, target );
				});

			// Automatically refresh the neighboring targets.
			refreshNeighborTargets();

			//-------------------------
			// Add to Sidebar
			//-------------------------
			// Add the curator panel to the sidebar.
			client.sidebar.addDisableExclusion( subtype ); // prevent forced collapse
			client.sidebar.addSection( subtype, 'Overworld', optsPanel.panel, {}, optsPanel );
			client.sidebar.refit( subtype ); // resize to fit contents

			//--------------------------------
			// Refresh Open File Choices
			//--------------------------------
			// Keep the source fixed while updating filenames and live candidates.
			client.tabbarFile.register(
				['tabChange','viewRemoved','viewRenamed'], 'overworldPopup',
				() => tool.refresh()
				);
		},

		//--------------------------------
		// Extend Application
		//--------------------------------
		// Tool methods remain on JestToolOverworld; no client overrides needed.
		// * Klass	- [class] Application constructor supplied by plugin setup.
		// * proto	- [object] Application prototype supplied by plugin setup.
		extend: function( Klass, proto ) {
			// No additional application methods are required.
		}
	};

	//--------------------------------
	// Register Plugin
	//--------------------------------
	// Use the same guarded registration as the other creator tool plugins.
	if ( window.JestTiler && typeof window.JestTiler.use==='function' )
		window.JestTiler.use( type, plugin );
	else console.error( 'overworld.plugin.js load error: JestTiler.use() not found' );
})( window );
