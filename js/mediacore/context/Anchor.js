//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/mediacore/context/Anchor.js loaded' );

//-------------------------
// Anchor
//-------------------------
// Calculates an [object] location through a stack of nested [objects].
class Anchor extends OSCallback {
	// Object properties
	//canvas     = null;       // [object] ElementCanvas (for visual testing).
	_color     = null;       // [string] Hex value, stores debugging color view. Set using this.debugging().
	_alpha     = null;       // [number] Value, stores transparency as a value 0-100.
	// Declare properties
	_parent    = null;       // Parent Anchor [object].
	x          = null;       // [number] value of X coordinate of the [object] relative to parent.
	y          = null;       // [number] value of Y coordinate of the [object] relative to parent.
	z          = null;       // [number] value of Z coordinate of the [object] relative to parent.
	width      = null;       // [number] value of width of the [object] (minimum = 1).
	height     = null;       // [number] value of height of the [object] (minimum = 1).
	// View-local display and coordinate measurements.
	units      = null;       // [number] value of grid (x,y) & width/height should conform to (defaults to 1px).
	zoom       = 1;          // [number] Display zoom for this file view.
	minZoom    = 0.01;       // [number] Minimum display zoom.
	maxZoom    = 10;         // [number] Maximum display zoom.

	//-------------------------
	// Instantiation
	//-------------------------
	// Initializes the object.
	// * x       - [number] value of horizontal offset relative to parent(s)
	// * y       - [number] value of vertical offset relative to parent(s)
	// * z       - [number] value of z index relative to parent(s)
	//   width   - [number] value of custom width span of anchor
	//   height  - [number] value of custom height span of anchor
	//   units   - [number] Value of anchor grid size (defaults to 1px).
	constructor( x=0, y=0, z=0, width=1, height=1, units=1 ) {
		super();                       // Call parent constructor
		this.move( x, y, z );          // Move the anchor point coordinates
		this.graticulate( units );     // Set the units the anchor is measured in
		this.resize( width, height );  // Set the anchor point WxH span
		this.show( null );             // By default, anchors are hidden
	}

	//-------------------------
	// Debugging
	//-------------------------
	// Create a visual color/alpha to display anchor rectangle in the 'inspector' mode.
	// RETURNS: [void].
	// color   - [string] Hex color (e.g. '#000') to enable debugging square, or [null] to turn off.
	// alpha   - [int] Value of opacity 0-100 (defaults to 80%).
	show( color=null, alpha=80 ) {
		// Validate the hex code
		if ( /^#([0-9A-Fa-f]{3}){1,2}$/.test(color) || color===null )
			this._color	= color;  // store debuggin color
		else {
			console.warn( `Invalid argument for color given. Debugging visual for anchor is turned off.` );
			this._color	= null;   // turn off
		}
		// Set the alpha/opacity
		this._alpha	= jsos.prove(alpha,'int') ? Math.max(0,Math.min(100,alpha)) : 80;
	}

	//-------------------------
	// Public Methods
	//-------------------------
	// Get the unit size.
	// RETURNS: [number] Unit size.
	getUnits() {
		// Return raw units number value.
		return Number( this.units );
	}

	// Return this anchor's logical bounds and zoomed display measurements.
	// RETURNS: [object] Logical bounds plus derived display-space values.
	getZoomed() {
		// Keep raw geometry separate from derived display geometry.
		return {
			logical : this.getBounds(),
			display : {
				zoom  : this.zoom,
				units : Number(this.units)  * this.zoom,
				x     : Number(this.x)      * this.zoom,
				y     : Number(this.y)      * this.zoom,
				w     : Number(this.width)  * this.zoom,
				h     : Number(this.height) * this.zoom
				}
			};
	}

	// Return this anchor's units magnified by zoom.
	// RETURNS: [Number] Magnified units value.
	getUnitsZoomed() {
		// Multiply the grid units by the magnification zoom value.
		return Number(this.units) * this.zoom; // [Number] value
	}

	//--------------------------------
	// Set View Zoom
	//--------------------------------
	// Change this view's display zoom without resizing its canvas data.
	// RETURNS: [number|false] Applied zoom, or `false` if invalid.
	// * value - [number] Requested zoom multiplier.
	setZoom( value ) {
		// Validate the requested zoom.
		const requested = Number( value );
		if ( !Number.isFinite(requested) ) return false;

		// Clamp zoom to the supported range.
		this.zoom =
			Math.min(
				this.maxZoom,
				Math.max( this.minZoom, requested )
				);

		// Tell the view or renderer to update its display.
		this.emit( 'zoom', null, this.zoom );
		return this.zoom; // applied zoom
	}

	// Return this anchor's set zoom magnification value.
	// RETURNS: [Number] of magnification zoom value.
	getZoom() { return this.zoom; }

	//-------------------------
	// Public Methods
	//-------------------------
	// Sets the parent through which the points are relative.
	// RETURNS: [void].
	// * anchor	- [object] Anchor serving as the baseline nested [object] (for relative x & y).
	setParent( anchor ) {
		// Validate argument(s).
		if ( !(anchor instanceof Anchor) ) {
			console.warn( `Parent of anchor must be of type [object] Anchor.` );
			return; // abort
		}
		// Set parent
		this._parent = anchor;
	}

	//-------------------------
	// Movement Handling
	//-------------------------
	// Move the anchor point [object].
	// RETURNS: [void].
	// * x - [number] value of horizontal offset relative to parent(s)
	// * y - [number] value of vertical offset relative to parent(s)
	// * z - [number] value of z index relative to parent(s)
	move( x, y, z=null ) {
		this.x  = x; // [number] Horizontal offset
		this.y  = y; // [number] Vertical offset
		this.z  = z===null ? this.z : z; // [number] Z index offset
	}

	// Raise or lower the z-value of the [object].
	// RETURNS: [void].
	// * z - [number] value of z index relative to parent(s)
	setZ( z ) {
		this.z = z; // [number] Z index offset
	}

	//-------------------------
	// Definition Methods
	//-------------------------
	// Define the grid size.
	// RETURNS: [bool] `true` on success, else `false`.
	//   size - [number] Value of grid the anchor is locked to.
	graticulate( size=1 ) {
		// Validate argument(s)
		if ( !jsos.prove(size,'number') || size<0.00001 ) {
			console.warn( `Attempted to set forbidden grid size. Resorting to default.` );
			size = 1; // default grid width/height
		}
		// Continue to setup the grid
		this.units = size; // set grid square of level
		// Emit event
		this.emit( 'graticulate', null, size );
		return true; // success
	}

	// Move the anchor point [object].
	// RETURNS: [object] of location & dimensions.
	getBounds() {
		return {
			zoom  : this.zoom,
			units : this.units,
			x     : this.x,
			y     : this.y,
			w     : this.width,
			h     : this.height
			};
	}

	//-------------------------
	// Get Position
	//-------------------------
	// Get an (X,Y,Z) coordinate:
	get x() { return this.x; }
	get y() { return this.y; }
	get z() { return this.z; }

	// Get an (X,Y,Z) coordinate relative to parent(s):
	get globalX() { return this._parent ? this.x + this._parent.globalX : this.x; }
    get globalY() { return this._parent ? this.y + this._parent.globalY : this.y; }
	get globalZ() { return this._parent ? this.z + this._parent.globalZ : this.z; }

	//-------------------------
	// Dimension Handling
	//-------------------------
	// Set width / height
	set width( value )  { this.resize( value, this.height ); }
	set height( value ) { this.resize( this.width, value ); }
	// Get width / height
	get width()  { return this.width; }
	get height() { return this.height; }

	// Resize the anchor point [object].
	// RETURNS: [void].
	// * width   - [number] value of custom width span of anchor
	// * height  - [number] value of custom height span of anchor
	resize( width, height=null ) {
		// Validate argument(s)
		if ( !jsos.prove(width,'number') || width<0 ||
			 !jsos.prove(height,'number') || height<0 ) {
			console.warn( `Attempted to set forbidden grid size: w=${width}, h=${height}` );
			return;
		}
		this.width  = width;   // [number] value of anchor width
		this.height = height;  // [number] value of anchor height
		// Emit event
		this.emit( 'resize', null, width, height );
	}
}
