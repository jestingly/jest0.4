//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/online/auth/JestLogin.js loaded' );

//-----------------------------
// JestLogin Class v0.1
//-----------------------------
// Handles login, registration, logout, and session check.
// Uses Inquiry + Transmission for server communication.
// Uses JestModal for UI login form.
// Emits: 'loggedIn', 'loggedOut', 'fail'
//-----------------------------
class JestLogin extends JestElement {
	// Object properties
	logged    = false;      // [bool] whether user is logged in or not.
	username  = null;       // [object|null] Logged-in user (or null)
	modals    = {};         // [object] JestModal instance
	parts     = {};         // [object] Login parts.

	//-------------------------
	// Constructor
	//-------------------------
	// Create a login manager.
	// * client  - [object] reference to main CMS controller
	// * name    - [string] Value of level name (e.g. 'level1').
	constructor( client ) {
		// Call the parent object constructor
		super( client );           // construct the parent
		// Setup the user account modals.
		this.initModalLogin();     // create login modal
		this.initModalSignup();    // create signup modal
		this.initModalLogout();    // create logout modal
		// Register UI change events.
		this.register( 'loggedIn', null, ()=>this.loggedIn() );
		this.register(
			['unrecognized','loggedOut'], null,
			() => this.loggedOut()
			);
	}

	//-------------------------
	// Create Login Part(s)
	//-------------------------
	// Generate the top right login-badge.
	// RETURNS: [void].
	build() {
		// --------------------------------
		// Create User Login UI
		// --------------------------------
		// Create a brand logo inside the system bar.
		const badge =
			new Panel({
				name    : 'login',
				tag     : 'div',
				classes : ['jest-username-badge']
				});
		this.badge  = badge; // keep ref
		badge.addElements([
			{
				name       : 'ico_profile',
				tag        : 'svg',
				attributes : {
					xmlns        : "http://www.w3.org/2000/svg",
					viewBox      : "0 0 1200 1200",
					width        : "1200pt",
					height       : "1200pt",
					"aria-hidden": "true",
					version      : 1.1
					},
				classes    : [ 'ico-profile' ],
				elements   :
					[
						{
							name       : 'path',
							tag        : 'path',
							attributes : {
								'd': 'm88.922 1087.5c51.656-234.32 261.1-409.45 511.08-409.45 250.03 0 459.47 175.13 511.08 409.45zm511.08-971.95c130.69 0 236.76 106.08 236.76 236.72 0 130.69-106.08 236.76-236.76 236.76s-236.76-106.08-236.76-236.76c0-130.64 106.08-236.72 236.76-236.72z',
								'fill-rule': 'evenodd'
								}
						}
					]
			},
			{
				name       : 'username',
				tag        : 'div',
				classes    : ['jest-username']
			},

			{
				name       : 'separator1',
				tag        : 'div',
				classes    : ['separator']
			},
			{
				name       : 'ico_lock',
				tag        : 'svg',
				attributes : {
					xmlns        : "http://www.w3.org/2000/svg",
					viewBox      : "0 0 1200 1200",
					width        : "1200pt",
					height       : "1200pt",
					"aria-hidden": "true",
					version      : 1.1
					},
				classes    : [ 'ico-lock' ],
				elements   :
					[
						{
							name       : 'path',
							tag        : 'path',
							attributes : {
								'd': 'm866.16 326.29v112.64h-98.766v-112.64c0-92.25-75-167.26-167.26-167.26-92.578 0-167.53 75-167.53 167.26v112.64h-98.766v-112.64c0-146.86 119.44-266.29 266.29-266.29 146.58 0 266.02 119.44 266.02 266.29zm-266.29 321.52c-6.1875 0-12.656 0.60938-18.844 2.1562-27.469 6.4688-49.688 28.078-56.484 55.547-8.625 34.266 5.25 68.484 35.156 86.719 5.5312 3.375 8.3438 10.172 7.0781 16.359l-31.734 143.16c-0.60937 3.375 0.9375 6.1875 1.8281 7.0781 0.9375 1.2188 3.0938 3.375 6.4688 3.375h113.25c3.375 0 5.5312-2.1562 6.4688-3.375 0.9375-0.9375 2.4844-3.7031 1.8281-7.0781l-31.781-143.16c-1.2188-6.1875 1.5469-12.938 7.0781-16.359 23.766-14.484 37.641-39.188 37.641-66.328 0-24.047-10.781-46.266-29.625-61.406-13.781-10.828-30.75-16.688-48.328-16.688zm368.11-75.891v465.94c0 56.484-45.656 102.14-102.14 102.14h-531.66c-56.484 0-102.14-45.656-102.14-102.14v-465.94c0-56.484 45.656-102.14 102.14-102.14h531.66c56.484 0 102.14 45.656 102.14 102.14zm-302.39 240.37c27.469-20.672 43.219-52.172 43.219-86.391 0-33.656-14.812-64.781-41.062-85.453-26.25-20.672-60.469-28.406-93.797-20.344-38.578 8.9531-69.75 39.516-79.312 78.047-10.781 43.219 4.9219 87.656 39.797 114.19l-29.297 132.98c-2.7656 11.438 0.32812 23.766 7.7344 33 7.4062 9.2344 18.844 14.812 30.562 14.812h113.25c12.047 0 23.156-5.5312 30.562-14.812 7.4062-9.2344 10.5-21.281 7.7344-33z'
								}
						}
					]
			},
			{
				name       : 'logout',
				tag        : 'a',
				text       : 'logout',
				attributes : {
					href   : "javascript:void(0)"
					},
				callbacks:
					[
						{
							command  : 'click',
							id       : 'btnLogout',
							type     : 'dom',
							callback :
								e => {
									// Open logout modal.
									this.show( "logout" );
								}
						}
					]
			},

			{
				name       : 'ico_key',
				tag        : 'svg',
				attributes : {
					xmlns        : "http://www.w3.org/2000/svg",
					viewBox      : "0 0 50 62.5",
					width        : "1200pt",
					height       : "1200pt",
					"aria-hidden": "true",
					version      : 1.1
					},
				classes    : [ 'ico-key' ],
				elements   :
					[
						{
							name       : 'path',
							tag        : 'path',
							attributes : {
								'd': 'M32,33.44A15.47,15.47,0,1,0,16.56,18a15.69,15.69,0,0,0,.73,4.72L3.12,36.87a2.08,2.08,0,0,0-.62,1.49v7A2.1,2.1,0,0,0,4.61,47.5h7a2.1,2.1,0,0,0,2.11-2.11V41.88h3.52a2.12,2.12,0,0,0,2.11-2.11V36.25h3.51a2.08,2.08,0,0,0,1.49-.62l2.93-2.92A15.69,15.69,0,0,0,32,33.44Zm3.52-22.5A3.52,3.52,0,1,1,32,14.45,3.51,3.51,0,0,1,35.55,10.94Z'
								}
						}
					]
			},
			{
				name       : 'login',
				tag        : 'a',
				text       : 'login',
				attributes : {
					href   : "javascript:void(0)"
					},
				callbacks:
					[
						{
							command  : 'click',
							id       : 'btnLogin',
							type     : 'dom',
							callback :
								e => {
									// Open login modal.
									this.show( "login" );
								}
						}
					]
			},

			{
				name       : 'separator2',
				tag        : 'div',
				classes    : ['separator']
			},
			{
				name       : 'signup',
				tag        : 'a',
				text       : 'signup',
				attributes : {
					href   : "javascript:void(0)"
					},
				callbacks:
					[
						{
							command  : 'click',
							id       : 'btnSignup',
							type     : 'dom',
							callback :
								e => {
									// Open signup modal.
									this.show( "signup" );
								}
						}
					]
			}
			]);
		// Hide user badge by default.
		//badge.hide(); // hide badge
	}

	//-------------------------
	// Initialize Login Modal
	//-------------------------
	// Builds the login modal using JestModal to log into an existing account.
	// RETURNS: [void]
	initModalLogin() {
		// Create Modal instance [object].
		const modal    = new JestModal( this.client );
		this.modals.login = modal;     // kep ref
		modal.build( 'modal-login' );  // build the modal

		// Set the title & message of the modal.
		modal.setTitle( 'Account Login' );
		modal.setText( 'Enter your username & password.' );

		// Create username field.
		const username = modal.addTextfield( 'username', null, '', 'Username', 'Username' );
		//username.setCaption( '' );
		username.showCaption();
		username.panel.reorderChild( username.caption, -1 );

		// Create password field.
		const password = modal.addTextfield( 'password', null, '', 'Password', 'Password', 'password' );
		//password.setCaption( '' );
		password.showCaption();
		password.panel.reorderChild( password.caption, -1 );

		// Create modal button(s).
		modal.addButton( 'login', 'Log In',
			() => {
				// Get username & password from login modal.
				const username = this.modals.login.getInputValue( 'username' );
				const password = this.modals.login.getInputValue( 'password' );
				// Attempt to login using username & password.
				this.login( username, password );
			});
		modal.addButton( 'cancel', 'Close', () => modal.close() );

		// Add modal to the DOM & close it.
		document.body.appendChild( modal.panel.el ); // attach to DOM
		modal.close(); // close by default
	}

	// Builds the login modal using JestModal to signup for a new account.
	// RETURNS: [void]
	initModalSignup() {
		// Create Modal instance [object].
		const modal    = new JestModal( this.client );
		this.modals.signup = modal;		// kep ref
		modal.build( 'modal-signup' );	// build the modal

		// Set the title & message of the modal.
		modal.setTitle( 'Register Account' );
		modal.setText( 'Fill out each required field.' );
		modal.setNotice( '' );

		// Create username field.
		const username = modal.addTextfield( 'username', null, '', 'Username', 'Username' );
		username.setCaption( '<b>3-20 characters</b> • at least <b>1 letter</b> & <b>1 number</b>' );
		username.showCaption();
		username.panel.reorderChild( username.caption, -1 );

		// Create email field.
		const email    = modal.addTextfield( 'email', null, '', 'Email', 'Email' );
		email.setCaption( '<b>valid e-mail address</b>' );
		email.showCaption();
		email.panel.reorderChild( email.caption, -1 );

		// Create password field.
		const password = modal.addTextfield( 'password', null, '', 'Password', 'Password', 'password' );
		password.setCaption( '<b>6 characters</b> • at least <b>1 letter</b> & <b>1 number</b>' );
		password.showCaption();
		password.panel.reorderChild( password.caption, -1 );

		// Create modal button(s).
		modal.addButton( 'signup', 'Signup', () => this.signup() );
		modal.addButton( 'cancel', 'Close', () => modal.close() );

		// Add modal to the DOM & close it.
		document.body.appendChild( modal.panel.el ); // attach to DOM
		modal.close(); // close by default
	}

	// Builds the logout modal using JestModal to logout your account session.
	// RETURNS: [void]
	initModalLogout() {
		// Create Modal instance [object].
		const modal   = new JestModal( this.client );
		this.modals.logout = modal;    // kep ref
		modal.build( 'modal-logout' ); // build the modal

		// Set the title & message of the modal.
		modal.setTitle( 'Logout Account' );
		modal.setText( `Proceed to logout of your account?` );

		// Create modal button(s).
		modal.addButton( 'confirm', 'Confirm', () => this.logout() );
		modal.addButton( 'cancel', 'Cancel', () => modal.close() );

		// Add modal to the DOM & close it.
		document.body.appendChild( modal.panel.el ); // attach to DOM
		modal.close(); // close by default
	}

	//-------------------------
	// Show Login Modal
	//-------------------------
	// Displays the login/signup modal dialog.
	// RETURNS: [bool] true on success else false.
	// * name	- [string] Value of modal to show.
	show( name ) {
		// Check if modal exists.
		if ( !this.modals?.[name] ) {
			console.error( `[JestLogin]: Cannot find modal named ${name}.` );
			return false; // fail
		}
		// Reset all inputs.
		this.modals[name].resetInputs();
		// Open the modal.
		this.modals[name].open();
		return true; // success
	}

	//-------------------------
	// Check Session Modal Action
	//-------------------------
	// Verify whether a user has a live login session on the server.
	// RETURNS: [void]
	async checkLoginSession() {
		// Request the server for existing login session.
		const url     = `${this.client.config.root}php/includes/auth/check.php`;
		const inquiry = new Inquiry( url, 'FETCH', 'POST', 'auth', 'form', null, 'json' );
		const result  = await this.client.transmitter.sendInquiry( inquiry );
		console.log( result );

		// Check if the user is already logged in.
		if ( result?.parsed?.code===200 ) {
			// Check the user in.
			this.checkin( result.parsed.data.user.username );
			// Emit login event.
			this.emit( 'loggedIn', null, this.username );
		}
		else {
			// Set user as not logged.
			this.checkout();
			// Emit failed check event.
			this.emit( 'unrecognized' );
		}
	}

	// Determine if a user is already verified as logged in.
	// RETURNS: [void]
	isLoggedIn() { return this.logged; }

	// Check a user in (log them in).
	checkin( username ) {
		// Log the user in.
		this.logged   = true;     // logged in
		this.username = username; // store username
	}

	// Check a user out (log them out).
	checkout() {
		this.logged   = false;    // logged out
		this.username = null;     // clear username
	}

	//-------------------------
	// Log-In Modal Action
	//-------------------------
	// Sends a login request using the modal input.
	// RETURNS: [void]
	// * username  - [string] Value of username to login with.
	// * password  - [string] Value of password to login with.
	async login( username, password ) {
		console.log( 'logging in...' );
		if ( !username || !password ) {
			alert( `Please enter a valid username & password.` );
			console.error( `[JestLogin] Can't login with missing credentials.` );
			return;
		}
		// Build url to call & send a query via transmitter.
		const url     = `${this.client.config.root}php/includes/auth/login.php`;
		const inquiry =
			new Inquiry(
				url, 'login', 'POST', 'auth', 'form',
				{ username, password }, 'json'
				);
		const result  = await this.client.transmitter.sendInquiry( inquiry );
		console.log( result );

		// Check if the user successfully logged in.
		if ( result?.parsed?.code===200 ) {
			// Check the user in.
			this.checkin( result.parsed.data.user.username );
			// Emit login event.
			this.emit( 'loggedIn', null, this.username );
			// Close the modal.
			this.modals.login.close();
		}
		else {
			// Set user as not logged.
			this.checkout();
			// Alert the user.
			this.modals.login.setNotice( result?.parsed?.message );
			const fieldNames     = [ 'username', 'password' ];
			const hasFieldNotice =
				this.applyFieldNotices(
					this.modals.login, fieldNames,
					result?.parsed?.data );
			// Use an alert only for a failure that did
			// not include field-specific feedback.
			if ( !hasFieldNotice )
				alert( result?.parsed?.message || 'Login failed.' );
			// Emit login fail event.
			this.emit( 'loginFail', null, result?.parsed?.message );
		}
	}

	//-------------------------
	// Apply Field Notices
	//-------------------------
	// Apply server-side errors to their matching field captions.
	// Clear captions when a field has no error in the current response.
	// RETURNS: [bool] True if at least one field error was displayed.
	// * modal      - [object] JestModal containing the fields to update.
	// * fieldNames - [array] Names of fields to check in the modal and response.
	// * data       - [object] Parsed response data, keyed by field name.
	applyFieldNotices( modal, fieldNames, data ) {
		// Track whether any field error was displayed.
		let hasFieldError   = false;

		// Update each field so old errors do not remain after a new response.
		for ( const fieldName of fieldNames ) {
			// Get the field from the modal.
			const field     = modal.getField( fieldName );

			// Skip this name when the modal does not contain the field.
			if ( !field ) continue;

			// Get the server response for this field.
			const fieldData = data?.[fieldName];

			// Only use the notice when the server marked this field as an error.
			const isError   = fieldData?.status==='error';
			const notice    =
				isError && typeof fieldData.notice==='string'
					? fieldData.notice : '';

			// Set the current error notice or clear a previous caption.
			field.setCaption( notice );

			// Record whether this field displayed an error.
			if ( notice )
				hasFieldError = true;
		}

		// Return whether any field displayed an error notice.
		return hasFieldError;
	}

	// --------------------------------
	// Reusable Login Requirement
	// --------------------------------
	// Check the current login state and explain why authentication is needed.
	// RETURNS: [boolean] True when the requested action may continue.
	// * options.action		- [string] Short action name shown in the notice.
	// * options.description	- [string] Optional explanation for the user.
	// * options.prompt		- [boolean] Whether to open the login prompt immediately.
	requireLogin( {
		action      = 'continue',
		description = '',
		prompt      = false
		} = {} ) {
		// Allow the action when the current login state is authenticated.
		if ( this.logged===true ) return true; // logged in

		// Build a useful message for the action the user attempted.
		const text =
			description
				? `Log in to ${action}. ${description}`
				: `Log in to ${action}.`;

		// Keep a reference to the login controller for the notification button.
		const login = this;
		// Explain the blocked action and offer a direct route to login.
		this.client.noticer.notify({
			text     : text,
			icon     : `${this.client.config.root}/images/icons/sm_profile.png`,
			duration : 8000,
			buttons  :
				[{
				label : 'Log In',
				click : () => login.show( 'login' )
				}]
			});

		// Open the login prompt immediately when the caller requests it.
		if ( prompt ) this.show( 'login' );
		// Tell the caller to stop; it can be retried after login.
		return false; // logged out
	};

	//-------------------------
	// Create Account Modal Action
	//-------------------------
	// Sends a registration request using modal inputs.
	// RETURNS: [void]
	async signup() {
		console.log( 'signup');
		const username = this.modals.signup.getInputValue( 'username' );
		const email    = this.modals.signup.getInputValue( 'email' );
		const password = this.modals.signup.getInputValue( 'password' );
		const url      = `${this.client.config.root}php/includes/auth/signup.php`;
		const inquiry  =
			new Inquiry(
				url, 'signup', 'POST', 'auth', 'form',
				{ username, email, password }, 'json'
				);
		const result   = await this.client.transmitter.sendInquiry( inquiry );
		console.log( result );

		// Check if the user successfully registered account.
		if ( result?.parsed?.code===200 ) {
			// Close signup modal.
			this.modals.signup.close();
			// Get username & password from signup modal.
			const username = this.modals.signup.getInputValue( 'username' );
			const password = this.modals.signup.getInputValue( 'password' );
			// Automatically attempt to login using username & password.
			this.login( username, password ); // auto-login after registration
		}
		else {
			// Set user as not logged.
			this.checkout();
			// Alert the user.
			this.modals.signup.setNotice( result?.parsed?.message );
			const fieldNames     = [ 'username', 'email', 'password' ];
			const hasFieldNotice =
				this.applyFieldNotices(
					this.modals.signup, fieldNames,
					result?.parsed?.data );
			// Use an alert only for a failure that did
			// not include field-specific feedback.
			if ( !hasFieldNotice )
				alert( result?.parsed?.message || 'Registration failed.' );
			// Emit failed signup event.
			this.emit( 'signupFail', null, result?.parsed?.message );
		}
	}

	//-------------------------
	// Logout Modal Action
	//-------------------------
	// Sends logout request to server.
	// RETURNS: [void]
	async logout() {
		const url     = `${this.client.config.root}php/includes/auth/logout.php`;
		const inquiry =
			new Inquiry(
				url, 'loggedOut', 'POST', 'auth', 'form', null, 'json'
				);
		const result  = await this.client.transmitter.sendInquiry( inquiry );
		console.log( result );

		// Check if the user successfully logged out.
		if ( result?.parsed?.code===200 ) {
			// Set user as not logged.
			this.checkout();
			// Close the logout modal.
			this.modals.logout.close();
			// Emit logged out event.
			this.emit( 'loggedOut' );	// emit event
		}
	}

	//-------------------------
	// Login/Logout UI Change
	//-------------------------
	// When a user is logged in, this helper method is called to change UI.
	// RETURNS: [void]
	loggedIn() {
		// Show logged in display.
		this.badge.refs.username.setText( this.username ); // display username
		this.badge.refs["ico_profile"].show(); // show profile icon
		this.badge.refs["username"].show();    // show username
		this.badge.refs["separator1"].show();  // show separator
		this.badge.refs["ico_lock"].show();    // show lock icon
		this.badge.refs["logout"].show();      // show logout button
		this.badge.refs["ico_key"].hide();     // hide lock icon
		this.badge.refs["separator2"].hide();  // hide separator
		this.badge.refs["login"].hide();       // hide login button
		this.badge.refs["separator2"].hide();  // hide separator
		this.badge.refs["signup"].hide();      // hide signup button
		// Emit UI change event.
		this.emit( 'ui:login' ); // emit event
	}

	// When a user is logged out, this helper method is called to change UI.
	// RETURNS: [void]
	loggedOut() {
		// Show logged in display.
		this.badge.refs.username.setText( this.username ); // display username
		this.badge.refs["ico_profile"].hide(); // hide profile icon
		this.badge.refs["username"].hide();    // hide username
		this.badge.refs["separator1"].hide();  // hide separator
		this.badge.refs["ico_lock"].hide();    // hide lock icon
		this.badge.refs["logout"].hide();      // hide logout button
		this.badge.refs["ico_key"].show();     // show lock icon
		this.badge.refs["login"].show();       // show login button
		this.badge.refs["separator2"].show();  // show separator
		this.badge.refs["signup"].show();      // show signup button
		// Emit UI change event.
		this.emit( 'ui:logout' ); // emit event
	}
}
