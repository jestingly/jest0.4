//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/online/JestOnline.js loaded' );

//-------------------------
// JestOnline Class v0.1
//-------------------------
// Class for connecting game client with a websocket for server interaction.
class JestOnline extends JestSavable {
	// Server [objects]
	websocket		= null;				// JestWebsocket [object] ie. object sending and receiving server interaction.
	// Connection session data
	user			= {};				// [object] Value of user session data: id

	//---------------------------------
	// Constructor
	//---------------------------------
	// Construct the [object].
	// * client		- [object] Application client creating the object.
	// * name		- [string] Value of server name (e.g. 'primary').
	constructor( client, name="primary" ) {
		// Call the parent object constructor
		super( client, name );	// construct the parent
		//---------------------------------
		// Create the server connect [object]
		//---------------------------------
		const websocket	= new JestWebsocket( this ); // server interactor
		this.websocket	= websocket;
		//---------------------------------
		// Setup Listener(s)
		//---------------------------------
		// Set other event(s)
		this.websocket.register( 'message:init', 'init', (e)=>this.init(e) );
		this.websocket.register( 'message:guestJoin', 'guestJoin', (e)=>this.guestJoin(e) );
		this.websocket.register( 'message:guestUpdate', 'guestUpdate', (e)=>this.guestUpdate(e) );
		this.websocket.register( 'message:guestLeft', 'guestLeft', (e)=>this.guestLeft(e) );
	}

	//-------------------------
	// Connection Method(s)
	//-------------------------
	// Connect websocket to the server.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * url	- [string] Value of server URL to connect to.
	async connect( url ) {
		// Check if connection is possible
		if ( this.websocket.connecting ) {
			console.warn( "[JESTOnline] Already connecting..." );
			return false;
		}
		if ( this.websocket.connected ) {
			console.warn( "[JESTOnline] Already connected..." );
			return true;
		}
		// Connect to the URL.
		await this.websocket.bootup( url );			// Start up system
		const ok = await this.websocket.connect(); 	// Attempt connection
		if ( ok ) {
			console.log( "✅ Connected" );
			return true; // success
		}
		else {
			console.warn( "❌ Timed out or failed" );
			//throw new Error( "Websocket connection failed." );
			return false; // fail
		}
	}

	//-------------------------
	// Message Method(s)
	//-------------------------
	// User joined the server.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * data	- data [object] handling received message
	async init( data ) {
		// Log some information
		console.log( data );
		// Update the user session.
		this.reserve( data );
		// Emit event.
		this.emit( 'selfJoin', null, data, data.id, data.username );
		//---------------------------------
		// Add all guest [objects]
		//---------------------------------
		console.log( "user session loading players..." );
		// Iterate all guests & add to client.
		for ( const [id,info] of Object.entries(data.clients) ) {
			if ( id===this.client.user.id ) continue; // ignore user
			await this.addGuest( info );
		}
		return true; // success
	}

	// Guest joined the server.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * data	- data [object] handling received message
	async guestJoin( data ) {
		// Log some information
		console.log( data );
		console.log( this.client.user.id );
		console.log( data.id );
		if ( data.id===this.client.user.id ) return false; // ignore user
		//---------------------------------
		// Add new guest [object]
		//---------------------------------
		console.log( "loading new guest..." );
		await this.addGuest( data ); // add guest
		return true; // success
	}

	// Guest data updated on the server.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * data	- data event [object] handling received message
	async guestUpdate( data ) {
		// Log some information
		//guests[data.id] = { x: data.x, y: data.y };
		//console.log( e );
		//console.log( data.id );
		//console.log( this.client.gameboard.guests );
		//---------------------------------
		// Handle Guest Update Action
		//---------------------------------
		// Emit event.
		this.emit( 'guestUpdate', null, data, data.id, data.action );
		//console.log( data );
		return true; // success
	}

	// Guest left the server.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// *data	- data [object] handling received message
	async guestLeft( data ) {
		// Log some information
		//console.log( data );
		if ( data.id===this.client.user.id ) return false; // ignore user
		//---------------------------------
		// Remove guest player [object]
		//---------------------------------
		await this.removeGuest( data ); // remove guest
		return true; // success
	}

	//-------------------------
	// User Session
	//-------------------------
	// Setup the user session seat.
	// RETURNS: [void].
	// * data	- [object] of user personal session data.
	//		id	- [int] Value of user id
	reserve( data ) {
		this.user.id	= data.id;	// user account id
	}

	// Abandon the user session seat.
	// RETURNS: [void].
	abandon() {
		// Clear the user's id
		this.user.id	= null;		// clear user id
	}

	//-------------------------
	// Player Method(s)
	//-------------------------
	// Create a guest from the server on the user client.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * data	- data [object] handling received message
	async addGuest( data ) {
		// Log some information
		console.log( this.client.user.id );
		console.log( data.id );
		console.log( "Adding Guest:", data.id, data.username );
		//---------------------------------
		// Add Player [object]
		//---------------------------------
		// Emit event.
		this.emit( 'guestJoin', null, data, data.id, data.username );
		return true; // success
	}

	// Remove a guest from the user client.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * data	- data [object] handling received message
	async removeGuest( data ) {
		// Log some information
		console.log( this.client.user.id );
		console.log( data.id );
		console.log( "Removing Guest:", data.id, data.username );
		//---------------------------------
		// Remove Player [object]
		//---------------------------------
		// Emit event.
		this.emit( 'guestLeft', null, data, data.id, data.username );
		return true; // success
	}

	//-------------------------
	// Send Updates to Server
	//-------------------------
	// Sends a self (user) message update to the WebSocket server.
	// RETURNS: [boolean] true if sent, false if blocked or failed.
	// * data	- [object] Data to send, must include at least a `type`.
	selfSendUpdate( data ) {
		// Try to pass data through websocket
		this.websocket.send( data ); // send attempt
		return true;
	}
}
