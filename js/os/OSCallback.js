//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/os/OSCallback.js loaded' );

// OSCallback class
class OSCallback extends OSConfigurable {
	// Element properties
	handlers		= {};			// [array] of event callback(s): [{ command, id, callback, type }]

	//-------------------------
	// Initialization
	//-------------------------
	// Initializes a new OSCallbacks instance.
	// * options		- [object] Configuration options.
	//   callbacks		- [array] Array of callback definitions.
	constructor( options={} ) {
		super( options ); // call parent constructor
	}

	// Apply the [object] initial callback(s) if set.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	initCallbacks() {
		// Apply callbacks if exists.
		if ( this._options.callbacks )
			this._initializeCallbacks( this._options.callbacks );
		return true; // success
	}

	//-------------------------
	// Private Methods
	//-------------------------
	// Initializes callbacks from options (if provided).
	// RETURNS: [void] Nothing.
	// * callbacks		- [array] Array of callback definitions.
	_initializeCallbacks( callbacks ) {
		// Iterate eeach callback & register.
		callbacks.forEach(
			( { command, id, callback, type='manual', iterations=null, data={} } ) => {
				this.register( command, id, callback, type, iterations, data );
			});
	}

	//-------------------------
	// Check Registration
	//-------------------------
	// Determines whether a callback is already registered.
	// RETURNS: [boolean] True if registered, else False.
	// * command	- [string|array] Event name or array of names.
	// * id			- [string] Unique callback ID.
	isRegistered( command, id ) {
		//--------------------------------
		// Validate Argument(s)
		//--------------------------------
		if ( typeof id!=='string' || (!Array.isArray(command) && typeof command!=='string') ) {
			console.warn( `OSCallback.isRegistered(): invalid argument(s). command=${command}, id=${id}` );
			return false;
		}

		//--------------------------------
		// Handle Array of Commands
		//--------------------------------
		if ( Array.isArray(command) ) {
			// If ANY command contains the ID, consider it registered.
			for ( const cmd of command ) {
				if ( this.isRegistered(cmd,id) )
					return true;
			}
			return false;
		}

		//--------------------------------
		// Access Handler List
		//--------------------------------
		const list = this.handlers?.[command];
		if ( !Array.isArray(list) ) return false; // no such command

		//--------------------------------
		// Check for Matching ID
		//--------------------------------
		return list.some( handler => handler.id===id );
	}

	//--------------------------------
	// Register Callback(s)
	//--------------------------------
	// Registers a callback under one or more event names.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * command		– [string|array] Event name or array of event names.
	// * id				– [string] Unique ID for the callback.
	// * callback		– [function] The callback function.
	// * type			– [string] Type of callback (default: 'manual').
	// * iterations		– [number|null] Max invocations (null = unlimited).
	// * data			– [object] Additional data (used by extended subclasses).
	register( command, id, callback, type='manual', iterations=null, data={} ) {
		// Handle multiple commands.
		if ( Array.isArray(command) ) {
			let allRegistered = true;
			command.forEach(
				cmd => {
					const success = this.register( cmd, id, callback, type, iterations, { ...data } );
					if ( !success ) allRegistered = false;
				});
			return allRegistered;
		}
		// Create the event category if it doesn't exist.
		if ( !this.handlers[command] )
			this.handlers[command] = [];
		// Prevent duplicate ID registration under same command.
		if ( this.handlers[command].some(handler=>handler.id===id) ) {
			console.error( `Callback with ID "${id}" is already registered for event "${command}".` );
			return false; // failed
		}
		// Bind & store the handler.
		this.handlers[command].push({
			id,
			callback	: callback.bind(this),
			type,
			iterations,
			iteration	: 0,
			data
			});
		return true; // success
	}

	//-------------------------
	// Clear All Registered Events
	//-------------------------
	// Unregisters *all* callbacks from all commands.
	// • Clears every registered event handler across all commands.
	// • Useful for resetting state or cleanup before teardown.
	// RETURNS: [int] Number of unregistered callbacks.
	unregisterAll() {
		//--------------------------------
		// Validate Registered Handlers
		//--------------------------------
		// No callbacks means no cleanup is necessary.
		if ( !this.handlers ) return 0;
		let count = 0; // track number of removed handlers

		//--------------------------------
		// Detach Each Registered Listener
		//--------------------------------
		// Iterate over snapshots because unregister() modifies
		// the underlying handler collections.
		for ( const [command, handlers] of Object.entries(this.handlers) ) {
			for ( const handler of [...handlers] ) {
				// Let OSEventTarget.unregister() remove the
				// native listener before clearing its callback.
				this.unregister( command, handler.id );
				count++;
			}
		}

		// Return total number of handlers removed
		return count;
	}

	// -------------------------
	// Helper: Is Promise-like
	// -------------------------
	// RETURNS: [bool] Whether v is thenable (Promise-like).
	// * v	- [any]
	_isThenable( v ) {
		return v!=null && (typeof v==='object' || typeof v==='function') && typeof v.then==='function';
	}

	// -------------------------
	// Helper: Parse stack for file:line:col
	// -------------------------
	// RETURNS: [object] { file, line, col } best-effort from error stack.
	// * err	- [Error]
	_parseStack( err ) {
		try {
			const s = String( err?.stack || '' );
			const lines = s.split( '\n' );
			for ( const line of lines ) {
				// Match patterns:
				// Chrome:    at func (path/file.js:123:45)
				// Firefox:   func@path/file.js:123:45
				// Node:      at path/file.js:123:45
				const match = line.match(/(?:at\s+)?(?:.*?@)?(.+?):(\d+):(\d+)/);
				if ( match ) {
					const [, file, lineNum, colNum] = match;
					return {
						file,
						line: Number(lineNum),
						col: Number(colNum)
					};
				}
			}
		} catch(e) {}
		// Return generic error (no filename & line #)
		return { file:'<unknown>', line:0, col:0 };
	}


	// -------------------------
	// Trigger (Async-Aware)
	// -------------------------
	// Triggers a specific callback by ID under an event name.
	// RETURNS: [Promise<any>] Resolves/rejects based on the callback.
	// * command	- [string] Name of the event.
	// * id			- [string] ID of the callback to trigger.
	// * args		- [any] Arguments to pass to the callback.
	async _trigger( command, id, ...args ) {
		// Require callbacks by command to exist.
		const callbacks = this.handlers?.[command];
		if ( !callbacks ) {
			console.warn( `No handlers found for event: ${command}` );
			return;
		}

		// Access handler & attempt to trigger a callback.
		const handler = callbacks.find( (h)=>h.id===id );
		if ( !handler || typeof handler.callback!=='function' ) {
			console.warn( `Handler with ID "${id}" not found for event "${command}".` );
			return;
		}

		//try {
			// Call; await if Promise-like. Works for both sync & async functions.
			const result	= handler.callback( ...args );
			const awaited	= this._isThenable(result) ? await result : result;

			// Track handler iterations AFTER successful completion.
			if ( handler.iterations!==null ) {
				handler.iteration++;
				if ( handler.iteration>=handler.iterations )
					this.unregister( command, id );
			}
			return awaited;
		//}
		/*catch ( err ) {
			// Extract file:line:col for precise reporting (your hard requirement).
			const { file, line, col } = this._parseStack( err );
			console.error(
				`[OSCallback] Error in handler "${id}" for "${command}" at ${file}:${line}:${col} — ${err?.message||err}`,
				err );
			throw err; // let caller policy decide (log/throw/skip)
		}*/
	}

	//-------------------------
	// Emit (Safe Serial Async, No Await Required)
	//-------------------------
	// Triggers handlers in order, respecting limit, and auto-waits for Promises.
	// RETURNS: [void] Never returns early; all handlers guaranteed to complete.
	// * command	– [string] Event name to emit.
	// * limit		– [int|null] Max number of callbacks to run (null = all).
	// * args		– [any] Arguments to pass to handlers.
	emit( command, limit=null, ...args ) {
		// Access requested callback (by command name).
		const callbacks = this.handlers?.[command];
		if ( !callbacks || !Array.isArray(callbacks) ) return; // no event by command name

		// Filter only manual handlers and respect limit.
		const list	= callbacks.filter( h => h.type==='manual' );
		const slice	= (limit===null) ? list : list.slice( 0, Math.max(0,limit) );

		// Run each handler serially, awaiting if it's a Promise.
		(async()=>{
			// Iterate each requested handler.
			for ( const h of slice ) {
				//try {
					// Call a requested handler.
					const result = h.callback( ...args );
					if ( this._isThenable(result) ) await result;

					// Track iterations.
					if ( h.iterations!==null ) {
						h.iteration++; // continue to next iteration
						if ( h.iteration>=h.iterations )
							this.unregister( command, h.id );
					}
				//}
				/*catch ( err ) { // error
					const { file, line, col } = this._parseStack(err);
					console.error(
						`[OSCallback] Error in handler "${h.id}" for "${command}" at ${file}:${line}:${col} — ${err?.message||err}`
						);
				}*/
			}
		})();
	}


	// -------------------------
	// EmitAsync (Configurable)
	// -------------------------
	// Configurable async emitter.
	// RETURNS: [Promise<void|any[]>] Serial resolves void; parallel resolves results array.
	// * command	- [string] Name of event to emit.
	// * options	- [null|int|object] { limit:[int|null], mode:'serial'|'parallel', onError:'throw'|'log'|'skip' }
	//      NOTE: If [null] or [int], options treats argument as options.limit=[int|null]
	// * args		- [any]
	async emitAsync( command, options={}, ...args ) {
		// Process user supplied options.
		//if ( options===null || Number.isInteger(options) )
		//	options	= { limit: options }; // generic object
		const { limit=null, mode='serial', onError='throw' } = options;
		const callbacks = this.handlers?.[command]; // access requested callback (by command name)
		if ( !callbacks || !Array.isArray(callbacks) ) return; // no callback found

		// Filter eligible handlers (manual only) and enforce limit.
		const list	= callbacks.filter( h => h.type==='manual' );
		const slice	= (limit===null) ? list : list.slice( 0, Math.max(0,limit) );

		if ( mode==='parallel' ) {
			// Fire all and wait. Error policy via allSettled + onError.
			const promises	= slice.map( h=>this._trigger(command, h.id, ...args) );
			const settled	= await Promise.allSettled( promises );
			if ( onError==='throw' ) {
				const firstRej = settled.find( s => s.status==='rejected' );
				if ( firstRej ) throw firstRej.reason;
			}
			if ( onError==='log' ) {
				settled.forEach(
					( s ) => {
						if ( s.status==='rejected' )
							console.warn( '[emitAsync] handler rejected:', s.reason );
					});
			}
			// 'skip' simply ignores rejections.
			return settled.map( s => s.status==='fulfilled' ? s.value : undefined );
		}

		// Default: serial (predictable order + easier reasoning).
		for ( const h of slice ) {
			try {
				await this._trigger( command, h.id, ...args );
			}
			catch (err) {
				if ( onError==='throw' ) throw err;
				if ( onError==='log' )
					console.warn( '[emitAsync] handler error (logged and continuing):', err );
				// 'skip' falls through
			}
		}
	}

	//--------------------------------
	// Unregister Callback(s)
	//--------------------------------
	// Unregisters a callback by one or more event names.
	// RETURNS: [void] Nothing.
	// * command	– [string|array] Event name or array of names.
	// * id		– [string] ID of the callback to unregister.
	unregister( command, id ) {
		// Handle multiple commands.
		if ( Array.isArray(command) ) {
			command.forEach( cmd => this.unregister(cmd,id) );
			return;
		}
		// Remove handler(s) for the command if present.
		if ( this.handlers?.[command] ) {
			this.handlers[command] = this.handlers[command].filter( (handler)=>handler.id!==id );
			// Clean up empty categories.
			if ( this.handlers[command].length===0 )
				delete this.handlers[command];
		}
	}
}
