//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/ui/JestCanvas.js loaded' );

//-------------------------
// JestCanvas Class
//-------------------------
// A canvas board for drawing/editing in a Jest JUI.
class JestCanvas extends JestElement {
	// Object properties
	//modes			= null;				// [array] of possible modes.

	//---------------------------------
	// Constructor
	//---------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client		- client [object] that this piece belongs to.
	constructor( client ) {
		super( client );
	}

	//---------------------------------
	// Initialization
	//---------------------------------
	// Build the element [object].
	// RETURNS: [void].
	// * name		- unique [string] value of component name in the system.
	// * classes	- [array] of classes to add to panel element.
	build( name='canvas', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		super.build( "div", name, ['canvas'].mergeUnique(classes) );
		// Add panel to client interface.
		/*this.client.panel.addPanel( 'toolbar', this.panel );
		// Iterate modes to generate button for each
		this.modes.forEach(
			mode => {
				this.panel.addElements([{
					name:	mode,
					tag:	'button',
					text:	mode,
					callbacks:
						[
							{
								command:	'click',
								id:			'btnLaunch',
								type:		'dom',
								callback:
									function () {
										// Launch the app
										//console.log( this );
										//this.editor.jot( mode );
										//this._highlight( btn );
									}
							}
						]
					}]);
			});*/
	}

	/*_highlight ( activeBtn ) {
		this.element.querySelectorAll('button').forEach(
			btn => {
				btn.style.background = btn===activeBtn ? '#555' : '#333';
			});
	}*/
}
