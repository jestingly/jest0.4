//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/libraries/harlequin/LibraryHarlequin.js loaded' );

//-------------------------
// LibraryHarlequin library
//-------------------------
JestLibraryRegistry.LibraryHarlequin =
	class LibraryHarlequin extends OSLibrary {
		// Declare properties
		name				= 'Harlequin Library';	// name of application
		version				= '1.0';				// application version

		// Creates the library.
		// RETURNS: [bool] `true` on success, else `false`.
		// * libs		- [array] of libs inside of library to include.
		constructor( libs ) {
			// Call the parent application constructor
			super( libs=[] );
			//---------------------------------
			// Setup application
			//---------------------------------
			this.setup(); // setup the library
		}
	};
