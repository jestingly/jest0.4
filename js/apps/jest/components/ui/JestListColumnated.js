//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/ui/JestListColumnated.js loaded' );

//-----------------------------
// JestListColumnated Class
//-----------------------------
// A column-capable list supporting sortable column headers and multi-field rows.
// Extends: JestList
class JestListColumnated extends JestList {
	// Object properties
	columns		= [];			// [array] of column configs: { id, label, visible, sortable }
	headers		= {};			// [object] map of header panels by id

	//--------------------------------
	// Set Columns
	//--------------------------------
	// Accepts an array of column configs and renders headers.
	// RETURNS: [void]
	// * cols	– [array<{ id, label, visible, sortable }>]
	setColumns( cols ) {
		// Create columns.
		this.columns	= cols;
		this.headers	= {};

		// Ensure header exists from JestList (inherited)
		if ( !this.header ) {
			console.warn( 'JestListColumnated: Missing this.header from parent class.' );
			return; // escape
		}

		// Update column count class
		for ( let i=1; i<=20; ++i )
			this.header.removeClass( `jest-cols-${i}` );
		this.header.addClass( `jest-cols-${cols.length}` );

		// Clear header contents
		this.header.clear();

		// Iterate all columns & generate inner label & event(s).
		for ( const col of this.columns ) {
			// Create column header.
			const head	=
				new Panel({
					tag     : 'div',
					classes : [ 'col-header' ],
					});
			// Add title span & optional icon/arrow.
			head.addElements([
				{
					name        : 'title',
					tag         : 'span',
					text        : col.label,
					classes     : [ 'title' ]
				},
				{
					name        : 'arrow',
					tag         : 'svg',
					attributes  :
						{
						xmlns   : "http://www.w3.org/2000/svg",
						viewBox : "0 0 24 24",
						width   : "24",
						height  : "24", "aria-hidden": "true"
						},
					classes     : [ 'ico-arrow', 'hidden' ],
					elements    :
						[{
							tag        : 'polyline',
							attributes :
								{
								points            : "6 9 12 15 18 9",
								"stroke-linecap"  : "round",
								"stroke-linejoin" : "round"
								}
						}]
				}]);

			// Hide column if invisible.
			if ( !col.visible ) head.hide();

			// Add head to header element.
			this.header.append( head );

			// Keep reference to head inside headers [array].
			this.headers[ col.id ] = head;

			// If the column is sortable, enable a click event.
			if ( col.sortable )
				head.register( 'click', 'sort', ()=>this.sortByColumn(col.id), 'dom' );
		}

		// Rebuild all items using new columns
		for ( const item of this.items )
			item.rebuild( this.columns );
	}

	//--------------------------------
	// Add a Single Column
	//--------------------------------
	// Add a column.
	// * cols	– array<{ id, label, visible, sortable }>
	addColumn( colConfig ) {
		// Add column configuration to columns.
		this.columns.push( colConfig );
		// Update column display with altered columns.
		this.setColumns( this.columns.slice() ); // trigger full reapply
	}

	//--------------------------------
	// Remove a Column by ID
	//--------------------------------
	// Remove a column.
	removeColumn( id ) {
		// Check if column (by id) exists.
		const i = this.columns.findIndex( c => c.id===id );
		if ( i===-1 ) return; // does not exist
		// Splice the columns (remove at index).
		this.columns.splice( i, 1 );
		// Update column display with altered columns.
		this.setColumns( this.columns.slice() );
	}

	//--------------------------------
	// Select a Single Item
	//--------------------------------
	// Select one row, or clear the selection when target is null.
	// RETURNS: [bool] Whether the requested selection was applied.
	// * target - [JestListColumnatedItem|null] Row to select.
	selectItem( target=null ) {
		// Find the target row's index, or use -1 to clear selection.
		const index = target===null ? -1 : this.items.indexOf( target );

		// Reject an item that does not belong to this list.
		if ( target!==null && index<0 )
			return false;

		// Apply the selected class to the target and remove it from other rows.
		for ( const item of this.items )
			item.panel.toggleClass( 'selected', item===target );

		// Keep both selection references synchronized.
		this.selectedItem  = target;
		this.selectedIndex = index;

		// Report that selection was updated.
		return true;
	}

	//--------------------------------
	// Select a Single Item by Index
	//--------------------------------
	// Select the row at index, or clear selection for a negative index.
	// RETURNS: [bool] Whether the requested selection was applied.
	// * index - [int] Index of the row to select.
	selectItemAt( index ) {
		// Treat a negative index as a request to clear selection.
		if ( index<0 )
			return this.selectItem( null );

		// Reject indices beyond the end of the list.
		if ( index>=this.items.length )
			return false;

		// Select the row at the requested index.
		return this.selectItem( this.items[index] );
	}

	// Selects a given item with a specific row column value.
	// RETURNS: [void]
	// * key	– [string] Value of row column key name.
	// * val	– [...] Value of row column value.
	selectItemByValue( key, val ) {
		// Iterate each item & deselect, then select item.
		for ( const item of this.items ) {
			//console.log( item.values );
			// Check if item is the requested target.
			const isTarget = ( item.values?.[key] === val );
			item.panel.toggleClass( 'selected', isTarget );
			// If item is requested target, select it.
			if ( isTarget ) this.selectedItem = item;
		}
	}

	//--------------------------------
	// Add Columnated Item
	//--------------------------------
	// Adds a multi-field row item.
	// RETURNS: [JestListColumnatedItem]
	// * row	– [object] with key:value for each column
	// * data	– [any] raw payload
	addItem( row, data=null ) {
		// Create a columnated item to add to the list.
		const item	= new JestListColumnatedItem( this.client, this.columns, row, data );
		const index	= this.items.length;
		const id	= `row-${index}`; // generate id
		item.build( id ); // build the item
		// Add the width (based upon # of columns)
		item.panel.addClass( `jest-cols-${this.columns.length}` );
		// Push the item into the list.
		this.items.push( item );
		this.container.append( item.panel );

		//--------------------------------
		// Click → Select this item
		//--------------------------------
		// Register event to select the row when clicked.
		item.register( 'click', 'selectRow', e=>this.selectItem(item) );

		// Apply the list's current drag setting to the new row.
		if ( this.dragEnabled && !item.isGroup ) {
			// Respect an explicit per-row request to disable dragging.
			if ( data?.draggable===false )
				item.disableDrag();
			else item.enableDrag();
		}
		// Keep dragging disabled when the list or row does not allow it.
		else item.disableDrag();

		//--------------------------------
		// Double-click → Emit custom event
		//--------------------------------
		// Register the double-click event.
		//item.panel.register( 'dblclick', ()=>this.emit( 'item:dblclick', item, item.data ) );

		return item; // return generated item
	}

	//--------------------------------
	// Remove a Single Item
	//--------------------------------
	// Remove an item by its object reference or its numeric index.
	// RETURNS: [bool] Whether an item was found and removed.
	// * itemOrIndex - [int|JestListColumnatedItem] Item index or item to remove.
	removeItem( itemOrIndex ) {
		// Resolve the item's index from either supported argument type.
		const index =
			typeof itemOrIndex==='number'
				? itemOrIndex
				: this.items.indexOf( itemOrIndex );

		// Return false if the requested item is not in the list.
		if ( index<0 || index>=this.items.length )
			return false;

		// Get the item before removing it from the array.
		const item = this.items[index];

		// Remove the item from the list and its DOM container.
		this.items.splice( index, 1 );
		item.panel.remove();

		// Clear the selected item reference if it was removed.
		if ( this.selectedItem===item )
			this.selectedItem = null;

		// Report that the item was removed.
		return true;
	}

	//--------------------------------
	// Sort by Column Key
	//--------------------------------
	sortByColumn( key ) {
		// Find column with matching key.
		const col	= this.columns.find( c => c.id===key );
		if ( !col || !col.sortable ) return; // can't sort by requested key

		// Determine if ascending.
		const asc	= !col._lastAsc;
		col._lastAsc = asc;
		// Turn visaul SVG arrow in the direction of the sort motion.
		this.headers[col.id].refs.arrow.toggleClass( 'invert', !asc );
		// Iterate list of items & sort.
		this.items.sort(
			( a, b ) => {
				const av	= a.getValue( key );
				const bv	= b.getValue( key );
				return asc ? av.localeCompare(bv) : bv.localeCompare(av);
			});
		// Toggle arrows hidden for non-selected column.
		this.toggleHeaderArrows( col.id );

		// Clear the list & readd each item (in new order).
		this.redraw(); // redraw
	}

	//----------------------------------------
	// Toggle all header arrows
	//----------------------------------------
	// Loops through headers and toggles their visibility state,
	// except for the currently selected column ID.
	// RETURNS: [void]
	// * colId	– [string] Current column ID to exclude
	toggleHeaderArrows( colId ) {
		// Hide all arrows whose column id does not match selected column.
		for ( const id in this.headers ) {
			if ( id!==colId && this.headers.hasOwnProperty(id) )
				this.headers[id].refs.arrow.hide(); // hide arrow
		}
		// Show the selected column's arrow.
		this.headers[colId].refs.arrow.show(); // show arrow
	}

	//-----------------------------
	// Redraw All Items in DOM (Preserving Headers)
	//-----------------------------
	// Redraw the populated list.
	redraw() {
		// Remove all item rows (leave header)
		for ( const item of this.items )
			item.panel.remove();

		// Re-append in sorted order
		for ( const item of this.items )
			this.container.append( item.panel );
	}
}
