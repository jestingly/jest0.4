//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/ui/tabbarFile.plugin.js loaded' );

// Tabbar handling plugin (for files).
(function( window ) {
	// Define the plugin [object]
	var type	= 'ui';
	var subtype	= 'tabbarFile';
	var plugin	= {
		//--------------------------------
		// Plugin Setup Function
		//--------------------------------
		init: async function( client ) {
			//---------------------------------
			// Create File Tabbar [object]
			//---------------------------------
			// Create the tabbar.
			const tabbarFile	= new JestTabbar( client );
			client.tabbarFile	= tabbarFile; // set tabbar
			tabbarFile.build();

			// Add tabbar to client interface.
			client.panel.refs.interface.refs.center.addPanel( 'tabbar', tabbarFile.panel );

			// Create a tabbar (+) button for a "new file".
			const action	= { name: 'new', text: null };
			const button	= client.tabbarFile.createButton( action );
			button.clicker.addClass( 'new-button' );
			button.register( 'click', null, e=>client.fileMenuAction('new') )
			// Add (+) New File Button Inside Tabbar
			button.clicker.addElements([
				{
					name       : 'new',
					tag        : 'svg',
					classes    : [ 'ico-new' ],
					attributes : {
						xmlns        : "http://www.w3.org/2000/svg",
						viewBox      : "0 0 1200 1200",
						width        : "1200pt",
						height       : "1200pt",
						version      : '1.1'
						},
					elements   :
						[
							{
								name       : 'path',
								tag        : 'path',
								attributes :
									{
									d : 'm552 1008h60v-360h384v-60h-384v-384h-60v384h-360v60h360z'
									}
							}
						]
				}]);
		},

		//--------------------------------
		// New Method(s) In Creator Application
		//--------------------------------
		extend: function( Klass, proto ) { }
	};
	// register with JestCreator
	if ( window.JestCreator && typeof window.JestCreator.use==='function' )
		window.JestCreator.use( type, plugin );
	else console.error( 'ui/tabbar.plugin.js load error: JestCreator.use() not found' );
})( window );
