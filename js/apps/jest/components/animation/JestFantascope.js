//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/animation/JestFantascope.js loaded' );

//-------------------------
// JestFantascope Class
//-------------------------
// Manages janis.
class JestFantascope extends JestFileLoader {
	// Object properties
	filetypes	= [ 'jani' ];	// [array] of filetype extension(s).

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
	// Class constructor for jani [object]s.
	// RETURNS: Virtual class name.
	get fileClass() { return JestJani; }

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
		// Attempt to Create File [object]
		//---------------------------------
		// Instantiate the return variable.
		let jani	= null; // initially jani is [null]
		// Validate the loaded data.
		if ( record instanceof AnimationAnimation ) {
			console.log( `Animation loaded: ${address}` );
			// Create a file [object] for the animation.
			jani	= new JestJani( this.client, address, this.client.config.janiSpan );
			await jani.setup(); // setup new [object]
			// Load the animation into the [JestJani] object.
			jani.setAnimation( record ); // add loaded animation to jani
		}
		else console.warn( `Animation not loaded: ${address}` );
		return jani; // new instance
	}
}
