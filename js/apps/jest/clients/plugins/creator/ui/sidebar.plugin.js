//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/ui/sidebar.plugin.js loaded' );

// Sidebar handling plugin (collapsible menu).
(function( window ) {
	// Define the plugin [object]
	var type	= 'ui';
	var subtype	= 'sidebar';
	var plugin	= {
		//--------------------------------
		// Plugin Setup Function
		//--------------------------------
		init: function( client ) {
			//---------------------------------
			// Create sidebar board [object]
			//---------------------------------
			// Create possible modes.
			//const modes	= [ 'draw', 'fill', 'erase', 'select' ];
			client.sidebar	= new JestCollapsibleMenu( client );
			client.sidebar.build();
			// Add sidebar to editor.
			client.panel.refs.interface.refs.right.addPanel( 'sidebar', client.sidebar.panel );
			client.emit( 'postbuild', null ); //emit post-build hook
		}
	};
	// register with JestCreator
	if ( window.JestCreator && typeof window.JestCreator.use==='function' )
		window.JestCreator.use( type, plugin );
	else console.error( 'ui/sidebar.plugin.js load error: JestCreator.use() not found' );
})( window );
