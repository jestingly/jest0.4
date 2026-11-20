//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/JestGamepiece.js loaded' );

//-------------------------
// JestGamepiece Class
//-------------------------
// Represents a basic [object] bound to the client world with various useful properties.
class JestGamepiece extends OSCallback {
	// Declare properties
	client		= null;				// [object] Application client reference.
	_skey		= null;				// [string] Value of unique [object] key.

	//---------------------------------
	// Constructor
	//---------------------------------
	// Initializes the game piece [object].
	// * client		- [object] Application client that this piece belongs to.
	constructor( client ) {
		super();					// construct the parent
		this.client	= client;		// game [object] reference
		// Generate a unique system key.
		const key	= jsos.generateKey(); // create unique key
		this.skey	= key;			// set unique key as [object] system key
	}

	//---------------------------------
	// Unique Key Handling
	//---------------------------------
	// Get the [object] unique system key value.
	// RETURNS: [string] Value of unique [object] skey.
	get skey() {
		return this._skey;	// return skey
	}
	// Set the [object] unique system key value.
	// RETURNS: [void].
	// * val	- [string] Value of worldling unique system key.
	set skey( val ) {
		this._skey	= val;	// set system key
	}

	// Plug the [object] into the central game timeout loop.
	// RETURNS: [void].
	// * callback		- [callable] to call each time the timeout pulse updates.
	/*jumpstart( callback ) {
		this.client.timeout.register( 'tick', 'animator', callback );
	}*/
}
