//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/ui/editor.plugin.js loaded' );

// Editor handling plugin (collapsible menu).
(function( window ) {
	// Define the plugin [object]
	var type	= 'ui';
	var subtype	= 'editor';
	var plugin	= {
		//--------------------------------
		// Plugin Setup Function
		//--------------------------------
		init: function( client ) {
			//---------------------------------
			// Create Editor Panel [object]
			//---------------------------------
			// Create editor panel to store the editing/playing area.
			client.editor	=
				client.panel.refs.interface.refs.center.createPanel({
					name:		'editor',
					id:			'jest-tiler-editor',
					classes:	[ 'editor' ]
					});
			//client.editor.resize( null, 100px );

			//---------------------------------
			// Add Gameboard Canvas [object]
			//---------------------------------
			// Create possible modes.
			//const modes			= [ 'draw', 'fill', 'erase', 'select' ];
			// Add canvas to editor.
			client.board	= new JestElement( client );
			client.board.build( 'div', 'board', ['board'] );
			// Add board to editor.
			client.editor.addPanel( 'board', client.board.panel );
			// Get workspace canvas to display imagery.
			const canvas	= client.gameboard.display.getCanvas( 'workspace' );
			// Disable right-click on canvas.
			canvas.el.addEventListener( 'contextmenu', e => e.preventDefault() );
			// Add gameboard world canvas to the editor panel.
			client.editor.refs.board.addPanel( 'gameboard', canvas );
		}
	};
	// register with JestCreator
	if ( window.JestCreator && typeof window.JestCreator.use==='function' )
		window.JestCreator.use( type, plugin );
	else console.error( 'ui/editor.plugin.js load error: JestCreator.use() not found' );
})( window );
