//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/file/JestFileLoader.js loaded' );

//-------------------------
// JestFileLoader Class
//-------------------------
// Manages files.
class JestFileLoader extends JestGamepiece {
	// Object properties
	filetypes	= [];		// [array] of filetype extension(s).
	files		= {};		// container of file [objects]

	///-------------------------
	// Constructor
	//-------------------------
	// Construct with app client reference.
	// * client		- [object] Application client creating the object.
	constructor( client ) {
		super( client );	// Call the parent constructor.
	}

	//-------------------------
	// Virtual Class Reference
	//-------------------------
	// Class constructor for file [object]s.
	// MUST be overridden by child class.
	get fileClass() {
		throw new Error( 'fileClass getter must be overridden in subclass' );
	}

	//-------------------------
	// Filing Information
	//-------------------------
	// Obtain a file key.
	// RETURNS: Stored file key [string].
	// * address	- [string] Full path to file, with filename + extension.
	//   network	- [string] One of: 'local', 'remote'
	getKey( address, network='remote' ) {
		//---------------------------------
		// Validate Arguments
		//---------------------------------
		if ( !jsos.argues({address:[address,'string']}) ) {
			console.warn( `Invalid argument for 'address': ${address}` );
			return false; // abort
		}
		if ( !jsos.argues({network:[network,'string']}) ) {
			console.warn( `Invalid argument for 'network': ${network}` );
			return false; // abort
		}

		//---------------------------------
		// Generate Key Value [string]
		//---------------------------------
		const prefix	= network==='local' ? 'loc' : 'url';
		const key		= `${prefix}:${address}`;
		return key; // key [string]
	}

	//---------------------------------
	// File Handling
	//---------------------------------
	// Download a file & generate a file [object].
	// RETURNS: File [object] or [bool] `false` on fail.
	// * address	- [string] Full address to file (e.g. 'head/head1.png')
	//   forceReload	- [bool] If true, skips cache and reloads all.
	async loadFile( address, forceReload=false ) {
		//--------------------------
		// Validate Argument
		//--------------------------
		if ( !jsos.argues({address:[address,'string']}) ) {
			console.warn( `Invalid argument for 'address': ${address}` );
			return false; // abort
		}

		//--------------------------
		// Load File via Multi-Loader
		//--------------------------
		// Load result, passing `name` as [array].
		const result	= await this.loadFiles( [address], forceReload );
		const key		= this.getKey( address, 'remote' );
		return result?.[key] ?? false; // return file
	}
	
	// Download file(s) & generate file [object(s)].
	// RETURNS: [object] of file(s) by address key or `false` on fail.
	// * addresses	- [array] Full address names (e.g. 'heads/head1.png').
	//   forceReload	- [bool] If true, skips cache and reloads all.
	async loadFiles( addresses, forceReload=false ) {
		//--------------------------
		// Validate Arguments
		//--------------------------
		if ( !jsos.argues({addresses:[addresses,'array']}) ) {
			if ( jsos.argues({addresses:[addresses,'string']}) )
				addresses = [addresses]; // wrap single address
			else {
				console.warn( `Invalid argument for 'addresses': ${addresses}` );
				return false; // abort
			}
		}

		//--------------------------------
		// Initialize Result Containers
		//--------------------------------
		const result	= {};			// final return map [key → file object]
		const toLoad	= [];			// array of [address] to be downloaded
		const groups	= {};			// map of [ext → address[]] for batch secretary load

		//--------------------------
		// Group by Extension
		//--------------------------
		// Map: extension → [filename stem]
		for ( const address of addresses ) {
			// Get file info using the address.
			const key		= this.getKey( address, 'remote' );
			const file		= this.getFile( address, 'remote' );
			const fileInfo	= this.client.getFileInfo( address );
			// Filter bad parse & unallowed filetypes.
			if ( !fileInfo || !this.filetypes.includes(fileInfo.extension) ) {
				console.warn( `Unsupported filetype: ${fileInfo?.extension} (${address})` );
				continue; // skip
			}

			// Use cache if available unless forced to reload
			if ( file && !forceReload ) {
				result[key] = file; // skip loading
				continue;; // skip
			}

			// Group files by extension for multi-load
			const ext = fileInfo.extension;
			if ( !groups[ext] ) groups[ext] = [];
			groups[ext].push( fileInfo.address );
			toLoad.push( address );
		}

		//--------------------------------
		// Early Exit if All Cached
		//--------------------------------
		// Return multi-filetype result container.
		if ( toLoad.length === 0 ) return result; // all were cached

		//--------------------------------
		// Load Each Extension Group via Secretary
		//--------------------------------
		// Iterate each filetype & load the requests.
		for ( const ext in groups ) {
			const extGroup = groups[ext]; // array of addresses for this ext
			await this.client.secretary.loadFiles( extGroup );
		}

		//--------------------------
		// Generate File Objects
		//--------------------------
		// Iterate all addresses & create [object].
		for ( const address of toLoad ) {
			// Render downloaded data into proper [object].
			const file = await this._generateFile( address, 'remote' );
			if ( file ) {
				const key = this.getKey( address, 'remote' );
				result[key] = file; // store result for return
			}
		}

		return result; // loaded files
	}

	/*async readFiles( fileInfos, forceReload=false ) {
		const result = {};
		const toRead = [];

		for ( const fileInfo of fileInfos ) {
			const key = this.getKey( fileInfo.address, fileInfo.network );
			const exists = this.files?.[key] instanceof this.fileClass;

			if ( exists && !forceReload ) {
				result[key] = this.files[key];
			} else {
				toRead.push( fileInfo );
			}
		}

		// Read missing files
		for ( const fileInfo of toRead ) {
			const file = await this.readFile( fileInfo );
			if ( file )
				result[ this.getKey(fileInfo.address, fileInfo.network) ] = file;
		}

		return result;
	}*/

	// Read file from local drive method.
	// RETURNS: [bool] success.
	// * fileInfo	- File information [object].
	async readFile( fileInfo ) {
		//--------------------------------
		// Validate Argument(s)
		//--------------------------------
		// Validate argument(s)
		if ( !fileInfo ) {
			console.warn( 'Cannot Read File: Supplied argument is empty!' );
			return null; // abort
		}

		//--------------------------------
		// Validate Filetype(s)
		//--------------------------------
		// Allowed types.
		const extension	= fileInfo.extension; // filetype extension [string]
		if ( !this.filetypes.includes(extension) ) {
			console.warn( `Unknown requested file type: ${extension}` );
			return null; // abort
		}

		//--------------------------------
		// Attempt to Load Data
		//--------------------------------
		// Use the Secretary to read a local file's data.
		console.log( `Attempting to read local file data...` );
		//console.log( fileInfo );
		console.log( fileInfo );
		const ok	= await this.client.secretary.readFile( fileInfo );
		if ( !ok ) {
			console.warn( `Could not read file data:`+fileInfo.address );
			return false; // abort
		}
		else console.log( `Local file data read successfully!` );

		//---------------------------------
		// Attempt to Render File
		//---------------------------------
		// Render the remote data into a file [object].
		const file	= await this._generateFile( fileInfo.address, 'local' );
		return file; // return file result
	}

	// Creates & stores a loaded file by filename.
	// NOTE: file data must already have been downloaded or read locally.
	// RETURNS: File [object] on success, else [null] on fail.
	// * address	- [string] Full path to file, with filename + extension.
	//   network	- [string] One of: 'local', 'remote'
	async _generateFile( address, network='remote' ) {
		//---------------------------------
		// Validate Arguments
		//---------------------------------
		// Check whether arguments are right data type.
		if ( !jsos.argues({address:[address,'string']}) ) {
			console.warn( `Invalid argument for 'address': ${address}` );
			return null; // abort
		}
		if ( !jsos.argues({network:[network,'string']}) ) {
			console.warn( `Invalid argument for 'network': ${network}` );
			return null; // abort
		}

		//---------------------------------
		// Parse Path Information
		//---------------------------------
		// Get file info using the address.
		const fileInfo	= this.client.getFileInfo( address, null, null, null, network );

		//--------------------------------
		// Validate Filetype(s)
		//--------------------------------
		// Allowed types.
		const extension	= fileInfo.extension; // filetype extension [string]
		if ( !this.filetypes.includes(extension) ) {
			console.warn( `Unknown requested file type: ${extension}` );
			return null; // abort
		}

		//---------------------------------
		// Access Loaded File Data
		//---------------------------------
		//console.warn( fileInfo );
		// Attempt to access the loaded file data [object].
		//console.log( this.client.secretary );
		const remote	= network==='local' ? false : true; // whether local or web file
		const record	= this.client.secretary.getRecord(address,network) ?? null;

		//--------------------------
		// Attempt to Create File [object]
		//--------------------------
		// Continue to create file [object].
		const file		= await this._createFileObject( record, fileInfo, address, network );
		if ( !file ) return null; // file not created

		//---------------------------------
		// Store Result & Return It
		//---------------------------------
		// Get full file address key [string] value.
		const key		= this.getKey( address, network ); // key [string]
		// Store reference to created file data in this.files container.
		this.files[key] = file; // store file
		return file; // return file [object|null]
	}

	//-------------------------
	// Record Validator
	//-------------------------
	// Returns true if blob data is valid.
	// Can be overridden per loader.
	_validateRecord( record ) {
		throw new Error( '_validateRecord must be implemented in subclass' );
	}

	//-------------------------
	// Abstract: Create File [object]
	//-------------------------
	// Must be implemented in subclass.
	_createFileObject( fileInfo, address, network ) {
		throw new Error( '_createFileObject must be implemented in subclass' );
	}

	// Add file [object] to fantascope.
	// NOTE: If second parameter is [null], fantascope will attempt to download.
	// RETURNS: File [object] `true` on success else `false` on fail.
	// * address	- [string] Full path to file, with filename + extension.
	//   file		- (optional) File [object].
	//   network	- [string] One of: 'local', 'remote'
	async addFile( address, file, network='remote' ) {
		//---------------------------------
		// Validate Propert(ies)
		//---------------------------------
		if ( this.getFile(address) ) {
			console.warn( `addFile() cannot overwrite existing file: ${address}.` );
			return false; // abort
		}

		//---------------------------------
		// Validate Arguments
		//---------------------------------
		if ( !jsos.argues({address:[address,'string']}) ) {
			console.warn( `addFile() invalid argument for 'address': ${address}` );
			return false; // abort
		}
		if ( file!==null && !(file instanceof this.fileClass) ) {
			console.warn( `addFile() invalid argument for 'file'.` );
			return false; // abort
		}

		//---------------------------------
		// Parse Path Information
		//---------------------------------
		// Get file info using the address.
		const fileInfo	= this.client.getFileInfo( address, null, null, null, network );

		//--------------------------------
		// Validate Filetype(s)
		//--------------------------------
		// Allowed types.
		const extension	= fileInfo.extension; // filetype extension [string]
		if ( !this.filetypes.includes(extension) ) {
			console.warn( `Unknown requested file type: ${extension}` );
			return false; // abort
		}

		//---------------------------------
		// Attempt Download (if requested)
		//---------------------------------
		// Determine if file [object] exists.
		if ( file===null ) {
			const file	= await this.loadFile( address );
			if ( !file || !(file instanceof this.fileClass) ) {
				console.warn( `addFile() could not load file: ${address}.` );
				return null; // return [null]
			}
		}

		//---------------------------------
		// Store File [object] Reference
		//---------------------------------
		// Get full file address key [string] value.
		const key		= this.getKey( address, network ); // key [string]
		// Set file [object].
		this.files[key] = file; // store file
		return file; // return [object]
	}

	//---------------------------------
	// Access File [object] from Registry
	//---------------------------------
	// Retrieves a file [object] by its name, if it exists and is valid.
	// RETURNS: File [object] on success, else `null`.
	// * address	- [string] Full path to file, with filename + extension.
	//   network	- [string] One of: 'local', 'remote'
	getFile( address, network='remote' ) {
		//---------------------------------
		// Validate Arguments
		//---------------------------------
		if ( !jsos.argues({address:[address,'string']}) )
			return null; // abort

		//---------------------------------
		// Return File [object] or [null]
		//---------------------------------
		// Get full file address key [string] value.
		const key		= this.getKey( address, network ); // key [string]
		const file		= this.files?.[key] ?? null;
		return (file instanceof this.fileClass) ? file : null;
	}

	// Determine if a file already has been downloaded/exists.
	// RETURNS: [boolean] `true` if exists, else `false` if not found.
	// * address	- [string] Full path to file, with filename + extension.
	//   network	- [string] One of: 'local', 'remote'
	hasFile( address, network='remote' ) {
		// Get full file address key [string] value.
		const key		= this.getKey( address, network ); // key [string]
		return (this.files?.[key] instanceof this.fileClass);
	}

	//---------------------------------
	// Remove File [object] from Registry
	//---------------------------------
	// Deletes a file [object] by name from the registry.
	// RETURNS: [boolean] `true` if removed, else `false` if not found or invalid.
	// * address	- [string] Full path to file, with filename + extension.
	//   network	- [string] One of: 'local', 'remote'
	removeFile( address, network='remote' ) {
		//---------------------------------
		// Validate Arguments
		//---------------------------------
		if ( !jsos.argues({address:[address,'string']}) )
			return false;

		//---------------------------------
		// Attempt Removal
		//---------------------------------
		// Get full file address key [string] value.
		const key	= this.getKey( address, network ); // key [string]
		const exists = (this.files?.[key] instanceof this.fileClass);
		if ( exists )
			delete this.files[key]; // remove from registry
		return exists; // return result
	}

	//---------------------------------
	// Retrieve All Registered File Names
	//---------------------------------
	// Gets an [array] of all registered file addresses in fantascope.
	// RETURNS: [array] of [string] addresses of loaded file [objects].
	getAllKeys() {
		//---------------------------------
		// Gather All Keys from Registry
		//---------------------------------
		return Object.keys( this.files )
			.filter( key => this.files[key] instanceof this.fileClass );
	}
}
