//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/system/components/panel/Panel.js loaded' );

//-------------------------
// Panel Class
//-------------------------
// Provides a class for creating a panel [object].
class Panel extends OSElement {
	// Same constructor argument(s)
	name		= null;				// [string] value of panel name (used for sorting)
	type		= null;				// Type of panel (form, etc.)

	//-------------------------
	// Constructor
	//-------------------------
	// Construct panel [object]
	constructor( options ) {
		super( options ); // parent construct
		// Handle option argument(s)
		this.name		= options.name || null;				// [string] name of object
		this.type		= options.type || 'unspecified';	// [string] value of type of panel
		// Setup the panel before creating the element
		this.setup();		// setup the panel
		this.render();		// render the panel
	}

	//-------------------------
	// Initialization
	//-------------------------
	// Setup the panel [object].
	// RETURNS: [boolean] true or false.
	setup() {
		super.setup(); // call parent setup method
		// Ensure class(es) include panel base class(es)
		this.classes.push( 'jest-panel' );
		return true; // success
	}
	// Render the panel [object].
	// RETURNS: [boolean] true or false.
	render() {
		super.render(); // call parent render method
		// --------------------------------
		// Render the children
		// --------------------------------
		this.addElements( this._options.elements );	// Generate the panel elements
	}

	//-------------------------
	// Add/Remove Panel(s)
	//-------------------------
	// Dynamically updates the panel content.
	// RETURNS: [void].
	// * elements	- [array] New content definitions for the panel.
	addElements( elements ) {
		// Require element data
		if ( !elements ) return;
		// Create panel element [objects]
		for ( const data of elements ) {
			// Create the custom PanelElement [object]
			const element = this.createPanel( data );
		}
	}

	// Dynamically create a child panel element [object].
	// RETURNS: PanelElement [object]
	// * data	- [object] of content definition for the element.
	createPanel( data ) {
		// Require this element to be created
		if ( this.el===null ) return false;
		// Ensure panel element [object] contains breadcrumbs
		data.breadcrumbs = [ ...this.breadcrumbs ];
		// --------------------------------
		// Create PanelElement [object]
		// --------------------------------
		let panel = null; // define element
		/*switch ( data.type ) {
			case 'form':
				panel		= new PanelForm( data );
				break;
			case 'button':
				panel		= new PanelFormButton( data );
				break;
			case 'dropdown':
				panel		= new PanelFormDropdown( data );
				break;
			default:
				panel		= new PanelElement( data );
				break;
		}*/
		panel       = new Panel( data );
		// Append to DOM & return
		const index = data?.index ?? null;
		this.addPanel( data.name, panel );
		// Return panel containing DOM element [object]
		return panel; // panel [object]
	}

	// Add a panel [object].
	// RETURNS: [void].
	// * name		- [string] Value of Panel name.
	// * panel		- Panel [object] to add to the window.
	//   index		- [int|null] Value of index to insert child at.
	addPanel( name, panel, index=null ) {
		// Append to DOM & return
		this.insertAt( panel.el, index );
		// Store quick-ref
		const key         = name ?? null;
		const breadcrumbs = [ ...this.breadcrumbs ];
		this.addBreadcrumbs( breadcrumbs ); // copy breadcrumbs
		this.ref( key, panel );
	}

	// Remove a panel [object] from the window.
	// RETURNS: [bool] true on success, false on failure.
	// * nameOrPanel - [string|Panel] key used in ref(), or the panel instance.
	removePanel( nameOrPanel ) {
		// Resolve panel reference
		let panel = null;
		let key   = null;
		if ( typeof nameOrPanel==='string' ) {
			key   = nameOrPanel;
			panel = this.refs?.[key] ?? null;
		}
		else if ( nameOrPanel && typeof nameOrPanel==='object' ) {
			panel = nameOrPanel;
			key   = Object.keys(this.refs).find( k=>this.refs[k]===panel) ?? null;
		}
		// Validate panel existence
		if ( !panel || !panel.el || !panel.el.parentNode ) {
			console.error( `Panel not found or already removed.` );
			return false; // abort
		}
		// Remove from DOM
		panel.el.parentNode.removeChild( panel.el );
		// Remove stored ref
		if ( key ) delete this.refs[key];
		return true; // success
	}

	//	Finds a nested child panel by walking this panel's named refs.
	//	Accepts a dot-separated path or an array of ref names.
	//	RETURNS: matching [Panel], or [null] when any part of the path is missing.
	getPanel(path) {
		// Normalize a string path into ref names while keeping array paths intact.
		const names =
			Array.isArray(path)
				? path
				: typeof path === 'string'
					? path.split('.') : null;

		// Reject unsupported paths and empty path segments.
		if (!names || names.length===0 ||
			names.some(
				name=>typeof name!=='string' || name.length===0 )
			) return null;

		// Start the search from this Panel instance.
		let panel = this;

		// Follow one named child ref at a time.
		for (const name of names) {
			// Stop if the current object has no refs or does not own this named ref.
			if (
				!panel?.refs ||
				!Object.prototype.hasOwnProperty.call(panel.refs, name)
			) return null;

			// Move into the next child panel before checking the next name.
			panel = panel.refs[name];
		}

		// Return the deepest panel reached by the path.
		return panel ?? null;
	}

	//-------------------------
	// Destroy Panel
	//-------------------------
	// Destroy this panel and all child panels.
	// RETURNS: [void]
	destroy() {
		// Emit destruction event (optional hook)
		this.emit?.( 'destroy', this );
		// Destroy all referenced children if they have a destroy() method
		if ( this.refs ) {
			for ( const key in this.refs ) {
				const panel = this.refs[key];
				if ( panel && typeof panel.destroy==='function' ) {
					panel.destroy();
				}
			}
		}
		// Remove this element from DOM
		if ( this.el && this.el.parentNode )
			this.el.parentNode.removeChild( this.el );
		// Clear references and internal flags
		this.refs		= {};
		this.el			= null;
		this.client		= null;
		this._options	= null;
		this.breadcrumbs = [];
		// Optional logging
		//console.log( `Panel.destroy(): '${this.name}' panel destroyed.` );
	}

}
