//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/os/OSElement.js loaded' );

// Jest HTML DOM Element class
class OSElement extends OSEventTarget {
	// Element properties
	el				= null;		// DOM element [object]
	tag				= null;		// DOM element type [string]
	id				= null;		// id [string] attribute value of DOM element
	classes			= null;		// class(es) [stray] attribute value of DOM element
	attributes		= null;		// [object] of attributes
	text			= null;		// [string] value of inner text

	// Creates the class [object] with configurable components.
	// RETURNS: [object] A new instance.
	// * options		- [object] Configuration options for the class [object].
	constructor( options={} ) {
		super( options ); // call parent constructor
		this.tag			= options.tag || 'div';			// [string] value of HTML markup tag
		// Setup element properties
		this.id				= options.id ?? null;			// HTML id [string] value
		this.classes		= options.classes ?? [];		// HTML class(es) [stray] value(s)
		let	classesDataType	= jsos.datatype( this.classes );
		if ( classesDataType!=='array' )
			this.classes	= classesDataType==='string' ? [this.classes] : [];
		this.attributes		= options.attributes || {};
		this.text			= options.text ?? '';
	}

	// --------------------------------
	// Initialization
	// --------------------------------
	// Setup the DOM element [object].
	// RETURNS: [boolean] `true` on success else `false` on fail.
	setup() {
		return super.setup();	// call parent setup method
	}

	// Render the OSElement [object].
	// RETURNS: [boolean] `true` on success else `false` on fail.
	render() {
		// --------------------------------
		// Create the DOM Element
		// --------------------------------
		this.createElement();				// Create the DOM element [object]
		this.initCallbacks();				// apply initial callback(s)
		//this._attachEventListeners();		// apply callback listeners
		return true;						// sucess
	}

	// Creates the DOM element for the [object].
	// RETURNS: [object] The created DOM element.
	createElement() {
		// Create the DOM element for the panel.
		const el	= jsos.generateElement( this.tag, this.id, this.classes, this.text, this.objectURL );
		this.el		= el;					// cross-reference to DOM element
		// Inject inner text content.
		this.el.innerHTML	= this.text;	// clear existing content
		// Use enhanced attribute method instead of raw loop
		if ( typeof this.attributes==='object' && this.attributes!==null )
			this.addAttributes( this.attributes );
	}

	//--------------------------------
	// Append child element
	//--------------------------------
	// RETURNS: [void]
	// * child - [Element|OSElement] Element to append
	append( child ) {
		if ( child instanceof OSElement )
			this.el.appendChild( child.el );
		else this.el.appendChild( child );
	}

	// Prepend child element
	// RETURNS: [void]
	// * child - [Element|OSElement] Element to prepend
	prepend( child ) {
		if ( child instanceof OSElement )
			this.el.prepend( child.el );
		else this.el.prepend( child );
	}

	//--------------------------------
	// Remove Element From DOM
	//--------------------------------
	// Detach an existing element from its parent.
	// Calling remove again is safe.
	//--------------------------------
	// This is not necessarily permanent destruction.
	// Do not unregister listeners here because elements
	// may be detached temporarily and subsequently reused.
	// RETURNS: [boolean] true if an element existed.
	remove() {
		// Ignore elements that have already been destroyed.
		if ( !this.el ) return false;
		// Detach the existing element from the DOM.
		this.el.remove(); // remove element
		return true;      // success
	}

	// Remove all child elements
	// RETURNS: [void]
	clear( ) {
		// Set inner HTML as empty.
		this.el.innerHTML = ''; // clear inner HTML
	}

	//-----------------------------
	// Insert Child at Specific Index
	//-----------------------------
	// Inserts a child [OSElement|Element] at a specific index inside this element.
	// RETURNS: [bool] true on success, false on failure.
	// * child	- [OSElement|Element] element to insert
	// * index - [int] target position to insert at
	insertAt( child, index=null ) {
		// Validate base element
		if ( !this.el || !(this.el instanceof Element) ) {
			console.error( 'insertAt() failed: invalid parent element:', this.el );
			return false;
		}
		// Resolve raw DOM element
		const newEl = ( child instanceof OSElement ) ? child.el : child;
		if ( !(newEl instanceof Element) ) {
			console.error( 'insertAt() failed: invalid child element:', newEl );
			return false;
		}

		// Clamp index if out of range
		const children = this.el.children;
		if ( index>=children.length || index==null ) {
			this.el.appendChild( newEl );
			return true;
		}
		else if ( index <= 0 ) {
			this.el.prepend( newEl );
			return true;
		}

		// Insert before the node currently at the target index
		this.el.insertBefore( newEl, children[index] );
		return true;
	}

	//-----------------------------
	// Reorder Existing Child
	//-----------------------------
	// Moves an existing child element to a new index.
	// RETURNS: [bool] true on success, false on failure.
	// * child		- [OSElement|Element] element to reposition
	// * newIndex	- [int|string|null] target index, or -1/'end' to push to end
	reorderChild( child, newIndex ) {
		//--------------------------------
		// Validate Parent Element
		//--------------------------------
		// Validate parent element
		if ( !this.el || !(this.el instanceof Element) ) {
			console.error( 'reorderChild() failed: invalid parent element:', this.el );
			return false;
		}

		//--------------------------------
		// Resolve Child Element
		//--------------------------------
		// Resolve DOM element
		const movingEl = ( child instanceof OSElement ) ? child.el : child;
		if ( !(movingEl instanceof Element) || !this.el.contains(movingEl) ) {
			console.error( 'reorderChild() failed: element is not a valid child of this.el:', movingEl );
			return false;
		}

		//--------------------------------
		// Remove Element Temporarily
		//--------------------------------
		// Temporarily remove element and reinsert at new index
		this.el.removeChild( movingEl );

		//--------------------------------
		// Handle Special Case: Push to End
		//--------------------------------
		// Allow 'end', -1, or null to mean "append to end"
		if (
			newIndex===-1 || newIndex===null ||
			newIndex===undefined || newIndex==='end'
		) {
			this.el.appendChild( movingEl ); // standard DOM append
			return true;
		}

		//--------------------------------
		// Insert at Requested Index
		//--------------------------------
		return this.insertAt( movingEl, newIndex );
	}

	//--------------------------------
	// DOM Class Handling
	//--------------------------------
	// Add class(es) to [this.el], if not already present.
	// RETURNS: [bool] true on success, false on error.
	// * classes - [string|string[]] Class or array of classes to add.
	addClass( classes=[] ) {
		// Validate element
		if ( !this.el || !(this.el instanceof Element) ) {
			console.error( 'addClass() failed: invalid element:', this.el );
			return false;
		}
		// Normalize input
		if ( typeof classes==='string' ) classes = [ classes ];
		if ( !(classes instanceof Array) ) {
			console.error( 'addClass() failed: invalid classes input:', classes );
			return false;
		}
		// Add only missing classes
		for ( const cls of classes ) {
			if ( typeof cls!=='string' ) continue;
			if ( !this.el.classList.contains(cls) )
				this.el.classList.add( cls );
		}
		return true;
	}

	// Remove class(es) from [this.el], only if present.
	// RETURNS: [bool] true on success, false on error.
	// * classes - [string|string[]] Class or array of classes to remove.
	removeClass( classes=[] ) {
		// Validate element
		if ( !this.el || !(this.el instanceof Element) ) {
			console.error( 'removeClass() failed: invalid element:', this.el );
			return false;
		}
		// Normalize input
		if ( typeof classes==='string' ) classes = [ classes ];
		if ( !(classes instanceof Array) ) {
			console.error( 'removeClass() failed: invalid classes input:', classes );
			return false;
		}
		// Remove only existing classes
		for ( const cls of classes ) {
			if ( typeof cls!=='string' ) continue;
			if ( this.el.classList.contains(cls) )
				this.el.classList.remove( cls );
		}
		return true;
	}

	//--------------------------------
	// Check for presence of class(es)
	//--------------------------------
	// RETURNS: [bool] true if all classes exist, false otherwise
	// * classes - [string|string[]] Class or array of classes to check
	hasClass( classes=[] ) {
		// Validate element
		if ( !this.el || !(this.el instanceof Element) ) {
			console.error( 'hasClass() failed: invalid element:', this.el );
			return false;
		}
		// Normalize input
		if ( typeof classes==='string' ) classes = [ classes ];
		if ( !(classes instanceof Array) ) {
			console.error( 'hasClass() failed: invalid classes input:', classes );
			return false;
		}
		// Check if all classes exist
		for ( const cls of classes ) {
			if ( typeof cls!=='string' ) continue;
			if ( !this.el.classList.contains(cls) )
				return false; // one or more class missing
		}
		return true; // all classes present
	}

	//--------------------------------
	// Toggle class(es) on [this.el]
	//--------------------------------
	// Add or remove class(es) based on state.
	// RETURNS: [bool] true on success, false on error.
	// * classes	- [string|string[]] Class or array of classes to toggle.
	// * state		- [bool] true=add, false=remove
	toggleClass( classes=[], state=true ) {
		// Validate element
		if ( !this.el || !(this.el instanceof Element) ) {
			console.error( 'toggleClass() failed: invalid element:', this.el );
			return false;
		}
		// Normalize input
		if ( typeof classes==='string' ) classes = [ classes ];
		if ( !(classes instanceof Array) ) {
			console.error( 'toggleClass() failed: invalid classes input:', classes );
			return false;
		}
		// Dispatch to add or remove
		return ( state )
			? this.addClass( classes )
			: this.removeClass( classes );
	}

	//--------------------------------
	// Set Attribute on Element
	//--------------------------------
	// Applies an attribute key/value to the DOM element.
	// RETURNS: [bool] true on success, false on failure
	// * key	- [string] name of attribute to set
	// * value	- [string] value to assign to attribute
	addAttribute( key, value ) {
		// Validate element
		if ( !this.el || !(this.el instanceof Element) ) {
			console.error( 'addAttribute() failed: invalid element:', this.el );
			return false; // fail
		}
		// Validate input
		if ( typeof key!=='string' ) {
			console.error( 'addAttribute() failed: key must be string:', key );
			return false; // fail
		}
		// Update internal config (optional)
		if ( !this.attributes ) this.attributes = {};
		this.attributes[key] = value;
		// Use appropriate setter
		try {
			// Parse HTML inside attribute(s).
			const finalValue = this.useHTMLAttributes ? this.parseHTMLAttrValue(value) : value;
			if ( key==="xmlns" )
				this.el.setAttribute( key, finalValue );
			else this.el.setAttributeNS( null, key, finalValue );
		}
		catch ( err ) { // error
			console.error( `addAttribute() failed for ${key}:`, err );
			return false; // fail
		}
		return true; // success
	}

	// --------------------------------
	// Inner Content Handling
	// --------------------------------
	// Set the inner text of an element.
	// NOTE: This replaces all the inner content.
	// RETURNS: [void]
	// * text	- [string] Content to display insid the element.
	setText( text ) {
		// Replace text content with text.
		this.el.textContent = text;
	}
	// Set the inner HTML of an element.
	// NOTE: This replaces all the inner content.
	// RETURNS: [void]
	// * text	- [string] HTML to display insid the element.
	setHTML( text ) {
		// Replace inner HTML with text.
		this.el.innerHTML = text;
	}

	//--------------------------------
	// Set Multiple Attributes
	//--------------------------------
	// Applies all key/value pairs in one object to DOM.
	// RETURNS: [int] Number of successful attributes set
	// * map - [object] key:value pairs
	addAttributes( map ) {
		// Require element to be set.
		if ( !this.el || !(this.el instanceof Element) ) {
			console.error( 'addAttributes() failed: invalid element:', this.el );
			return 0;
		}
		// Validate argument(s).
		if ( typeof map!=='object' || map===null ) {
			console.error( 'addAttributes() failed: invalid map:', map );
			return 0;
		}
		// Iterate attributes & set them.
		let count = 0;
		for ( const key in map ) {
			if ( typeof key!=='string' ) continue;
			const val = map[key];
			if ( this.addAttribute(key,val) )
				count++;
		}
		return count; // return success
	}

	//--------------------------------
	// Parse HTML Escaped Attribute Value
	//--------------------------------
	// Converts HTML entities like &lt;kbd&gt; into actual HTML tags.
	// RETURNS: [string] parsed HTML string
	// * str - [string] HTML-encoded text
	parseHTMLAttrValue( str ) {
		if ( typeof str!=='string' || !str.includes('&lt;') ) return str;
		const div = document.createElement('div');
		div.innerHTML = str;
		return div.textContent ?? str;
	}

	//--------------------------------
	// Unset Attribute from Element
	//--------------------------------
	// Removes a single attribute from DOM and internal map.
	// RETURNS: [bool] true if removed, false on fail
	// * key - [string] name of attribute to remove
	removeAttribute( key ) {
		// Require element to be set.
		if ( !this.el || !(this.el instanceof Element) ) {
			console.error( 'removeAttribute() failed: invalid element:', this.el );
			return false; // fail
		}
		// Validate argument(s).
		if ( typeof key!=='string' ) {
			console.error( 'removeAttribute() failed: key must be string:', key );
			return false; // fail
		}
		// Attempt to remove an attribute.
		try {
			this.el.removeAttribute( key );
			if ( this.attributes && this.attributes.hasOwnProperty(key) )
				delete this.attributes[key];
		}
		catch ( err ) { // handle error
			console.error( `removeAttribute() failed for ${key}:`, err );
			return false; // fail
		}
		return true; // success
	}

	//-----------------------------
	// Positioning DOM element.
	//-----------------------------
	// Resize the DOM element.
	// RETURNS: [void].
	// * width	- [int] Value of new width or [null] for no change.
	// * height	- [int] Value of new height or [null] for no change.
	resize( width, height ) {
		// Resize the DOM element style width and/or height.
		// Update element width.
		if ( width!==null
			 && this.el.style.width!==`${width}px` )
			this.el.style.width  = `${width}px`;  // width
		// Update element height.
		if ( height!==null
			 && this.el.style.height!==`${height}px` )
			this.el.style.height = `${height}px`; // height
	}
	// Expand the DOM element by some amount (adds to existing size).
	// RETURNS: [void]
	// * dw - [int|null] Amount to increase width (optional)
	// * dh - [int|null] Amount to increase height (optional)
	expand( dw=null, dh=null ) {
		// Get existing style(s).
		const style	= window.getComputedStyle( this.el );
		// Parse current size as integer
		const currW	= parseInt( style.width, 10 );
		const currH	= parseInt( style.height, 10 );
		// Apply added dimensions
		if ( dw!==null )
			this.el.style.width  = `${currW + dw}px`;
		if ( dh!==null )
			this.el.style.height = `${currH + dh}px`;
	}
	// Moves an element using the top|left|bottom|right style properties.
	// RETURNS: [void]
	// * top     - [int|null] New top offset in pixels (optional)
	// * left    - [int|null] New left offset in pixels (optional)
	// * bottom  - [int|null] New bottom offset in pixels (optional)
	// * right   - [int|null] New right offset in pixels (optional)
	move ( top=null, left=null, bottom=null, right=null ) {
		if ( top!==null )
			this.el.style.top    = `${top}px`;
		if ( left!==null )
			this.el.style.left   = `${left}px`;
		if ( bottom!==null )
			this.el.style.bottom = `${bottom}px`;
		if ( right!==null )
			this.el.style.right  = `${right}px`;
	}

	//-----------------------------
	// Positioning DOM element.
	//-----------------------------
	// Convert a mouse event into the element's local pixel coordinates.
	// Canvas positions are returned in backing pixels, regardless of CSS zoom.
	// RETURNS: [object] { x, y } local coordinates.
	// * event - [MouseEvent] Pointer event to convert.
	mousePos( event ) {
		// Measure the element as it is currently displayed.
		const rect = this.el.getBoundingClientRect();

		// Exclude the garage border so dropping and visual snapping use the
		// exact same local coordinate origin.
		const borderLeft = this.el.clientLeft;
		const borderTop  = this.el.clientTop;

		// Start with CSS-pixel coordinates inside the displayed element.
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;

		// Non-canvas elements keep their existing CSS-pixel coordinates.
		if ( !(this.el instanceof HTMLCanvasElement) )
			return { x, y }; // local (x,y)

		// Avoid division by zero for a hidden or not-yet-sized canvas.
		if ( rect.width===0 || rect.height===0 )
			return { x: 0, y: 0 };

		// Convert displayed CSS pixels to the canvas backing-store pixels.
		return {
			x : x * this.el.width  / rect.width,
			y : y * this.el.height / rect.height
			};
	}

	//--------------------------------
	// Show DOM Element
	//--------------------------------
	// Makes DOM element visible.
	// RETURNS: [void]
	show() {
		// See if element exists.
		if ( !this.el ) return;
		// Remove "hidden" class from element.
		this.removeClass( 'hidden' );
	}

	//--------------------------------
	// Hide DOM Element
	//--------------------------------
	// Hides DOM element from document.
	// RETURNS: [void]
	hide() {
		// See if element exists.
		if ( !this.el ) return;
		// Add "hidden" class to element.
		this.addClass( 'hidden' );
	}
}
