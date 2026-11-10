//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/file/JestSecretary.js loaded' );

//-------------------------
// JestSecretary Class
//-------------------------
// Manages *.* files (downloads, preloading, data handling).
class JestSecretary extends JestGamepiece {
	// Declare properties
	baseURL		= null;			// [string] Root directory for remote file requests
	filetypes	= {};			// [object] Specs for supported extensions
	records		= {};			// [object] Cached parsed data per extension

	// --------------------------------
	// Constructor
	// --------------------------------
	// Construct with a default base URL.
	// * client		- Client [object] that this piece belongs to.
	// * baseURL	- [string] Base URL for all image(s) / image folder(s).
	constructor( client, baseURL=null ) {
		super( client );			// Call the parent constructor.
		this.baseURL	= baseURL;	// Set the global placeholder.
	}

	// --------------------------------
	// Register Filetype(s)
	// --------------------------------
	// Add a new filetype dynamically.
	// RETURNS: [void] on success, throws [object[ Error on fail.
	// * ext	- [string] Extension (e.g. 'png', 'json')
	// * specs	- [object] { parser?, cacheTime?, strict?, responseType? }
	addFiletype( ext, specs ) {
		// Validate argument
		if ( !jsos.prove(ext,'string') )
			throw new Error( 'Invalid extension. Must be [string].' );
		// Validate argument
		if ( !specs || typeof specs!=='object' )
			throw new Error( 'Invalid specs for filetype registration.' );
		// Register filetype.
		this.filetypes[ext]	=
			{
			responseType :	'text',
			cacheTime    :	0,
			strict       :	true,
			...specs
			};
		// Ensure file storage exists for this filetype.
		if ( !this.records[ext] )
			this.records[ext]	= {};
	}

	// Remove an existing filetype.
	// RETURNS: [void] on success, throws [object[ Error on fail.
	// * ext	- [string] The ext key to remove.
	removeFiletype( ext ) {
		// Validate argument
		if ( !jsos.prove(ext,'string') )
			throw new Error( 'Invalid ext. Must be of type [string].' );
		// Remove associated ext & storage.
		if ( this.filetypes[ext] ) {
			delete this.filetypes[ext];
			delete this.records[ext];
		}
	}

	// --------------------------------
	// Get a Record (with Warning)
	// --------------------------------
	// Get a record full path.
	// RETURNS: [object] of file information, else [null] on fail.
	// * address	- [string] Full path to file, with filename + extension.
	//   network	- [string] One of: 'local', 'remote'
	getRecordPurview( address, network='remote' ) {
		//-------------------------
		// Validate Arguments
		//-------------------------
		// Ensure filetype & stem are [string].
		if ( !jsos.prove(address,'string') ) {
			console.warn( `Invalid argument(s): 'address' must a [string].` );
			return null; // abort
		}

		// --------------------------------
		// Parse Path & Add to Queue
		// --------------------------------
		// Get overview of address file info.
		const fileInfo	= this.client.getFileInfo( address );

		// --------------------------------
		// Validate Specs Defined for Filetype
		// --------------------------------
		// Check if specs have been defined for this filetype.
		const specs		= this.filetypes[fileInfo.extension];
		if ( !specs ) {
			console.warn( `Unregistered extension: ${address}` );
			return null; // abort
		}

		//-------------------------
		// Parse Path Information
		//-------------------------
		// Extract fileInfo data for purview.
		const filename	= fileInfo.filename;	// file stem + extension
		const ext		= fileInfo.extension;	// filetype extension (no stem)
		const stem		= fileInfo.stem;		// file name (no extension)

		// Remove leading/trailing slashes & re-add single trailing slash.
		let path		= fileInfo.path;		// path to file
		path			= !path ? '' : path.trim().replace(/^\/+|\/+$/g,'');
		if ( path.length>0 ) path += '/';

		// Get file MIME subpath for extension.
		const subpath	= this.filetypes[ext]?.subpath ?? ''; // interpret response data

		// Properly redirect the full parsed path.
		let fullPath	= '';
		if ( network==='remote' ) {
			// Auto-generate full URL-based record key.
			if ( !ext ) {
				console.warn( `Secretary: Unknown extension for extension "${ext}".` );
				return null; // abort
			}
			// Ensure full remote path ends with slash before filename.
			fullPath	= `${this.baseURL}/`;
			// Include subpath (defined in specs).
			if ( subpath.length>0 )
				fullPath	= `${fullPath}${subpath}/`;
			// Include requested path (from address argument).
			if ( path.length>0 )
				fullPath	= `${fullPath}${path}`;
		}

		//-------------------------
		// Generate Record Key
		//-------------------------
		// Generate prefix based upon network.
		const prefix	= network==='local' ? 'loc' : 'web';
		const key		= `${prefix}:${fullPath}${filename}`;

		// --------------------------------
		// Create Purview & Return Data
		// --------------------------------
		// Define purview [object] return data.
		let purview		= {
			key:			key,
			address:		`${fullPath}${filename}`,
			path:			path,
			subpath:		subpath,
			stem:			stem,
			filename:		filename,
			extension:		ext,
			network:		network==='remote' ? 'remote' : 'local',
			cacheTime:		specs.cacheTime,
			strict:			specs.strict,
			responseType:	specs.responseType
			};
		return purview;		// return purview
	}

	// --------------------------------
	// Storing & Filing Data
	// --------------------------------
	// Store a file's result in the secretary's records.
	// RETURNS: [boolean] `true` on success, `false` if any file fails.
	// * ext		- [string] Value of file filetype extension.
	// * key		- [string] Unique record key of file being stored.
	// * data		- [...] data of file to store.
	file( ext, key, data ) {
		// Further parse file data into game [object]
		//try {
			// Build generic result [object].
			const result	= { key, data };
			// Check for additional parsing.
			let parsed		= null;
			const parser	= this.filetypes[ext]?.parser ?? null;
			if ( parser ) {
				if ( parser in this.client.parsers )
					parsed	= this.client.parsers[parser].parse( result );
				else {
					console.warn( `Secretary could not locate parser: ${parser}` );
					parsed	= data; // fallback
				}
			}
			else parsed		= data; // raw data
			// Check if value successfully parsed.
			if ( parsed )
				this.records[ext][key] = parsed;
			else throw new Error( "could not parse file because data corrupted or incorrect format" );
			return true; // success
		/*}
		catch ( err ) {
			console.warn( `Secretary could not load ${ext} file "${key}": ${err.message}` );
			return false; // fail
		}*/
	}

	// --------------------------------
	// Web File Downloading
	// --------------------------------
	// Retrieves *.* file, parses it, then stores the file by stem.
	// RETURNS: [boolean] `true` on success, `false` if any file fails.
	// * address - [string] value of address path
	async loadFile( address ) {
		return await this.loadFiles( [address] );
	}

	// Loads remote files by full address (e.g., 'tiles/grass.png').
	// RETURNS: [boolean] `true` if all load, `false` if any fail.
	// * addresses - [array] of [string] address paths
	async loadFiles( addresses ) {
		// --------------------------------
		// Validate Argument(s)
		// --------------------------------
		// Validate argument(s)
		if ( !jsos.prove(addresses,'array') )
			throw new Error( 'Secretary loadFiles(): `addresses` must be [array]' );

		// --------------------------------
		// Setup Data For Transfer
		// --------------------------------
		const queue = [];
		// Iterate all addresses & load file(s).
		for ( const address of addresses ) {
			// --------------------------------
			// Attempt to Purview Address
			// --------------------------------
			// Purview the address & queue if successful.
			const purview	= this.getRecordPurview( address );
			// Check if purview succeeded.
			if ( !purview ) continue; // skip
			// Queue the item.
			queue.push( purview );
		}

		// --------------------------------
		// Begin Downloading
		// --------------------------------
		// Use transmitter to load files queue in batches of 3
		await this.client.transmitter.loadFiles( queue, 3, this.defaultCacheTime, false, false );

		// --------------------------------
		// Process Each Result
		// --------------------------------
		// Process results
		let allOK	= true;
		for ( const request of queue ) {
			// Get overview of address file info.
			const { address, filename, path, extension: ext, stem, key } = request;
			// Check if previously loaded.
			if ( this.hasRecord(address) ) continue; // skip

			// Continue to load file.
			const data	= this.client.transmitter.getFiles( address );
			if ( !data ) {
				console.warn( `No data returned for: ${address}` );
				allOK	= false;
				continue; // skip
			}

			// Further parse file data into game [object]
			let parsed	= data.parsed;
			// Check whether data successfully loaded.
			if ( !parsed ) {
				console.warn( `Failed to download/parse file: ${filename}` );
				allOK = false;
				continue; // skip
			}

			// Proceed to file the file in secretary records.
			const filed		= this.file( ext, key, parsed );
			if ( !filed ) {		// check if file failed
				allOK = false;	// at least one file failed
				continue;		// continue to try next file
			}
			// Notify console that the file has been processed.
			console.log( `Loaded and stored [${ext}]: ${address}` );
		}

		return allOK; // success status
	}

	// --------------------------------
	// Local File Reading
	// --------------------------------
	// Read a File object (e.g., from drag-drop or input).
	// RETURNS: [boolean] `true` on success, `false` if any file fails.
	// * item		– either a File or a FileInfo [object]
	async readFile( item ) {
		// delegate to readFiles for uniform handling
		const ok = await this.readFiles( [item] );
		return ok;
	}

	// Read File [objects] (e.g., from drag-drop or input).
	// RETURNS: [boolean] `true` on success, `false` if any file fails.
	// * items		– [array] of File or FileInfo [objects]
	async readFiles( items ) {
		// --------------------------------
		// Initialize Debugging
		// --------------------------------
		// Track execution time and identify this operation in the console.
		const debugID	= `[readFiles ${Date.now()}]`;
		const startTime	= performance.now();

		console.group( `${debugID} 📂 READ FILES STARTED` );
		console.log( '📥 Input items:', items );
		console.log( '📊 Input count:', items?.length );
		console.log( '🗃️ Current records:', this.records );
		console.log( '📋 Registered filetypes:', this.filetypes );

		try {
			// --------------------------------
			// Validate Argument(s)
			// --------------------------------
			// Ensure the supplied items are an array.
			console.log( '🔍 Validating input array...' );

			if ( !jsos.prove(items,'array') ) {
				console.error( '❌ Invalid input:', items );
				throw new Error( '`items` must be [array] of File/FileInfo' );
			}

			console.log( '✅ Input validation passed.' );

			// --------------------------------
			// Prevent Re-Reading Previously Read Files
			// --------------------------------
			// Build a queue containing only files that have not already been stored.
			const queue = [];

			console.groupCollapsed( '🔎 Filtering previously loaded files' );

			for ( const [index, item] of items.entries() ) {
				// Display the original file information.
				console.groupCollapsed( `📄 Input #${index + 1}: ${item?.address || item?.name || 'Unknown'}` );
				console.log( 'Original item:', item );
				console.log( 'Original address:', item?.address );

				// Resolve the address into its local record identity.
				const purview = this.getRecordPurview( item.address, 'local' );
				const { extension: ext, key } = purview;

				console.log( 'Resolved purview:', purview );
				console.log( 'Resolved extension:', ext );
				console.log( 'Resolved record key:', key );

				// Determine whether this file already exists in storage.
				const existingRecord = this.records?.[ext]?.[key];

				console.log( 'Record collection:', this.records?.[ext] );
				console.log( 'Existing record:', existingRecord );
				console.log( 'Already stored:', !!existingRecord );

				// Skip previously loaded files.
				if ( existingRecord ) {
					console.warn( `⏭️ SKIPPED: Already stored [${ext}] ${key}` );
					console.groupEnd();
					continue;
				}

				// Add the file to the pending read queue.
				queue.push( item );

				console.log( `✅ QUEUED: [${ext}] ${key}` );
				console.groupEnd();
			}

			console.groupEnd();

			// Report the results of queue filtering.
			console.log( '📊 Queue filtering results:', {
				inputCount: items.length,
				queuedCount: queue.length,
				skippedCount: items.length - queue.length
			});

			console.log( '📦 Final read queue:', queue );

			// Stop reading if all requested files are already stored.
			if ( queue.length === 0 ) {
				console.warn( '⏭️ No files to read. All requested files already exist.' );
				console.log( '✅ Returning TRUE.' );
				return true;
			}

			// --------------------------------
			// Begin Reading
			// --------------------------------
			// Request the transmitter to load queued files as ArrayBuffers.
			console.group( '📡 TRANSMITTER READ' );

			console.log( 'Transmitter:', this.client?.transmitter );
			console.log( 'Requested files:', queue );
			console.log( 'Requested format:', 'arrayBuffer' );
			console.log( '⏳ Starting transmitter.readFiles()...' );

			const transmitterStart = performance.now();

			// Use transmitter to read files (in batches of 3).
			const reads = await this.client.transmitter.readFiles( queue, 'arrayBuffer' );

			console.log( '✅ Transmitter finished.' );
			console.log( '⏱️ Transmitter duration:', `${(performance.now() - transmitterStart).toFixed(2)}ms` );
			console.log( '📥 Raw transmitter response:', reads );
			console.log( '📊 Response count:', reads?.length );
			console.log( '📊 Response is array:', Array.isArray( reads ) );

			// Inspect each transmitter response before processing.
			if ( Array.isArray(reads) ) {
				for ( const [index, entry] of reads.entries() ) {
					console.log( `📦 Transmitter result #${index + 1}:`, {
						request: entry?.request,
						file: entry?.file,
						result: entry?.result,
						resultType: typeof entry?.result,
						isArrayBuffer: entry?.result instanceof ArrayBuffer,
						byteLength: entry?.result?.byteLength,
						isNull: entry?.result === null,
						isUndefined: entry?.result === undefined
					});
				}
			}

			console.groupEnd();

			// --------------------------------
			// Process Each Result
			// --------------------------------
			// Track whether every file was processed successfully.
			let allOK = true;

			// Track individual processing outcomes.
			let successCount = 0;
			let failureCount = 0;

			console.group( '⚙️ PROCESSING FILE RESULTS' );

			for ( const [index, entry] of reads.entries() ) {
				// Extract the transmitter response components.
				const { request, file, result } = entry;

				console.group( `📄 Processing file #${index + 1}: ${request?.filename || 'Unknown'}` );

				console.log( '📥 Full response entry:', entry );
				console.log( '📋 Request metadata:', request );
				console.log( '📁 File object:', file );
				console.log( '📦 Raw result:', result );

				// --------------------------------
				// Extract File Information
				// --------------------------------
				// Get overview of address and file information.
				const { address, filename, path, extension: ext, stem } = request;

				console.log( '📍 Address:', address );
				console.log( '📄 Filename:', filename );
				console.log( '📂 Path:', path );
				console.log( '🔖 Extension:', ext );
				console.log( '🏷️ Stem:', stem );

				// --------------------------------
				// Resolve Record Purview
				// --------------------------------
				// Resolve the local address and extract its storage key.
				console.log( '🔍 Calling getRecordPurview()...' );

				const purview = this.getRecordPurview( address, 'local' );
				const { key } = purview;

				console.log( '📋 Purview result:', purview );
				console.log( '🗝️ Record key:', key );
				console.log( '🗃️ Existing extension records:', this.records?.[ext] );
				console.log( '🗃️ Existing key record:', this.records?.[ext]?.[key] );

				// --------------------------------
				// Validate Filetype Registration
				// --------------------------------
				// Retrieve the registered specifications for this extension.
				console.log( `🔍 Looking up filetype specifications for "${ext}"...` );

				const specs = this.filetypes[ext];

				console.log( '📋 Filetype specifications:', specs );
				console.log( '📋 Available extensions:', Object.keys(this.filetypes) );

				// Reject files whose extensions have not been registered.
				if ( !specs ) {
					console.error( `❌ Unregistered extension: ${filename}` );
					console.error( 'Failed extension:', ext );
					console.error( 'Failed request:', request );

					allOK = false;
					failureCount++;

					console.groupEnd();
					continue;
				}

				console.log( '✅ Filetype registration found.' );

				// --------------------------------
				// Convert File Data
				// --------------------------------
				// Determine the conversion format required by this filetype.
				const parseFormat = specs.parse || 'text';

				console.groupCollapsed( '🔄 DATA CONVERSION' );

				console.log( 'Input format:', 'arrayBuffer' );
				console.log( 'Output format:', parseFormat );
				console.log( 'Input data:', result );
				console.log( 'Input data type:', typeof result );
				console.log( 'Input is ArrayBuffer:', result instanceof ArrayBuffer );
				console.log( 'Input byte length:', result?.byteLength );
				console.log( 'Conversion specifications:', specs );

				console.log( '⏳ Calling client.convertData()...' );

				const conversionStart = performance.now();

				// Convert the loaded ArrayBuffer into the required data representation.
				let parsed = this.client.convertData( result, 'arrayBuffer', parseFormat );

				console.log( '⏱️ Conversion duration:', `${(performance.now() - conversionStart).toFixed(2)}ms` );
				console.log( '📦 Parsed result:', parsed );
				console.log( '📊 Parsed type:', typeof parsed );
				console.log( '📊 Parsed constructor:', parsed?.constructor?.name );
				console.log( '📊 Parsed is null:', parsed === null );
				console.log( '📊 Parsed is undefined:', parsed === undefined );
				console.log( '📊 Parsed is falsy:', !parsed );

				// Provide a readable preview when the parsed data is a string.
				if ( typeof parsed === 'string' ) {
					console.log( '📏 Parsed string length:', parsed.length );
					console.log( '📝 Parsed string preview:', parsed.substring(0, 500) );
				}

				console.groupEnd();

				// --------------------------------
				// Validate Parsed Data
				// --------------------------------
				// Reject files whose conversion returned a falsy result.
				if ( !parsed ) {
					console.error( `❌ Failed to read/parse file: ${filename}` );
					console.error( 'Original result:', result );
					console.error( 'Parsed result:', parsed );
					console.error( 'Requested parse format:', parseFormat );
					console.error( 'Filetype specifications:', specs );

					allOK = false;
					failureCount++;

					console.groupEnd();
					continue;
				}

				console.log( '✅ File data parsed successfully.' );

				// --------------------------------
				// Store File in Secretary Records
				// --------------------------------
				// File the converted data under its extension and resolved key.
				console.groupCollapsed( '🗃️ RECORD STORAGE' );

				console.log( '⏳ Calling this.file()...' );
				console.log( 'Extension:', ext );
				console.log( 'Record key:', key );
				console.log( 'Parsed data:', parsed );
				console.log( 'Record before filing:', this.records?.[ext]?.[key] );

				const filingStart = performance.now();

				// Attempt to store the parsed file.
				const filed = this.file( ext, key, parsed );

				console.log( '⏱️ Filing duration:', `${(performance.now() - filingStart).toFixed(2)}ms` );
				console.log( '📋 this.file() returned:', filed );
				console.log( '📋 Return type:', typeof filed );
				console.log( '🗃️ Record after filing:', this.records?.[ext]?.[key] );
				console.log( '🗃️ Extension records after filing:', this.records?.[ext] );

				console.groupEnd();

				// --------------------------------
				// Validate Filing Result
				// --------------------------------
				// Continue processing other files even when one filing fails.
				if ( !filed ) {
					console.error( `❌ Failed to store file: ${filename}` );
					console.error( 'Extension:', ext );
					console.error( 'Key:', key );
					console.error( 'Filing return value:', filed );

					allOK = false;
					failureCount++;

					console.groupEnd();
					continue;
				}

				// Record successful processing.
				successCount++;

				console.log( `✅ LOADED AND STORED [${ext}]: ${address}` );
				console.log( '📍 Storage location:', `this.records[${JSON.stringify(ext)}][${JSON.stringify(key)}]` );

				console.groupEnd();
			}

			console.groupEnd();

			// --------------------------------
			// Final Processing Summary
			// --------------------------------
			// Report the total number of successful and failed operations.
			console.group( '📊 READ FILES SUMMARY' );

			console.table({
				'Input files': {
					count: items.length
				},
				'Skipped files': {
					count: items.length - queue.length
				},
				'Queued files': {
					count: queue.length
				},
				'Transmitter results': {
					count: reads.length
				},
				'Successfully stored': {
					count: successCount
				},
				'Failed files': {
					count: failureCount
				}
			});

			console.log( '🗃️ Final secretary records:', this.records );
			console.log( '⏱️ Total duration:', `${(performance.now() - startTime).toFixed(2)}ms` );
			console.log( '🏁 Final success status:', allOK );

			if ( allOK )
				console.log( '✅ ALL FILES PROCESSED SUCCESSFULLY.' );
			else
				console.error( '❌ ONE OR MORE FILES FAILED.' );

			console.groupEnd();

			// Return the overall success status.
			return allOK;
		}
		catch ( error ) {
			// --------------------------------
			// Unexpected Error Reporting
			// --------------------------------
			// Preserve the original exception while reporting diagnostic information.
			console.error( '💥 UNEXPECTED ERROR IN readFiles()' );
			console.error( 'Error:', error );
			console.error( 'Message:', error?.message );
			console.error( 'Stack:', error?.stack );
			console.error( 'Original input:', items );
			console.error( '⏱️ Duration before failure:', `${(performance.now() - startTime).toFixed(2)}ms` );

			// Preserve the original behavior for unexpected exceptions.
			throw error;
		}
		finally {
			// --------------------------------
			// Close Main Debug Group
			// --------------------------------
			// Always close the outer console group, including after exceptions.
			console.log( `${debugID} 🏁 READ FILES FINISHED` );
			console.groupEnd();
		}
	}

	// Save file data as Blob locally.
	// RETURNS: [string] URL to file blob (or downloads it if preferred).
	/*writeFile( filetype, name, data ) {
		// Begin generating the
		const ext	= this.filetypes[filetype]?.extension ?? 'txt';
		const blob	= new Blob( [data], { type: 'text/plain' } );
		const url 	= URL.createObjectURL( blob );
		// Optionally auto-download
		const a		= document.createElement( 'a' );
		a.href		= url;
		a.download	= `${name}.${ext}`;
		a.click();
		// Return the URL
		return url;
	}*/

	// Retrieve a record of the given filetype extension & record key.
	// RETURNS: [object] Record if found, else [null] + warning.
	// * address	- [string] Full path to file, with filename + extension.
	//   network	- [string] One of: 'local', 'remote'
	getRecord( address, network='remote' ) {
		// --------------------------------
		// Parse Path & Get Extension
		// --------------------------------
		// Get overview of address file info.
		const purview	= this.getRecordPurview( address, network );
		const ext		= purview.extension; // filetype extension (no stem)
		const key		= purview.key;
		// --------------------------------
		// Proceed to Return Record
		// --------------------------------
		// Check if record exists.
		if ( this.hasRecord(address,network) )
			return this.records[ext][key];
		// Throw warning & return [null].
		console.error( `Secretary: No record found for file "${address}".` );
		return null; // doesn't exist
	}

	// Check if a record exists for the given filetype extension & record key.
	// RETURNS: [boolean] `true` if exists, `false` if not.
	// * address	- [string] Full path to file, with filename + extension.
	//   network	- [string] One of: 'local', 'remote'
	hasRecord( address, network='remote' ) {
		// --------------------------------
		// Parse Path & Get Extension
		// --------------------------------
		// Get overview of address file info.
		const purview	= this.getRecordPurview( address, network );
		const ext		= purview.extension; // filetype extension (no stem)
		const key		= purview.key;
		// --------------------------------
		// Proceed to Check Record
		// --------------------------------
		// Validate arguments
		if ( !jsos.prove(ext,'string') || !jsos.prove(key,'string') ) {
			console.warn( 'Invalid argument(s). `ext` and `key` must both be of type [string].' );
			return false; // abort
		}
		// Check existence
		return !!( this.records?.[ext]?.[key] );
	}
	// Remove a secretary record if it exists (clears cache only).
	// RETURNS: [boolean] `true` if exists, `false` if not.
	// * address	- [string] Full path to file, with filename + extension.
	//   network	- [string] One of: 'local', 'remote'
	removeRecord( address, network='remote' ) {
		// --------------------------------
		// Parse Path & Get Extension
		// --------------------------------
		// Get overview of address file info.
		const purview	= this.getRecordPurview( address, network );
		const ext		= purview.extension; // filetype extension (no stem)
		const key		= purview.key;
		// --------------------------------
		// Proceed to Remove Record
		// --------------------------------
		// Check if record already exists.
		if ( this.hasRecord(address,network) ) {
			delete this.records[ext][key]; // remove it
			console.log( `Removed record ${ext}:${key}` );
			return true; // cleared cache
		}
		// Throw warning & return [bool] false.
		console.warn( `No record to remove: ${ext}:${key}` );
		return false; // nothing removed
	}
}
