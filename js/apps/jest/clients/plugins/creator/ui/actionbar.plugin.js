//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/ui/actionbar.plugin.js loaded' );

// Actionbar handling plugin (collapsible menu).
(function( window ) {
	// Define the plugin [object]
	var type	= 'ui';
	var subtype	= 'actionbar';
	var plugin	= {
		//--------------------------------
		// Plugin Setup Function
		//--------------------------------
		init: function( client ) {
			// --------------------------------
			// Create Actionbar Toolbar [object]
			// --------------------------------
			// Create the actionbar toolbar.
			const actionbar  = new JestToolbar( client );
			client.actionbar = actionbar; // set actionbar
			actionbar.build( 'actionbar', ['actionbar'] );
			// Add actionbar toolbar to client interface.
			client.panel.refs.interface.refs.center.addPanel( 'actionbar', actionbar.panel );
			// Add event listener callback(s).
			actionbar.register(
				'btnClick', 'interact',
				( e, action, button ) => {
					// Switch tools.
					//client.toolbox.setTool( action.name );
				});
		}
	};
	// register with JestCreator
	if ( window.JestCreator && typeof window.JestCreator.use==='function' )
		window.JestCreator.use( type, plugin );
	else console.error( 'ui/actionbar.plugin.js load error: JestCreator.use() not found' );
})( window );
