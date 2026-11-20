//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/image/JestImager.js loaded' );

//-------------------------
// JestImager Class
//-------------------------
// Manages image download(s) & storage.
class JestImager extends JestFileLoader {
	// Object properties
	filetypes	= [ 'gif', 'png' ];	// [array] of filetype extension(s).

	///-------------------------
	// Constructor
	//-------------------------
	// Construct with app client reference.
	// * client		- [object] Application client creating the object.
	constructor( client ) {
		super( client );		// Call the parent constructor.
	}

	//-------------------------
	// Virtual Class Reference
	//-------------------------
	// Class constructor for image [object]s.
	// RETURNS: Virtual class name.
	get fileClass() { return JestGraphic; }

	//-------------------------
	// Abstract: Create File [object]
	//-------------------------
	// Create file instance.
	// RETURNS: Generated file [object] instance or [null].
	// * record		- Loaded secretary record [object].
	// * fileInfo	- File information [object].
	// * address	- [string] Full path to file, with filename + extension.
	//   network	- [string] One of: 'local', 'remote'
	async _createFileObject( record, fileInfo, address, network ) {
		//---------------------------------
		// Validate Record Data
		//---------------------------------
		// Check if the parsed blob data is available.
		if ( !record?.blob || !(record.blob instanceof Blob) ) {
			console.warn( 'Cannot find file data.' );
			return null; // abort
		}

		//---------------------------------
		// Attempt to Create File [object]
		//---------------------------------
		// Continue to create file [object].
		const file		=
			new JestGraphic(
				this.client,		// app client [object]
				fileInfo.filename,	// filename of file
				address,			// URL of file source
				network				// protocl ('local', 'remote')
				);
		file.setup();				// call any necessary setup
		file.render( record.blob );	// render blob into file [object]
		return file; // new instance
	}
}
