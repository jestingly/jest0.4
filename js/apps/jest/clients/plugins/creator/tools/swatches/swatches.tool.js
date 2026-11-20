//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/tools/swatches/swatches.plugin.js loaded' );

//---------------------------------------------
// JestSwatches Class
//---------------------------------------------
// Sidebar panel UI that displays a user-editable swatch list.
// Supports adding, removing, and selecting tile swatches.
// Emits: 'select', 'add', 'remove'
//---------------------------------------------
class JestSwatches extends JestTool {
	// Object Properties
	toolbar			= null;				// [object] JestToolbar for buttons
	swatchList		= [];				// [array] list of swatches
	swatchId		= 0;				// [int] unique ID incrementor
	container		= null;				// [HTMLElement] DOM container holding swatches

	//---------------------------------
	// Constructor
	//---------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client		- client [object] that this piece belongs to.
	constructor( client ) {
		super( client ); // call parent constructor
	}

	//---------------------------------
	// Initialization
	//---------------------------------
	// Build the element [object].
	// RETURNS: [void].
	// * name		- unique [string] value of component name in the system.
	// * classes	- [array] of classes to add to panel element.
	build( name='swatchPanel', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		super.build( name, ['swatch-panel'].mergeUnique(classes) );

		//--------------------------------
		// Create Swatch Container
		//--------------------------------
		// Create the inner DOM element(s).
		this.panel.addElements([
			{ name: 'listWrap', tag: 'div', classes: [ 'swatch-list', 'jest-panel' ] },
			{ name: 'buttons',  tag: 'div', classes: [ 'selector-buttons' ] }
			]); // add to form
		this.container	= this.panel.refs.listWrap; // keep ref

		//---------------------------------
		// Create Toolbar [object]
		//---------------------------------
		// Create the toolbar.
		const toolbar	= new JestToolbar( this );
		this.toolbar	= toolbar; // set toolbar
		toolbar.build(); // build the toolbar
		// Add toolbar to client interface.
		this.panel.refs.buttons.addPanel( 'toolbar', toolbar.panel );

		//--------------------------------
		// Create Button(s)
		//--------------------------------
		// Create a swatch button.
		this.toolbar.createButton( { name: 'add', text: 'Add Swatch' } );
		// Register click event.
		this.toolbar.buttons.add.register(
			'click', 'swatchPanel', ()=>this.emit('addForeground') );
		// Create a swatch button.
		this.toolbar.createButton( { name: 'export', text: 'Export' } );
		// Register click event.
		this.toolbar.buttons.export.register(
			'click', 'swatchPanel', ()=>this.exportSwatches() );
		// Create a swatch button.
		this.toolbar.createButton( { name: 'import', text: 'Import' } );
		// Register click event.
		this.toolbar.buttons.import.register(
			'click', 'swatchPanel', ()=>this.openImportDialog() );

		//-----------------------------
		// Listen for Swatch Change
		//-----------------------------
		// Implement "swatch change" listener for foreground/background.
		this.client.register(
			'swatchChange', 'updateActiveSwatch',
			( key, data ) => {
				// Check if foreground is being set.
				if ( key!=='foreground' ) return;
				// Highlight the active swatch in swatch panel.
				this.setActiveSwatch( data.tx, data.ty );
			});
	}

	//--------------------------------------------
	// Set Active Swatch by Tile Coordinate
	//--------------------------------------------
	// Highlights the swatch matching the given tx/ty.
	// All other swatches are cleared of active state.
	// RETURNS: [void]
	// * tx		– [int] x-index of tile on tileset
	// * ty		– [int] y-index of tile on tileset
	setActiveSwatch( tx, ty ) {
		// Iterate through all swatches to test.
		this.swatchList.forEach(
			s => {
				const isMatch = ( s.contents?.tx===tx && s.contents?.ty===ty );
				s.panel.toggleClass( 'active', isMatch ); // activate only matching swatch
			});
	}

	//-------------------------
	// Add Swatch (from Foreground)
	//-------------------------
	// Add the foreground swatch as a saved swatch inside the panel.
	// RETURNS: [void]
	// * label	- [string] Value name of swatch to add.
	addSwatchFromForeground( label='untitled' ) {
		// Access foreground tile
		const tile	= this.client.swatches.foreground?.contents;
		if ( !tile ) return; // no tiler
		// Add the tile as a swatch & activate it.
		this.addSwatch( label, tile ); // add swatch
		this.setActiveSwatch( tile.tx, tile.ty ); // optional helper
	}

	//-------------------------
	// Add Swatch from Tile Object
	//-------------------------
	// Add a swatch inside the swatch panel.
	// * label	- [string] Value name of swatch to add.
	// * tile	– [object] tile with tx/ty
	addSwatch( label, tile ) {
		// Get application state.
		const state		= this.client.getState();
		if ( !tile || !state.tilesetView ) return; // no tile
		// Clone the tile for storing reference.
		const coords	= { ...tile }; // clone tile
		// Add swatch label.
		coords.label	= label ?? 'untitled';

		//--------------------------------------------
		// Prevent Duplicate Swatches
		//--------------------------------------------
		// Check if tile already exists.
		const alreadyExists =
			this.swatchList.some(
				swatch => swatch.contents?.tx===coords.tx && swatch.contents?.ty===coords.ty
				);
		// If tile swatch exists, give it a little flicker.
		if ( alreadyExists ) {
			// Optionally flash the existing swatch visually
			const swatch =
				this.swatchList.find(
					swatch => swatch.contents?.tx===coords.tx && swatch.contents?.ty===coords.ty
					);
			// Highlight the swatch.
			if ( swatch ) {
				// Add a singal class with a short timeout.
				swatch.panel.addClass( 'signal' );
				setTimeout( ()=>swatch.panel.removeClass('signal'), 500 );
				// Play "swatch add" deflect sound effect to signal action.
				this.client.soundboard.playSound( 'jest_deflect', 'mp3', 1.05 );
			}
			return; // block duplicate
		}

		//--------------------------------------------
		// Create Swatch Display
		//--------------------------------------------
		// Create a display to show the tile.
		const display	= new JestDisplay( this.client );
		const id		= 'swatch-' + (++this.swatchId);
		display.build( id, ['swatch'] ); // build DOM
		display.contents = coords;

		// Draw the tile graphical image inside the display.
		const canvas	= state.tileset.getTileStamp( coords.tx, coords.ty );
		display.addCanvas( 'tile' );
		display.render( 'tile', canvas );

		//--------------------------------------------
		// Add Canvas Label (Name Underneath)
		//--------------------------------------------
		// Get label & add below swatch.
		display.panel.addAttribute( 'data-tooltip', coords.label );

		//--------------------------------------------
		// Add Remove Button (SVG "X")
		//--------------------------------------------
		display.panel.addElements([
			{
				name: 'closeBtn',
				tag: 'div',
				classes: [ 'button-close' ],
				elements: [
					{
						name: 'x',
						tag: 'svg',
						classes: [ 'ico-x' ],
						attributes: {
							xmlns: "http://www.w3.org/2000/svg",
							viewBox: "0 0 24 24",
							width: "16",
							height: "16",
							"aria-hidden": "true"
						},
						elements: [
							{
								name: 'path',
								tag: 'path',
								attributes: {
									d: 'M6 6 L18 18 M6 18 L18 6',
									stroke: 'currentColor',
									'stroke-width': '2',
									'stroke-linecap': 'round'
								}
							}
						]
					}
				]
			}]);

		//--------------------------------------------
		// Event: Click = Set Foreground Swatch
		//--------------------------------------------
		// Click = set foreground swatch
		display.panel.register(
			'click', 'setForeground',
			() => {
				// Set the swatch as the foreground tile.
				this.client.toolSetTileSwatch( { tx: coords.tx, ty: coords.ty }, 'foreground' );
				// Emit select swatch event.
				this.emit( 'select', null, coords );
			}, 'dom' );

		//--------------------------------------------
		// Event: Click X to Remove Swatch
		//--------------------------------------------
		// Remove swatch button listener.
		display.panel.refs.closeBtn.register(
			'click', 'removeSwatch',
			( e ) => {
				// Stop propagation & remove swatch.
				e.stopPropagation(); // prevent triggering foreground change
				// Verify user wants to remove the [object].
				if ( !confirm("You are about to remove a swatch. Remove anyway?") ) return;
				this.removeSwatch( coords.tx, coords.ty );
			}, 'dom' );

		//--------------------------------------------
		// Finalize: Add to UI and Track
		//--------------------------------------------
		// Append swatch panel to container.
		this.container.addPanel( `swatch-${id}`, display.panel );
		this.swatchList.push( display );
		// Highlight the swatch.
		if ( display ) {
			// Add a singal class with a short timeout.
			display.panel.addClass( 'signal' );
			setTimeout( ()=>display.panel.removeClass('signal'), 500 );
		}
		// Play "swatch add" sound effect to signal action.
		this.client.soundboard.playSound( 'jest_swatch_add', 'mp3', 1.05 );
		// Emit add event.
		this.emit( 'added', null, display );
	}

	//--------------------------------------------
	// Remove Swatch By Tile Coordinate
	//--------------------------------------------
	// Removes a swatch that matches the given tile coords.
	// Emits: 'remove' – when a swatch is removed
	// RETURNS: [bool] true on removal, false if not found
	// * tx		– [int] x-index of tile on tileset
	// * ty		– [int] y-index of tile on tileset
	removeSwatch( tx, ty ) {
		// Find matching swatch object
		const swatch =
			this.swatchList.find(
				s => s.contents?.tx === tx && s.contents?.ty === ty
				);
		if ( !swatch ) return false; // no match found
		// Remove the panel DOM element.
		swatch.panel.remove();
		// Remove swatch tile data.
		this.swatchList =
			this.swatchList.filter(
				s => s.contents?.tx!==tx || s.contents?.ty!==ty
				);
		// Play "swatch add" sound effect to signal action.
		this.client.soundboard.playSound( 'jest_swatch_remove', 'mp3', 1.05 );
		// Emit add event.
		this.emit( 'removed', null, {tx,ty} ); // emit event
		return true; // success
	}

	//-------------------------
	// Remove Swatch
	//-------------------------
	// * display – [JestDisplay] swatch display object
	/*removeSwatch( display ) {
		if ( display?.panel?.parentNode )
			display.panel.parentNode.removeChild( display.panel );
		this.swatchList = this.swatchList.filter( d => d !== display );
		this.emit( 'remove', null, display );
	}*/

	//--------------------------------
	// Export All Swatches to File
	//--------------------------------
	// Download all swatches as a JSON file.
	// RETURNS: [void]
	exportSwatches() {
		// Extract Swatch Data
		const data	= this.swatchList.map( s => s.contents );
		if ( !data.length ) return;

		//--------------------------------
		// Create Download Blob
		//--------------------------------
		const blob	=
			new Blob(
				[ JSON.stringify( data, null, 2 ) ],
				{ type: 'application/json' }
				);
		const url	= URL.createObjectURL( blob );

		//--------------------------------
		// Trigger Download
		//--------------------------------
		const a		= document.createElement( 'a' );
		a.href		= url;
		a.download	= 'tile-swatches.json';
		a.click();

		//--------------------------------
		// Cleanup URL
		//--------------------------------
		URL.revokeObjectURL( url );
	}

	//--------------------------------
	// Open Import File Dialog
	//--------------------------------
	// Opens file picker to import swatches.
	// RETURNS: [void]
	openImportDialog() {
		// Create a file input element.
		const input		= document.createElement( 'input' );
		input.type		= 'file';
		input.accept	= 'application/json';
		// Read a file.
		input.onchange	=
			( e ) => {
				const file	= e.target.files?.[0];
				if ( !file ) return;
				const reader = new FileReader();
				reader.onload = evt => this.importSwatches(evt.target.result);
				reader.readAsText( file );
			};
		// Artificially click it.
		input.click();
	}

	//--------------------------------
	// Import Swatch Data
	//--------------------------------
	// Import swatch list from JSON string or array.
	// RETURNS: [void]
	// * jsonData – [string|array] swatch contents
	importSwatches( jsonData ) {
		let arr;

		//--------------------------------
		// Parse JSON if string
		//--------------------------------
		// Require JSON data to be a string.
		if ( typeof jsonData==='string' ) {
			try {
				arr = JSON.parse( jsonData );
			}
			catch ( err ) {
				console.error( 'JestSwatches: Invalid JSON during import.', err );
				return;
			}
		}
		else if ( Array.isArray(jsonData) )
			arr = jsonData;
		else {
			console.error(
				'JestSwatches: importSwatches() expected string or array but got:',
				typeof jsonData
				);
			return;
		}

		//--------------------------------
		// Validate Array
		//--------------------------------
		// The data should be an [array].
		if ( !Array.isArray(arr) ) {
			console.warn( 'JestSwatches: Imported data is not an array.' );
			return;
		}

		//--------------------------------
		// Add Each Swatch (skip duplicates)
		//--------------------------------
		// Iterate each item & add as swatch.
		arr.forEach(
			tile => {
				// Validate the data being passed in.
				if ( typeof tile!=='object' || tile.tx===undefined || tile.ty===undefined ) {
					console.warn( 'JestSwatches: Skipping invalid swatch entry.', tile );
					return;
				}
				// Add the swatch.
				const label	= tile.label ?? 'untitled';
				this.addSwatch( label, tile );
			});
	}
}
