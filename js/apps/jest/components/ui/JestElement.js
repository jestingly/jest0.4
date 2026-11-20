//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/ui/JestElement.js loaded' );

//-------------------------
// JestElement Class
//-------------------------
// Mode selection toolbar using Panel base
// NOTE: JestElement does not descend from OSElement. Instead its property
// "this.panel" is a reference to a Panel [object] (which is of type OSElement).
class JestElement extends JestMatrix {
	// Object properties
	id			= null;				// [string] Value of item / element id.
	panel		= null;				// Panel [object] handling the DOM element.
	contents	= null;				// [...] Backend contents of the element.

	//---------------------------------
	// Constructor
	//---------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client		- client [object] that this piece belongs to.
	constructor( client ) {
		super( client ); // call parent constructor
	}

	//---------------------------------
	// Initialization
	//---------------------------------
	// Build the element panel.
	// RETURNS: [void].
	// * tag		- [string] value of DOM element tag (e.g. "div", "input").
	// * name		- unique [string] value of component name in the system.
	// * classes	- [array] of classes to add to panel element.
	build( tag, name, classes ) {
		// Create DOM Panel element [object].
		this.panel	= new Panel({
			// Return DOM element [object]
			tag:		tag,
			name:		name,
			classes:	classes
			});
	}

	//-------------------------
	// Set Object Contents
	//-------------------------
	// Set additional backend data as contents of element.
	// RETURNS: [boolean] true on success, else false.
	// * contents – [any] object or structure to store as backend data.
	setContents( contents ) {
		//-------------------------
		// Validate Content & Set
		//-------------------------
		// Validate argument(s).
		if ( contents === undefined ) {
			console.warn( 'setContents() called with undefined.' );
			return false; // nothing added
		}
		// Assign and emit.
		this.contents = contents;
		return true; // success
	}

	//-------------------------
	// Get Object Contents
	//-------------------------
	// Get the contents inside the element.
	// RETURNS: [any|null] Contents or [null] if empty.
	getContents() {
		return this.contents ?? null;
	}

	//-------------------------
	// Remove Object Contents
	//-------------------------
	// Clear the currently stored object contents.
	// RETURNS: [boolean] true if contents were cleared, else false.
	removeContents() {
		if ( this.contents === null ) return false; // nothing to remove
		const removed = this.contents;
		this.contents = null;
		return true; // success
	}

	//--------------------------------
	// Identification Method(s)
	//--------------------------------
	// Set object unique id.
	// RETURNS: [bool] `true` if success, else `false` if fail.
	// * val	- [str] value of new id value.
	setId( val ) {
		// Validate argument(s).
		if ( val==='' ) return false;
		// Set property value.
		this.id	= val;
		// Emit event(s).
		this.emit( 'update-id', null, val );
		return true; // success
	}

	// Get object unique id.
	// RETURNS: [str] unique id.
	getId() { return this.id; }
}
