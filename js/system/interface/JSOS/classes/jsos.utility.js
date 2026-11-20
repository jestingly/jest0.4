//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/system/interface/JSOS/classes/JSOSUtility.js loaded' );

// Jest OS class
class JSOSUtility extends JSOSReadWrite {
	// Object properties
	skeys			= new Set();		// [Set<string>] Unique keys for open file tracking.
	mouseUps		= null;				// [Array] Global mouse-up event(s).
	// Known SVG tag list (render-critical)
	svgTags			= null;				// [Set<string>] svgTags which use NS element methods.

	//---------------------------------
	// Initialization
	//---------------------------------
	// Creates the class [object] with configurable components.
	// RETURNS: [object] A new instance.
	// * options		- [object] Configuration options for the class [object].
	constructor( options={} ) {
		super( options );				// call parent constructor
		this.skeys		= new Set();	// Initialize key set
		// Set global "safe" mouse-up [array] for reference.
		this.mouseUps	= [ 'mouseup', 'blur', 'oncontextmenu' ];
		this.svgTags	=
			new Set([
				'svg', 'g', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon',
				'text', 'tspan', 'defs', 'use', 'linearGradient', 'radialGradient',
				'stop', 'clipPath', 'mask', 'pattern', 'filter',
				'feGaussianBlur', 'feOffset', 'feColorMatrix'
				]);
	}

	//---------------------------------
	// Unique Key Handling
	//---------------------------------
	// Generate a unique ID.
	// RETURNS: [void].
	generateKey() {
		let skey, attempts = 0;
		do {
			// Generate random + timestamp-based key
			const rand = Math.random().toString(36).substring(2, 10); // 8-char random string
			const time = Date.now().toString(36); // timestamp in base36
			skey = `${time}_${rand}`;
			/*if ( ++attempts>20 )
				throw new Error( "Failed to generate a unique key." );*/
		} while ( this.skeys.has(skey) );
		this.skeys.add( skey );
		return skey;
	}

	//--------------------------------
	// Release Key
	//--------------------------------
	// Removes a used key from the tracking set.
	// * key	- [string] Unique key to remove.
	releaseKey( key ) {
		this.skeys.delete( key );
	}

	//-------------------------
	// Class Extension
	//-------------------------
	// Load mixin data into class prototype.
	// * targetClass	- [string] value of class prototype to implement mixins into.
	// * names			- [array] of mixin names to implement.
	// RETURNS: [bool] `true` on success, else `false`.
	static implement( targetClass, names ) {
		names.forEach(
			name => {
				if ( Mixins[name] )
					Object.assign( targetClass.prototype, JestMixins[name] );
				else throw new Error( `Mixin ${name} not found` );
			});
	}

	//-------------------------
	// HTML Element Methods
	//-------------------------
	// Create an HTML element from markup
	generateElement( type='div', id='', classes=[], markup='', objectURL=null ) {
		// Declare variables
		let datatype	= null;	// used to check datatype(s)
		let el			= null;	// used to create HTML Element
		// Create HTML Element by requested type
		if ( type==='audio' )
			el	= new Audio( objectURL || '' );
		else if ( type==='image' )
			el	= new Image( objectURL || '' );
		else if ( this.svgTags.has(type) )
			el	= document.createElementNS( "http://www.w3.org/2000/svg", type );
		else el	= document.createElement( String(type) );
		// Add markup
		el.innerHTML = markup!==null ? String(markup) : '';
		// Add unique identifier
		el.id = id!==null ? String(id) : '';
		// Add class(es)
		datatype = this.datatype( classes );
		if ( datatype==='string' )
			el.classList.add( classes );
		else if ( datatype==='array' ) {
			for ( const className of classes ) {
				el.classList.add( String(className) );
			}
		}
		// Return generated element [object]
		return el;
	}

	// Flip the classes on a DOM element or array of elements
	// RETURNS: [bool] `true` on success else `false` on fail.
	// * elements		- [HTMLElement|HTMLElement[]] Element(s) to apply class-flip to.
	// * add			- [string|string[]] Class(es) to add.
	// * remove			- [string|string[]] Class(es) to remove.
	classflip( elements, add=[], remove=[] ) {
		// Normalize inputs
		if ( !(elements instanceof Array) )	elements	= [elements];
		if ( !(add instanceof Array) )		add			= [add];
		if ( !(remove instanceof Array) )	remove		= [remove];
		// Iterate through elements
		for ( const element of elements ) {
			// Validate each element
			if ( !element || !(element instanceof HTMLElement) ) {
				console.error( 'Invalid element:', element );
				continue; // Skip invalid elements
			}
			// Add and remove classes
			element.classList.add( ...add );
			element.classList.remove( ...remove );
		}
		return true; // Success
	}

	//-------------------------
	// DATA Parsing
	//-------------------------
	// Convert version between string and integer formats.
	// @param {string|number} version - Version to convert.
	// @param {string} [cast='verse'] - Target format: 'verse' (string) or 'intverse' (integer).
	// @returns {string|number|null} - Converted version or null on fail.
	intvert( version, cast='verse' ) {
		// Check if version supplied
		if ( !version ) return null;
		// Convert number to version ie. 100 to 1.0.0
		if ( cast==='verse' && typeof version==='number' ) {
			return version
				.toString()
				.padStart( 3, '0' )
				.match( /(\d)(\d)(\d)/ )
				.slice( 1, 4 )
				.join( '.' );
		}
		// Parse
		if ( cast==='intverse' && typeof version==='string' && /^\d+\.\d+\.\d+$/.test(version) ) {
			return parseInt( version.replace(/\./g, ''), 10 );
		}
		return null; // return [null] if fail
	}

	// Pathologize (clean parse a path & return result)
	// RETURNS: [string] or [array] of [strings] depending on request; `null` if empty
	// * path		- [string] or [array] of [strings] to pathologize
	//   explode	- [boolean] whether to return clean split [array] or pathologized [string]; defaults to false
	//   delimiter	- [string] value of delimiter between values ie. ',' or '/' for file paths, etc.
	pathologize( path, explode=false, delimiter='/' ) {
		// Merge the path by delimiter
		path	= path.join( delimiter );
		// Remove trailing slashes
		path	= path.replace( /^\/+/g, '' );				// leading slashes
		path	= path.replace( /\/+$/, '' );				// ending slahes
		path	= path.replace( /([^:])(\/\/+)/g, '$1/' );	// double slashes
		// Explode into [array] if requested (else keep as [string])
		if ( explode===true )
			path = path.split( delimiter );
		return path; // return parsed path
	}

	// Parse a multiuniverse stray path into an object with a customizable delimiter.
 	// @param {string|null} stray				- Multiuniverse stray path.
	// @param {string|null} [fallverse=null]	- Default version fallback if not found.
	// @param {string} [delimiter='/']			- Custom delimiter for parsing.
	// @returns {object|null}					- Parsed multiuniverse object or null on fail.
	multiuniverse( stray=null, fallverse=null, delimiter='/' ) {
    	// Validate input: `stray` must be a non-empty string
		if ( !stray || typeof stray!=='string') return null;
		// Clean and split the input path into parts using `pathologize`
		const parts		= pathologize( stray, true, delimiter );
		// If fewer than 2 parts exist, the path is too short to process
		if ( parts.length<2 ) return null;
		// Extract the last part of the path (could be a version or a type)
		const end		= parts.pop();
		let type, version, verse=null, intverse=null;
		// Check if the last part matches a valid version format (e.g., "1.2.3")
		if ( /^\d+\.\d+\.\d+$/.test(end) ) {
			type		= parts.pop();		// If valid version, the previous part is the type
			version		= end;				// Set the version
		}
		else {
			type		= end;				// If not a valid version, treat it as the type
			// Use `fallverse` if it is a valid fallback version
			version		= fallverse && /^\d+\.\d+\.\d+$/.test(fallverse) ? fallverse : null;
		}
		// Convert the version into both string ('verse') and integer ('intverse') formats
		if ( version ) {
			verse		= intvert( version, 'verse' );
			intverse	= intvert( version, 'intverse' );
		}
		// Rebuild various structured outputs from the processed parts
		const base		= parts.join( delimiter );					// Base path without type or version
		const trail		= [ ...parts, type ];						// Full path as an array
		const path		= trail.join( delimiter );					// Full path as a string
		const typeverse	= version ? [type,verse] : [type];			// Type + version as an array
		const issue		= [ ...parts, ...typeverse ];				// Full issue as an array
		const edition	= issue.join( delimiter );					// Full issue as a string
		// Return the structured object
		return {
			base,		// Base path as string.
			type,		// Type of the multiuniverse.
			verse,		// Version as a string.
			path,		// Full path as a string.
			trail,		// Path as an array.
			edition,	// Full edition path as a string.
			issue,		// Edition as an array.
			intverse	// Integer version or null.
		};
	}

	//-------------------------
	// JEST® DOM Utility Class
	//-------------------------
	// Finds the offset of el from the body or html element
	// RETURNS: [object] { left, top }
	getAbsoluteOffsetFromBody( el ) {
		let x = 0, y = 0;
		// Loop until no more offsetParents or invalid offsets
		while ( el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop) ) {
			// Add element offsets minus scroll, plus border
			x += el.offsetLeft - el.scrollLeft + el.clientLeft;
			y += el.offsetTop - el.scrollTop + el.clientTop;
			// Move up the DOM tree
			el = el.offsetParent;
		}
		return { left:x, top:y };
	}

	// Finds the offset of el from relativeEl
	// RETURNS: [object] { left, top }
	getAbsoluteOffsetFromGivenElement( el, relativeEl ) {
		let x = 0, y = 0;
		// Loop until reaching relativeEl or top of DOM
		while ( el && el!==relativeEl && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop) ) {
			// Add element offsets minus scroll, plus border
			x += el.offsetLeft - el.scrollLeft + el.clientLeft;
			y += el.offsetTop - el.scrollTop + el.clientTop;
			// Move up the DOM tree
			el = el.offsetParent;
		}
		return { left:x, top:y };
	}

	// Finds the offset of el from the first parent with position: relative
	// RETURNS: [object] { left, top }
	getAbsoluteOffsetFromRelative( el ) {
		let x = 0, y = 0;
		let valString;
		// Loop until top of DOM or stopping at position:relative
		while ( el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop) ) {
			// Add element offsets minus scroll, plus border
			x += el.offsetLeft - el.scrollLeft + el.clientLeft;
			y += el.offsetTop - el.scrollTop + el.clientTop;
			// Move up the DOM tree
			el = el.offsetParent;
			if ( el!==null ) {
				// Check if element is position: relative
				if ( typeof getComputedStyle!=='undefined' )
					valString = getComputedStyle(el,null).getPropertyValue('position');
				else valString = el.currentStyle[ 'position' ];
				// Stop if relative
				if ( valString==='relative' ) el = null;
			}
		}
		return { left:x, top:y };
	}

	// Take an event & convert it to coordinates
	// RETURNS: [object] { x, y }
	mousePos( e ) {
		// Get the event's target element
		let el		= e.currentTarget;
		// Get offset from body
		let offset	= this.getAbsoluteOffsetFromBody( el );
		// Subtract offsets from clientX/Y to get local position
		let x		= e.clientX - offset.left;
		let y		= e.clientY - offset.top;
		return { x:x, y:y };
	}

	//--------------------------------
	// Get Visible Rectangle in DOM
	//--------------------------------
	// Computes the visible portion of an element relative to the viewport,
	// accounting for all scrollable/clipping parent containers.
	// RETURNS: [object|null] visible rect { top, left, right, bottom, width, height }
	// * element – [HTMLElement] DOM node to inspect.
	getVisibleRect( element ) {
		// Get initial bounding rect of the element.
		let rect	= element.getBoundingClientRect();
		let parent	= element.parentElement;

		// Traverse up the DOM tree.
		while ( parent ) {
			// Get computed styles of parent.
			const style			= getComputedStyle( parent );
			const isScrollable	=
				[ 'auto', 'scroll', 'hidden' ].includes( style.overflow ) ||
				[ 'auto', 'scroll', 'hidden' ].includes( style.overflowX ) ||
				[ 'auto', 'scroll', 'hidden' ].includes( style.overflowY );

			// If scrollable or clipped, intersect the rect.
			if ( isScrollable ) {
				const parentRect	= parent.getBoundingClientRect();

				// Intersect element's rect with parent clip region.
				rect = {
					top		: Math.max( rect.top, parentRect.top ),
					left	: Math.max( rect.left, parentRect.left ),
					right	: Math.min( rect.right, parentRect.right ),
					bottom	: Math.min( rect.bottom, parentRect.bottom )
				};

				// Calculate visible width and height.
				rect.width	= Math.max( 0, rect.right - rect.left );
				rect.height	= Math.max( 0, rect.bottom - rect.top );

				// If fully clipped, return null.
				if ( rect.width === 0 || rect.height === 0 )
					return null;
			}

			// Move to next parent up the tree.
			parent = parent.parentElement;
		}

		// Return the final visible bounding box.
		return rect;
	}
}
