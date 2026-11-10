//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/online/api/JestCloud.js loaded' );

//-----------------------------
// JestCloud Class v0.1
//-----------------------------
// Handles cloud saving of levels (auto & manual).
// Uses Inquiry + Transmission for server communication.
// Emits: 'save', 'load', 'delete', 'list', 'error'
//-----------------------------
class JestCloud extends JestElement {
	// Object properties
	saves        = [];              // [array] list of cloud saves
	lastSavedId  = null;            // [int|null] last saved entry id
	lastLoaded   = null;            // [object|null] last loaded save
	// Track an in-flight request so startup and the login event cannot fetch twice.
	listLoaded   = false;           // [boolean] Whether cloud list data has loaded.
	listLoading  = null;            // [Method] To loadback cloud list data.
	// UI handling properties
	fileViewer   = null;            // [object] JestFileViewer panel
	toolbar      = null;            // [object] JestToolbar for buttons
	container    = null;            // [object] JestPanel item list container
	modals       = {};              // [object] { conflict:JestModal, rename:JestModal }
	rename       = { input:null };  // [object] refs for rename modal parts

	//-------------------------
	// Constructor
	//-------------------------
	// Create the cloud save manager.
	// * client		- [object] reference to CMS controller
	constructor( client ) {
		super( client );           // construct base element
		// Build both modals at construction so they’re ready instantly.
		this.initModalConflict();  // create conflict modal
		this.initModalRename();    // create rename modal
	}

	// --------------------------------
	// Initialization
	// --------------------------------
	// Build the element [object].
	// RETURNS: [void].
	// * name		- unique [string] value of component name in the system.
	// * classes	- [array] of classes to add to panel element.
	build( name='cloud', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		super.build( 'div', name, ['cloud-panel'].mergeUnique(classes) );

		//--------------------------------
		// Create File Browser Menu
		//--------------------------------
		// Add cloud panel to the sidebar menu.
		const fileViewer = new JestFileViewer( this );
		this.fileViewer  = fileViewer; // sidebar cloud record browser
		fileViewer.build(); // build the file viewer
		// Create columns for list.
		fileViewer.listView.setColumns([
			{ id: 'level_name',    label: 'Filename',     visible: true,  sortable: true },
			//{ id: 'save_type',     label: 'Type',         visible: true,  sortable: true },
			{ id: 'version',       label: 'Version',      visible: true,  sortable: false },
			//{ id: 'note',          label: 'Note',         visible: true,  sortable: true },
			{ id: 'saved_at',      label: 'Modified',     visible: true,  sortable: true },
			{ id: 'actions',       label: 'Actions',      visible: true,  sortable: false }
			]);

		//--------------------------------
		// Create Swatch Container
		//--------------------------------
		// Create the inner DOM element(s).
		this.panel.addElements([
			{ name: 'listWrap', tag: 'div', classes: [ 'cloud-list', 'jest-panel' ] },
			{ name: 'buttons',  tag: 'div', classes: [ 'selector-buttons' ] }
			]); // add to form
		this.container = this.panel.refs.listWrap; // keep ref
		// Add file browser to the cloud panel.
		this.container.addPanel( 'browser', fileViewer.panel );

		// --------------------------------
		// Create Toolbar [object]
		// --------------------------------
		// Create the toolbar.
		const toolbar  = new JestToolbar( this );
		this.toolbar   = toolbar; // set toolbar
		toolbar.build(); // build the toolbar
		// Add toolbar to client interface.
		this.panel.refs.buttons.addPanel( 'toolbar', toolbar.panel );

		//--------------------------------
		// Create Button(s)
		//--------------------------------
		// Create a sync button.
		this.toolbar.createButton( { name: 'sync', text: 'Synchronize' } );
		// Register click event.
		/*this.toolbar.buttons.sync.register(
			'click', 'syncLevel', ()=>this.emit('addForeground') );*/

		//-----------------------------
		// Listen for Swatch Change
		//-----------------------------
		// Implement "swatch change" listener for foreground/background.
		/*this.client.register(
			'swatchChange', 'updateActiveSwatch',
			( key, data ) => {
				// Check if foreground is being set.
				if ( key!=='foreground' ) return;
				// Highlight the active swatch in swatch panel.
				this.setActiveSwatch( data.tx, data.ty );
			});*/
	}

	//-------------------------
	// Configuration Method(s)
	//-------------------------
	// Reset the cloud session.
	// RETURNS: [void].
	reset() {
		// Set the list as unloaded.
		this.listLoaded = false;
		// Clear the populated list.
		this.fileViewer.populate( [] );
	}

	//-------------------------
	// Save to Cloud
	//-------------------------
	// Sends a save request (manual or auto).
	// RETURNS: [void]
	// * file      - JestFileLevel [object] being synced to server.
	//     file.stem  – [string] filename stem value
	//     file.data  – [string|object] full level payload (we'll stringify if object)
	// * type      – 'manual' | 'auto'
	// * meta      – parsed CLOUD block from file (may contain cloud_id, version)
	// * opts      – { force:boolean=false } to overwrite when server says newer
	async save( file, type='manual', opts={} ) {
		// Convert payload to string for storage
		const json = typeof file.data==='string' ? file.data : JSON.stringify(file.data);

		// Extract advisory info (cloud_id + version) from the file’s CLOUD block
		const meta             = file?.context.meta || {};
		const cloud_id         = meta?.cloud_id ? Number(meta.cloud_id) : null;
		const if_match_version = meta?.version!==undefined ? Number(meta.version) : null;

		// Generate a payload to send to the server.
		const payload	= {
			level_name       : file.stem,
			save_type        : type,
			data             : json,
			cloud_id         : cloud_id,
			if_match_version : if_match_version,
			force            : !!opts.force
			};

		// Transmit the API call.
		const url     = `${this.client.config.root}php/api/levels/save.php`;
		const inquiry = new Inquiry( url, 'cloud-save', 'POST', 'cloud', 'json', payload, 'json' );
		const result  = await this.client.transmitter.sendInquiry( inquiry );
		console.log( result );

		//-------------------------
		// Handle Server Response
		//-------------------------
		// Check if result was successful.
		if ( result?.parsed?.code===200 ) {
			// Retrieve parsed data saves & emit the save event.
			const data = result.parsed?.data || null;
			// IMPORTANT: update in-file CLOUD block with returned {id, version}
			this.lastSavedId = result.parsed?.data?.id || null;
			this.emit( 'save', null, file, data );
		}
		// Conflict handling (409): name_in_use, version_mismatch, etc.
		else if ( result?.parsed?.code===409 ) {
			// Retrieve parsed data & emit the conflict event.
			const info = result.parsed.data || {};
			await this.emitAsync( 'conflict', {}, file, info );
			// NOTE: Need to show a modal and decide:
			// - Overwrite: call save(...) again with opts.force=true
			// - Bind: set meta.cloud_id = info.existing.id then save(...)
			// - Fork: ask user for a new filename, then save(...) with no cloud_id in meta
			return null;
		}
		//else if ( result?.parsed?.code===404 ) {}	// record not found
		else if ( result?.parsed?.code===401 ) {   // not logged in
			// Check if user is logged in.
			if ( !this.client.login.isLoggedIn() ) { // check for session
				this.client.login.emit(
					'loginRequired', null,
					'synch data to the cloud'
					);
				// If the user is not logged in, prompt login screen.
				if ( this.client.login.logged!==true )
					this.client.login.show( "login" ); // show the login screen
			}
		}
		else { // fail
			console.warn( '[JestCloud]: Save failed', result );
			// Emit an event with the supplied error.
			this.emit( 'error', 'save', result );
		}
	}

	//-------------------------
	// Save Overwrite (Conflict Resolver)
	//-------------------------
	// Force-overwrites the server version when user confirms.
	// RETURNS: [Promise<object|null>] same as save()
	// * file      - JestFileLevel [object] being synced to server.
	//     file.stem  – [string] filename stem value
	//     file.data  – [string|object] full level payload (we'll stringify if object)
	// * meta      – { cloud_id, version } from your CLOUD block
	async saveOverwrite( file ) {
		return this.save( file, 'manual', { force:true } );
	}

	//-------------------------
	// Save Bind To Existing (Conflict Resolver)
	//-------------------------
	// Binds to an existing row by id/version, then saves normally.
	// RETURNS: [Promise<object|null>]
	// * file      - JestFileLevel [object] being synced to server.
	//     file.stem  – [string] filename stem value
	//     file.data  – [string|object] full level payload (we'll stringify if object)
	// * existing  – { id, version } returned by server on 'name_in_use'
	async saveBindToExisting( file, existing ) {
		// Update the level's meta data.
		file.context.meta.cloud_id	= Number( existing.id );
		file.context.meta.version	= Number( existing.version );
		// Attempt to save the meta & file.
		return this.save( file, 'manual', { force:false } );
	}

	//-------------------------
	// Fork Save As (Conflict Resolver)
	//-------------------------
	// Creates a brand-new cloud row by clearing id/version, using a new filename.
	// RETURNS: [Promise<object|null>]
	// * file      - JestFileLevel [object] being synced to server.
	//     file.stem  – [string] filename stem value
	//     file.data  – [string|object] full level payload (we'll stringify if object)
	// * meta     – parsed CLOUD meta (id/version will be ignored for fork)
	async forkSaveAs( file ) {
		delete file.context.meta.cloud_id;
		delete file.context.meta.version;
		return this.save( file, 'manual', { force:false } );
	}

	//-------------------------
	// List Cloud Saves
	//-------------------------
	// Loads all cloud saves for the current user.
	// RETURNS: [void].
	async list() {
		//-------------------------
		// Check if User Logged In
		//-------------------------
		// Require a valid login session before attempting to pull a list.
		if ( !this.client.login.isLoggedIn() ) // check for session
			return; // cannot list cloud items without session

		//-------------------------
		// Send Server Inquiry
		//-------------------------
		// Build the API URL to call.
		const url     = `${this.client.config.root}php/api/levels/list.php`;
		// Create an inquiry [object] using the payload data to transmit.
		const inquiry = new Inquiry( url, 'cloud-list', 'GET', 'cloud', 'form', null, 'json' );
		// Seek response from server using the request.
		const result  = await this.client.transmitter.sendInquiry( inquiry );
		console.log( result );

		//-------------------------
		// Handle Server Response
		//-------------------------
		// Check if result was successful.
		if ( result?.parsed?.code===200 ) {
			// Retrieve parsed data saves & emit the list event.
			this.saves = result.parsed.data.saves || [];
			this.emit( 'list', null, this.saves );
		}
		else { // fail
			console.warn( '[JestCloud]: List failed', result );
			// Emit an event with the supplied error.
			this.emit( 'error', 'list', result );
		}
	}

	//-------------------------
	// Load Cloud Save
	//-------------------------
	// Loads a specific save by ID.
	// RETURNS: [void]
	// * id		- [int] Save entry ID
	async load( id ) {
		if ( !id || typeof id!=='number' ) return;
		// Build the API URL to call.
		const url     = `${this.client.config.root}php/api/levels/load.php?id=${id}`;
		// Create an inquiry [object] using the payload data to transmit.
		const inquiry = new Inquiry( url, 'cloud-load', 'GET', 'cloud', 'form', null, 'json' );
		// Seek response from server using the request.
		const result  = await this.client.transmitter.sendInquiry( inquiry );
		console.log( result );

		//-------------------------
		// Handle Server Response
		//-------------------------
		// Check if result was successful.
		if ( result?.parsed?.code===200 ) {
			// Retrieve parsed data saves & emit the load event.
			this.lastLoaded = result.parsed.data || null;
			this.emit( 'load', null, this.lastLoaded );
		}
		else { // fail
			console.warn( '[JestCloud]: Load failed', result );
			// Emit an event with the supplied error.
			this.emit( 'error', 'load', result );
		}
	}

	//-------------------------
	// Delete Save
	//-------------------------
	// Deletes a save by its ID.
	// RETURNS: [void]
	// * id		- [int] Save entry ID
	async delete( id ) {
		if ( !id || typeof id!=='number' ) return;
		// Build the API URL to call.
		const url     = `${this.client.config.root}php/api/levels/delete.php`;
		// Create an inquiry [object] using the payload data to transmit.
		const inquiry = new Inquiry( url, 'cloud-delete', 'POST', 'cloud', 'form', { id }, 'json' );
		// Seek response from server using the request.
		const result  = await this.client.transmitter.sendInquiry( inquiry );
		console.log( result );

		//-------------------------
		// Handle Server Response
		//-------------------------
		// Check if result was successful.
		if ( result?.parsed?.code===200 ) {
			this.emit( 'delete', null, id );
		}
		else { // fail
			console.warn( '[JestCloud]: Delete failed', result );
			// Emit an event with the supplied error.
			this.emit( 'error', 'delete', result );
		}
	}

	//-------------------------
	// Initialize Conflict Modal
	//-------------------------
	// Builds a modal with a dynamic body and dynamic buttons.
	// RETURNS: [void]
	initModalConflict() {
		// Create a new modal for user conflict resolution.
		const modal	= new JestModal( this.client );
		this.modals.conflict	= modal;				// keep ref
		modal.build( 'modal-cloud-conflict' );			// build the modal
		modal.setTitle( 'Cloud Save Conflict' );		// static title
		modal.setText( '' );							// body set per show

		// NOTE: We will (re)build buttons per showConflict() call.
		// Add modal to the DOM & close it.
		document.body.appendChild( modal.panel.el );	// attach to DOM
		modal.close(); // auto-close modal on load by default
	}

	//-------------------------
	// Initialize Rename Modal (for Fork)
	//-------------------------
	// Simple OK/Cancel prompt that returns a new filename.
	// RETURNS: [void]
	initModalRename() {
		// Create a new modal for user file rename resolution.
		const modal	= new JestModal( this.client );
		this.modals.rename	= modal;					// keep ref
		modal.build( 'modal-cloud-rename' );			// build the modal
		modal.setTitle( 'Choose New Name' );			// static title
		modal.setText( 'Enter a new filename for your fork.' );

		// Create the input once; we’ll read its value on OK.
		this.rename.input	=
			modal.addTextfield( 'newname', null, '', 'New filename', 'New filename' );
		this.rename.input.showCaption();
		this.rename.input.panel?.reorderChild?.( this.rename.input.caption, -1 );

		// Add to DOM and close.
		document.body.appendChild( modal.panel.el );
		modal.close(); // auto-close modal on load by default
	}

	//-------------------------
	// Modal Method(s)
	//-------------------------
	// Opens the Conflict modal and resolves to:
	// 	'overwrite' | 'bind' | 'fork' | null (cancel)
	// RETURNS: [Promise<string|null>]
	// * info	– [object] { reason, server_version?, client_version?, existing? }
	// * ctx	– [object] { filename:string, canBind:bool=true }
	async showConflict( info, ctx={} ) {
		// Build a one-shot Promise that resolves from the button handlers.
		return new Promise(
			( resolve ) => {
				const { reason, server_version, client_version, existing } = info || {};
				const { filename, canBind=true } = ctx;
				const modal = this.modals.conflict;

				//--------------------------------
				// Prepare dynamic body text
				//--------------------------------
				let body = '';
				switch ( reason ) {
					case 'version_mismatch':
						body =
							`Cloud version is newer than your file.\n\n`+
							`Server version: v${server_version}\n`+
							`Your version  : v${client_version}\n\n`+
							`Choose: Overwrite the cloud with your local file, or Fork to a new cloud file.`;
						break;
					case 'name_in_use':
						body =
							`A cloud file named "<b>${filename}</b>" already exists.\n\n`+
							`Cloud ID: <b>${existing?.id}</b> &nbsp; Version: <b>${existing?.version}</b>\n\n`+
							`Choose: <b>Bind</b> to that file (continue saving there) or <b>Fork</b> to a new name.`;
						break;
					case 'missing_version':
					default:
						body =
							`Your file is missing a version tag, or the server expects a new record.\n\n`+
							`Choose: Fork to create a new cloud file.`;
						break;
				}
				modal.setText( body.replace(/\n/g,'<br>') );

				//--------------------------------
				// Rebuild buttons per invocation
				//--------------------------------
				// If your JestModal lacks a clearButtons(), remove & rebuild the footer node manually.
				if ( typeof modal.clearButtons==='function' )
					modal.clearButtons();

				// Cancel → resolve(null)
				modal.addButton(
					'cancel', 'Cancel',
					() => {
						modal.close(); // close the modal
						resolve( null );
					});

				// Specific options by reason:
				if ( reason==='version_mismatch' ) {
					// Create an "Overwrite" button (to overwrite sync record).
					modal.addButton(
						'overwrite', 'Overwrite',
						() => {
							modal.close();
							resolve( 'overwrite' );
						});
					// Create a "Fork" button (to fork a new sync record).
					modal.addButton(
						'fork', 'Fork',
						() => {
							modal.close();
							resolve( 'fork' );
						});
				}
				// Filename exists in database already.
				else if ( reason==='name_in_use' ) {
					if ( canBind ) {
						// Create a "Bind" button (to bind synced record to file).
						modal.addButton(
							'bind', 'Bind',
							()=>{
								modal.close();
								resolve( 'bind' );
							});
					}
					// Create a "Fork" button (to fork a new sync record).
					modal.addButton(
						'fork', 'Fork',
						() => {
							modal.close();
							resolve( 'fork' );
						});
				}
				else {
					// missing_version or unknown → only offer Fork + Cancel
					modal.addButton(
						'fork', 'Fork',
						() => {
							modal.close();
							resolve( 'fork' );
						});
				}

				// Finally open the modal.
				modal.open(); // open the modal
			});
	}

	// Opens the rename modal and resolves with the new name or null if cancelled.
	// RETURNS: [Promise<string|null>]
	// * currentName	- [string] Value of file's current filename stem.
	async promptRename( currentName ) {
		return new Promise(
			( resolve ) => {
				// Access the file rename modal.
				const modal	= this.modals.rename;

				// Reset + preset sensible default (append " (copy)")
				modal.resetInputs?.();
				const def	= currentName?.trim() ? `${currentName} (copy)` : 'untitled (copy)';
				this.rename.input.setValue( def ); // set suggested filename

				// Rebuild buttons for this invocation (OK → resolve name, Cancel → resolve null)
				if ( typeof modal.clearButtons==='function' )
					modal.clearButtons(); // clear all buttons (to add new ones)

				// Create an "OK" button (to set name).
				modal.addButton(
					'ok', 'OK',
					() => {
						// Get user's supplied new file name.
						const newName = (this.rename.input.getValue() || '').trim();
						modal.close();		// close the modal
						resolve( newName || null ); // pass new filename through resolve
					});

				// Create a "Cancel" button to cancel sync.
				modal.addButton(
					'cancel', 'Cancel',
					() => {
						modal.close();		// close the modal
						resolve( null );	// resolve the promise
					});

				// Open modal
				modal.open(); // open the modal
			});
	}

	//-------------------------
	// List Loading
	//-------------------------
	// Fetch the cloud list once for the current logged-in session.
	// RETURNS: [Promise<void>] Resolves after the cloud list request finishes.
	async loadList() {
		//--------------------------------
		// Check If List's Loaded or Loading
		//--------------------------------
		// Do not request account data before authentication is available.
		if ( this.client.login.logged!==true ) return;
		// Reuse the active request if another login/startup path already began it.
		if ( this.listLoading ) return this.listLoading;
		// Skip a duplicate fetch after this session's list has loaded.
		if ( this.listLoaded ) return;

		//--------------------------------
		// Define List-Load Request Method
		//--------------------------------
		// Start the request and mark the list loaded after it completes.
		this.listLoading =
			(async () => {
				await this.list();
				this.listLoaded = true;
			})();

		//--------------------------------
		// Call to Load the List
		//--------------------------------
		// Clear the in-flight marker even if the request fails.
		try { await this.listLoading; }
		finally { this.listLoading = null; }
	};
}
