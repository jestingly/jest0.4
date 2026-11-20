//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/tools/animation/animation.plugin.js loaded' );

//-------------------------
// Options Plugin
//-------------------------
// Add options for handling animation loopabiltiy, etc.
(function( window ) {
	//--------------------------------
	// Plugin Metadata
	//--------------------------------
	const type		= 'tools';
	const subtype	= 'animation';

	//--------------------------------
	// Plugin Definition
	//--------------------------------
	const plugin = {
		//--------------------------------
		// Initialize Plugin
		//--------------------------------
		// Called once when plugin is registered.
		// * client - [object] reference to JestCreator
		init: function( client ) {
			//-------------------------
			// Create Control Panel
			//-------------------------
			// Generate a "form" inside the sidebar.
			const optsPanel		= new JestForm( client );			// create DOM Panel element [object].
			optsPanel.build( 'animation', ['tiler-animation'] );	// build the form

			// Create the "LOOP" option (as a checkbox).
			const inputLoop	= new JestInputCheckbox( client, 'loop', null, false, 'Loop' );
			inputLoop.build( `input-loop` );			// build field
			optsPanel.addField( 'loop', inputLoop );	// add field to form
			inputLoop.showLabel(); // show the label

			// Add the curator panel to the sidebar.
			client.sidebar.addDisableExclusion( 'animation' );		// prevent forced collapse
			client.sidebar.addSection( subtype, 'Animation', optsPanel.panel, {}, optsPanel );
			client.sidebar.refit( subtype ); // resize to fit contents

			//-------------------------
			// Handle Event(s)
			//-------------------------
			// Register an event when "LOOP" is toggled.
			inputLoop.register(
				'change', 'toggleLoop',
				( enable ) => {
					//--------------------------------
					// Check Program Availability
					//--------------------------------
					// Gatekeep with file status check.
					let s; if ( !(s=client.getFileStatus(null,true)) ) return false; // abort

					//--------------------------------
					// Toggle Animation Loop
					//--------------------------------
					// Set whether animation is looping or not.
					if ( enable===true )
						s.ani.loopOn();		// animation is looping
					else s.ani.loopOff();	// animation is not looping

					//--------------------------------
					// Finish & Emit Event(s)
					//--------------------------------
					// Emit loop on/off event.
					client.emit( 'animation:loop', null, enable );
				});
			let toggle		= false; // sounds off by default
			inputLoop.setChecked( toggle );

			//---------------------------------
			// Refresh Animation Options on Tab Change
			//---------------------------------
			// Create event for when tab is changed, to switch file.
			client.tabbarFile.register(
				'tabChange', 'animationRefresh',
				( view ) => {
					//---------------------------------
					// Refresh Animation Setting(s) Form
					//---------------------------------
					// Reload options form to reflect animation setting(s).
					client.refreshAnimationControls();
				});

			//-----------------------------
			// Jani File Loading Event(s)
			//-----------------------------
			// Attach an open-file event listener to handle data callback.
			/*client.register(
				'openedFile', 'loadAnimation',
				async () => {
					//--------------------------------
					// Check Program Availability
					//--------------------------------
					// Gatekeep with file status check.
					let s; if ( !(s=client.getFileStatus(null,true)) ) return false; // abort

					//--------------------------------
					// Add Animation to Animator Lineup
					//--------------------------------
					client.animator.add( s.ani );	// add animation to animator
				});*/
		},

		//--------------------------------
		// New Method(s) In Creator Application
		//--------------------------------
		extend: function( Klass, proto ) {
			// Update the settings control(s).
			// RETURNS: [void].
			proto.refreshAnimationControls = function() {
				//--------------------------------
				// Check Program Availability
				//--------------------------------
				// Gatekeep with file status check.
				let s; if ( !(s=this.getFileStatus(null,true)) ) return false; // abort

				//--------------------------------
				// Access Options Form Data
				//--------------------------------
				// Access animation options form & fields.
				const formOpts = this.sidebar.getSection('animation')?.getContents();
				if ( !formOpts ) return; // no form found
				const fieldLoop = formOpts.getField( 'loop' );
				if ( !fieldLoop ) return; // no size field found
				// Check / uncheck box to match animation loop setting.
				fieldLoop.setChecked( s.ani.loop );
			}
		}
	};

	//--------------------------------
	// Register With Creator Application
	//--------------------------------
	if ( window.JestAnimator && typeof window.JestAnimator.use==='function' )
		window.JestAnimator.use( type, plugin );
	else console.error( 'options.plugin.js load error: JestAnimator.use() not found' );
})( window );
