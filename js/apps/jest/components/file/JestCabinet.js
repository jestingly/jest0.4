//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/file/JestCabinet.js loaded' );

//-------------------------
// JestCabinet Class
//-------------------------
// Manages open files and active working file(s).
class JestCabinet extends JestGamepiece {
	// Cabinet propert(ies)
	openFiles		= {};				// [object] { skey: JestFile } for open file instances.
	activeKey		= null;				// [string|null] Currently active file key.

	//--------------------------------
	// Constructor
	//--------------------------------
	// Construct a new JestCabinet.
	// * game - [object] Client or app instance.
	constructor( game ) {
		super( game );					// Call parent
		this.openFiles	= {};			// Open file registry
	}

	//--------------------------------
	// Save an Open File
	//--------------------------------
	// Accesses a file inside the cabinet & saves it.
	// RETURNS: [bool] true on success or false if fail.
	// * file	- [JestFile] Instance to track.
	// * method	- [string] Value: "new", "overwrite", "cloud", "download"
	async saveFile( key, method="download" ) {
		// Check if file is open inside cabinet.
		if ( !this.openFiles?.[key] ) {
			console.warn( 'Cannot Save File: Not open inside cabinet.' );
			return false; // fail
		}
		// Acces file inside cabinet.
		const file	= this.openFiles[key];
		// Emit a pre-save event.
		this.emit( 'presave', null, file );		// emit event
		// Attempt to save the file.
		await file.saveToDisk( method );
		// Emit post-save event(s).
		this.emit( 'save', null, file );		// emit event
		this.emit( 'postsave', null, file );	// emit event
		return true; // success
	}

	//--------------------------------
	// Add a New File
	//--------------------------------
	// Adds a file to the cabinet and activates it.
	// RETURNS: [string] Key of added file.
	// * file	- [JestFile] instance to track.
	openFile( file ) {
		// Newest open file becomes active file record.
		const key			= file.skey; // file unique system key
		this.activeKey		= key;
		this.openFiles[key]	= file;
		return key;
	}

	//--------------------------------
	// Switch Active File
	//--------------------------------
	// Sets a file as the active working file.
	// RETURNS: [bool] true on success.
	// * key	- [string] Key of the file to activate.
	switchToFile( key ) {
		// Determine active file.
		if ( !this.openFiles[key] ) return false;
		this.activeKey = key; // set key as active
		return true;
	}

	//--------------------------------
	// Get Active File
	//--------------------------------
	// Returns the currently active file.
	// RETURNS: [JestFile|null].
	getActiveFile( ) {
		return this.openFiles[this.activeKey] || null;
	}

	//--------------------------------
	// Close One File
	//--------------------------------
	// Removes one open file.
	// RETURNS: [bool] true on success.
	// * key	- [string] Key to remove.
	closeFile( key ) {
		// Check if file exist(s).
		if ( !this.openFiles[key] ) return false;
		const file = this.openFiles[key];
		// Confirm if unsaved
		if ( file.hasUnsavedChanges && file.hasUnsavedChanges() ) {
			if ( !window.confirm(`Unsaved changes in "${file.stem}". Close anyway?`) )
				return false;
		}
		// Remove file & its unique key.
		delete this.openFiles[key];
		jsos.releaseKey( key );
		if ( this.activeKey===key )
			this.activeKey = null;
		// Return success.
		return true; // success
	}

	//--------------------------------
	// Close All Open Files
	//--------------------------------
	// Attempts to close all files, warns if unsaved.
	// RETURNS: [bool] true if successful.
	closeAll() {
		// Iterate all open files & close.
		for ( const key of Object.keys(this.openFiles) ) {
			if ( !this.closeFile(key) )
				return false; // If user cancels
		}
		return true; // success
	}

	//--------------------------------
	// Get All Open Keys
	//--------------------------------
	// Returns keys of all open files.
	// RETURNS: [array<string>].
	getOpenKeys() {
		return Object.keys( this.openFiles );
	}

	//--------------------------------
	// Has Unsaved Changes?
	//--------------------------------
	// Checks all files for pending changes.
	// RETURNS: [bool].
	hasUnsavedChanges() {
		// Iterate all open key(s) & check for unsaved change(s).
		for ( const key of this.getOpenKeys() ) {
			const file = this.openFiles[key];
			if ( file.hasUnsavedChanges && file.hasUnsavedChanges() )
				return true; // unsaved changes exist
		}
		return false; // no unsaved changes
	}
}
