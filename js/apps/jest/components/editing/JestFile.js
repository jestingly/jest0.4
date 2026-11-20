//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/editing/JestFile.js loaded' );

//-------------------------
// JestFile Class
//-------------------------
// A sidebar menu for graphical user interfaces.
class JestFile extends JestElement {
	// Object properties
	origin			= null;			// [string] Value of file origin ("local", "remote", "generated").
	path			= null;			// [string] Value of file path.
	stem			= null;			// [string] Value of filename "stem" (without extension).
	extension		= null;			// [string] value of file type.
	data			= null;			// [object] reference to file data.
	queue			= {};			// [object] Temp data queued for various tasks such as saving.
	// Saving & closing properties
	saveHandle		= null;			// [FileSystemFileHandle|null] Handle for persistent saves.
	// Contextual attachment properties
	context			= null;			// [object] base [object] data.

	//---------------------------------
	// Constructor
	//---------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client		- [object] Application client that this piece belongs to.
	// * origin		- [string] Value of file data origin ("local", "remote", etc.).
	constructor( client, origin ) {
		super( client );			// call parent constructor
		this.setOrigin( origin );	// set file data origin
		// Initially set saved & changed values.
		this.jot( "saved", false );		// it has not been saved
		this.jot( "changed", false );	// it has not been changed
	}

	//-------------------------
	// Teardown Method(s)
	//-------------------------
	// Destroy the view [object]
	// RETURNS: [void].
	destroy() {
		//-------------------------
		// Cleanup Event(s)
		//-------------------------
		// Remove all event(s).
		this.unregisterAll();

		//-------------------------
		// Clear Out Data & Reference(s)
		//-------------------------
		// Delete [object] references.
		this.data		= null;	// empty data
		this.context	= null;	// dereference context
	}

	//--------------------------------
	// Set File Origin
	// ( origin [string] ) => void
	//-------------------------------
	// Accepts: "local", "remote", "generated", "manual", "unknown"
	setOrigin( origin ) {
		// Determine acceptable origin value(s).
		const validOrigins = [
			"local",		// Loaded from device or file system
			"remote",		// Downloaded via HTTP or WebSocket
			"generated",	// Programmatically generated
			"manual",		// Hand-entered or user-composed
			"unknown"		// Catch-all or error case
			];
		// Validate supplied argument.
		if ( !validOrigins.includes(origin) ) {
			console.warn( `[setOrigin] Invalid origin "${origin}". Defaulting to "unknown".` );
			origin	= "unknown";
		}
		// Change origin value.
		this.origin	= origin;
	}

	//-------------------------
	// Lexical Handling
	//-------------------------
	// Change the path to the file [object].
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * folderpath	- [string] Value of new name.
	setPath( folderpath ) {
		this.path		= jsos.prove(folderpath,'string') ? folderpath : null;
		this.emit( 'pathChange', null, this ); // path change event
		return true; // successfully changed
	}

	// Change the filename "stem" value of the file [object].
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * stem	- [string] Value of new filename stem (without extension).
	setStem( stem ) {
		// Check if stem name is changing.
		if ( stem===this.stem ) return; // unchanged
		// Set the new stem filename.
		this.stem		= jsos.prove(stem,'string') ? stem : 'unnamed';
		this.jot( "changed", true );				// mark as changed (filename changed)
		this.emit( 'stemChange', null, this );		// filename change event
		return true; // successfully changed
	}

	// Change the extension of file [object].
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * extension	- [string] Value of new name.
	setExtension( extension ) {
		// Check if extension changing.
		if ( extension===this.extension ) return; // unchanged
		// Set the new stem filename.
		this.extension	= jsos.prove(extension,'string') ? extension : 'unnamed';
		this.jot( "changed", true );				// mark as changed (extension changed)
		this.emit( 'extensionChange', null, this );	// extension change event
		return true; // successfully changed
	}

	// Use requested file info for [object] reference orientation.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * fileInfo	- File information [object].
	async setFile( fileInfo ) {
		//--------------------------------
		// Validate fileInfo structure
		//--------------------------------
		// Check if file data was sent.
		if ( !fileInfo /*|| !(fileInfo.data)*/ ) return false;
		//--------------------------------
		// Set path / handle correctly
		//--------------------------------
		this.saveHandle	= fileInfo.handle ?? null;	// allow persisting save
		this.setPath( fileInfo.path );				// set path name for file
		this.setStem( fileInfo.stem );				// set filename of file
		this.setExtension( fileInfo.extension );	// set filetype extension
		//--------------------------------
		// Set File Data
		//--------------------------------
		// Store the file path data.
		this.data = fileInfo.data;
	}

	// Open a file.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * fileInfo	- File information [object].
	async openFile( fileInfo ) {
		// Orient this [object] to the provided file information.
		this.setFile( fileInfo ); // assign file information
		return true; // success
	}

	//--------------------------------
	// Context Handling Method(s)
	//--------------------------------
	// Build the element [object].
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * context	- pre-loaded [object].
	setContext( context ) {
		// Validate argument(s).
		if ( typeof variable === 'object' && variable !== null &&  !Array.isArray(variable) ) {
			console.warn( `Argument "context" must be an [object].` );
			return false; // fail
		}
		// Set context reference.
		console.log( `Setting [object] as "context".` );
		this.context	= context ?? null;
		return true; // success
	}

	// Return the context [object].
	// RETURNS: [object] or [null].
	getContext() { return this.context; }

	//--------------------------------
	// Save To Disk
	//--------------------------------
	// Main save dispatcher.
	// RETURNS: [Promise<boolean>] true on success.
	// * mimeType		- [string] MIME type (e.g. 'text/plain')
	// * forceSaveAs	- [bool] Force Save As dialog (default: false)
	// * fallback		- [bool] Allow fallback forced download (default: true)
	async saveToDisk( mimeType='text/plain', forceSaveAs=false, fallback=true ) {
		//--------------------------------
		// Trusted Save (overwrite)
		//--------------------------------
		// If a save path is defined, continue to save.
		if ( this.path && !forceSaveAs ) {
			const fullpath	= `${this.path}${this.stem}.${this.extension}`;
			const ok		= await this.saveToTrustedPath( fullpath );
			if ( ok ) return true; // successfully saved
		}
		//--------------------------------
		// Save As Dialog
		//--------------------------------
		// Seek a "Save As" dialog.
		const result	= await this.saveAsDialog();
		if ( result.success )  return true;		// successfully saved
		// User canceled → do not fallback
		if ( result.canceled ) return false;	// respect cancel, no fallback
		//--------------------------------
		// Fallback Forced Download
		//--------------------------------
		// Attempt to download file.
		if ( fallback ) {
			this.downloadFallback();
			return true; // downloaded
		}
		//--------------------------------
		// All Methods Failed
		//--------------------------------
		return false; // all methods failed
	}

	//--------------------------------
	// Save To Trusted Path
	//--------------------------------
	// OVERWRITES the file at a known trusted full path.
	// RETURNS: [Promise<boolean>] true on success.
	// * fullPath	- [string] Full absolute path to save to.
	async saveToTrustedPath( fullPath ) {
		// Electron IPC Overwrite
		if ( window.jestAPI && window.jestAPI.saveFile ) {
			// Attempt to save.
			const result = await window.jestAPI.saveFile( fullPath, this.data );
			if ( result.success ) {
				// Toggle file as unchanged.
				this.jot( "saved", true );		// it has been saved
				this.jot( "changed", false );	// it has not been changed
				// Get new file path info.
				console.log( result.path );
				const fileInfo	= this.client.getFileInfo( result.path );
				this.setFile( fileInfo );		// update path info
				console.log( `JestFile: Saved "${this.stem}".` );
				this.saved( 'success' );		// emit event
				return true; // successfully saved
			}
			else {
				console.warn( `JestFile: Save failed "${fullPath}".` );
				this.saved( 'failed' ); // emit event
				return false; // failed to save
			}
		}
		// Save failed
		console.warn( `JestFile: Could not find IPC handler for saving.` );
		this.saved( 'failed' ); // emit event
		return false; // fail
	}

	//--------------------------------
	// Save As Dialog
	//--------------------------------
	// Prompts user with Save As dialog, allows picking path.
	// RETURNS: [Promise<boolean>] true on success.
	async saveAsDialog() {
		//--------------------------------
		// Electron IPC Save As
		//--------------------------------
		if ( window.jestAPI && window.jestAPI.saveFileAs ) {
			const defaultName	= `${this.stem}.${this.extension}`;
			const result		= await window.jestAPI.saveFileAs( defaultName, this.data );
			// Check if save succeeded.
			if ( result.success ) { // saved
				// Toggle file as unchanged.
				this.jot( "saved", true );		// it has been saved
				this.jot( "changed", false );	// it has not been changed
				// Get new file path info.
				console.log( result.path );
				const fileInfo	= this.client.getFileInfo( result.path );
				this.setFile( fileInfo );		// update path info
				console.log( `JestFile: Saved As "${this.stem}".` );
				this.saved( 'success' );		// emit event
				return { success: true, canceled: false }; // successfully saved
			}
			else if ( result.canceled ) { // canceled
				console.warn( `JestFile: Electron "Save As" canceled by user.` );
				this.saved( 'canceled' ); // emit event
				return { success: false, canceled: true }; // canceled save
			}
			else { // failed
				console.warn( `JestFile: Electron "Save As" failed "${this.stem}".` );
				this.saved( 'failed' ); // emit event
				return { success: false, canceled: false }; // failed to save
			}
		}
		//--------------------------------
		// Browser FS Access Save As
		//--------------------------------
		else if ( 'showSaveFilePicker' in window ) {
			try {
				const handle	=
					await window.showSaveFilePicker({
						suggestedName:		`${this.stem}.${this.extension}`,
						types:
							[{
							description:	'Jest Files',
							accept:			{ 'text/plain': [`.${this.extension}`] }
							}]
						});
				const writable	= await handle.createWritable();
				await writable.write( new Blob( [this.data], { type: 'text/plain' } ) );
				await writable.close();
				this.saveHandle	= handle;
				// Toggle file as unchanged.
				this.jot( "saved", true );		// it has been saved
				this.jot( "changed", false );	// it has not been changed
				console.log( 'JestFile: Saved via FS Access API.' );
				this.saved( 'success' ); // emit event
				return { success: true, canceled: false }; // successfully saved
			}
			catch ( err ) { // failed to save as
				if ( err.name==='AbortError' ) { // aborted
					console.warn( 'JestFile: Save As canceled by user.' );
					this.saved( 'canceled' ); // emit event
					return { success: false, canceled: true }; // canceled save
				}
				else {
					console.error( `JestFile: Save As failed: ${err.message}` );
					this.saved( 'failed' ); // emit event
					return { success: false, canceled: false }; // failed to save
				}
			}
		}
		//--------------------------------
		// Save As failed
		//--------------------------------
		console.warn( `JestFile: Could not access system "Save As" dialog.` );
		this.saved( 'failed' ); // emit event
		return { success: false, canceled: false }; // failed to save
	}

	//--------------------------------
	// Download Fallback
	//--------------------------------
	// Generates a forced download link to save file.
	// RETURNS: [void].
	downloadFallback() {
		// Convert data to blob for HTML anchor download.
		const blob	= new Blob( [this.data], { type: 'text/plain' } );
		// Create an HTML anchor element.
		const a		= document.createElement( 'a' );
		a.href		= URL.createObjectURL( blob );
		a.download	= `${this.stem}.${this.extension}`;
		document.body.appendChild( a );	// append element to DOM
		a.click();						// force-click the download
		document.body.removeChild( a );	// remove element
		this.saved( 'success' ); // emit event
		console.log( 'JestFile: Downloaded fallback.' );
	}

	//--------------------------------
	// Emit Handler(s)
	//--------------------------------
	// Emit a saved event.
	saved( status=null ) {
		// Since the file was saved, mark it as unchanged.
		if ( status==='success' )
			this.jot( "changed", false ); // mark as saved (unchanged)
		// Emit a saved event.
		this.emit( 'saved', null, { status } );
	}

	//--------------------------------------
	// Buffer Temp Data Method(s)
	//--------------------------------------
	// Stores a piece of temporary data into the buffer.
	// Validates the input arguments before storing.
	// RETURNS: [bool] true if stored successfully
	// THROWS: [Error] if key is invalid or duplicate
	// * key	- [string] required non-empty key identifier
	// * data	- [any] any value to associate with key
	enqueue( key, data ) {
		// Validate: key must be non-null string
		if ( typeof key!=='string' || key.trim()==='' )
			throw new Error( `buff(): Invalid key → must be non-empty string.` );
		// Validate: key must not already exist in buffer
		if ( key in this.queue )
			throw new Error( `buff(): Key '${key}' already buffered.` );
		// Store data in internal buffer map
		this.queue[ key ] = data;
		return true;
	}

	// Retrieves and removes a specific item from the queue.
	// RETURNS: [any|null] data value if found, else null
	// * key - [string] required key to retrieve
	dequeue( key ) {
		// Validate key
		if ( typeof key!=='string' || key.trim()==='' )
			throw new Error( `dequeue(): Invalid key → must be non-empty string.` );
		// Check if key exists
		if ( !(key in this.queue) )
			return null;
		// Retrieve + delete
		const value = this.queue[ key ];
		delete this.queue[ key ];
		return value; // return item
	}

	// Retrieves the full buffer contents and clears it.
	// Use when committing, saving, or flushing all queued data.
	// RETURNS: [object] shallow copy of current buffer state
	flush() {
		// Clone buffer contents to return
		const clone	= { ...this.queue };
		// Clear buffer
		this.queue	= {};
		return clone;
	}
}
