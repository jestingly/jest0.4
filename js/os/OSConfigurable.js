//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/os/OSConfigurable.js loaded' );

// OSConfigurable class
class OSConfigurable {
	// Plugin handling
	static plugins	= {};			// static plugins [array] for extending the Jest application
	// Declare properties
	_options		= {};			// specific options passed to constructor
	_vars 			= {};			// [object] of mode statuses
	_data			= {};			// [object] of misc. data to set internally
	_temp			= {};			// [object] of temporary data for progressive actions
	_clocks			= {};			// [object] of clocked time(s)

	//-------------------------
	// Constructor
	//-------------------------
	// Initializes a new OSConfigurable instance.
	// * options		- [object] Configuration options.
	constructor( options={} ) {
		// Save argument data
		this._options		= options;
	}

	//--------------------------------
	// Plugin Manager
	//--------------------------------
	// Register a plugin.
	// * type	- [string] Value of plugin type.
	// * plugin	- plugin [object] to plug into the system.
	// A plugin may define:
	//  - extend( Class, prototype )	→ called immediately, to augment static or prototype
	//  - init(instance)				→ called in the constructor, to wire instance-level hooks
	// * targetClass  - [string|null] optional name of the class to defer for
	static use( type, plugin ) {
		//------------------------
		// Because this.plugins is static to OSConfigurable,
		// we will ensure that all children have their own
		// class-specific plugins.
		//------------------------
		// Shadow plugins per subclass if not already
		if ( !Object.hasOwn( this, 'plugins' ) ) {
			this.plugins = {}; // fork it
			console.log( `[plugin:init] Shadowed plugin map for ${this.name}` );
		}

		// Ensure plugins exist.
		if ( !this.plugins?.[type] )
			this.regPlugins( type );

		// Check if plugin is extending the object's prototype.
		if ( typeof plugin.extend==='function' )
			plugin.extend( this, this.prototype );
		// Check if plugin has an initialization function.
		if ( typeof plugin.init==='function' )
			this.plugins[type].push( plugin.init );
	}

	// Initialize plugins.
	// * type	- [string] Value of plugin type.
	static regPlugins( type ) {
		// Ensure plugin type does not exist.
		if ( this.plugins?.[type] ) {
			//console.warn( `Plugins type "${type}" already registered.` );
			return; // escape
		}
		// Create new plugins type for this.
		this.plugins[type]	= [];
	}

	//-------------------------
	// Initialize plugins scoped to this class (not subclasses)
	//-------------------------
	// * type - [string] Plugin type (e.g. 'tools')
	// RETURNS: [Promise|false]
	static async initPlugins( type, instance ) {
		// Validate caller
		if ( typeof instance!=='object' ) {
			console.error( `[plugin:init] Invalid instance passed to ${this.name}.initPlugins()` );
			return false;
		}

		// Ensure this class owns its own plugins (no inherited leaks)
		if ( !Object.hasOwn(this,'plugins') ) {
			console.warn( `[plugin:init] ${this.name} has no local plugins.` );
			return false;
		}

		// Retrieve plugins for type
		const pluginList = this.plugins[type];
		if ( !pluginList || pluginList.length===0 ) {
			console.warn( `[plugin:init] ${this.name} has no plugins for type '${type}'` );
			return false;
		}

		// Execute plugins with the given instance as context
		for ( const initFn of pluginList ) {
			const isAsync = initFn[Symbol.toStringTag] === 'AsyncFunction';
			if ( isAsync ) await initFn.call( instance, instance );
			else initFn.call( instance, instance );
		}

		return true; // success
	}

	// Counts how many plugins for a type exist.
	// RETURNS: [int] number of registered plugins of given type.
	// * type - [string] Value of plugin type to check (e.g., 'tools', 'filters')
	countPlugins( type ) {
		// Validate plugin type.
		if ( typeof type!=='string' || !type.length ) {
			console.error( 'countPlugins() failed: invalid type:', type );
			return 0;
		}
		// Access plugin set.
		const set = this.constructor.plugins?.[type];
		if ( !set || typeof set!=='object' ) return 0;
		// Return count of plugins under type.
		return Object.keys(set).length;
	}

	//-------------------------
	// Data Methods
	//-------------------------
	// Sets or updates a variable in the container.
	// RETURNS: [void].
	// * name		- [string|array<string>] Path name or group + key (e.g., ['group', 'key']).
	// * value		- [...] Value to store.
	set( name, value ) {
		if ( Array.isArray(name) ) {
			const [group,key] = name;
			if ( !(group in this._data) )
				this._data[group] = {};
			this._data[group][key] = value;
		}
		else {
			name = jsos.pathologize( name );
			this._data[name] = value;
		}
	}

	// Retrieves a variable from the container (optionally removes it).
	// RETURNS: [...] Value of the variable, or `false` if not found.
	// * name		- [string|array<string>] Path name or group + key.
	// * wipe		- [boolean] Whether to remove the variable (default: false).
	get( name, wipe=false ) {
		if ( Array.isArray(name) ) {
			const [group,key] = name;
			if ( group in this._data && key in this._data[group] ) {
				const value = this._data[group][key];
				if ( wipe )
					delete this._data[group][key];
				return value;
			}
		}
		else {
			name = jsos.pathologize( name );
			if ( name in this._data ) {
				const value = this._data[name];
				if ( wipe )
					delete this._data[name];
				return value;
			}
		}
		return false;
	}

	// Checks if a variable exists in the container.
	// RETURNS: [boolean] `true` if the variable exists, `false` otherwise.
	// * name		- [string|array<string>] Path name or group + key.
	has( name ) {
		if ( Array.isArray(name) ) {
			const [group,key] = name;
			return group in this._data && key in this._data[group];
		}
		else {
			name = jsos.pathologize( name );
			return name in this._data;
		}
	}

	// Deletes variables from the container.
	// RETURNS: [boolean] `true` if successful, `false` otherwise.
	// * ...names	- [array<string>] Path names or group + key to delete.
	unset( ...names ) {
		names.forEach( ( name ) => {
			if ( Array.isArray(name) ) {
				const [group,key] = name;
				if ( group in this._data && key in this._data[group] ) {
					delete this._data[group][key];
				}
			}
			else {
				name = jsos.pathologize( name );
				if ( name in this._data ) delete this._data[name];
			}
		});
		return true;
	}

	// Clears all data from the container.
	// RETURNS: [void].
	clear() {
		this._data = {}; // Reset the container.
	}

	// Temporarily pushes a value onto `_temp` and pops it off.
	// RETURNS: [...] Pushed or popped value.
	// * lever   - [boolean] Whether to push (true) or pop (false).
	// * name    - [string] Key name to store the variable under.
	// * value   - [...] Value to temporarily store (only used if `lever` is true).
	pushpop( lever=true, name='variable', value=null ) {
		this._temp = this._temp || {}; // Ensure `_temp` exists.
		if ( lever ) {
			// Push value onto `_temp`.
			this._temp[name] = value;
			return value;
		}
		else {
			// Pop value off `_temp`.
			const result = this._temp[name] ?? null;	// Retrieve and ensure null fallback.
			delete this._temp[name];					// Remove key from `_temp`.
			return result;
		}
	}

	// Finds variables in `_data` by path patterns, including wildcards.
	// RETURNS: [object|false] Matches as key-value pairs, or false if no matches.
	// * ...args	- [array<string>] Paths or patterns to search for (e.g., 'group/*').
	// NOTES:
	// - Use `*` for wildcard matches (e.g., 'group/*').
	// - If `snip` is provided, trims the specified number of path parts.
	herd( ...args ) {
		// Ensure `_temp` exists.
		this._temp		= this._temp || {};
		// Retrieve and clear the `snip` value from `_temp`.
		const snip		= this.pushpop( false, 'snip' ); // Pop temporary snip value.
		const matches	= {};
		let found		= false;
		// Process each argument.
		args.forEach(
			( arg ) => {
				const name			= jsos.pathologize( arg );
				const hasWildcard	= name.includes( '*' );
				// Handle wildcards.
				if ( hasWildcard ) {
					const pathParts	= name.split( '/' );
					const loose		= pathParts[pathParts.length-1] === '*';
					// Search `_data` for matches.
					for ( const key in this._data ) {
						const keyParts	= key.split( '/' );
						// Skip if the key is shorter than the path pattern.
						if ( keyParts.length<pathParts.length ) continue;
						// Check each part of the key against the pattern.
						let match		= true;
						for ( let i=0; i<pathParts.length; i++ ) {
							// If loose match, accept any extra parts beyond the wildcard.
							if ( i>=pathParts.length-1 && loose ) break;
							// Skip if parts don't match and it's not a wildcard.
							if ( pathParts[i]!=='*' && pathParts[i]!==keyParts[i] ) {
								match	= false;
								break;
							}
						}
						// If matched, add to results.
						if ( match ) {
							found = true;
							matches[key] = this._data[key];
						}
					}
				}
				// Handle exact matches.
				else if ( this.has(name) ) {
					found = true;
					matches[name] = this._data[name];
				}
			});

		// Return false if no matches found.
		if ( !found ) return false;

		// Apply `snip` logic to trim path parts if needed.
		if ( typeof snip==='number' && snip>0 ) {
			const trimmedMatches = {};
			Object.keys(matches).forEach(
				( key ) => {
					const keyParts		= key.split( '/' );
					// Skip if snipping would remove the entire key.
					if ( keyParts.length<=snip ) return;
					// Trim path parts and reindex.
					const trimmedKey	= keyParts.slice(snip).join('/');
					trimmedMatches[trimmedKey] = matches[key];
				});
			return trimmedMatches;
		}

		// Return result(s)
		return matches;
	}

	//-------------------------
	// Dynamic Var Method(s)
	//-------------------------
	// Set a dynamic variable.
	// RETURNS: [bool] `true` on success, else `false`.
	// * key	- [string] name of key to set.
	// * val	- [string] value of var.
	jot( key, val ) {
		//console.log( 'jestAlert: Changing var ...' );
		this._vars[key]	= val;
		return true; // success
	}

	// Get a dynamic variable.
	// RETURNS: [string] value of dynamic var.
	// * key	- [string] name of key to set.
	//   pop	- [bool] whether to pop the item off (delete it).
	skim( key, pop=false ) {
		//console.log( 'jestAlert: Getting var ...' );
		if ( !(key in this._vars) )
			this._vars[key]	= null;
		const val	= this._vars[key];		// get value
		if ( pop ) delete this._vars[key];	// remove value
		return val; // return value
	}

	//-------------------------
	// Timer Functions
	//-------------------------
	// Timer method: returns elapsed time in milliseconds
	//   name		- [string] Optional name of the clock (default: 'default')
	//   datetime	- [boolean] Whether to log Date.now(), or performance ( defaults to false, e.g. performance.now() )
	//   report		- [boolean] Whether to console log a report
	_clock( name='default', datetime=false, report=false ) {
		// Ensure clock storage exists
		if ( !this._clocks ) this._clocks = {};
		// Get current timestamp
		const now		= !datetime ? performance.now() : Date.now();
		// Calculate time difference
		const elapsed	= !this._clocks[name] ? 0 : now - this._clocks[name];
		// Update stored timestamp
		this._clocks[name] = now;
		// Output a report if requested
		if ( report )
			console.log( `Clock '${name}' recorded: ${elapsed / 1000} seconds` );
		return elapsed; // Return time
	}
}
