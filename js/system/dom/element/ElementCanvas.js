//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/dom/element/ElementCanvas.js loaded' );

// ElementCanvas class
class ElementCanvas extends OSElement {
	// Attribute properties
	// Movement propert(ies)
	anchor     = null;     // [object] Anchor for matrix handling.
	width      = 100;      // [int] value of canvas width
	height     = 100;      // [int] value of canvas height

	// Creates the class [object] with configurable components.
	// RETURNS: [object] A new instance.
	// * options		- [object] Configuration options for the class [object].
	constructor( options={} ) {
		// --------------------------------
		// Configure DOM "Canvas" Data
		// --------------------------------
		options.tag  = 'canvas';
		super( options ); // call OSObject parent constructor
		// Handle default canvas size
		this.width   = options.width ? options.width : this.width;
		this.height  = options.height ? options.height : this.height;
		// Setup the [object] before creating the element
		this.setup();     // setup the [object]
		this.render();    // render the [object]
	}

	// Setup the [object].
	// RETURNS: [boolean] true or false.
	setup() {
		// --------------------------------
		// Setup Canvas [object]
		// --------------------------------
		super.setup(); // call parent setup method
		// Ensure class(es) include element base class(es)
		this.classes.push( 'jest-canvas' );
		// --------------------------------
		// Create Anchor [object]
		// --------------------------------
		// Create an anchor [object] for moving & size specifications
		const anchor = new Anchor();    // create central anchor
		anchor.move( 0, 0 );            // move anchor to default position
		this.anchor  = anchor;          // store anchor as property
		return true; // success
	}

	// Render the [object].
	// RETURNS: [boolean] true or false.
	render() {
		// --------------------------------
		// Add Event Handler(s)
		// --------------------------------
		// Add resize event handler for canvas updating
		this.anchor.register( 'resize', 'canvas', (w,h)=>this.resize(w,h) );
		// --------------------------------
		// Render Canvas
		// --------------------------------
		super.render(); // call parent render method
		// --------------------------------
		// Default Orientation(s)
		// --------------------------------
		this.resize ( this.width, this.height );
		return true;    // success
	}

	// --------------------------------
	// Sizing & Positioning Method(s)
	// --------------------------------
	// Resize the DOM canvas.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * width	- [int] Value of new width.
	// * height	- [int] Value of new height.
	resize( width=100, height=100 ) {
		// Validate argument(s)
		if ( !Number.isInteger(width) ) {
			console.error( `Argument "width" must be an integer.` );
			width  = 100;
		}
		if ( !Number.isInteger(height) ) {
			console.error( `Argument "width" must be an integer.` );
			height = 100;
		}
		// Set width & height
		this.width     = Math.max( 0, width );  // save new width
		this.height    = Math.max( 0, height ); // save new height
		this.el.width  = width;                 // update element width
		this.el.height = height;                // update element height
		// Call parent resize() method.
		super.resize( width, height );
		// Ensure anchor dimensions match (fallback)
		this.anchor.width  = width;
		this.anchor.height = height;
		return true; // success
	}

	// --------------------------------
	// Rendering Method(s)
	// --------------------------------
	// Render an image into the display.
	// RETURNS: [void].
	// * canvas	- [object] ElementCanvas object to render inside the display.
	// clear	- [bool] Whether to clear area first.
	// resize	- [bool] Whether to resize the canvas to match the sw,sh.
	// dx,dy	- [number] Coordinates of location on destination canvas to draw.
	// sx,sy	- [number] Coordinates of location on source canvas to clip.
	// sw,sh	- [number] Width and height dimensions of source canvas to clip.
	draw( canvas, clear=false, resize=false, dx=0, dy=0, sx=0, sy=0, sw=null, sh=null ) {
		// Set auto dimension(s) if not supplied.
		const w   = sw ?? canvas.el.width;
		const h   = sh ?? canvas.el.height;
		// Get tooldrop canvas context & clear it.
		const ctx = this.el.getContext( '2d' );
		// Clear area if requested.
		if ( clear )
			ctx.clearRect( 0, 0, w, h );
		// Resize crate to show contents if requested.
		if ( resize )
			this.resize( w, h );

		// Draw the selected tile on the dragdrop crate canvas.
		ctx.drawImage(
			canvas.el,			// image contents being copied
			sx,    sy,			// source crop x,y
			w,     h,			// source W x H
			dx,    dy,			// destination x,y
			w,     h			// destination W x H
			);
	}

	//--------------------------------
	// Load & Copy Image to Canvas
	//--------------------------------
	// Copies an image & resizes canvas to match its dimensions & pixels.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * image	– [ElementImage] to conform to & replicate pixels.
	// clear	- [bool] Whether to clear area first.
	// resize	- [bool] Whether to resize the canvas to match the sw,sh.
	// dx,dy	- [number] Coordinates of location on destination canvas to draw.
	// sx,sy	- [number] Coordinates of location on source canvas to clip.
	// sw,sh	- [number] Width and height dimensions of source canvas to clip.
	copyImage( image, clear=false, resize=false, dx=0, dy=0, sx=0, sy=0, sw=null, sh=null ) {
		//--------------------------------
		// Safety Check: Image Must Be Loaded
		//--------------------------------
		// Check if image is fully loaded & has dimension.
		if ( !image.el.complete || image.el.naturalWidth===0 ) {
			console.warn( 'Image not fully loaded or invalid' );
			return false; // abort
		}

		//--------------------------------
		// Create Canvas and Draw Image
		//--------------------------------
		// Get dimension(s) if not supplied.
		const w	= sw ?? image.el.naturalWidth;
		const h	= sh ?? image.el.naturalHeight;
		// Resize canvas to match image dimensions.
		if ( resize )
			this.resize( w, h );

		//--------------------------------
		// Copy Image to Canvas
		//--------------------------------
		// Access canvas context & copy image.
		const ctx = this.el.getContext( '2d' );
		// Clear area if requested.
		if ( clear )
			ctx.clearRect( 0, 0, w, h );
		// Draw the selected tile on the dragdrop crate canvas.
		ctx.drawImage(
			image.el,		// image contents being copied
			sx,    sy,		// source crop x,y
			w,     h,		// source W x H
			dx,    dy,		// destination x,y
			w,     h		// destination W x H
			);
		return true; // success
	}

	//--------------------------------
	// Crop Canvas Region
	//--------------------------------
	// Crops a rectangular region from the current canvas and
	// resizes this canvas to only show that region.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * x		– [int] Left coordinate of crop area.
	// * y		– [int] Top coordinate of crop area.
	// * width	– [int] Width of crop area.
	// * height	– [int] Height of crop area.
	crop( x, y, width, height ) {
		//--------------------------------
		// Validate Argument(s)
		//--------------------------------
		// Ensure valid arguments.
		if ( !Number.isFinite(x) || !Number.isFinite(y) ||
			 !Number.isFinite(width) || !Number.isFinite(height) )
			return false; // abort

		if ( width<=0 || height<=0 )
			return false; // abort

		//--------------------------------
		// Create Temporary Offscreen Canvas
		//--------------------------------
		const sourceCanvas = this.el;
		const offCanvas = document.createElement('canvas');
		offCanvas.width = width;
		offCanvas.height = height;

		const offCtx = offCanvas.getContext('2d');
		offCtx.drawImage(
			sourceCanvas,
			x, y,				// source crop origin
			width, height,		// source crop size
			0, 0,				// destination origin
			width, height		// destination size
			);

		//--------------------------------
		// Resize This Canvas and Replace Pixels
		//--------------------------------
		// Resize the canvas.
		this.resize( width, height );

		// Draw image from crop back onto canvas.
		const ctx = this.el.getContext('2d');
		ctx.clearRect( 0, 0, width, height );
		ctx.drawImage( offCanvas, 0, 0 );

		return true; // success
	}

	//--------------------------------
	// Clear Canvas Pixels
	//--------------------------------
	// Clears all pixels without resizing or resetting transforms.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	clear() {
		// Safety check.
		if ( !this.el ) return false; // abort
		// Clear pixel buffer.
		const ctx	= this.el.getContext( '2d' );
		ctx.clearRect( 0, 0, this.el.width, this.el.height );
		return true; // success
	}

	//--------------------------------
	// Reset Canvas
	//--------------------------------
	// Clears canvas by resetting dimensions (resets state).
	// RETURNS: [boolean] `true` on success else `false` on fail.
	reset() {
		// Reset via dimension reassignment.
		this.el.width	= this.width;
		this.el.height	= this.height;
		return true; // success
	}

	//--------------------------------
	// Destroy Canvas Content
	//--------------------------------
	// Shrinks canvas to 0x0 to fully erase and disable rendering.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	collapse() {
		// Collapse canvas.
		this.resize( 0, 0 );
		return true; // success
	}
}
