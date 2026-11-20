//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/editing/tools/JestFileViewEditorPainterLevel.js loaded' );

//-------------------------
// JestFileViewEditorPainterLevel Class
//-------------------------
// This class enhances the file editor painter view with level creation specific capabilities.
class JestFileViewEditorPainterLevel extends JestFileViewEditorPainter {
	// Object propert(ies)

	//---------------------------------
	// Constructor
	//---------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client - [object] Application client that this piece belongs to.
	constructor( client ) {
		super( client ); // call parent constructor
	}

	//-------------------------
	// Initialization
	//-------------------------
	// Build the element [object].
	// RETURNS: [void].
	// * name    - unique [string] value of component name in the system.
	// * classes - [array] of classes to add to panel element.
	build ( name='file-view-editor-painter-level', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		const defaultClasses = [ 'file-view-editor-painter-level' ];
		super.build( name, defaultClasses.mergeUnique(classes) );
		// Initialize the view
		// Copy level canvas content to this canvas.
	}

	//--------------------------------
	// Create Level Relationship
	//--------------------------------
	// RETURNS: [JestFileLevelRelationship] Neighbor links for this level view.
	createRelationship() {
		// Give this view compass directions and level edge rendering.
		return new JestFileRelationshipLevel( this );
	}

	//---------------------------------
	// Set File
	//---------------------------------
	// Set the file object to view/edit.
	// RETURNS: [void].
	// * file - [JestFile] The file to assign.
	setFile( file ) {
		// Validate argument(s)
		if ( !(file instanceof JestFileLevel) ) {
			console.warn( `Argument "file" must be of type JestLevel.` );
			return false; // failed
		}
		// Continue to set the file.
		super.setFile( file ); // call parent method
	}

	//---------------------------------
	// Initialize View
	//---------------------------------
	// Prepares layout and visuals (graticulation, containers, etc.).
	// RETURNS: [void].
	initView() {
		// Initialize the base view and its tile measurement.
		super.initView();
		//-------------------------
		// Configure Level Measurements
		//-------------------------
		// Graticulate to match the application configuration tile grid.
		const units     = this.client.config.tileGrid;
		this.anchor.graticulate( units ); // set tile grid
		// Size the backing canvas in unzoomed level pixels.
		const levelGrid = this.client.config.levelGrid;
		this.anchor.resize( levelGrid*units, levelGrid*units );
	}

	//--------------------------------
	// Refresh Level Canvas
	// RETURNS: [boolean]
	//--------------------------------
	// Composite all visible level layers into the
	// painter preview, preserving their rendering order.
	// NOTE: Layers are stored bottom-to-top, so drawing
	// them sequentially produces the correct visual stack.
	//--------------------------------
	// RETURNS: [boolean] `true` on success else `false` if fail.
	refreshCanvas() {
		//--------------------------------
		// Validate Current File
		//--------------------------------
		// A level file must be assigned before rendering.
		if ( !this.file ) return false;

		// Preserve the parent painter's refresh behavior.
		super.refreshCanvas();

		//--------------------------------
		// Resolve Level and Destination
		//--------------------------------
		// Retrieve the level represented by this file.
		const level = this.file.context;
		// Validate the required rendering objects.
		if ( !level ) return false;

		//--------------------------------
		// Clear Previous Preview
		//--------------------------------
		// Remove the previous composite before rebuilding.
		this.canvas.clear();

		//--------------------------------
		// Composite Visible Layers
		//--------------------------------
		// Iterate from the bottom layer to the top layer.
		for ( const layer of level.getLayers() ) {
			// Hidden layers must not appear in the preview.
			if ( !layer.visible || !layer.canvas ) continue; // skip

			// Draw the layer over the existing composite.
			this.canvas.draw(
				layer.canvas,
				false, // do not clear
				false, // do not resize
				0, 0, 0, 0,
				null, null, this.canvas.width, this.canvas.height
				);
		}

		// Rendering completed.
		return true; // success
	}

	// Get level rendering canvas.
	// RETURNS: [void].
	getViewRender() {
		// Return composite copy of level bitmap canvas.
		//const canvas = this.file.context.canvas;
		//const canvas = this.file.context.getActiveLayer()?.canvas ?? null;
		return this.canvas; // level bitmap canvas
	}
}
