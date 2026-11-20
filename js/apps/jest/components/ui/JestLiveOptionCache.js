//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/ui/JestLiveOptionCache.js loaded' );

//-----------------------------
// LiveOptionCache Class
//-----------------------------
// Tracks live options & feeds updates to multiple bound dropdowns.
// Source can be function, [array], [object],
// or anything that can be converted to options.
class JestLiveOptionCache extends JestGamepiece {
	// Object properties
	eventName		= '';				// [string] global client event name this cache listens to
	labelField		= '';				// [string] key to read label text from each source object
	valueField		= '';				// [string] key to read unique option values from each source object
	options			= [];				// [array] normalized list of { value, label } available in the cache
	watchers		= new Set();		// [set] all JestInputSelect instances bound to this cache for live updates
	watcherFilters	= new WeakMap();	// [function] filter for watcher items.
	formatter		= null;				// [function] – (raw:any)=>array of {value,label}

	//--------------------------------
	// Initialization Method(s)
	//--------------------------------
	// Initialize the reactive cache system, register a global
	// client event listener, and prepare the watcher registry.
	// RETURNS: [void].
	// * client		- [object] main application client
	// * eventName		- [string] global event to listen for
	// * labelField	- [string] key to use for option labels
	// * valueField	- [string] key to use for option values
	constructor( client, eventName, labelField='name', valueField='id' ) {
		super( client ); // call parent constructor
		this.eventName		= eventName;
		this.labelField		= labelField;
		this.valueField		= valueField;
		this.options		= [];			// current [{ value, label }]
		this.watchers		= new Set();	// input dropdowns watching this cache

		//--------------------------------
		// Listen to Global Event from Client
		//--------------------------------
		// Any plugin may emit:
		//		client.emit( eventName, null, rawData );
		// rawData → array | object | function → converted into options.
		this.register(
			eventName, `cache_${eventName}`,
			( payload, filterFn ) => {
				this._updateFromSource( payload, filterFn );
			});
	}

	//--------------------------------
	// Formatting Method(s)
	//--------------------------------
	// Set a custom formatting function to override default
	// conversion of raw input into { value, label } objects.
	// This lets plugins fully control formatting logic.
	// RETURNS: [LiveOptionCache] (chainable)
	// * fn – [function] – (raw:any)=>array of {value,label}
	setFormatter( fn ) {
		if ( typeof fn === 'function' )
			this.formatter = fn;
		return this;
	}

	//--------------------------------
	// Internal: Convert Raw Source Into Options
	//--------------------------------
	// Convert incoming raw source data into standard option objects
	// and distribute updated option lists to all bound dropdowns.
	// RETURNS: [void].
	// * raw		- [array|object|function] (raw data or callable)
	// * filterFn	– [function] comparing whether watcher is filtered out
	_updateFromSource( raw, filterFn ) {
		// Allow generating data via function callback
		if ( typeof raw==='function' )
			raw	= raw();

		//--------------------------------
		// If Custom Formatter is Defined
		//--------------------------------
		if ( this.formatter ) {
			try {
				this.options	= this.formatter(raw) ?? [];
			}
			catch ( err ) {
				console.error( `LiveOptionCache formatter failed`, err );
				this.options	= [];
			}
		}

		//--------------------------------
		// If [array] Supplied
		//--------------------------------
		// Convert Array → Option List
		else if ( Array.isArray(raw) ) {
			this.options	=
				raw.map(
					o => ({
						value : o?.[this.valueField],
						label : o?.[this.labelField] ?? o?.[this.valueField]
					})).filter( o => o.value!==undefined );
		}

		//--------------------------------
		// If [object] Supplied
		//--------------------------------
		// Convert Object → Option List
		else if ( typeof raw==='object' ) {
			this.options	=
				Object.entries(raw).map(
					( [ k, v ] ) => ({
						value: k,
						label: v?.[this.labelField] ?? k
					}));
		}

		//--------------------------------
		// Unknown / Escape
		//--------------------------------
		// Unsupported Type
		else {
			console.warn( `LiveOptionCache: unsupported raw source type`, raw );
			return; // abort
		}

		// Push new options to all bound dropdowns
		for ( const input of this.watchers ) {
			this._applyToWatcher( input, filterFn );
		}
	}

	//-------------------------------
	// Apply Options to Watcher
	//-------------------------------
	// Applies filtered options to the watcher.
	// RETURNS: [void]
	// * input		– [object] select input element (watcher)
	// * filterFn	– [function|null] optional per-call filter (from emit)
	//-------------------------------
	_applyToWatcher( input, filterFn=null ) {
		// Skip if static filter fails.
		const staticFilter	= this.watcherFilters.get( input );
		if ( staticFilter && staticFilter(input)===false )
			return;

		// Filter options (if filterFn provided)
		let visibleOptions = this.options;
		if ( typeof filterFn==="function" )
			visibleOptions = this.options.filter( o => filterFn(o, input) );

		// Update input options.
		input.setOptions( visibleOptions );

		// Clamp to valid option.
		const val	= input.getValue();
		const found	= visibleOptions.find( o => o.value===val );
		if ( !found ) {
			const fallback = visibleOptions[0]?.value ?? '';
			input.setValue( fallback );
		}
	}

	//--------------------------------
	// Manually Refresh (Optionally Pass Data)
	//--------------------------------
	// Manually trigger an update without requiring an external
	// client event. Useful for plugin-driven refresh cycles.
	// RETURNS: [void]
	// * data - optional raw data to update from
	refresh( data ) {
		this._updateFromSource( data );
	}

	//--------------------------------------------------
	// Binding Method(s)
	//--------------------------------------------------
	// Attach a JestInputSelect dropdown to this cache so that
	// it automatically receives live updates whenever the raw
	// source changes.
	// RETURNS: [void]
	// * input	- [JestInputSelect] dropdown instance
	// * fn		– [function] for filtering individual watchers.
	bind( input, filter=null ) {
		// Add input to watchers list.
		this.watchers.add( input );
		// Add optional "options" filter.
		if ( filter )
			this.watcherFilters.set( input, filter );
		// Apply immediately.
		this._applyToWatcher( input );
	}

	// Detach a dropdown from the cache. Prevents memory leaks
	// when forms are destroyed or curator objects are removed.
	// RETURNS: [void]
	// * input - [JestInputSelect] dropdown instance
	unbind( input ) {
		this.watchers.delete( input );
	}

	//--------------------------------------------
	// Update Single Option (by Value)
	//--------------------------------------------
	// Updates a single option’s label/value in all bound watchers without full refresh.
	// RETURNS: [void]
	// * oldVal		– [string] current value of the option
	// * newVal		– [string|null] new value (null to keep same)
	// * newLabel	– [string|null] new label text
	updateOption( oldVal, newVal=null, newLabel=null ) {
		//--------------------------------
		// Update Internal Cache Copy
		//--------------------------------
		// Iterate options & update value & label.
		for ( const opt of this.options ) {
			if ( opt.value===oldVal ) {
				if ( newVal!==null ) opt.value = newVal;
				if ( newLabel!==null ) opt.label = newLabel;
				break;
			}
		}

		//--------------------------------
		// Update All Watchers In-Place
		//--------------------------------
		// Iterate other watchers' options & update value & label.
		for ( const input of this.watchers ) {
			const opt = input.options.find( o => o.value===oldVal );
			if ( !opt ) continue;

			const isSelected = ( input.getValue() === oldVal );

			// Update DOM + internal values
			if ( newVal!==null ) {
				opt.value = newVal;
				if ( opt.panel?.el ) opt.panel.el.value = newVal;
			}
			if ( newLabel!==null ) {
				opt.setLabel( newLabel );
				if ( opt.panel?.el ) opt.panel.el.textContent = newLabel;
			}

			// Preserve selection
			if ( isSelected && newVal!==null )
				input.selectOption( newVal );
		}
	}
}
