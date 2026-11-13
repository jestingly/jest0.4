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
	canvas       = null;     // [object] ElementCanvas for drawing.
	// Reference propert(ies)
	file         = null;     // [object] JestFile being viewed.

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
		const defaultClasses = [ 'file-view' ];
		super.build( name, defaultClasses.mergeUnique(classes) );
		// --------------------------------
		// Create Drawing [objects]
		// --------------------------------
		// Create the level rendering [canvas]
		const canvas = new ElementCanvas();
		this.canvas  = canvas;
		// Pixelate the canvas for pixel art.
		canvas.el.style.imageRendering = 'pixelated';
		//this.panel.addPanel( 'canvas', canvas ); // add canvas to element
		// Add canvas to palette element
		this.panel.el.appendChild( canvas.el );
		// Attach event(s) to re-scale the canvas to match its zoomed dimensions.
		this.anchor.register(
			['resize','zoom'], 'canvas', ()=>this.resize() );
	}

	//-------------------------
	// Canvas Methods
	//-------------------------
	// Resize the canvas to match its raw dimensions at a requested magnification.
	// NOTE: This is an event callback method.
	// RETURNS: [void].
	resize() {
		// Get real dimensions (after zoom).
		const bounds = this.anchor.getZoomed();
		// Update canvas dimensions
		this.canvas?.resize( bounds.display.w, bounds.display.h );
		console.log( `Resizing canvas to: ${bounds.display.w}x${bounds.display.h}` );
		// Emit the resized event.
		this.emit( 'resize', null, bounds.display.w, bounds.display.h );
	}

	/*//--------------------------------
	// Apply View Zoom
	//--------------------------------
	// Set the canvas's displayed size while preserving its backing dimensions.
	// RETURNS: [boolean] `true` on success else `false`.
	applyZoom() {
		// Resolve the visible canvas element.
		const canvas = this.canvas?.el;
		if ( !canvas ) return false;

		// Scale only its CSS dimensions; canvas.width and canvas.height
		// remain the unzoomed coordinate space used by drawing operations.
		canvas.style.width          = `${canvas.width * this.zoom}px`;
		canvas.style.height         = `${canvas.height * this.zoom}px`;
		canvas.style.maxWidth       = 'none';
		canvas.style.maxHeight      = 'none';
		canvas.style.imageRendering = 'pixelated';
		return true; // success
	}

	//--------------------------------
	// Get Canvas Pixel Position
	//--------------------------------
	// Convert a pointer event into unzoomed canvas pixel coordinates.
	// RETURNS: [object|null] Pixel position, or `null` if unavailable.
	// * event - [PointerEvent|MouseEvent] Pointer event over this view.
	getCanvasPosition( event ) {
		// Resolve the canvas and its displayed bounds.
		const canvas = this.canvas?.el;
		const rect   = canvas?.getBoundingClientRect();
		if ( !canvas || !rect || !rect.width || !rect.height ) return null;

		// Convert from displayed CSS pixels to the canvas backing pixels.
		// Leave coordinates unclamped so tools can continue a drag outside
		// the canvas when their existing behavior allows it.
		return {
			x: (event.clientX - rect.left) * canvas.width / rect.width,
			y: (event.clientY - rect.top) * canvas.height / rect.height
			};
	}

	//--------------------------------
	// Get Canvas Grid Position
	//--------------------------------
	// Convert a pointer event into this view's grid coordinates.
	// RETURNS: [object|null] Grid position, or `null` if unavailable.
	// * event - [PointerEvent|MouseEvent] Pointer event over this view.
	getCanvasGridPosition( event ) {
		// Resolve the unzoomed canvas position.
		const position = this.getCanvasPosition( event );
		if ( !position ) return null; // fail

		// Validate the view's unzoomed tile measurement.
		const bounds   = this.anchor.getZoomed();
		const units    = bounds.display.units;
		if ( !Number.isFinite(units) || units<=0 )
			return null; // fail

		// Convert canvas pixels into local grid coordinates.
		return {
			x: Math.floor( position.x / units ),
			y: Math.floor( position.y / units )
			};
	}*/

	// --------------------------------
	// Open File
	// --------------------------------
	// Opens the file and triggers its view/render logic.
	// RETURNS: [void].
	// * file  - [object] JestFile being viewed.
	openFile( file ) {
		// Set the file context.
		this.setFile( file );  // set the JestFile instance
		// Check if file is set.
		if ( !this.file )
			throw new Error( 'No file set for this view.' );
		this.initView();       // Perform visual setup
		this.renderFile();     // Load file data into view
	}

	//-------------------------
	// File Handling Methods
	//-------------------------
	// Set the file instance being viewed.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * file  - JestFile [object] being viewed in context.
	setFile( file ) {
		// Validate argument.
		if ( !(file instanceof JestFile) ) {
			console.log( file );
			console.warn( `Invalid argument type for argument "file".` );
			return false; // fail
		}
		// Set the file.
		this.file = file;
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
		// Keep the tile measurement on this view instead of making tools
		// retrieve it directly from the global configuration.
		const units = Number( this.client.config.tileGrid );
		// Set the anchor's grid to the unzoomed tile size.
		this.anchor.graticulate( units ); // set grid size
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
	// * sourceCanvas  - [HTMLCanvasElement] Source canvas.
	// * destCanvas    - [HTMLCanvasElement] Destination canvas.
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
