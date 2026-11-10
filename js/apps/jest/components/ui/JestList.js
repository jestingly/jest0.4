//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/ui/JestList.js loaded' );

//-----------------------------
// JestList Class
//-----------------------------
// Custom scrollable list container supporting item management, selection, and sorting.
// Extends: JestElement
class JestList extends JestElement {
	// Object Properties
	items			= [];			// [array] of JestListItem
	sortMode		= 'none';		// [string] 'none' | 'alpha' | 'chrono'
	sortAsc			= true;			// [bool] direction of sort
	mode			= 'default';	// [string] 'default' | 'linear', 'single'
	selectedIndex	= -1;			// [int] index of selected item (for linear)
	selectedItem	= null;			// [object|null] of selected item (for non-linear).
	nextItemId		= 0;			// [int] Value of next item id.
	// Add this property:
	dragEnabled		= false;		// [bool] whether dragging items is enabled or disabled.
	// Panel parts
	header			= null;			// Panel [object] containing the list header(s).
	container		= null;			// Panel [object] containing the body of list items.

	// --------------------------------
	// Constructor
	// --------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client  - client [object] that this piece belongs to.
	//   mode    – [string] Value of new mode to set.
	constructor( client, mode='default' ) {
		super( client );      // call parent constructor
		this.setMode( mode ); // set list mode
	}

	//--------------------------------
	// Build List Container
	//--------------------------------
	// Build the element [object].
	// RETURNS: [void].
	// * name		- unique [string] value of component name in the system.
	// * classes	- [array] of classes to add to panel element.
	build( name='jest-list', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		super.build( "div", name, ['jest-list'].mergeUnique(classes) );
		
		// Create a header panel.
		this.header		= new Panel( { tag: 'div', classes: ['list-header'] } );
		this.panel.addPanel( 'header', this.header ); // add header to panel

		// Create a container for the list items.
		this.container	= new Panel( { tag: 'div', classes: ['list-body'] } );
		this.panel.addPanel( 'container', this.container ); // add container to panel
	}

	//-----------------------------
	// Set Drag Enabled Flag
	//-----------------------------
	// Set the list handling mode.
	// RETURNS: [boolean] Whether requested mode was set.
	//   mode – [string] Value of new mode to set.
	setMode( mode='default' ) {
		// Switch possible mode(s) & set.
		switch ( mode ) {
			// Allow these requested modes:
			case 'default':
			case 'single':
			case 'linear':
				this.mode = mode;
				break;
			// Unknown mode.
			default:
				this.mode = 'default';
				return false; // unknown
		}
		// Return success.
		return true; // success
	}

	//-----------------------------
	// Set Drag Enabled Flag
	//-----------------------------
	// RETURNS: [void]
	// * enabled – [bool]
	setDragEnabled( enabled=true ) {
		if ( enabled ) this.enableDragging();
		else this.disableDragging();
	}

	//-----------------------------
	// Enable Drag Mode
	//-----------------------------
	enableDragging() {
		// Set drag as enabled.
		this.dragEnabled = true;
		for ( const i of this.items )
			if ( i.isGroup ) i.disableDrag();
			else i.enableDrag();

		// Attach listener once
		this.container.register( 'dragover', 'sort', e=>this.onDragOver(e), 'dom' );
	}

	//-----------------------------
	// Disable Drag Mode
	//-----------------------------
	disableDragging() {
		// Set drag as disabled.
		this.dragEnabled = false;
		// Iterate each item & disable draggability.
		for ( const i of this.items ) i.disableDrag();
		// Unregister the drag event.
		this.container.unregister( 'dragover' );
	}

	//-----------------------------
	// Drag Over Handler
	//-----------------------------
	onDragOver( e ) {
		// Require drag to be enabled.
		if ( !this.dragEnabled ) return;
		e.preventDefault(); // prevent bubbling

		const dragging = this.container.el.querySelector('.dragging');
		const after = [...this.items].find(i => i.panel.el === e.target.closest('.jest-list-item'));

		if ( dragging && after && dragging!==after.panel.el ) {
			const fromIdx = this.items.findIndex(i => i.panel.el===dragging);
			const toIdx = this.items.findIndex(i => i===after);
			if ( fromIdx!==toIdx )
				this.moveItem(fromIdx, toIdx);
		}
	}

	//--------------------------------
	// Add Item to List
	//--------------------------------
	// RETURNS: [JestListItem]
	// * label – [string] display name
	// * data  – [any] optional payload
	addItem( label, data=null ) {
		// Create list item [object].
		const item	= new JestListItem( this.client, label, data );
		const id	= `item-${this.nextItemId++}`; // generate id
		item.setId( id ); // set id
		item.build( id ); // build it

		// Push item into list of item(s).
		this.items.push( item );
		this.container.addPanel( id, item.panel );

		// Register click for toggle/linear
		item.panel.register( 'click', 'clicked', ()=>this.handleClick(item), 'dom' );

		// Only allow dragging if globally enabled
		if ( this.dragEnabled && !item.isGroup ) {
			if ( data?.draggable===false )
				item.disableDrag(); // disable drag
			else item.enableDrag(); // enable drag
		}
		else item.disableDrag(); // Always disable if global off or group

		// Disable drag for groups.
		if ( item.isGroup )
			item.disableDrag();

		// Return generated list item [object].
		return item; // return [JestListItem]
	}

	//-----------------------------
	// Select Item At Index
	//-----------------------------
	// RETURNS: [bool] true if valid and selected
	// * index – [int]
	selectItemAt( index ) {
		// -----------------------------
		// If index is invalid (-1), deselect all
		// -----------------------------
		// If index is less than 0, all items are deactivated.
		if ( index<0 ) {
			// Reset both selection references.
			this.selectedIndex = -1;
			this.selectedItem  = null;
			// Deactive & disable all.
			this.deactivateAll();	// visually deselect
			//this.disableAll();	// disable all if you're using linear
			// Emit event(s).
			this.emit( 'linear:clear', null ); // optional event
			return true; // success
		}

		// -----------------------------
		// Index Range Sanity Check
		// -----------------------------
		// Clamp index.
		if ( index>=this.items.length ) return false;

		//--------------------------------
		// Handle Linear Selection
		//--------------------------------
		// Programmatic selection must not simulate a user click.
	    if ( this.mode==='linear' ) {
	        this.selectedIndex = index;
	        this.updateLinearSelection();
			// Emit the linear select event.
	        this.emit( 'linear:select', null, index );
	    }

		//--------------------------------
		// Handle Single Selection
		//--------------------------------
		// Select one item without toggling its active state.
		else if ( this.mode==='single' ) {
			// Retrieve the requested item.
			const item = this.items[index];
			// Deselect all other items.
			for ( const row of this.items )
				if ( row!==item ) row.deactivate();
			// Activate the requested item.
			item.activate();
			// Remember the selected item and index.
			this.selectedItem  = item;
			this.selectedIndex = index;
		}

		//--------------------------------
		// Handle Default Selection
		//--------------------------------
		// Select one item without toggling its active state.
	    else {
			// Get list item [object] @ index.
	        const item = this.items[index];
	        item.toggle();
			// Emit the toggle event.
	        this.emit( 'toggle', null, item );
	    }
		return true; // success
	}

	//--------------------------------
	// Handle Click Event
	//--------------------------------
	// Handle item selection according to the list's mode.
	//--------------------------------
	// Supported modes:
	//   linear:  Select items according to their index.
	//   single:  Select exactly one item at a time.
	//   default: Toggle clicked items independently.
	//--------------------------------
	// * clickedItem - [JestListItem] clicked list item.
	handleClick( clickedItem ) {
		//--------------------------------
		// Resolve Clicked Item
		//--------------------------------
		// Get the clicked item's index in the list.
		const clickedIndex = this.items.indexOf( clickedItem );
		if ( clickedIndex<0 ) return false;

		//--------------------------------
		// Handle Linear Selection
		//--------------------------------
		// Select items according to the list's linear selection rules.
		if ( this.mode==='linear' ) {
			this.selectedIndex = clickedIndex;
			this.updateLinearSelection();
			this.emit( 'linear:select', null, clickedIndex );
		}

		//--------------------------------
		// Handle Single Selection
		//--------------------------------
		// Reuse the list's programmatic selection behavior.
		else if ( this.mode==='single' )
			this.selectItemAt( clickedIndex );

		//--------------------------------
		// Handle Toggle Selection
		//--------------------------------
		// Preserve the original independent toggle behavior.
		else {
			clickedItem.toggle();
			this.emit( 'toggle', null, clickedItem );
		}

		//--------------------------------
		// Notify Registered Callbacks
		//--------------------------------
		// Pass the clicked item to any registered listeners.
		this.emit( 'clickedItem', null, clickedItem );
		return true; // success
	}

	//--------------------------------
	// Update Linear Selection
	//--------------------------------
	// Enable all up to selected index, disable others
	updateLinearSelection() {
		// Iterate each item & enable/disable.
		this.items.forEach(
			( item, i ) => {
				// Determine if active or not.
				const enabled =
					( this.sortAsc )
						? ( i<=this.selectedIndex )
						: ( i>=this.selectedIndex );
				// Check if enabling or disable.
				if ( enabled ) { // enable
					item.activate();	// highlight current
					//item.enable();		// enable item
				}
				else { // disable
					item.deactivate();	// remove highlight
					//item.disable();		// disable item
				}
			});
	}

	//--------------------------------
	// Set Linear Selection Index
	//--------------------------------
	// Updates active state for linear list index flow.
	// Only touches current/next item, avoids full reset.
	// RETURNS: [bool]
	// * index – [int] new selection index
	setLinearIndex( index ) {
		const prev = this.selectedIndex;

		// Deactivate current item, if valid
		if ( prev>=0 && prev<this.items.length ) {
			//this.items[prev].enable();
			this.items[prev].deactivate();
		}

		// Update index
		this.selectedIndex = index;

		// Enable and activate new item if valid
		if ( index>=0 && index<this.items.length ) {
			//this.items[index].enable();
			this.items[index].activate();
		}

		// Update enabled state on all
		this.updateLinearSelection();
		return true;
	}

	//--------------------------------
	// Sort Items
	//--------------------------------
	// RETURNS: [void]
	// * mode – 'alpha' | 'chrono'
	// * asc  – [bool]
	sort( mode='alpha', asc=true ) {
		// Attempt to sort (e.g. alphabetical, chronological).
		this.sortMode = mode;
		this.sortAsc  = asc; // when ascending or descending

		// If alphabetical, sort alphabetical.
		if ( mode==='alpha' )
			this.items.sort( (a,b) => asc
				? a.label.localeCompare(b.label)
				: b.label.localeCompare(a.label)
			);
		// Sort chronological.
		else if ( mode==='chrono' )
			this.items.sort( (a,b) => asc
				? a.timestamp - b.timestamp
				: b.timestamp - a.timestamp
			);

		// Redraw the list in new order.
		this.redraw();
	}

	//--------------------------------
	// Redraw All Items in DOM
	//--------------------------------
	// Clear list panel & readd every item.
	redraw() {
		// Clear the panel DOM.
		this.container.clear();
		// Iterate each item & append.
		for ( const item of this.items )
			this.container.append( item.panel );
	}

	//--------------------------------
	// Clear All List Items
	//--------------------------------
	// Remove every item and reset selection state.
	clear() {
		//--------------------------------
		// Remove Existing Items
		//--------------------------------
		// Remove from the end to avoid skipping entries.
		while ( this.items.length )
			this.removeItem( this.items.length-1 );

		//--------------------------------
		// Reset Selection
		//--------------------------------
		// Clear all selection references.
		this.selectedIndex = -1;
		this.selectedItem  = null;
	}

	//-----------------------------
	// Remove Item by Index or Reference
	//-----------------------------
	// RETURNS: [bool]
	// * itemOrIndex - [int|JestListItem]
	removeItem( itemOrIndex ) {
		// Try to find the item's index.
		let index	= -1;
		if ( typeof itemOrIndex==='number' )
			index	= itemOrIndex;
		else index	= this.items.indexOf( itemOrIndex );

		// Determine if index is in bounds.
		if ( index<0 || index>=this.items.length )
			return false; // out of bounds

		// Get the item @ index.
		const item	= this.items[index];

		// Remove the item from the container.
		this.container.removePanel( item.getId() );
		this.items.splice( index, 1 ); // remove from this.items
		// If mode is linear, handle selection update.
		if ( this.mode==='linear' ) {
			if ( index<=this.selectedIndex )
			    this.selectedIndex--;
			this.selectedIndex	=
				Math.min(
					this.selectedIndex, this.items.length-1
					);
			this.updateLinearSelection();
		}

		//--------------------------------
		// Synchronize Selection
		//--------------------------------
		// Clear selection when removing the selected item.
		// Otherwise, update the selected item's index.
		if ( this.mode==='single' ) {
			if ( this.selectedItem===item ) {
				this.selectedItem  = null;
				this.selectedIndex = -1;
			}
			else if ( this.selectedItem )
				this.selectedIndex = this.items.indexOf( this.selectedItem );
		}
		else if ( this.selectedItem===item )
			this.selectedItem = null;

		return true; // success
	}

	//-----------------------------
	// Get Item by Index
	//-----------------------------
	// RETURNS: [JestListItem|null]
	// * index - [int]
	getItem( index ) {
		// Check if index is within boudns, then return item if exists.
		return ( index>=0 && index<this.items.length ) ? this.items[index] : null;
	}

	//-----------------------------
	// Get All Items
	//-----------------------------
	// RETURNS: [array<JestListItem>]
	getItems() {
		return this.items.slice(); // copy-safe
	}

	//-----------------------------
	// Move/Reorder Item
	//-----------------------------
	// RETURNS: [bool]
	// * fromIndex - [int]
	// * toIndex   - [int]
	moveItem( fromIndex, toIndex ) {
		//--------------------------------
		// Sanity Check
		//--------------------------------
		// Skip if source index matches destination index.
		if ( fromIndex===toIndex ) return false;
		// Require indices to be within bounds.
		if ( fromIndex<0 || toIndex<0 ||
			 fromIndex>=this.items.length || toIndex>=this.items.length )
			return false; // out-of-bounds

		//--------------------------------
		// Splice List of Items
		//--------------------------------
		// Splice & destructure to access item.
		const [item] = this.items.splice( fromIndex, 1 );
		this.items.splice( toIndex, 0, item );

		//--------------------------------
		// Synchronize Selected Index
		//--------------------------------
		// Preserve the selected item's position after reordering.
		if ( this.mode==='single' && this.selectedItem )
			this.selectedIndex = this.items.indexOf( this.selectedItem );

		//--------------------------------
		// Redraw & Emit Event
		//--------------------------------
		this.redraw(); // redraw the list
		// Emit reordered event.
		this.emit( 'reordered', null, fromIndex, toIndex );
		return true; // sucess
	}

	//-----------------------------
	// Hide Item from Display
	//-----------------------------
	hide() {
		this.panel.addClass( 'hidden' );
	}

	//-----------------------------
	// Show Item in Display
	//-----------------------------
	show() {
		this.panel.removeClass( 'hidden' );
	}

	//-----------------------------
	// Enable All Items
	//-----------------------------
	enableAll() {
		this.items.forEach( i => i.setEnabled(true) );
	}

	//-----------------------------
	// Disable All Items
	//-----------------------------
	disableAll() {
		this.items.forEach( i => i.setEnabled(false) );
	}

	//-----------------------------
	// Activate All Items
	//-----------------------------
	activateAll() {
		this.items.forEach( i => i.activate() );
	}

	//-----------------------------
	// Deactivate All Items
	//-----------------------------
	deactivateAll() {
		this.items.forEach( i => i.deactivate() );
	}
}
