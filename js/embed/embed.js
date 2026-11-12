//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/embed/embed.js loaded' );
// Global log
function log( message ) { console.log(message); }
// Attempt to load applet.
// * request	- { action }
async function jestBootup( request ) {
	try {
		console.log( 'jestAlert: content.js response' );
		// --------------------------------
		// Handle content by status
		// --------------------------------
		switch ( JestEnvironmentStatus ) {
			case 'shutdown': // environment not running
				if ( request.action==='openJestEnvironment' ) {
					(async () => {
						console.log( 'jestAlert: openJestEnvironment message received.' );
						try {
							// --------------------------------
							// Load up the helper utility
							// --------------------------------
							// Generate the Jest interface [object]
							console.log( 'jestAlert: Create interface.' );
							jsos = new JSOSInterface();

							// --------------------------------
							// Load up the enviroment
							// --------------------------------
							// Generate the Jest environment
							console.log( 'jestAlert: Create environment.' );
							JestEnvironment = new JSOSEnvironment();
							JestEnvironment.generateEnvironment();
							setStatus( 'running' );
							jsos.build(); // build the JSOS

							// --------------------------------
							// Import libraries
							// --------------------------------
							// Harlequin
							JestEnvironment.librarian.ship( 'Harlequin' );
							JestEnvironment.librarian.libs.Harlequin.ship( ['HarlequinWindow'] );

							// --------------------------------
							// Open the game application
							// --------------------------------
							//JestEnvironment.execute( 'JestPlay' );
							//const app  = JestEnvironment.apps.JestPlay;

							JestEnvironment.execute( 'JestTiler' );
							const app  = JestEnvironment.apps.JestTiler;

							//JestEnvironment.execute( 'JestAnimator' );
							//const app  = JestEnvironment.apps.JestAnimator;

							// --------------------------------
							// Setup application
							// --------------------------------
							await app.setup();	// setup the application
							await app.launch();	// auto-launch
						}
						catch ( e ) {
							console.error( 'jestAlert: Error embedding modal:', e );
						}
					})();
				}
				break;
			default: break; // not shutdown
		}
	}
	catch ( e ) {
		console.error( 'jestAlert: Error booting environment:', e );
	}
}

// Bootup the environment
jestBootup({
	action: "openJestEnvironment"
	});
