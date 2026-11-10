//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/editing/tools/JestFileViewEditorPainterTileset.js loaded' );

//-------------------------
// JestFileViewEditorPainterTileset Class
//-------------------------
// This class enhances the file editor painter view with tileset retrieval specific capabilities.
class JestFileViewEditorPainterTileset extends JestFileViewEditorPainter {
	// Object propert(ies)

	// --------------------------------
	// Constructor
	// --------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client - [object] Application client that this piece belongs to.
	constructor( client ) {
		super( client ); // call parent constructor
	}

	//-------------------------
	// Teardown Method(s)
	//-------------------------
	// Destroy the view [object]
	// RETURNS: [void].
	destroy() {
		// Call parent constructor.
		super.destroy(); // parent destroy()
	}

	//-------------------------
	// Initialization
	//-------------------------
	// Build the element [object].
	// RETURNS: [void].
	// * name    - unique [string] value of component name in the system.
	// * classes - [array] of classes to add to panel element.
	build ( name='file-view-editor-painter-tileset', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		const defaultClasses = [ 'file-view-editor-painter-tileset' ];
		super.build( name, defaultClasses.mergeUnique(classes) );
		// Initialize the view
		// Copy level canvas content to this canvas.
	}

	// --------------------------------
	// Set File
	// --------------------------------
	// Set the file object to view/edit.
	// RETURNS: [void]
	// * file - [JestFile] The file to assign.
	setFile( file ) {
		// Validate argument(s)
		if ( !(file instanceof JestFileTileset) ) {
			console.warn( `Argument "file" must be of type JestFileTileset.` );
			return false; // failed
		}
		// Continue to set the file.
		super.setFile( file ); // call parent method
	}

	// --------------------------------
	// Initialize View
	// --------------------------------
	// Prepares layout and visuals (graticulation, containers, etc.).
	// RETURNS: [void]
	initView() {
		super.initView(); // call parent method
		// Resize to level size.
		const width  = this.file.context.image.file.el.width;
		const height = this.file.context.image.file.el.height;
		this.anchor.resize( width, height );
	}

	//-------------------------
	// Copy Canvas Content
	//-------------------------
	// Copies the source canvas to the destination canvas at (0,0).
	// RETURNS: [void]
	// * sourceCanvas - [HTMLCanvasElement] Source canvas.
	// * destCanvas   - [HTMLCanvasElement] Destination canvas.
	refreshCanvas( /*sourceCanvas, destCanvas*/ ) {
		// Require file to be set.
		if ( !this.file ) return;
		super.refreshCanvas(); // call parent method
		// Obtain file canvas context & copy contents to canvas.
		const sourceCanvas = this.getViewRender().el;
		const destCanvas   = this.canvas.el;
		const ctx          = destCanvas.getContext( '2d' );
		ctx.clearRect( 0, 0, destCanvas.width, destCanvas.height ); // optional clear
		ctx.drawImage(
			sourceCanvas, // image contents being copied
			0, 0, // source crop x,y
			sourceCanvas.width, sourceCanvas.height, // source W x H
			0, 0, // destination x,y
			destCanvas.width, destCanvas.height // destination W x H
			);
	}

	// Get image canvas.
	// RETURNS: [void].
	getViewRender() {
		// Return the tileset image canvas.
		const canvas = this.file.context.image.file;
		return canvas; // tileset image canvas
	}
}
