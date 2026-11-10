//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/JestTransmitter.js loaded' );

//-------------------------
// JestTransmitter Class
//-------------------------
class JestTransmitter extends JestGamepiece {
	// Transmission propert(ies)
	transmissions		= [];				// [array] Transmission [objects] handling request(s)
	results				= null;				// { address: { blob, parsed, objectURL, responseType, expiresAt, strict } }
	pendingLoads		= new Map();		// Tracks in-progress requests to prevent duplicate loading
	defaultCacheTime	= 0;				// Default expiration time
	strictItems			= null;				// URLs that should never be removed unless explicitly requested

	//-------------------------
	// Instantiation
	//-------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client		- Client [object] that this piece belongs to.
	constructor( client, defaultCacheTime=600000 ) { // Default: 10 minutes (in milliseconds)
		super( client );								// Call the parent constructor.
		this.transmissions		= [];					// [array] Transmission [objects]
		this.results			= new Map();			// { address: { blob, parsed, objectURL, responseType, expiresAt, strict } }
		this.pendingLoads		= new Map();			// Tracks ongoing loads to prevent duplicates
		this.defaultCacheTime	= defaultCacheTime;		// Default expiration time
		this.strictItems		= new Set();			// URLs that should never be removed unless explicitly requested
	}

	//-------------------------
	// Transmission Handling
	//-------------------------
	// Load requested files in batches while reusing cached and in-progress requests.
	// RETURNS: [void] after processing the requested files.
	// * files           - [array] File request objects.
	// * batchSize       - [number] Maximum number of concurrent requests per batch.
	// * cacheTime       - [number] Cache lifetime in milliseconds.
	// * strict          - [boolean] Protect cache entries against forced removal.
	// * continueOnError - [boolean] Continue loading other files when one request rejects.
	async loadFiles( files, batchSize=5, cacheTime=this.defaultCacheTime, strict=false, continueOnError=true ) {
		// Capture one timestamp for this batch of cache checks.
		const now = Date.now(); // Capture the current timestamp

		// Process the requested files in concurrent batches.
		for ( let i=0; i<files.length; i+=batchSize ) {
			// Isolate the current batch from the full request list.
			const batch    = files.slice( i, i+batchSize ); // Extract the current batch
			// Process each file in the batch concurrently using Promise.all
			const results  =
				await Promise.all(
					batch.map(
						async file => {
							try {
								// Check if the file exists in cache and is still valid
								const cached = this.results.get( file.address );
								if ( cached && cached.expiresAt>now ) {
									console.log( `Cache hit: ${file.address}` ); // Log cache usage
									return cached; // Return cached result
								}
								// If file is already being fetched, return the same promise
								if ( this.pendingLoads.has(file.address) ) {
									console.log( `Waiting for ongoing load: ${file.address}` );
									return await this.pendingLoads.get( file.address );
								}
								// Start this file request and remove it from pending when it finishes.
								const loadPromise =
									this.loadFile(
										file,
										typeof file.cacheTime==='number' ? file.cacheTime : cacheTime,
										typeof file.strict==='boolean' ? file.strict : strict
										)
										.finally(
											() => {
												this.pendingLoads.delete( file.address ); // Remove from pending on completion
											});
								// Register the request so later callers can share its promise.
								this.pendingLoads.set( file.address, loadPromise );
								// Return this file's loaded result.
								return await loadPromise;
							}
							catch ( error ) {
								// Report which request failed.
								console.error( `File request failed: ${file?.address}`, error );
								// Resolve this request as a failed item when batch continuation is enabled.
								if ( continueOnError ) return null;
								// Preserve fail-fast behavior when the caller opts out.
								throw error;
							}
						})
					);
			// Keep the per-file results available for optional inspection or caching work.
			console.log( 'Batch results:', results );
		}
		//console.log( this.results ); // Log all results for debugging
	}

	// Load a file either from cache (if valid) or by making a new request
	// * file				- [object] { address: [string], responseType: [string] }
	// * defaultCacheTime	- [number] Duration (in ms) to cache the response (default: this.defaultCacheTime)
	// * defaultStrict		- [boolean] If true, prevents the cache from being forcefully cleared
	async loadFile( file, defaultCacheTime=this.defaultCacheTime, defaultStrict=false ) {
		//-------------------------
		// LOAD FILE (WITH CACHE OVERRIDE)
		// Checks local cache before making a network request.
		// Honors per-file overrides of cacheTime and strict flags.
		//-------------------------
		const now			= Date.now();
		const address		= file.address;
		const cacheTime		= typeof file.cacheTime==='number' ? file.cacheTime : defaultCacheTime;
		const strict		= typeof file.strict==='boolean' ? file.strict : defaultStrict;

		// Check if the requested file is already cached and not expired
		if ( this.results.has(file.address) ) {
			const cached	= this.results.get( file.address );
			if ( cached.expiresAt>now ) {
				// If responseType is not defined, return cached result as-is
				if ( !file.responseType ) {
					console.log( `Using cached file (no type check): ${file.address}` );
					return cached;
				}
				// If responseType is defined but mismatches, throw an error and return false
				if ( cached.responseType!==file.responseType ) {
					console.error( `Response type mismatch for ${file.address}. Expected: ${file.responseType}, Cached: ${cached.responseType}` );
					return false;
				}
				// Log cache hit
				console.log( `Using cached file: ${file.address}` );
				return cached; // return cached data
			}
		}
		// If already loading, return existing promise
		if ( this.pendingLoads.has(file.address) ) {
			console.log( `Waiting for ongoing load: ${file.address}` );
			return await this.pendingLoads.get( file.address );
		}
		// If the file is not in cache or is expired, create a new inquiry request
		const inquiry	= new Inquiry( file.address, 'FETCH', 'GET', 'download', 'file', null, file.responseType );
		// Send the inquiry request and return the fetched file data
		return this.sendInquiry( inquiry, cacheTime, strict );
	}

	// Handles the network request, processes the response, and stores it in cache
	// * inquiry	- [object] Inquiry request object containing file details
	// * cacheTime	- [number] How long to store the file in cache (in ms)
	// * strict		- [boolean] If true, prevents certain files from being forcefully flushed
	async sendInquiry( inquiry, cacheTime, strict ) {
		const transmission	= new Transmission();		// Create a new transmission instance
		// Register an error event.
		transmission.register(
			'error', 'failed',
			e => {
				console.warn( `File failed to download: ${inquiry.address}` );
			});
		this.transmissions.push( transmission );		// Add to active transmissions
		try {
			//
			const address	= inquiry.address;			// Get seed URL before additional parsing
			// Set the inquiry URL using a force refresh if requested (optional)
			inquiry.address	= !this.client.config.refresh ? inquiry.address : `${inquiry.address}?r=${Date.now()}`;
			await transmission.send( inquiry );			// Perform the file request
			// Extract response details from the inquiry object
			const { responseType, parsed } = inquiry;
			const blob		= parsed instanceof Blob ? parsed : null;		// Store Blob if applicable
			const objectURL	= blob ? URL.createObjectURL(blob) : null;		// Generate an object URL if needed
			// Determine when the cache entry should expire
			const expiresAt	= cacheTime>0 ? Date.now()+cacheTime : Infinity;
			// Mark the file as "strict" if applicable (prevents forced removal)
			if ( strict ) this.strictItems.add( address );
			// Store the fetched data in the cache
			const cache		= { blob, parsed, objectURL, responseType, expiresAt, strict };
			this.results.set( address, cache );
			return cache; // Return the processed response
		}
		catch ( error ) {
			console.error( `Error with URL: ${inquiry.address}`, error ); // Log network errors
		}
		finally {
			// Remove the completed transmission from active list
			this.transmissions = this.transmissions.filter( t => t!==transmission );
		}
	}

	// Parse a url before requesting / getting.

	//-------------------------
	// Reading File(s)
	//-------------------------
	// Reads a local file using JestFileReader.
	// RETURNS: [Promise<object>] Resolves with { file, result }.
	// * item     - [File] or [object] FileInfo data.
	// * datatype - [string] How to read the file (default: 'text').
	async readFile ( item, datatype='text' ) {
		// Inspect the incoming file information before selecting a reading method.
console.log( '🔍 readFile() ENTERED' );
console.log( '📄 Item:', item );
console.log( '📄 Item filename:', item?.filename );
console.log( '📂 Item.file:', item?.file );
console.log( '📦 Item.data:', item?.data );
console.log( '📦 Data type:', typeof item?.data );
console.log( '📦 Data is undefined:', item?.data === undefined );
console.log( '📦 Data is null:', item?.data === null );
console.log( '📋 Requested datatype:', datatype );
console.log( '📁 File instanceof File:', item?.file instanceof File );
		// If we already have raw `data`, just pass it through.
		if ( item && item.data!==null && item.data !== undefined ) {
			return {
				request : item,
				file    : item.file || new File( [], item.stem || 'unknown' ),
				result  : item.data
				};
		}
		// Otherwise fall back to the old FileReader path:
		return new Promise(
			( resolve, reject ) => {
				const reader	= new JestFileReader( this.client ); // Create reader
				reader.datatype	= datatype; // set read mode
				reader.register(
					'load', 'transmitter',
					e => resolve( { request: item, file: reader.file, result: reader.result } )
					);
				reader.register( 'error', 'transmitter', e => reject(e) );
				reader.readFile( item.file ); // begin reading
			});
	}

	// Reads multiple local files using JestFileReader in sequence.
	// RETURNS: [Promise<array>] Array of { file, result } for each successfully read file.
	// * files    - [array] File data or FileInfo [objects].
	// * datatype - [string] Read mode (default: 'text').
	async readFiles ( items, datatype='text' ) {
		// Validate argument(s)
		if ( !Array.isArray(items) )
			throw new Error( 'Expected [array] of File objects.' );
		const results = []; // stores output
		// Iterate each file & read it
		for ( const item of items ) {
			try {
				// await readFile will handle both File and fileInfo
				const result = await this.readFile( item, datatype );
				results.push( result ); // store result
			}
			catch ( err ) {
				console.error( `Failed to read file: ${item.filename}`, err );
			}
		}
		// Return the result(s)
		return results;
	}

	//-------------------------
	// Cached Data Handling
	//-------------------------
	// Retrieves one or multiple files from cache if they exist and are not expired.
	// RETURNS: [object | array | null] Cached file object(s) or null if not found.
	// * addresses	- [array/string] A single URL (string) or an array of URLs to retrieve.
	// FILE OBJECT STRUCTURE:
	// {
	//   blob: [blob|null],			// The raw file data as a Blob (if applicable)
	//   parsed: [any],				// The parsed file data
	//   objectURL: [string|null],	// A generated object URL for usage in DOM (if applicable)
	//   responseType: [string],	// The type of response (e.g., 'json', 'blob', 'text')
	//   expiresAt: [number],		// Timestamp indicating when the cache entry expires
	//   strict: [boolean]			// Whether the file is protected from automatic cache flushing
	// }
	getFiles( addresses ) {
		const now = Date.now(); // Current timestamp
		// Handle single URL input
		if ( typeof addresses==='string' ) {
			const file	= this.results.get( addresses );
			return file && file.expiresAt>now ? file : null;
		}
		// Handle multiple URLs input
		if ( Array.isArray(addresses) ) {
			return addresses
				.map(
					address => {
						const file	= this.results.get( address );
						return file && file.expiresAt>now ? file : null;
					})
					.filter( file => file!==null ); // remove [null] entries (i.e., non-cached files)
		}
		return null; // Invalid input type
	}

	// Clears expired cache entries or removes all cached files based on options
	// * removeAll	- [boolean] If true, removes all cached items
	// * force		- [boolean] If true, allows forced removal of "strict" items
	flushCache( { removeAll=false, force=false }={} ) {
		const now	= Date.now(); // Capture current timestamp
		// Iterate through cached items
		this.results.forEach(
			( value, address ) => {
				if ( removeAll ) {
					// Check if the item is marked as "strict" and should be skipped
					if ( this.strictItems.has(address) && !force ) {
						console.log( `Skipping strict item: ${address}` );
						return;
					}
					// Remove the item from the strict set if forced
					this.strictItems.delete( address );
					this.results.delete( address );
					// Revoke associated object URL if applicable
					if ( value.objectURL )
						URL.revokeObjectURL( value.objectURL );
				}
				else if ( value.expiresAt<=now ) {
					// Remove expired cache entries
					this.results.delete( address );
					if ( value.objectURL )
						URL.revokeObjectURL( value.objectURL );
				}
			});
		// Log the status of the cache after the cleanup process
		console.log( `Cache flushed. Strict items kept: ${Array.from(this.strictItems).length}` );
	}

	// Removes a specific file from cache, with optional strict override
	// * address	- [string] File URL to remove from cache
	// * force		- [boolean] If true, forces removal even if the file is marked as "strict"
	removeFromCache( address, force=false ) {
		// Check if cache is available
		if ( this.results.has(address) ) {
			const item	= this.results.get( address ); // access cache
			// Prevent removal if the item is "strict" and force is not enabled
			if ( this.strictItems.has(address) && !force ) {
				console.log( `Cannot remove strict cache item: ${address}` );
				return false;
			}
			// Remove the file from cache and strict list
			this.results.delete( address );
			this.strictItems.delete( address );
			// Revoke associated object URL if applicable
			if ( item.objectURL )
				URL.revokeObjectURL( item.objectURL );
			console.log( `Cache item removed: ${address}` ); // Log removal action
			return true;
		}
		return false; // Return false if the file was not found in cache
	}
}
