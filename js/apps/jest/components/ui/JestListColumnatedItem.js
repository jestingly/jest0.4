//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/ui/JestListColumnatedItem.js loaded' );

//-----------------------------
// JestListColumnatedItem Class
//-----------------------------
// Multi-field list item representing a row of data.
// Extends: JestListItem
class JestListColumnatedItem extends JestListItem {
	// Object properties
	columns		= [];
	values		= {};

	//---------------------------------
	// Constructor
	//---------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client		- client [object] that this piece belongs to.
	constructor( client, columns, row={}, data=null ) {
		super( client, '', data ); // call parent constructor
		this.columns	= columns;
		this.values 	= row;
	}

	//--------------------------------
	// Build Column Row
	//--------------------------------
	// Build the element [object].
	// RETURNS: [void].
	// * name		- unique [string] value of component name in the system.
	// * classes	- [array] of classes to add to panel element.
	build( name='col-row', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		super.build( name, ['col-row'].mergeUnique(classes) );

		// Remove the default label element.
		this.panel.removePanel( 'label' );

		//-------------------------
		// Add Event Listeners
		//-------------------------
		// Add click & double-click DOM events.
		//this.panel.register( 'click', 'channel', e=>this.click(e), 'dom' );
		//this.panel.register( 'dblclick', 'channel', e=>this.dblclick(e), 'dom' );

		// Rebuild the list item column(s).
		this.rebuild( this.columns );
	}

	//-----------------------------
	// Rebuild Row with New Columns
	//-----------------------------
	rebuild( newColumns ) {
		// Set the columns.
		this.columns = newColumns;
		// Clear the panel to rebuild.
		this.panel.clear();

		// Iterate each column & generate a col cell for it.
		for ( const col of this.columns ) {
			const val	= this.values[col.id]; // ?? '';
			const field	= new Panel({
				tag     : 'div',
				classes : [ 'col-field' ],
				text    : val
				});
			if ( !col.visible ) field.hide();
			this.panel.append( field );
		}

		// Optional: Apply .jest-cols-[n] to row
		this.panel.addClass( `jest-cols-${newColumns.length}` );
	}

	//--------------------------------
	// Get Value by Column ID
	//--------------------------------
	// RETURNS: [string]
	getValue( id ) {
		return this.values[id]; // ?? '';
	}

	//--------------------------------
	// DOM Event Channels
	//--------------------------------
	// Each receives native DOM event, re-emits through system
	click( e )		{ this.emit( 'click', null, e ); }
	dblclick( e )	{ this.emit( 'dblclick', null, e ); }
}
