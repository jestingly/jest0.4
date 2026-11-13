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

	// --------------------------------
	// Constructor
	// --------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client		- [object] Application client that this piece belongs to.
	constructor( client ) {
		super( client ); // call parent constructor
	}

	//-------------------------
	// Initialization
	//-------------------------
	// Build the element [object].
	// RETURNS: [void].
	// * name		- unique [string] value of component name in the system.
	// * classes	- [array] of classes to add to panel element.
	build ( name='file-view-editor-painter-level', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		const defaultClasses = [ 'file-view-editor-painter-level' ];
		super.build( name, defaultClasses.mergeUnique(classes) );
		// Initialize the view
		// Copy level canvas content to this canvas.
	}

	// --------------------------------
	// Set File
	// --------------------------------
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

	// --------------------------------
	// Initialize View
	// --------------------------------
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

	//-------------------------
	// Copy Canvas Content
	//-------------------------
	// Copies the source canvas to the destination canvas at (0,0).
	// RETURNS: [void]
	// * sourceCanvas	- [HTMLCanvasElement] Source canvas.
	// * destCanvas		- [HTMLCanvasElement] Destination canvas.
	/*refreshCanvas() {
		// Require file to be set.
		if ( !this.file ) return;
		super.refreshCanvas(); // call parent method
		// Obtain file canvas context & copy contents to canvas.
		const render		= this.getViewRender();
		if ( !render ) {
			console.error( '[JestFileViewEditorPainterLevel] Could not access level layer canvas.' );
			return false;
		}
		const sourceCanvas	= render.el; // canvas element
		const destCanvas	= this.canvas.el;
		const ctx			= destCanvas.getContext('2d');
		ctx.clearRect( 0, 0, destCanvas.width, destCanvas.height ); // optional clear
		ctx.drawImage(
			sourceCanvas, // image contents being copied
			0, 0, // source crop x,y
			sourceCanvas.width, sourceCanvas.height, // source W x H
			0, 0, // destination x,y
			destCanvas.width, destCanvas.height // destination W x H
			);
	}*/

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
		const level      = this.file.context;
		// Retrieve the destination canvas.
		const destCanvas = this.canvas;

		// Validate the required rendering objects.
		if ( !level ) return false;

		//--------------------------------
		// Clear Previous Preview
		//--------------------------------
		// Remove the previous composite before rebuilding.
		destCanvas.clear();

		//--------------------------------
		// Composite Visible Layers
		//--------------------------------
		// Iterate from the bottom layer to the top layer.
		for ( const layer of level.getLayers() ) {
			// Hidden layers must not appear in the preview.
			if ( !layer.visible ) continue; // skip

			// Retrieve this layer's rendered canvas.
			const sourceCanvas = layer.canvas;
			// Skip layers without an initialized canvas.
			if ( !sourceCanvas ) continue; // skip

			// Draw the layer over the existing composite.
			destCanvas.draw(
				sourceCanvas, false, false, 0, 0, 0, 0,
				null, null, destCanvas.width, destCanvas.height
				);
		}

		// Rendering completed.
		return true;
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
