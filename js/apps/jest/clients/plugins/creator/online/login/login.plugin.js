//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/online/login/login.plugin.js loaded' );

// Login handling plugin (for files).
(function( window ) {
	// Define the plugin [object]
	var type    = 'online';
	var subtype = 'login';
	var plugin  = {
		//--------------------------------
		// Plugin Setup Function
		//--------------------------------
		init: async function( client ) {
			// --------------------------------
			// User Login/Sign-up Authentication
			// --------------------------------
			// Build the GUI.
			client.login.build(); // setup login/logout badge
			// Add a login panel to the top right of the app interface.
			client.register(
				'postbuild', 'loginPlugin',
				() => {
					// Access top right panel.
					const topright = client.panel.getPanel( 'system.topright' );
					// Add login panel to the top right panel.
					if ( topright )
						topright.addPanel( 'login', client.login.badge );
				});

			// --------------------------------
			// Setup Login Notification Event(s)
			// --------------------------------
			// Wire global failed account signup event.
			client.login.register(
				'signupFail', 'default',
				message => {
					// --------------------------------
					// Send User Failed Notification
					// --------------------------------
					// Send user a simple notification.
					client.noticer.notify({
						text     : `Failed to create account! ${message}`,
						icon     : `${this.config.root}/images/icons/sm_profile.png`,
						duration : 4000,
						//persistent: true,
						buttons  :
							[
							{ label: 'Ok', click: () =>  {/*console.log('Ok pressed');*/} }
							]
						//onExpire  : () => console.log('Notification expired')
						});
					// Play sound effect to signal action.
					client.soundboard.playSound( 'jest_error', 'mp3', 1.05 );
				});

			// Wire global failed account login event.
			client.login.register(
				'loginFail', 'default',
				message => {
					// --------------------------------
					// Send User Failed Notification
					// --------------------------------
					// Send user a simple notification.
					client.noticer.notify({
						text     : `Failed to log in! ${message}`,
						icon     : `${this.config.root}/images/icons/sm_key.png`,
						duration : 4000,
						//persistent: true,
						buttons  :
							[
							{ label: 'Ok', click: () =>  {/*console.log('Ok pressed');*/} }
							]
						//onExpire  : () => console.log('Notification expired')
						});
					// Play sound effect to signal action.
					client.soundboard.playSound( 'jest_error', 'mp3', 1.05 );
				});

			// Wire global failed account "login required" event.
			client.login.register(
				'loginRequired', 'default',
				message => {
					// --------------------------------
					// Send User Failed Notification
					// --------------------------------
					// Send user a simple notification.
					client.noticer.notify({
						text     : `Login required to perform action: ${message}`,
						icon     : `${this.config.root}/images/icons/sm_profile.png`,
						duration : 4000,
						//persistent: true,
						buttons  :
							[
							{ label: 'Ok', click: () =>  {/*console.log('Ok pressed');*/} }
							]
						//onExpire  : () => console.log('Notification expired')
						});
					// Play sound effect to signal action.
					client.soundboard.playSound( 'jest_alert', 'mp3', 1.05 );
				});

			// Wire global login/logout events
			client.login.register(
				'loggedIn', 'accountActionLoggedIn',
				username => {
					// --------------------------------
					// Send User "Logged In" Notification
					// --------------------------------
					// Send user a simple notification.
					client.noticer.notify({
						text     : `Successfully logged in as ${username}!`,
						icon     : `${this.config.root}/images/icons/sm_profile.png`,
						duration : 4000,
						//persistent: true,
						buttons  :
							[
							{ label: 'Ok', click: () =>  {/*console.log('Ok pressed');*/} }
							]
						//onExpire  : () => console.log('Notification expired')
						});
					// Play sound effect to signal action.
					client.soundboard.playSound( 'jest_login', 'mp3', 1.05 );
				});
			//this.login.register( 'logout', 'tiler', () => this.clearUserUI() );

			// --------------------------------
			// Autocheck Login Session
			// --------------------------------
			// Check if user is logged in.
			await client.login.checkLoginSession(); // try to checkin
			// Prompt user with a login screen if no session is active.
			if ( client.login.logged!==true )
				client.login.show( "login" );
		},

		//--------------------------------
		// New Method(s) In Tiler Application
		//--------------------------------
		extend: function( Klass, proto ) { }
	};
	// register with JestCreator
	if ( window.JestCreator && typeof window.JestCreator.use==='function' )
		window.JestCreator.use( type, plugin );
	else console.error( 'online/login/login.plugin.js load error: JestCreator.use() not found' );
})( window );
