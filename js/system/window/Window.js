//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/system/window/Window.js loaded' );

//-------------------------
// Window Class
//-------------------------
class Window extends BaseWindow {
	// Declare properties
	options			= null;		// [object] of options supplied to constructor
	title			= null;		// title of window [object]

	// Creates a window with configurable components.
	// RETURNS: [object] A new instance.
	// * options		- [object] Configuration options for the class [object].
	constructor( options={} ) {
		// Call the parent constructor
		super( options );
		// Save options
		this.title		= options.title || 'Window'; // store base title for the window [object]
		// Setup the window [object]
		this.setup();		// setup the window
		this.render();		// render the window
	}

	// Initializes the window with dynamic panels.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * elements		- [object] Configuration options for the panels.
	addElements( elements ) {
		// Require element data
		if ( !elements ) return;
		// Generate panels dynamically based on configuration
		( elements || [] ).forEach(
			data => {
				this.createPanel( data );
			});
		return true; // success
	}

	// Dynamically create a child panel [object].
	// RETURNS: Panel [object]
	// * data	- [object] of content definition for the element.
	createPanel( data ) {
		// Require this element to be created
		if ( this.el===null ) return false;
		//---------------------------------
		// Create Panel [object]
		//---------------------------------
		let element = null; // define element
		switch ( data.type ) {
			case "panel":
			default:
				// Create element [object]
				element		=
					new Panel({
						...data,
						breadcrumbs: [ ...this.breadcrumbs ]
						});
				break;
		}
		// Append to DOM & return
		this.addPanel( data.name, element );
		// Return DOM element [object]
		return element;
	}

	// Add a panel [object].
	// RETURNS: [void].
	// * name		- [string] value of Panel name.
	// * panel		- Panel [object] to add to the window.
	addPanel( name, panel ) {
		// Append to DOM & return
		this.el.appendChild( panel.el );
		// Store quick-ref
		const key	= name ?? null;
		//this.addBreadcrumbs( this ); // add window as breadcrumb
		this.ref( key, panel );
	}

	// Initializes the window with dynamic panels.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * elements		- [object] Configuration options for the panels.
	render() {
		// Call the parent render method
		super.render();
		// Add resize & drag events
		//this.resizable();
		return true; // success
	}

	// Add resize handles
	resizable() {
		const directions = [
			'top', 'right', 'bottom', 'left',
			'top-left', 'top-right', 'bottom-left', 'bottom-right'
			];
		directions.forEach(
			dir => {
				const handle		= document.createElement( 'div' );
				handle.className	= `resize-handle resize-${dir}`;
				this.el.appendChild( handle );

				handle.addEventListener(
					'mousedown',
					( e ) => {
						// Prevent bubbling.
						e.stopPropagation();
						// Get starting positions & dimensions.
						const startWidth	= this.el.offsetWidth;
						const startHeight	= this.el.offsetHeight;
						const startX		= e.clientX;
						const startY		= e.clientY;
						const startLeft		= this.el.offsetLeft;
						const startTop		= this.el.offsetTop;

						const onMouseMove	=
							(e) => {
								const dx	= e.clientX - startX;
								const dy	= e.clientY - startY;

								if ( dir.includes('right') )
									this.resize( startWidth+dx );

								if ( dir.includes('bottom') )
									this.resize( null, startHeight+dy );

								if ( dir.includes('left') ) {
									const newWidth	= startWidth - dx;
									const newLeft	= startLeft + dx;
									// Prevent window from going off-screen on the left or shrinking too much
									if ( newWidth>50 && newLeft>=0 ) {
										this.resize( newWidth );
										this.move( null, newLeft );
									}
								}

								if ( dir.includes('top') ) {
									const newHeight	= startHeight - dy;
									const newTop	= startTop + dy;
									// Prevent window from going off-screen at the top or shrinking too much
									if ( newHeight>50 && newTop>=0 ) {
										this.resize( null, newHeight );
										this.move( newTop );
									}
								}
							};

						const onMouseUp =
							() => {
								document.removeEventListener( 'mousemove', onMouseMove );
								document.removeEventListener( 'mouseup', onMouseUp );
							};

						document.addEventListener( 'mousemove', onMouseMove );
						document.addEventListener( 'mouseup', onMouseUp );
					}
				);

			});
	}

	// Override minimize method
	// RETURNS: [boolean] `true` on success else `false` on fail.
	minimize() {
		// Call parent minimize method & reframe if possible
		if ( super.minimize() ) { // attempt to minimize
			// Get saved state data
			this.measure(); // save measurements before minimizing
			this.el.style.width		= '100%';
			this.el.style.height	= '0px';
			// Pin window to bottom right
			this.el.style.bottom	= '0px';
			this.el.style.right		= '0px';
			this.el.style.top		= '';        // clear top
			this.el.style.left		= '';        // clear left
			this.el.style.position	= 'fixed'; // Ensure it's at the bottom-right corner
			return true; // successfully reframing
		}
		return false; // failed to reframe
	}

	// Override restore method
	// RETURNS: [boolean] `true` on success else `false` on fail.
	restore() {
		// Call parent restore method & reframe if possible
		if ( super.restore() ) { // attempt to restore
			if ( this.measurements ) {
				this.el.style.width		= this.measurements.width || 'auto';	// Restore width, default to auto
				this.el.style.height	= this.measurements.height || '';		// Restore height
				this.el.style.top		= this.measurements.top || '';		// Restore top
				this.el.style.left		= this.measurements.left || '';		// Restore left
				this.el.style.bottom	= '';	// Clear bottom
				this.el.style.right		= '';	// Clear right
				this.el.style.position	= '';	// Restore original position
			}
			return true; // successfully restoring
		}
		return false; // failed to reframe
	}

	// Override maximize method
	// RETURNS: [boolean] `true` on success else `false` on fail.
	maximize() {
		// Call parent maximize method & reframe if possible
		if ( super.maximize() ) { // attempt to maximize
			if ( this.measurements ) {
				this.el.style.top		= '0'; // top-left
				this.el.style.left		= '0'; // top-left
				this.el.style.width		= window.innerWidth + 'px';
				this.el.style.height	= window.innerHeight + 'px';
			}
			return true; // successfully reframing
		}
		return false; // failed to reframe
	}

	// Close the window.
	// RETURNS: [void].
	close() {
		console.log( 'Closing window...' );
		super.close();
	}
}
