//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/connect/JestWebsocket.js loaded' );

//-------------------------
// JestWebsocket Class
//-------------------------
// Class for connecting to server & reading data.
class JestWebsocket extends OSCallback {
	// Websocket & server [objects]
	ws				= null;				// [object] WebSocket connecting to server
	attempts		= 0;				// [int] value of how many connect attempts made
	limit			= 5;				// [int] value of how many connect attempts to make before quitting
	url				= null;				// [string] value of websocket server URL
	// Status variable(s)
	running			= false;			// true after bootup()
	connecting		= false;			// true while connecting
	connected		= false;			// true only when socket is fully open
	trying			= false;			// true only during each individual connect attempt

	// --------------------------------
	// Constructor
	// --------------------------------
	// Construct the [object].
	constructor() {
		// Call the parent object constructor
		super();	// construct the parent
	}

	//-------------------------
	// Connection Method(s)
	//-------------------------
	// Attempt to safely connect, then enforce timeout for hangs.
	// RETURNS: [boolean] true if connected, false if failed or timed out.
	// * timeoutMs	- [int] Time in milliseconds to wait before giving up.
	async connect( timeoutMs=10000 ) {
		// Abort if system not running
		if ( !this.running ) {
			console.warn( "[JESTWebsocket] System not booted." );
			return false;
		}
		// Don't connect if already connected
		if ( this.isConnected() ) {
			console.warn( "[JESTWebsocket] Already connected." );
			return true;
		}
		// Prevent overlapping connect attempts
		if ( this.connecting || this.trying ) {
			console.warn( "[JESTWebsocket] Already attempting to connect." );
			return false;
		}
		// Begin connection attempt
		this.connecting		= true;		// trying to connect
		this.trying			= false;	// trying to open socket
		this.connected		= false;	// not connected yet
		await this.openSocket();
		// Wait for either success or failure
		const start	= Date.now();
		while ( this.connecting && !this.connected ) {
			// If timeout exceeded, abort
			if ( (Date.now()-start)>timeoutMs ) {
				console.error( `[JESTWebsocket] Connection timeout after ${timeoutMs}ms` );
				await this.shutdown();	// shut down the websocket
				return false;
			}
			await new Promise( r => setTimeout(r,100) );
		}
		return this.connected; // return status
	}

	// Retries the connect() method safely.
	// RETURNS: [void].
	async retryConnect() {
		// Require operation to be running
		if ( !this.running || !this.connecting || this.trying || this.connected ) return;
		// Prevent overlapping attempts
		console.log( "[JESTWebsocket] Retrying connection..." );
		try {
			await this.openSocket();
		}
		finally {
			this.trying			= false;	// trying to open socket
			this.connected		= false;	// not connected yet
		}
	}

	// Connect to the server.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	async openSocket() {
		// Validate status
		if ( !this.running  || !this.connecting
			 || this.trying || this.connected ) return false;
		//-------------------------
		// Setup Data For Connection
		//-------------------------
		await this.disconnect();  // disconnect existing connection
		this.trying = true;       // trying to connect
		//-------------------------
		// Attempt to Connect
		//-------------------------
		// Attempt to connect to websocket server
		try {
			// Attempt to open a connection to the WebSocket server
			console.log( `[JESTWebsocket] Connecting to [${this.url}]...` );
			this.ws           = new WebSocket( `${this.url}` );
			// Successfully connected
			this.ws.onopen    = () => this.open();
			// Handle incoming message from server
			this.ws.onmessage = e => this.message( JSON.parse(e.data) );
			// A non-fatal error occurred with the socket
			this.ws.onerror   = err => this.error( err );
			// Socket closed (server down, lost connection, etc.)
			this.ws.onclose   = e => this.close( e );
			return true; // connection made
		}
		catch ( err ) {
			// If creating the WebSocket throws (very rare), log it
			console.error( "[JESTWebsocket] Unexpected exception during connection:", err );
			// Failed to connect
			this.trying     = false;  // not trying to connect
			return false;             // connection failed
		}
	}

	// Check if the websocket is connected to a server.
	// RETURNS: [boolean] true if connected, false if not.
	isConnected() {
		// Check if server is connected
		return this.ws?.readyState===WebSocket.OPEN;
	}

	// Check if the websocket can connect to a server.
	// RETURNS: [boolean] true if new connection can be made, false if not.
	canConnect() {
		// Check if server is connected
		return !this.isConnected() && !this.connecting;
	}

	//-------------------------
	// WebSocket Message Interaction
	//-------------------------
	// Handle server messages (such as other guest data, server messages, etc.)
	// * data	- data [object] handling received message
	message( data ) {
		//-------------------------
		// Server Message Received
		//-------------------------
		// Handle the message data received
		switch ( data.type ) {
			case "init": // User joined the sever
				console.log( "you connected as user: "+data.id );
				break;
			case "guestJoin": // Guest joined the server.
				console.log( "another guest joined" );
				break;
			case "guestUpdate": // Guest data update.
				//console.log( "another guest changed" );
				break;
			case "guestLeft": // Guest left the server.
				console.log( "another guest left" );
				break;
			default: // unknown message
				console.warn( "[JESTWebsocket] Unknown message type:", data.type );
				return false; // unrecognized message
		}
		// Emit message event & attach data
		this.emit( `message:${data.type}`, null, data ); // emit event
	}

	//-------------------------
	// Send Message to Server
	//-------------------------
	// Sends a message to the WebSocket server.
	// RETURNS: [boolean] true if sent, false if blocked or failed.
	// * data	- [object] Data to send, must include at least a `type`.
	send( data ) {
		// Require operation to be running & websocket to be open.
		if ( !this.running || !this.ws || this.ws.readyState!==WebSocket.OPEN ) {
			console.warn( "[JESTWebsocket] Cannot send — WebSocket not open." );
			return false;
		}
		// Handle data validation, parsing & sending.
		if ( typeof data!=='object' || !data.type || !data.action ) {
			console.error( "[JESTWebsocket] Invalid send() payload:", data );
			return false;
		}

		// Try to send message to server.
		try {
			this.ws.send( JSON.stringify(data) ); // send message
			this.emit( 'send' ); // emit event
			this.emit( `send:${data.type}`, null, data ); // emit event
			return true;
		}
		catch ( err ) { // error
			console.error( "[JESTWebsocket] Failed to send message:", err );
			return false;
		}
	}

	//-------------------------
	// Running & Terminating
	//-------------------------
	// Starts the websocket for operation.
	// RETURNS: [boolean] if true, false if fail.
	// * url	- [string] Value of server URL to connect to.
	async bootup( url ) {
		// Cannot reboot while running (call shutdown() first).
		if ( this.running ) {
			console.warn( "[JESTWebsocket] Already booted." );
			return false;
		}
		// Register URL to connect to.
		this.url			= url;
		// Reset statuses
		this.running		= true;		// now booted up for use
		this.attempts		= 0;		// Reset backoff counter
		this.connecting		= false;	// not trying to connect
		this.trying			= false;	// not trying to open socket
		this.connected		= false;	// not connected
		this.emit( 'bootup' );			// emit event
		return true; // success
	}

	// Stops the websocket from operating.
	// RETURNS: [void].
	async shutdown() {
		await this.disconnect( true );	// terminate if open
		this.running		= false;	// now shutdown from operating
		this.attempts		= 0;		// Reset backoff counter
		this.connecting		= false;	// not trying to connect
		this.trying			= false;	// not trying to open socket
		this.connected		= false;	// not connected
		this.emit( 'shutdown' );		// emit event
	}

	// Closes the WebSocket connection.
	// RETURNS: [Promise] resolves when socket fully closes.
	// * force - [boolean] if true, forcibly terminates the socket.
	async disconnect( force=false ) {
		// No socket or already closed
		if ( !this.ws || this.ws.readyState===WebSocket.CLOSED ) return;
		// Force kill immediately
		if ( force ) {
			console.warn( "[JESTWebsocket] Forcibly terminating socket..." );
			this.ws.close( 1000, 'Client disconnect' ); // properly close the socket
		}
		else { // Graceful close with promise resolution
			console.log( "[JESTWebsocket] Closing WebSocket gracefully..." );
			await new Promise(
				resolve => {
					this.ws.onclose = () => resolve();
					this.ws.close();
				});
		}
		this.ws				= null;		// set Websocket to [null]
		this.connecting		= false;	// not trying to connect
		this.connected		= false;	// not connected
		this.emit( 'disconnect' );		// emit event
	}

	// Reset the WebSocket for a new session.
	// RETURNS: [void].
	/*reset() {
		// Require operation to be disconnected
		if ( this.connected ) return;
		//-------------------------
		// Setup Data For Connection
		//-------------------------
		// Reset new session variable(s)
		this.connected	= false;	// not yet connected
		this.finished	= false;	// not yet finished
	}*/

	//-------------------------
	// WebSocket Event Handling
	//-------------------------
	// Immediately called when a new WebSocket connection is opened.
	// RETURNS: [void].
	open() {
		// Require operation to be running
		if ( !this.running ) return;
		// Establish open connection data
		console.log( `[JESTWebsocket] Connection made to server [${this.url}].` );
		// Reset statuses
		this.attempts	= 0;		// Reset backoff counter
		this.connecting	= false;	// not trying to connect
		this.trying		= false;	// not trying to open socket
		this.connected	= true;		// successfully connected
		// Trigger open event listener
		this.emit( 'open' );		// emit event
	}

	// WebSocket connection error event handler.
	// RETURNS: [void].
	// * err	- error [object]
	error( err ) {
		// Require operation to be running
		if ( !this.running ) return;
		// Throw error
		console.warn( "[JESTWebsocket] Connection error:", err );
		// Trigger error event listener
		this.emit( 'error', null, err );	// emit error event with data
	}

	// WebSocket closed event handler.
	// RETURNS: [void].
	// * e	- event [object]
	async close( e ) {
		// Require operation to be running
		if ( !this.running || !this.connecting ) return await this.shutdown();
		this.trying		= false;	// not trying to open socket
		// Warn user connection to the server has been broken
		console.warn( "[JESTWebsocket] Connection closed:", e.reason || "No reason given" );
		// If we haven't hit the retry limit, attempt reconnection
		if ( this.attempts<this.limit ) {
			this.attempts++;
			const retryDelay = 1000 * this.attempts; // Hyperbolic backoff
			console.log( `[JESTWebsocket] Reconnecting in ${retryDelay}ms...` );
			setTimeout( ()=>this.retryConnect(), retryDelay );
		}
		else {
			console.error( "[JESTWebsocket] Max reconnect attempts reached. Giving up." );
			this.shutdown();	// shutdown the websocket
		}
		// Trigger close event listener
		this.emit( 'close' );	// emit event
	}

	//-------------------------
	// Get WebSocket Status
	//-------------------------
	// Returns current state of the WebSocket system.
	// RETURNS: [object] status report.
	getStatus() {
		return {
			running:	this.running,		// [bool] true if system is active
			connected:	this.connected,		// [bool] true if socket is open
			connecting:	this.connecting,	// [bool] true if socket is trying to connect
			attempts:	this.attempts,		// [int] retry attempts so far
			limit:		this.limit,			// [int] max retry attempts allowed
			hasSocket:	!!this.ws,			// [bool] true if a socket instance exists
			state:		this.ws?.readyState ?? null // [int|null] raw readyState from WebSocket
			};
	}
}
