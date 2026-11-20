//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/play/JestPlayer.js loaded' );

//-------------------------
// JestPlayer Class
//-------------------------
// Represents a root player [object] with animations for different parts (head, sword, body).
class JestPlayer extends JestHuman {
	//---------------------------------
	// Account Propert(ies)
	//---------------------------------
	// World data
	id				= null;				// [int] Value of guest account ID (e.g. 120145).
	username		= null;				// [string] Value of user username (e.g. 'Antago').

	//---------------------------------
	// Initialization
	//---------------------------------
	// Initializes the Guest.
	// RETURNS: [void].
	// * client		- client [object] that this piece belongs to.
	// * type		- [string] Value of [object] type (e.g. "user").
	constructor( client, type ) {
		// Call parent constructor
		super( client, type );	// construct the parent
	}

	//-------------------------
	// Memory Management
	//-------------------------
	// Destruct the [object]
	// RETURNS: [void].
	teardown() {
		super.teardown(); // call parent destructor
	}

	//-------------------------
	// Data Handling
	//-------------------------
	// Load the data.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * id			- [int] Value of user id (e.g. 12).
	// * username	- [string] Value of user username (e.g. 'Antago').
	async load( id, username ) {
		super.load();					// call parent load start method
		this.id			= id;			// set user account ID
		this.username	= username;		// set user account username
		this.complete();				// call complete method
		return true;					// success
	}

	// Complete data load.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	complete() {
		super.complete();				// call parent complete method
		//this.client.websocket.guests[this.id] = this; // store reference in stack [object]
		return true;					// success
	}
}
