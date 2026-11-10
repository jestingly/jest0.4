//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/editing/tools/JestFileView.js loaded' );

//-------------------------
// JestFileView Class
//-------------------------
// This class frames a file in a viewable format using a canvas inside a panel.
class JestFileView extends JestTool {
	// Object propert(ies)
	canvas			= null;			// [object] ElementCanvas for drawing.
	// Reference propert(ies)
	file			= null;			// [object] JestFile being viewed.

	// --------------------------------
	// Constructor
	// --------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client		- [object] Application client that this piece belongs to.
	constructor( client ) {
		super( client );			// call parent constructor
	}

	//-------------------------
	// Teardown Method(s)
	//-------------------------
	// Destroy the view [object]
	// RETURNS: [void].
	destroy() {
		// Remove all event(s).
		this.unregisterAll();
	}

	//-------------------------
	// Initialization
	//-------------------------
	// Build the element [object].
	// RETURNS: [void].
	// * name		- unique [string] value of component name in the system.
	// * classes	- [array] of classes to add to panel element.
	build( name='file-view', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		const defaultClasses	= [ 'file-view' ];
		super.build( name, defaultClasses.mergeUnique(classes) );
		// --------------------------------
		// Create Drawing [objects]
		// --------------------------------
		// Create the level rendering [canvas]
		const canvas	= new ElementCanvas();
		this.canvas		= canvas;
		//this.panel.addPanel( 'canvas', canvas ); // add canvas to element
		// Add canvas to palette element
		this.panel.el.appendChild( canvas.el );
		// Add resize event handler for canvas updating
		this.anchor.register( 'resize', 'canvas', (w,h)=>this.resize(w,h) );
	}

	//-------------------------
	// Canvas Methods
	//-------------------------
	// Resize the canvas element.
	// NOTE: This is a callback method.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * width		- [int] Value of custom width span of canvas.
	// * height		- [int] Value of custom height span of canvas.
	resize( width, height ) {
		// Update canvas dimensions
		if ( this.canvas )
			this.canvas.resize( width, height );
		return true;	// success
	}

	// --------------------------------
	// Open File
	// --------------------------------
	// Opens the file and triggers its view/render logic.
	// RETURNS: [void].
	// * file		- [object] JestFile being viewed.
	openFile( file ) {
		// Set the file context.
		this.setFile( file );		// set the JestFile instance
		// Check if file is set.
		if ( !this.file )
			throw new Error( 'No file set for this view.' );
		this.initView();			// Perform visual setup
		this.renderFile();			// Load file data into view
	}

	//-------------------------
	// File Handling Methods
	//-------------------------
	// Set the file instance being viewed.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * file		- JestFile [object] being viewed in context.
	setFile( file ) {
		// Validate argument.
		if ( !(file instanceof JestFile) ) {
			console.log( file );
			console.warn( `Invalid argument type for argument "file".` );
			return false; // fail
		}
		// Set the file.
		this.file	= file;
	}

	// Set the file instance being viewed.
	// RETURNS: JestFile [object] or [null].
	getFile() {
		// Return the file.
		return this.file;
	}

	// --------------------------------
	// Initialize View
	// --------------------------------
	// Prepares layout and visuals (graticulation, containers, etc.).
	// RETURNS: [void].
	initView() {
		// Re-apply grid layout to the anchor using tile size config.
		const tileGrid = this.client.config.tileGrid;
		this.anchor.graticulate( tileGrid ); // set grid size
	}

	// --------------------------------
	// Render File
	// --------------------------------
	// Visualizes the file data onto the panel.
	// RETURNS: [void].
	renderFile() {
		console.log( `[View] Rendering data to view: ${this.file.stem}.${this.file.extension}` );
		// Render & update the canvas.
		this.refreshCanvas();
	}

	//-------------------------
	// Copy Canvas Content
	//-------------------------
	// Copies the source canvas to the destination canvas at (0,0).
	// RETURNS: [void].
	refreshCanvas() {
		// Require file to be set.
		if ( !this.file ) return;
		// Obtain file canvas context & copy contents to canvas.
		//console.log( "Refresh canvas called." );
	}

	// Get image canvas.
	// RETURNS: [void].
	getViewRender() {
		return true; // success
	}

	// Copies the source canvas to the destination canvas at (0,0).
	// RETURNS: [void]
	// * sourceCanvas	- [HTMLCanvasElement] Source canvas.
	// * destCanvas		- [HTMLCanvasElement] Destination canvas.
	/*refreshCanvas( sourceCanvas, destCanvas ) {
		// Require file to be set.
		if ( !this.file ) return;
		super.refreshCanvas(); // call parent method
		// Obtain file canvas context & copy contents to canvas.
		//const sourceCanvas	= this.file.context.tileset.image.el;
		//const destCanvas	= this.canvas.el;
		const ctx			= destCanvas.getContext( '2d' );
		ctx.clearRect( 0, 0, destCanvas.width, destCanvas.height ); // optional clear
		ctx.drawImage(
			sourceCanvas, // image contents being copied
			0, 0, // source crop x,y
			sourceCanvas.width, sourceCanvas.height, // source W x H
			0, 0, // destination x,y
			destCanvas.width, destCanvas.height // destination W x H
			);
	}*/
}
