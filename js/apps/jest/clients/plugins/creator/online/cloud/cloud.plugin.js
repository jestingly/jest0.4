//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/online/cloud/cloud.plugin.js loaded' );

// Cloud handling plugin (for files).
(function( window ) {
	// Define the plugin [object]
	var type	= 'online';
	var subtype	= 'cloud';
	var plugin	= {
		//--------------------------------
		// Plugin Setup Function
		//--------------------------------
		init: async function( client ) {
			// --------------------------------
			// Cloud Hook(s)
			// --------------------------------
			// Register "synchronize" save event (with notification).
			client.cloud.register(
				'save', 'systemNotice',
				async () => {
					// Send user a simple notification.
					client.noticer.notify({
						text      : 'Data successfully synched to the cloud!',
						icon      : `${client.config.root}/images/icons/sm_plane.png`,
						duration  : 4000,
						//persistent: true,
						buttons   :
							[
							{ label: 'Ok', click: () => console.log('Ok pressed') }
							]
						//onExpire  : () => console.log('Notification expired')
						});
					// Play "air whoosh" sound effect to signal action.
					client.soundboard.playSound( 'jest_breeze', 'wav', 1.05 );
				});

			//--------------------------------
			// Create Cloud Viewer Menu
			//--------------------------------
			// Render the cloud file viewer UI interface.
			client.cloud.build(); // build file viewer
			// Create cloud viewer sidebar menu.
			client.sidebar.addDisableExclusion( 'cloud' ); // prevent forced collapse
			const cloudSection = client.sidebar.addSection( 'cloud', 'Cloud', null, {}, null );
			// Add cloud panel to the sidebar menu.
			const cloudMenu    = client.sidebar.getSection( 'cloud' );
			cloudMenu.addItem( 'viewer', client.cloud.panel );

			//--------------------------------
			// Wire Cloud List to Tab Change
			//--------------------------------
			// Create event for when tab is changed, to switch level.
			client.tabbarFile.register(
				'tabChange', 'refreshCloudList',
				( nextView, prevView, action ) => {
					// Select file browser list item by cloud id.
					if ( nextView!==null ) {
						const id = Number( nextView.file.context?.meta?.cloud_id );
						client.cloud.fileViewer.listView.selectItemByValue( 'id', id );
					}
				});

			//--------------------------------
			// Wire Cloud List to Sidebar Panel
			//--------------------------------
			// Register "synchronize" button event.
			client.cloud.toolbar.buttons.sync.register(
				'click', 'syncLevel',
				async () => {
					// Get the active application state and open level view.
					const state	= client.getState(); // get current program state
					const view	= state.levelView;   // get active level file

					// Sync is available only when a level file is active.
					if ( !view ) return; // disabled

					// Stop here and offer login when the user is not authenticated.
					const allowed =
						client.login.requireLogin({
							action      : 'sync this level',
							description : 'Your level will be saved to your cloud account.'
							});
					if ( !allowed ) return;

					// Save the active level through the existing cloud-save pathway.
					await client.cabinet.saveFile( view.file.skey, 'cloud' );
				});

			// Attach to cloud
			client.cloud.register(
				'list', 'viewer',
				( list ) => {
					// Repopulate (refresh) the list of files.
					client.cloud.fileViewer.populate( list );
					// Resize the menu to fit.
					client.sidebar.refit( 'cloud' );
				});

			// Set the default sort type of the cloud file list.
			client.cloud.fileViewer.listView.sortByColumn( 'level_name' ); // sort by filename

			// --------------------------------
			// Load Cloud List After Login
			// --------------------------------
			// Fetch the list whenever login succeeds after startup.
			client.login.register(
				'loggedIn', 'loadList',
				() => {
					// Attempt to auto-populate cloud list.
					client.cloud.loadList() // load list
				});

			// Clear the displayed account list when the user logs out.
			client.login.register(
				'loggedOut', 'clearCloudList',
				() => {
					// Reset the cloud list.
					client.cloud.reset(); // reset
				});

			// Fetch now when the user was already logged in before this plugin started.
			if ( client.login.isLoggedIn() )
				await client.cloud.loadList(); // trigger fetch

			//--------------------------------
			// File Open Event
			//--------------------------------
			// Attach cloud meta data to level [object].
			client.register(
				'loadFileData', 'loadCloudMeta',
				( file, { cloud } ) => {
					// Attach file's CLOUD meta to level [object]
					//console.log( file );
					//console.log( cloud );
					file?.context?.setCloudMeta?.( cloud );
				});

			//--------------------------------
			// When server confirms a save
			//--------------------------------
			// Register event for when a file is synced to the server.
			client.cloud.register(
				'save', null,
				// file: JestFileLevel [object]
				// data: { id, version, level }
				( file, data ) => {
					// Update the file's CLOUD block
					// with cloud data returned from server
					file.context.setCloudMeta({
						type      : 'manual',
						cloud_id  : Number( data.id ),
						version   : Number( data.version ),
						timestamp : new Date().toISOString()
						});
					//ui.toast( `Cloud saved: ${data.level} v${data.version}` );
				});

			//--------------------------------
			// On conflict, show modal and resolve (Overwrite / Bind / Fork)
			//--------------------------------
			client.cloud.register(
				'conflict', null,
				async ( file, info ) => {
					// Get the filename from the level.
					const filename	= file.stem;
					const choice	=
						await client.cloud.showConflict( info, { filename, canBind:true } );
					if ( !choice ) return; // cancelled

					// Overwrite a cloud record with existing level meta data.
					if ( choice==='overwrite' ) {
						await client.cloud.saveOverwrite( file );
						return; // finish
					}

					// Update local level file meta data with server record & sync.
					if ( choice==='bind' && info?.existing ) {
						// Bind id/version then save.
						await client.cloud.saveBindToExisting( file, info.existing );
						return; // finish
					}

					// Create a new cloud record with the level file & new meta data.
					if ( choice==='fork' ) {
						// Prompt the user for a new filename.
						const newName	= await client.cloud.promptRename( filename );
						if ( !newName ) return;		// cancel
						file.setStem( newName );	// update filename
						file.context.resetCloudBinding(); // reset level cloud meta data

						// Try re-syncing the level to the cloud.
						await client.cloud.save( file, 'manual', { force: false } );
						return; // finish
					}
				});

			//--------------------------------
			// Basic error pipe
			//--------------------------------
			client.cloud.register(
				'error', null,
				( op, result ) => {
					// filename/lines are here in *this* handler; example below:
					console.error(
						'[Cloud] Error',
						{ op, result, filename:'CloudController.js', lines:'1-120', chars:'1-0' }
					);
					//ui.alert( 'Cloud error. Check console.' );
				});
		},

		//--------------------------------
		// New Method(s) In Tiler Application
		//--------------------------------
		extend: function( Klass, proto ) { }
	};
	// register with JestCreator
	if ( window.JestCreator && typeof window.JestCreator.use==='function' )
		window.JestCreator.use( type, plugin );
	else console.error( 'online/cloud/cloud.plugin.js load error: JestCreator.use() not found' );
})( window );
