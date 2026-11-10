//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/ui/JestInputSelect.js loaded' );

//-----------------------------
// JestInputSelect Class
//-----------------------------
// Dropdown select input element.
// Extends: JestElement
class JestInputSelect extends JestInput {
	// Object properties
	options		= [];		// [array] list of JestInputSelectOption
	lastMethod	= null;		// [string|null] 'spinner' | 'keyboard' | null

	//--------------------------------
	// Constructor
	//--------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client			– [object] parent application client
	// * name			– [string|null] name of the input (form use)
	// * id				– [string|null] HTML ID; if null, defaults to auto-generated skey
	// * defaultValue	– [string|null] default selected value
	// * labelText		– [string|null] optional text to show in a <label> element
	constructor( client, name=null, id=null, defaultValue=null, labelText=null ) {
		super( client ); // call parent constructor
		// Set some default properties.
		this.setLabel( labelText ?? null );			// [string] the text for the label
		this.setName( name ?? null );				// [string] value of field name
		this.setId( id ?? this.skey );				// [string] HTML id
		this.setDefault( defaultValue ?? null );	// [string] default input value
	}

	//--------------------------------
	// Build Component
	//--------------------------------
	// Build the outer panel and select box.
	// RETURNS: [void]
	// * name		- [string] unique name for system reference
	// * classes	- [array] extra CSS classes
	build( name='select', classes=[] ) {
		//--------------------------------
		// Build the Panel
		//--------------------------------
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		super.build( name, ['input-select'].mergeUnique(classes) );

		//--------------------------------
		// Create Input Select Dropdown DOM Element
		//--------------------------------
		// Generate the input select panel.
		this.panel.addElements([
			{ name: 'select', tag: 'select', attributes: {} }
			]);
		this.field = this.panel.refs.select; // keep reference

		//--------------------------------
		// Set Default Value
		//--------------------------------
		// Check if default value is set.
		if ( this.defaultValue )
			this.setDefault( this.defaultValue );

		//--------------------------------
		// Register Event(s)
		//--------------------------------
		// Register DOM events routed through internal method calls
		const events = [ 'change', 'focus', 'blur', 'click' ];
		for ( const eventName of events )
			this.registerDOMEvent( eventName );
	}

	//--------------------------------
	// Set Default Value (Override)
	//--------------------------------
	// RETURNS: [void]
	// * str	- [string] default input text
	setDefault( value ) {
		// Validate / default argument(s).
		this.defaultValue	= value ?? '';
		// Set the field default value.
		if ( this.field )
			this.selectOption( value );
	}

	//--------------------------------
	// Set Entire Option List
	//--------------------------------
	// Replace all current options with new ones.
	// * arr - [array] of { value, label } objects
	setOptions( arr=[] ) {
		//--------------------------------
		// Save Cursor
		//--------------------------------
		// Store the current selected item.
		const prevValue = this.getValue(); // store current selected

		//--------------------------------
		// Clear & Load New Option(s)
		//--------------------------------
		// Clear out all existing options.
		this.clearOptions(); // wipe existing
		// Iterate new options & add them.
		for ( const option of arr )
			this.addOption( option.value, option.label );

		//--------------------------------
		// Restore Selection Cursor
		//--------------------------------
		// Auto-select previously selected item (or clear if no options).
		const found = arr.find( o => o.value===prevValue );
		if ( found )
			this.selectOption( prevValue ); // restore selection if found
		else if ( arr.length > 0 )
			this.selectOption( arr[0].value ); // fallback to first item
		else this.selectOption( '' ); // no options

		//--------------------------------
		// Emit Event If Selection Changed
		//--------------------------------
		// Emit change-value event.
		if ( prevValue!==this.getValue() )
			this.emit( 'change', null, this.getValue() );
	}

	//--------------------------------
	// Create Object Method(s)
	//--------------------------------
	// Creates a new select dropdown option instance.
	// RETURNS: [JestInputSelectOption]
	// * id		- [string] unique id value for option
	// * label	- [string] display text
	_makeOption( id, label ) {
		// Create select input [object].
		const option	= new JestInputSelectOption( this.client, id, label );
		option.build(); // build [object]
		return option; // instance
	}

	//--------------------------------
	// Add Option to Select
	//--------------------------------
	// Adds a new option at the end of the dropdown.
	// RETURNS: [JestInputSelectOption]
	// * value	- [string] value for option
	// * label	- [string] display text
	addOption( value, label ) {
		// Create select input [object].
		const opt = this._makeOption( value, label );
		// Add option to options [array].
		this._moveOptionTo( opt, this.options.length );
		return opt; // return option [object]
	}

	//--------------------------------
	// Add Multiple Options At Once
	//--------------------------------
	// Add several options using an array of { value, label } objects.
	// RETURNS: [void]
	// * arr - [array] of option objects
	addOptions( arr=[] ) {
		// Iterate options supplied & creat.
		for ( const { value, label } of arr )
			this.addOption( value, label ); // add new option
	}

	//--------------------------------
	// Move an Option to a New Index
	//--------------------------------
	// Get a select option in the dropdown.
	getOption( value ) {
		return this.options.find( o => o.value===value );
	}
	// Get a select option's index in the dropdown.
	getOptionIndex( value ) {
		return this.options.findIndex( o => o.value===value );
	}

	//--------------------------------
	// Move This Option to New Index
	//--------------------------------
	// Moves an option by its `value` to a different index in the list.
	// RETURNS: [bool] true on success
	// * value     – [string] value of the option to move
	// * newIndex  – [int] destination index (clamped automatically)
	moveOption( value, newIndex ) {
		//--------------------------------
		// Locate Option
		//--------------------------------
		// Check if option exists in dropdown.
		const opt = this.getOption( value );
		if ( !opt ) {
			console.warn( `moveOption: option not found: ${value}` );
			return false; // abort
		}

		//--------------------------------
		// Move in DOM & Re-Index
		//--------------------------------
		// Move DOM element inside select box.
		return this._moveOptionTo( opt, newIndex );
		//return true; // success
	}

	//--------------------------------
	// Move Option DOM + Update Index
	//--------------------------------
	// Internal helper to move or insert an option at a target index.
	// RETURNS: [bool] true on success
	// * opt      – [JestInputSelectOption] the option object to insert/move
	// * index    – [int] target index to place the option
	_moveOptionTo( opt, index ) {
		//--------------------------------
		// Validate Target Element
		//--------------------------------
		// Must be a valid option object with DOM panel.
		if ( !opt || !(opt instanceof JestInputSelectOption) || !opt.panel?.el ) {
			console.warn( '_moveOptionTo(): Invalid option or missing element' );
			return false; // abort
		}

		//--------------------------------
		// Clamp Index
		//--------------------------------
		// Enforce index value within valid [int] bounds.
		const clampedIndex = Math.max( 0, Math.min(index,this.options.length) );

		//--------------------------------
		// Remove Option From Array If Exists
		//--------------------------------
		// Remove if it’s already in this.options to avoid duplicates.
		const existingIndex = this.options.indexOf( opt );
		if ( existingIndex!==-1 )
			this.options.splice( existingIndex, 1 );

		//--------------------------------
		// Insert Into Internal Array
		//--------------------------------
		// Insert item @ specific index in [array].
		this.options.splice( clampedIndex, 0, opt );
		// Set owner after insert
		opt.setOwner( this );

		//--------------------------------
		// Insert Into DOM at Index
		//--------------------------------
		const children = Array.from( this.field.el.children );
		if ( clampedIndex >= children.length )
			this.field.el.appendChild( opt.panel.el );
		else
			this.field.el.insertBefore( opt.panel.el, children[clampedIndex] );

		//--------------------------------
		// Re-index All Options
		//--------------------------------
		this._resortIndex();	// ensure ._index is correct
		return true;			// success
	}


	//--------------------------------
	// Adopt Existing Option
	//--------------------------------
	// Inserts an existing JestInputSelectOption into this dropdown.
	// Handles DOM insertion, array tracking, and reindexing.
	// RETURNS: [bool] true on success else false if fail.
	// * opt		– [JestInputSelectOption] existing option object
	// * index		– [int|null] target index (defaults to end)
	adoptOption( opt, index=null ) {
		//--------------------------------
		// Validate Input
		//--------------------------------
		// Validate the option is an input dropdown option.
		if ( !opt || !(opt instanceof JestInputSelectOption) ) {
			console.warn( 'adoptOption(): Invalid option passed in.' );
			return false; // abort
		}

		//--------------------------------
		// Remove from Select Container
		//--------------------------------
		// If it belongs to another select, remove it cleanly.
		if ( opt.hasOwner() && opt.owner!==this )
			opt.detachFromOwner();

		//--------------------------------
		// Clamp Index if Provided
		//--------------------------------
		// Calculate proper final index position in the select option(s).
		const insertIndex =
			(index===null)
			? this.options.length
			: Math.max( 0, Math.min(index,this.options.length) );

		//--------------------------------
		// Use Internal Movement Logic
		//--------------------------------
		// Insert and move the option.
		this._moveOptionTo( opt, insertIndex );
		return true; // success
	}

	//--------------------------------
	// Select an Option by Value
	//--------------------------------
	// Set the select dropdown to the specified value.
	// Silently fails if not found.
	// RETURNS: [void]
	// * value	- [string] value of option to select.
	selectOption( value ) {
		//--------------------------------
		// Setup Variable(s)
		//--------------------------------
		// Set class option(s).
		this.lastMethod = 'system'; // the system called this

		//--------------------------------
		// Clear Selection If Requested
		//--------------------------------
		// Gracefully handle null/empty input
		if ( value==='' || value===null || value===undefined ) {
			this.field.el.value = ''; // deselect
			// Emit the select event.
			this.emit( `${this.lastMethod}:select`, null, value );
			this.emit( 'select', null, '' );
			// Reset last method used.
			this.lastMethod = null; // reset after emit
			return; // abort
		}

		//--------------------------------
		// Choose Existing Item
		//--------------------------------
		// Check if option already exists.
		const exists = this.getOption( value );
		if ( exists ) {
			// Set the field select option.
			this.field.el.value = value; // set option
			// Emit the select event.
			this.emit( `${this.lastMethod}:select`, null, value );
			this.emit( 'select', null, value );
			// Reset last method used.
			this.lastMethod = null; // reset after emit
		}
		// Warn if option not found.
		else {
			// Throw an error indicating the option did not exist.
			console.error( `selectOption: option not found: ${value}` );
			this.lastMethod = null; // reset after emit
		}
	}

	//--------------------------------
	// Remove a Specific Option
	//--------------------------------
	// Remove an option from the dropdown by value.
	// Automatically selects nearest neighbor or clamps.
	// RETURNS: [bool] true if removed
	// * value - [string] id of option to remove
	removeOption( value ) {
		//--------------------------------
		// Validate Argument(s)
		//--------------------------------
		// Check if index exists.
		const idx = this.getOptionIndex( value );
		if ( idx===-1 ) return false; // not found

		//--------------------------------
		// Quick DOM Cleanup
		//--------------------------------
		// Remove from DOM
		const opt = this.options[idx];
		if ( opt.panel?.el && opt.panel.el.parentNode )
			opt.panel.el.parentNode.removeChild( opt.panel.el );

		//--------------------------------
		// Remove & Resort
		//--------------------------------
		// Remove from [array]
		this.options.splice( idx, 1 );
		opt.detachFromOwner();	// detach option from select
		// Resort the indices.
		this._resortIndex();	// update all indexes

		//--------------------------------
		// Recalibrate Selection
		//--------------------------------
		// Determine fallback selection
		if ( this.options.length===0 ) {
			this.field.el.value = ''; // clear selection
			return true; // success
		}
		// Clamp index within bounds
		const clampIdx = Math.min( idx, this.options.length-1 );
		// Finally, select it.
		this.selectOption( this.options[clampIdx].value );
		return true; // success
	}

	//--------------------------------
	// Remove All Options
	//--------------------------------
	// Clear all options and selection.
	// RETURNS: [void]
	removeAllOptions() {
		this.clearOptions();
		this.field.el.value = '';
	}

	//--------------------------------
	// Hide All Options (Soft Clear)
	//--------------------------------
	// Hides all options without destroying them.
	hideAllOptions() {
		// Iterate existing option & hide them all.
		for ( const option of this.options ) {
			if ( option.panel?.el ) {
				option.panel.el.hidden = true;
			}
		}
	}

	//--------------------------------
	// Show Single Option by ID
	//--------------------------------
	// * id - [string] option value to show
	showOption( id ) {
		// Iterate existing options & hide irrelevant items.
		for ( const opt of this.options )
			if ( option.id===id && option.panel?.el )
				option.panel.el.hidden = false;
	}

	//--------------------------------
	// Show Options by Filter
	//--------------------------------
	// * fn - [function] filter callback (opt) => bool
	showOptions( fn ) {
		// Iterate existing option & filter.
		for ( const option of this.options )
			if ( option.panel?.el )
				option.panel.el.hidden = !fn(option);
	}

	//--------------------------------
	// Filter Options By Type
	//--------------------------------
	// * type - [string] matching type value
	filterOptionsByType( type ) {
		this.showOptions( option => option.data?.type===type );
	}

	//--------------------------------
	// Clear All Options
	//--------------------------------
	// RETURNS: [void]
	clearOptions() {
		// Empty html.
		this.field.el.innerHTML = '';
		this.options = [];
	}

	//--------------------------------
	// Update label of a specific option
	//--------------------------------
	// RETURNS: [void]
	// * value - [string] id value of option
	// * label - [string] new label text
	setOptionLabel( value, label ) {
		// Get option & update level if exists.
		const opt = this.getOption( value );
		if ( opt ) opt.setLabel( label );
	}

	//-------------------------
	// Ordering Utilities
	//-------------------------
	// Internal: Reindexes all select option(s) so that _index = index (0..n-1).
	_resortIndex() {
		// Iterate all option(s) & set index in-order.
		for ( let i=0; i<this.options.length; i++ )
			this.options[i].setIndex( i );
	}

	// Resort the DOM element(s).
	_resortDOM() {
		// Rebuild this.options[] from DOM order
		const nodes = Array.from( this.field.el.children );
		this.options.sort(
			( a, b ) => nodes.indexOf(a.panel.el) - nodes.indexOf(b.panel.el)
			);
		this._resortIndex();
	}

	//--------------------------------
	// DOM Event Forwarders
	//--------------------------------
	change( e )	{
		//--------------------------------
		// Setup Variable(s)
		//--------------------------------
		// Set class option(s).
		this.lastMethod = this.lastMethod ?? 'user';

		//--------------------------------
		// Change the Field Value
		//--------------------------------
		// Parse field value to number.
		const val = e.target.value;

		//--------------------------------
		// Emit Change Event
		//--------------------------------
		// Emit the change event.
		this.emit( `${this.lastMethod}:change`, null, val );
		this.emit( `change`, null, val );
		// Reset last method used.
		this.lastMethod = null; // reset after emit
	}
	focus( e )	{ this.emit( 'focus', null, e ); }
	blur( e )	{ this.emit( 'blur', null, e ); }
	click( e )	{ this.emit( 'click', null, e ); }
}
