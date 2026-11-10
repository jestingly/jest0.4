//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/ui/JestCurator.js loaded' );

//-----------------------------
// JestCurator Class
//-----------------------------
// Panel for selecting and displaying objects by key.
class JestCurator extends JestElement {
	// Object properties
	toolbar			= null;			// [object] JestToolbar for buttons
	selectBox		= null;			// [object] JestInputSelect
	detail			= null;			// [HTMLElement] detail viewer
	objects			= {};			// [object] map of id -> JestCuratorObject
	types			= [];			// [array] registered types (strings)
	typeBox			= null;			// [object] JestInputSelect for type filtering
	typeSelected	= 'tiles';		// [string] default selected type
	filterCallbacks	= {};			// [object] map of type -> callback
	// Cached Visible Options
	cachedOptions	= {};			// map of type -> [array] of ids
	selectionMemory	= new Map();	// map of contextual selected items (such as between tabs)
	// Private counter variable(s)
	_idCounter		= 0;			// [int] value of id

	//--------------------------------
	// Constructor
	//--------------------------------
	// RETURNS: [void]
	// * client - [object] parent reference
	constructor( client ) {
		super( client );
	}

	//--------------------------------
	// Build Component
	//--------------------------------
	// RETURNS: [void]
	// * name		- [string] system name
	// * classes	- [array] additional class names
	build( name='object-selector', classes=[] ) {
		//--------------------------------
		// Setup Selector Panel
		//--------------------------------
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		super.build( 'div', name, ['object-selector'].mergeUnique(classes) );
		// Add panel elements.
		this.panel.addElements([
			{ name: 'selectwrap', tag: 'div', classes: [ 'selector-wrap' ] },
			{ name: 'detail',     tag: 'div', classes: [ 'selector-detail' ] },
			{ name: 'buttons',    tag: 'div', classes: [ 'selector-buttons' ] }
			]);
		// Assign detail element
		this.detail  = this.panel.refs.detail;
		//-------------------------
		// Create Type Select Box
		//-------------------------
		this.typeBox = new JestInputSelect( this.client );
		this.typeBox.build( 'type-dropdown' );
		this.typeBox.register( 'change', 'update-type', ()=>this.typify() );
		this.panel.refs.selectwrap.addPanel( 'types', this.typeBox.panel );
		// Default selected type
		this.typeBox.setOptions(
			this.types.map(
				( t ) =>
					({
						label    : t.charAt(0).toUpperCase()+t.slice(1), // optional prettier label
						value    : t
					})
				));
		//--------------------------------
		// Create Input Select-Box
		//--------------------------------
		// Create select box and hook events
		this.selectBox	= new JestInputSelect( this.client );
		this.selectBox.build( 'object-dropdown' );
		this.selectBox.register( 'change', 'update-detail', ()=>this.display() );
		this.panel.refs.selectwrap.addPanel( 'items', this.selectBox.panel );
		// Select a default item.
		this.typeBox.setValue( this.typeSelected );
		// --------------------------------
		// Create Toolbar [object]
		// --------------------------------
		// Create the toolbar.
		const toolbar	= new JestToolbar( this );
		this.toolbar	= toolbar; // set toolbar
		toolbar.build();
		// Add toolbar to client interface.
		this.panel.refs.buttons.addPanel( 'toolbar', toolbar.panel );
		//-------------------------
		// Update Curator Loop
		//-------------------------
		// Register "update" loop callback event.
		this.client.register(
			'update', `curator_${this.skey}`,
			( e, state, enabled, mode ) => this.update()
			);
	}

	//--------------------------------
	// Update & Rendering Method(s)
	//--------------------------------
	// Update the curator on the application display loop.
	update() {
		// Disable all menu buttons.
		this.toolbar.toggleAll( false );
		// Get current selected option [object].
		const object	= this.getSelectedObject();
		// Emit 'update' event for display.
		this.emit( 'update', null, this.typeSelected, object ); // emit event
	}

	//--------------------------------
	// Register One or More Types
	//--------------------------------
	// Accepts a single type or array of types.
	// * input - [string|array] type(s) to register
	registerType( input ) {
		// Normalize input into array
		const list = Array.isArray(input) ? input : [ input ];
		// Iterate types.
		for ( const type of list ) {
			if ( typeof type==='string' && !this.types.includes(type) )
				this.types.push( type );
		}
		// Refresh dropdown
		this._refreshTypeBox();
		// Auto-select last added type
		if ( list.length>0 ) {
			this.typeSelected = list[list.length - 1];
			this.typeBox.setValue( this.typeSelected );
			this.refreshOptions();
		}
	}

	//--------------------------------
	// Unregister One or More Types
	//--------------------------------
	// Removes provided types and reselects remaining type if needed.
	// * input - [string|array] type(s) to unregister
	unregisterType( input ) {
		const list	= Array.isArray(input) ? input : [ input ];
		let changed	= false;
		// Iterate types.
		for ( const type of list ) {
			const index = this.types.indexOf( type );
			if ( index!==-1 ) {
				this.types.splice( index, 1 );
				changed = true;
			}
		}
		// Check if any types removed.
		if ( changed ) {
			// Refresh dropdown
			this._refreshTypeBox();
			// Fallback type selection
			if ( !this.types.includes(this.typeSelected) ) {
				this.typeSelected = this.types.length>0 ? this.types[0] : null;
				this.typeBox.setValue( this.typeSelected ?? '' );
				this.refreshOptions(); // will auto-hide all if none
			}
		}
	}

	//--------------------------------
	// Clear All Types
	//--------------------------------
	// Empties all type entries and hides all items.
	clearTypes() {
		// Empty types list.
		this.types = [];
		this.typeSelected = null;
		if ( this.typeBox ) {
			this.typeBox.clearOptions();
			this.typeBox.setValue( '' );
		}
		// Refresh dropdown
		this._refreshTypeBox();
		this.refreshOptions(); // will auto-hide all
	}

	//--------------------------------
	// Refresh Type Dropdown List
	//--------------------------------
	// INTERNAL: Call after adding/removing types.
	_refreshTypeBox() {
		// Check if typebox exists.
		if ( !this.typeBox ) return;
		// Iterate options and assign label + value.
		const options =
			this.types.map(
				type => ({
					label: type.charAt(0).toUpperCase() + type.slice(1),
					value: type
				}) );
		// Set all existing "type" option(s).
		this.typeBox.setOptions( options );
	}

	//--------------------------------
	// Refresh Object Options by Type
	//--------------------------------
	// Called when type dropdown changes
	refreshOptions() {
		//-------------------------
		// Reset visibility before filtering
		//-------------------------
		Object.values( this.objects )
			.forEach(
				obj => obj.jot?.( 'visible', true )
			);
		//-------------------------
		// Begin Filtering
		//-------------------------
		// Get active selected type.
		const type			= this.typeSelected;
		const options		= this.selectBox.options;
		// Track visible candidates
		let firstVisible	= null;
		// Hide/show options based on type
		for ( const option of options ) {
			const id		= option.value;
			const object	= this.objects[id];
			const match		= this.isVisibleObject( object );
			if ( option.panel?.el ) {
				option.panel.el.hidden = !match;
				if ( match && !firstVisible )
					firstVisible = option;
			}
		}
		// Check if currently selected option is hidden
		const selectedId	= this.selectBox.getValue();
		const selectedOpt	= options.find( o => o.value === selectedId );
		const visible		= selectedOpt && !selectedOpt.panel?.el.hidden;
		// If the current selection is no longer visible, switch to first visible
		if ( !visible ) {
			if ( firstVisible ) {
				this.selectBox.setValue( firstVisible.value );
				this.display(); // force display sync
			}
			else {
				this.selectBox.setValue( '' ); // no match, clear selection
				this.display(); // clear display
			}
		}
	}

	//--------------------------------
	// Resort Options by Custom Comparator
	//--------------------------------
	// Sorts the dropdown options and updates the UI accordingly.
	// RETURNS: [void]
	// * comparator - [function] Comparator function (a,b)=>int (like array.sort)
	resortOptions( comparator ) {
		// Defensive: bail if no comparator or selectBox
		if ( typeof comparator!=='function' || !this.selectBox ) return;

		//--------------------------------
		// Get All Option Entries
		//--------------------------------
		// Grab the current options from the selectBox
		const options = this.selectBox.options;
		if ( !options || options.length===0 ) return;

		//--------------------------------
		// Apply Sort to Options
		//--------------------------------
		// Sort using the comparator passed in
		options.sort(
			( a, b ) => {
				const objA	= this.objects[ a.value ];
				const objB	= this.objects[ b.value ];
				return comparator( objA, objB );
			});

		//--------------------------------
		// Rebuild DOM <option> Order
		//--------------------------------
		// Clear all <option> tags from the <select>
		const selectEl		= this.selectBox.field.el;
		const selectedId	= this.selectBox.getValue();
		selectEl.innerHTML	= ''; // clear all

		// Re-add in new order
		for ( const opt of options ) {
			selectEl.appendChild( opt.panel.el );
		}

		//--------------------------------
		// Restore Option Order Reference
		//--------------------------------
		// Replace the options array in place
		this.selectBox.options = options;

		//--------------------------------
		// Restore Selection
		//--------------------------------
		// Re-set selected value (to avoid accidental deselection)
		if ( selectedId )
			this.selectBox.setValue( selectedId );

		//--------------------------------
		// Re-filter visibility after sort
		//--------------------------------
		this.refreshOptions();
	}

	//--------------------------------
	// Determine if Object is Visible
	//--------------------------------
	// Centralized visibility logic using type + plugin filters.
	// RETURNS: [bool]
	// * object - [JestCuratorObject]
	// * type	– [string|null] filter by type (defaults to current typeSelected)
	isVisibleObject( object, type=null ) {
		const t	= type ?? this.typeSelected;
		// Ensure valid object and type match
		if ( !object?.data || object.data.type!==t )
			return false;
		// Emit 'filter' for external plugin filtering
		this.emit( 'filter', null, t, object.data, object );
		// Read state from mode flag
		const mode 	= object.skim?.( 'visible' );
		if ( mode===false ) return false;
		// Passed all checks
		return true;
	}

	//--------------------------------
	// Get All Visible Options (by type)
	//--------------------------------
	// Get an [array] list of all visible option [ids].
	// RETURNS: [array] of option ids
	// * type	– [string|null] filter by type (defaults to current typeSelected)
	getVisibleOptions( type=null ) {
		const t	= type ?? this.typeSelected;
		// Check cache
		if ( this.cachedOptions[t] )
			return this.cachedOptions[t];
		// Generate list from scratch
		const options	= this.selectBox.options;
		const visible	=
			options.map(
				opt => {
					const obj = this.objects[ opt.value ];
					return this.isVisibleObject(obj,t) ? opt.value : null;
				})
				.filter( id => id!==null );
		// Cache it
		this.cachedOptions[t] = visible;
		return visible;
	}

	//--------------------------------
	// Get Curated Object By ID
	//--------------------------------
	// Get a curator item object using the object id.
	// RETURNS: [JestCuratorObject|null]
	// * id - [string] object ID
	getObject( id ) {
		// Determine if object exists & return it if it does.
		return this.objects?.[id] ?? null;
	}

	// Get a curator item object from the curator list of required type.
	// RETURNS: [JestCuratorObject|null].
	// * type		– [string|null] item type to remove (defaults to current selection)
	// * idParam	– [string|null] id to remove (defaults to current selection)
	getObjectByType( type=null, idParam=null ) {
		//--------------------------------
		// Validate Object(s)
		//--------------------------------
		// Get selected ID and corresponding object.
		const object	= this.getObject( idParam );
		// Validate curator object data type.
		if ( !object ) {
			console.warn( `Could not find curator object of specified id "${idParam}".` );
			return null; // user aborted
		}

		// Validate curator object data type.
		if ( object?.data?.type!==type ) {
			console.warn( `Cannot retrieve object. Object not of type "${type}".` );
			return null; // user aborted
		}

		//--------------------------------
		// Return Result
		//--------------------------------
		// Return the found object.
		return object; // [JestCuratorObject|null]
	}

	// Locate all visible objects in the curator matching:
	// (1) .data.type === type
	// (2) all key/value pairs in `props` match .data
	// RETURNS: [array<object>] list of matched objects (can be empty).
	// * type		- [string] Type to match in .data.type
	// * props		- [object] Key/value pairs to match inside .data
	// * visible	- [bool] restrict search to visible options
	getByTypeAndProps( type, props={}, visible=false ) {
		//--------------------------------
		// Prepare Match Collection
		//--------------------------------
		const matches = [];
		// Get items based upon criteria.
		const ids =
			visible
			? this.getVisibleOptions(type)
			: Object.keys( this.objects ).filter(
				id => this.objects[id]?.data?.type === type
				);

		//--------------------------------
		// Iterate Over All Curated Objects
		//--------------------------------
		for ( const id of ids ) {
			const obj = this.objects[id];
			if ( !obj?.data ) continue;

			//--------------------------------
			// Check All Specified Key/Value Pairs
			//--------------------------------
			let match = true;
			for ( const [key,val] of Object.entries(props) ) {
				if ( obj.data[key]!==val ) {
					match = false;
					break; // escape
				}
			}

			// Add Match
			if ( match ) matches.push( obj );
		}

		//--------------------------------
		// Return All Matches (may be empty)
		//--------------------------------
		return matches;
	}

	//--------------------------------
	// Get Visible Curator Objects
	//--------------------------------
	// Get an [array] list of all option [objects].
	// RETURNS: [array] of visible JestCuratorObjects
	// * type	– [string|null] filter by type (defaults to current typeSelected)
	getVisibleObjects( type=null ) {
		const t = type ?? this.typeSelected;
		// Check if cache exists
		if ( !this.cachedOptions?.[t] )
			this.getVisibleOptions( t ); // triggers population
		// Map cached ids to objects (skip missing ones for safety)
		return ( this.cachedOptions[t] ?? [] )
			.map( id => this.objects[id] )
			.filter( obj => !!obj );
	}

	//--------------------------------
	// Get Current Selected Type
	//--------------------------------
	// RETURNS: [string|null] current type
	getSelectedType() {
		return this.typeSelected ?? null;
	}

	//--------------------------------
	// Get Currently Selected Object
	//--------------------------------
	// Returns the currently selected object (if any).
	// RETURNS: [JestCuratorObject|null]
	getSelectedObject() {
		// Get current selected object id (if exists).
		const id = this.selectBox.getValue();	// current selected ID
		if ( !id ) return null;					// no selection made
		// If an object is selected, return the object.
		return this.objects[id] ?? null;		// return matching object or null
	}

	//--------------------------------
	// Flush Visible Options Cache
	//--------------------------------
	// * type – [string|null] flush specific type or all
	flushVisibleCache( type=null ) {
		if ( type ) {
			// Flush one type safely
			if ( this.cachedOptions?.[type] )
				delete this.cachedOptions[type];
		}
		else this.cachedOptions = {}; // flush all
	}

	//--------------------------------
	// Add Object to Selector
	//--------------------------------
	// Adds a new predefined object to the curator.
	// RETURNS: [JestCuratorObject] or [null].
	// * type		- [string] value of item type
	// * data		- [object] any payload
	//   autoselect	- [bool] whether to autoselect the added item (default: true)
	addObject( type, data, autoselect=true ) {
		//--------------------------------
		// Normalize Object Metadata
		//--------------------------------
		// Define initial data propert(ies).
		const id	= data.id ?? this.generateId( data.action ?? 'obj' );
		data.id		= id;					// ensure ids match
		data.type	= type ?? 'unknown';	// assign fallback type if missing

		//--------------------------------
		// Handle Duplicate ID
		//--------------------------------
		// If an object with this ID already exists, remove it before re-adding
		if ( this.objects[id] ) {
			console.error( `[JestCurator] Duplicate ID "${id}" detected. Removing old object before re-adding.` );
			this.removeObject( id );
		}

		//--------------------------------
		// Debug Specific Case (Backend)
		//--------------------------------
		//if ( data.name==='Sign' )
			//console.warn( 'Adding SIGN:', data );

		//--------------------------------
		// Wrap in Curator Object
		//--------------------------------
		const object	= new JestCuratorObject( this.client, id, data );
		this.objects[id] = object;			// keep [object] ref
		// Flush the cache.
		this.flushVisibleCache();
		// Set initial visibility
		object.jot( 'visible', true );

		//--------------------------------
		// Create Display Element
		//--------------------------------
		// Create the display for the select option.
		const display	= new JestDisplay( this.client );
		display.build( `display_${id}` );	// note the “hidden” class
		object.display	= display;			// stash it on the object
		object.display.disable();			// disable display by default
		// Add display to detail panel
		this.detail.addPanel( id, display.panel );

		//--------------------------------
		// Add to Select Dropdown
		//--------------------------------
		// Add new option to select box.
		let option;
		// Create new [JestInputSelectOption] if not supplied.
		if ( !data?._option || !(data._option instanceof JestInputSelectOption) ) {
			option			= this.selectBox.addOption( id, data.name ?? id );
			data._option	= option; // keep [JestInputSelectOption] option in data
		}
		// Use existing option instance.
		else {
			option	= data._option; // existing option
			this.selectBox.adoptOption( option, option.getIndex() );
		}

		// Hide if type doesn't match current selection.
		if ( option?.panel?.el )
			option.panel.el.hidden = !this.isVisibleObject( object );

		//--------------------------------
		// Emit Add Event
		//--------------------------------
		// Emit "added" event.
		this.emit( 'add', null, object );

		//--------------------------------
		// Auto-Select Item
		//--------------------------------
		// Auto select option.
		if ( autoselect===true )
			this.select( option.value );
		// Return the newly created curator object.
		return object; // [JestCuratorObject] instance
	}

	//--------------------------------
	// Remove An Object Safely
	//--------------------------------
	// Removes a curator item object from the curator list of required type.
	// RETURNS: [JestCuratorObject|null].
	// * type		– [string|null] item type to remove (defaults to current selection)
	// * idParam	– [string|null] id to remove (defaults to current selection)
	removeObjectByType( type=null, idParam=null ) {
		//--------------------------------
		// Validate Object(s)
		//--------------------------------
		// Get selected ID and corresponding object.
		const object	= this.getObject( idParam );
		// Validate curator object data type.
		if ( !object ) {
			console.error( `Could not find curator object of specified id "${idParam}".` );
			return null; // user aborted
		}

		// Validate curator object data type.
		if ( object?.data?.type!==type ) {
			console.error( `Cannot remove object. Object not of type "${type}".` );
			return null; // user aborted
		}

		//--------------------------------
		// Remove Object & Return
		//--------------------------------
		// Remove & return result.
		return this.removeObject( idParam ); // [JestCuratorObject|null]
	}

	// Removes a curator item object from the curator list.
	// RETURNS: [JestCuratorObject|null].
	// * idParam – [string|null] id to remove (defaults to current selection)
	removeObject( idParam=null ) {
		//--------------------------------
		// Check If Item Exists
		//--------------------------------
		// Determine the real target ID.
		let targetId;
		// Fallback to current selected visible item (if no id supplied).
		if ( idParam===null ) {
			// Check if any visible options exist at all
			const visible	= this.getVisibleOptions();
			if ( visible.length===0 ) {
				console.error( `[JestCurator] removeObject(): no visible items to remove` );
				return null; // abort
			}
			// Use selected item id.
			targetId = this.selectBox.getValue();
		}
		// Use supplied item id.
		else targetId = idParam;

		// Check target existence.
		if ( !this.objects[targetId] ) {
			console.error( `[JestCurator] removeObject(): object "${targetId}" not found` );
			return null; // abort
		}

		//--------------------------------
		// Clear Cache(s)
		//--------------------------------
		// Flush the cache.
		this.flushVisibleCache( this.typeSelected );

		//--------------------------------
		// Remove Display Element
		//--------------------------------
		// Remove display from detail panel.
		const object	= this.objects[targetId];
		this.detail.removePanel( targetId, object.display.panel );

		//--------------------------------
		// Remove From Select Dropdown
		//--------------------------------
		// Delete the item.
		delete this.objects[targetId];
		// Remove from select box
		this.selectBox.options = this.selectBox.options.filter( (o)=>o.value!==targetId );
		this.selectBox.field.el.querySelectorAll( 'option' )
			.forEach(
				opt => {
					if ( opt.value===targetId )
						opt.remove();
				});

		//--------------------------------
		// Emit Add Event
		//--------------------------------
		// Emit "remove" event.
		this.emit( 'remove', null, object );

		//--------------------------------
		// Auto-Select Item
		//--------------------------------
		// Auto-select next visible neighbor
		if ( this.getVisibleOptions().length>0 )
			this.select(); // auto-select
		else {
			this.selectBox.setValue( '' ); // select nothing
			this.display(); // refresh display
		}
		return object; // success
	}

	//--------------------------------
	// Select Method(s)
	//--------------------------------
	// Remember Curator Selection
	// Save the selected type and object for a context.
	// * key - [string] unique file or context identifier
	rememberSelection( key ) {
		// Require contextual key to be valid.
		if ( key===null || key===undefined ) return false;
		//--------------------------------
		// Remember Selection
		//--------------------------------
		// Store the selected item in memory.
		this.selectionMemory.set( key,
			{
			type	: this.typeSelected,
			id		: this.selectBox.getValue()
			});
		// Return success.
		return true;
	}

	// Restore Curator Selection
	// Restore a previously remembered selection.
	// * key - [string] unique file or context identifier
	restoreSelection( key ) {
		// Require contextual key to be valid.
		if ( key===null || key===undefined ) return false;
		// Request a selected item saved in memory.
		const selection	= this.selectionMemory.get( key );
		if ( !selection ) return false;

		//--------------------------------
		// Restore Object Type
		//--------------------------------
		// Set the selected item type to previous item.
		if ( this.types.includes(selection.type) )
			this.setType( selection.type );

		//--------------------------------
		// Perform Hard Refresh
		//--------------------------------
		this.flushVisibleCache();
		this.refreshOptions();

		//--------------------------------
		// Validate Selected Object
		//--------------------------------
		// Check if previously selected item still exists.
		const object	= this.getObject( selection.id );
		// Finally, select the previously selected item.
		if (
			object &&
			object.data.type===this.typeSelected &&
			this.isVisibleObject(object) ) {
			this.select( selection.id );
			return true;
		}

		//--------------------------------
		// Select First Available Object
		//--------------------------------
		// Fallback and select the first item if not found.
		this.select();
		return false; // restored selection failed
	}

	// Switch Curator Selection Context
	// Save the outgoing selection, refresh the list,
	// then restore the incoming selection.
	// * previousKey - [string] outgoing context
	// * currentKey  - [string] incoming context
	// * refresh     - [function|null] optional refresh callback
	switchSelection( previousKey, currentKey, refresh=null ) {
		//--------------------------------
		// Remember Previous Selection
		//--------------------------------
		if ( previousKey!==null && previousKey!==undefined )
			this.rememberSelection( previousKey );

		//--------------------------------
		// Refresh Curator
		//--------------------------------
		if ( typeof refresh==='function' )
			refresh();

		//--------------------------------
		// Restore Current Selection
		//--------------------------------
		this.flushVisibleCache();
		this.refreshOptions();
		// Restore the previous selection.
		return this.restoreSelection( currentKey );
	}

	// Select an option with flexible args.
	// * id    – [string|null]   option value to start from (if null, first visible)
	// * delta – [number]        offset from base index (e.g. 1, -1, 2, etc.)
	select( id=null, delta=0 ) {
		//--------------------------------
		// Get Visible Option(s)
		//--------------------------------
		// Gather visible options.
		const visible = this.selectBox.options.filter(
			opt => {
				const obj = this.objects[opt.value];
				return !opt.panel?.el.hidden && this.isVisibleObject(obj);
			});
		// Extract option ids.
		const ids	= visible.map( opt => opt.value );
		const total	= ids.length; // count visible otions

		//--------------------------------
		// No Options: Clear Selection
		//--------------------------------
		// No options available → clear selection
		if ( total===0 ) {
			this.selectBox.setValue( '' );
			this.display(); // update display
			// Return empty stats.
			return {
				previousIndex : null,
				newIndex      : null,
				selectedItem  : null,
				clampedCount  : 0,
				totalOptions  : 0
				};
		}

		//--------------------------------
		// Calculate Relative "Previous-most Index"
		//--------------------------------
		// Determine base index from id.
		// NOTE: Resets to first item if requested id not found.
		let prevIndex	= null;
		if ( id!==null ) {
			const index	= ids.indexOf( id );
			if ( index===-1 ) {
				//console.warn( `[JestCurator] select(): ID "${id}" not found in visible list.` );
				return {
					previousIndex : null,
					newIndex      : null,
					selectedItem  : null,
					clampedCount  : 0,
					totalOptions  : ids.length
					};
			}
			prevIndex	= index;
		}
		else prevIndex	= 0;

		//--------------------------------
		// Clamp & Calculate Selection Indices
		//--------------------------------
		// Apply delta and clamp to bounds
		let desired			= prevIndex + delta;
		let clampedCount	= 0;
		if ( desired<0 ) {
			clampedCount	= -desired;
			desired			= 0;
		}
		else if ( desired>=total ) {
			clampedCount	= desired - (total-1);
			desired			= total - 1;
		}

		//--------------------------------
		// Select New Option & Refresh Display
		//--------------------------------
		// Perform the selection, & update display.
		const newId	= ids[ desired ];
		this.selectBox.setValue( newId );
		this.display(); // update display

		//--------------------------------
		// Build & Return Stats
		//--------------------------------
		// Return diagnostics statistical data.
		const scope	= {
			previousIndex : id!==null ? prevIndex : null,
			newIndex      : desired,
			selectedItem  : this.objects[newId],
			clampedCount  : clampedCount,
			totalOptions  : total
			};
		return scope;
	}

	//--------------------------------
	// Set Selected Type Explicitly
	//--------------------------------
	// Sets the selected type in the type dropdown.
	// Refreshes visibility and internal state.
	// RETURNS: [void]
	// * type - [string] type key to set
	setType( type ) {
		//--------------------------------
		// Validate & Apply Type
		//--------------------------------
		if ( !type || !this.types.includes(type) ) {
			console.warn( `[JestCurator] setType(): Invalid type "${type}"` );
			return;
		}

		//--------------------------------
		// Set Type & Trigger Refresh
		//--------------------------------
		this.typeSelected = type;			// update internal type
		this.typeBox.setValue( type );		// update dropdown
		this.typify();						// refresh visible objects
	}

	//--------------------------------
	// Select First Visible Entry
	//--------------------------------
	// Selects the first visible item in the type dropdown.
	// RETURNS: [void].
	selectTopType() {
		// Select the top item in the type dropdown.
		if ( this.types.length>0 ) {
			const firstType		= this.types[0];
			this.typeSelected	= firstType;
			this.typeBox.setValue( firstType );
			this.refreshOptions(); // triggers re-filtering
		}
	}

	// Selects the first visible item in the item dropdown.
	// RETURNS: [void].
	selectTopObject() {
		// Select the top item in the object dropdown.
		const visible = this.getVisibleOptions();
		if ( visible.length>0 ) {
			this.selectBox.setValue( visible[0] );
			this.display(); // force update
		}
	}

	// Get the current index of a select option.
	getOptionIndex( id ) {
		const options = this.selectBox.options;
		for ( let i=0; i<options.length; i++ ) {
			if ( options[i].value === id )
				return i;
		}
		return -1; // not found
	}

	//--------------------------------
	// Update Label of an Existing Option
	//--------------------------------
	// Updates the visible label in the select box when data changes.
	// RETURNS: [void]
	// * id    - [string] id of the object whose label changed
	// * label - [string] new label to display
	updateOptionLabel( id, label ) {
		// Update the actual DOM <option> tag if it exists
		this.selectBox.setOptionLabel( id, label );
	}

	//--------------------------------
	// Update Option Label and Value
	//--------------------------------
	// Updates both the label and/or value of a visible curated object.
	// Maintains selection state and updates all internal references.
	// RETURNS: [bool] success
	// * oldId		– [string] current ID of the object/option
	// * newId		– [string|null] new ID to assign (optional; leave null to keep existing)
	// * newLabel	– [string|null] new display label (optional; leave null to keep existing)
	updateOption( oldId, newId=null, newLabel=null ) {
		//--------------------------------
		// Validate Input Existence
		//--------------------------------
		const object = this.objects?.[oldId];
		if ( !object ) {
			console.warn( `[JestCurator] updateOption(): No object found for ID "${oldId}"` );
			return false; // abort
		}
		const select = this.selectBox;

		//--------------------------------
		// Locate Option Entry
		//--------------------------------
		const opt = select.options.find( o => o.value === oldId );
		if ( !opt ) {
			console.warn( `[JestCurator] updateOption(): No option found for ID "${oldId}"` );
			return false; // abort
		}

		//--------------------------------
		// Track Current Selection
		//--------------------------------
		const isSelected = ( select.getValue() === oldId );

		//--------------------------------
		// Update Label (if provided)
		//--------------------------------
		if ( newLabel !== null ) {
			opt.setLabel( newLabel );	// update label in object
			if ( opt.panel?.el )
				opt.panel.el.textContent = newLabel; // update DOM node
		}

		//--------------------------------
		// Update Value (if changed)
		//--------------------------------
		if ( newId && newId!==oldId ) {
			// Reassign in Objects Map
			this.objects[ newId ] = object;
			delete this.objects[ oldId ];
			object.data.id = newId;

			// Update Option Value
			opt.value = newId;
			if ( opt.panel?.el )
				opt.panel.el.value = newId;

			// Update DOM Selection If Active
			if ( isSelected )
				select.selectOption( newId );
		}

		// Done
		return true;
	}

	//--------------------------------
	// Hide All Display Panels
	//--------------------------------
	// Hides all children of the detail panel container.
	// RETURNS: [void]
	hideAllDisplays() {
		// Safety check: detail panel must exist
		if ( !this.detail?.panel?.el ) return;
		// Hide every child node
		Array.from( this.detail.panel.el.children )
			.forEach(
				child => child.hidden = true
				);
	}

	//--------------------------------
	// Display Selected Object
	//--------------------------------
	// Select the current select box item (display it).
	// RETURNS: [void]
	display() {
		// Get selected ID and corresponding object
		const object	= this.getSelectedObject();
		// Hide all displays.
		this.hideAllDisplays(); // use helper method
		// Hide all displays
		for ( const key in this.objects )
			if ( this.objects[key]?.display )
				this.objects[key].display.disable();
		// If the selected object is invalid, exit early
		if ( !object ) {
			this.emit( 'display', null, null ); // emit null selection
			return; // abort
		}
		// Show the selected object’s display
		if ( object.display )
			object.display.enable();
		// Emit selection event
		this.emit( 'display', null, object );	// object to display
		this.emit( 'displayed', null, object ); // event when display finished
	}

	// Change the type of selected box items (e.g. 'links').
	// RETURNS: [void]
	typify() {
		// Get selected "type" value from select box.
		const val	= this.typeBox.getValue();
		if ( !val ) return; // no value found
		// Change selected type to value.
		this.typeSelected = val;
		// Flush the cache.
		this.flushVisibleCache( this.typeSelected );
		this.refreshOptions(); // refresh options list
	}

	//--------------------------------
	// Generate Unique ID
	//--------------------------------
	// Generate an [object] id.
	// RETURNS: [string]
	// * base - [string] base name (optional)
	generateId( base='obj' ) {
		//--------------------------------
		// Use Master Counter to Prevent Reuse
		//--------------------------------
		let id = `${base}_${this._idCounter++}`;

		//--------------------------------
		// Ensure Uniqueness Just In Case
		//--------------------------------
		// Rare edge case fallback if object already exists
		while ( this.objects[id] ) {
			id = `${base}_${this._idCounter++}`;
		}

		// Return unique id
		return id;
	}

	//--------------------------------
	// Export All Predefined Objects
	//--------------------------------
	// Download all objects as a structured JSON file.
	// RETURNS: [void]
	exportObjects() {
		// Extract all object data [array].
		const data	= Object.values(this.objects).map( o=>o.data );
		// Convert to downloadable blob.
		console.log( data );
		const blob	=
			new Blob(
				[ JSON.stringify( data, null, 2 ) ],
				{ type: 'application/json' }
				);
		const url	= URL.createObjectURL( blob );
		// Create & trigger download link.
		const a		= document.createElement( 'a' );
		a.href		= url;
		a.download	= 'predefined-objects.json';
		a.click();
		// Clean up URL object
		URL.revokeObjectURL( url );
	}

	//--------------------------------
	// Open Import File Dialog
	//--------------------------------
	// Opens file picker for .json file containing exported objects.
	// RETURNS: [void]
	openImportDialog() {
		// Create <input type=file>
		const input		= document.createElement( 'input' );
		input.type		= 'file';
		input.accept	= 'application/json';
		// File load callback
		input.onchange	=
			( e ) => {
				const file		= e.target.files?.[0];
				if ( !file ) return;
				const reader	= new FileReader();
				reader.onload	= ( evt ) => this.importObjects( evt.target.result );
				reader.readAsText( file );
			};
		// Trigger dialog
		input.click();
	}

	//--------------------------------
	// Import Object Catalog from JSON
	//--------------------------------
	// Accepts stringified JSON array or raw array and loads each [object] as a predefined.
	// RETURNS: [void]
	// * jsonData	- [string|array] input to parse and import
	importObjects( jsonData ) {
		let arr;
		//-------------------------
		// Parse if string
		//-------------------------
		if ( typeof jsonData==='string' ) {
			try {
				arr = JSON.parse( jsonData );
			}
			catch ( err ) {
				console.error( 'JestCurator: Invalid JSON during import.', err );
				return;
			}
		}
		else if ( Array.isArray(jsonData) ) {
			arr = jsonData;
		}
		else {
			console.error(
				'JestCurator: importObjects() expected string or array but got:',
				typeof jsonData
				);
			return;
		}

		//-------------------------
		// Validate parsed array
		//-------------------------
		if ( !Array.isArray(arr) ) {
			console.warn( 'JestCurator: Imported content is not an array.' );
			return;
		}

		//-------------------------
		// Import entries
		//-------------------------
		arr.forEach(
			( data ) => {
				// A type is required.
				if ( !data?.type ) {
					console.warn( 'JestCurator: Imported item did not define type, skipping.' );
					return;
				}
				else this.addObject( data.type, data );
			});
		// Force dropdown refresh after batch
		this.typeBox.setValue( this.typeSelected );
		this.typify();

		//--------------------------------
		// Auto-Select First Visible Matching Option
		//--------------------------------
		// If there is a first visible matching option, auto-select it
		this.select();

		//--------------------------------
		// Update Counter to Avoid Reuse
		//--------------------------------
		// Find highest numeric suffix across all object IDs
		const maxId = Object.keys( this.objects )
			.map( id => parseInt( id.split('_')[1], 10 ) )
			.filter( n => !isNaN(n) )
			.reduce( (a,b) => Math.max(a,b), 0 );

		// Ensure counter is always ahead of highest existing ID
		if ( maxId >= this._idCounter )
			this._idCounter = maxId + 1;
	}
}
