//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/editing/tools/JestFileRelationship.js loaded' );

//-------------------------
// JestFileRelationship Class
//-------------------------
// Stores named links from one open file view to other open file views.
class JestFileRelationship {
	// Reference propert(ies)
	owner   = null;         // [JestFileView|null] View that owns the links.
	views   = new Map();    // [Map<string,JestFileView>] Target view by slot.

	//--------------------------------
	// Constructor
	//--------------------------------
	// Assign the view that owns these relationships.
	// * owner - [JestFileView] Source view of the links.
	constructor( owner ) {
		// Keep the source view available for validation and subclasses.
		this.owner = owner;
	}

	//--------------------------------
	// Assign a View
	//--------------------------------
	// Set a target view in a named slot, or clear the slot with null.
	// RETURNS: [boolean] `true` when the assignment was accepted.
	// * slot  - [string] Name of the relationship slot.
	// * view  - [JestFileView|null] Target view.
	setView( slot, view ) {
		// Require a live owner and a named slot.
		if ( !this.owner || typeof slot!=='string' || !slot )
			return false; // abort

		// Allow the caller to clear a slot even when it is already empty.
		if ( view===null ) {
			this.views.delete( slot );
			return true; // success
		}

		// Accept other file views and prevent links back to this view.
		if ( !(view instanceof JestFileView) || view===this.owner )
			return false; // fail

		// Replace the target for this slot.
		this.views.set( slot, view );
		return true; // success
	}

	//--------------------------------
	// Get a Linked View
	//--------------------------------
	// RETURNS: [JestFileView|null] Current target for the slot.
	// * slot - [string] Name of the relationship slot.
	getView( slot ) {
		// Empty slots resolve to null.
		return this.views.get( slot ) ?? null;
	}

	// RETURNS: [int] Number of occupied slots.
	get size() {
		// Count the current links.
		return this.views.size;
	}

	//--------------------------------
	// Remove Links to a View
	//--------------------------------
	// Clear every slot pointing to a view that just closed.
	// * view - [JestFileView] Target view being removed.
	removeView( view ) {
		// One target may occupy multiple slots.
		for ( const [slot, target] of this.views )
			if ( target===view )
				this.views.delete( slot );
	}

	//--------------------------------
	// Teardown Method(s)
	//--------------------------------
	// Release the owner and all linked views.
	destroy() {
		// Drop references held by the closing view.
		this.views.clear();
		this.owner = null;
	}
}
