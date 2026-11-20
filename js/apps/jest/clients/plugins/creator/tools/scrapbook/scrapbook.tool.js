//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/tools/scrapbook/scrapbook.tool.js loaded' );

//-------------------------
// JestToolScrapbook Class
//-------------------------
// This class frames an [object] that serves as a base usable tool.
class JestToolScrapbook extends JestTool {
	// UI handling properties
	toolbar			= null;				// [object] JestToolbar for buttons
	imageSelect		= null;				// JestInputFileSelect [object] for sprite image(s).
	frameRange		= null;				// JestInputRange [object] for navigating frame(s).
	layerRange		= null;				// JestInputRange [object] for navigating layer(s).

	//---------------------------------
	// Constructor
	//---------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client		- [object] Application client that this piece belongs to.
	// * name		- [string] Value of tool name.
	constructor( client, name ) {
		super( client, name ); // call parent constructor
	}

	//-------------------------
	// Initialization
	//-------------------------
	// Build the element [object].
	// RETURNS: [void].
	// * name		- unique [string] value of component name in the system.
	// * classes	- [array] of classes to add to panel element.
	build( name='tool-scrapbook', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		const defaultClasses	= [ 'tool-scrapbook' ];
		super.build( name, defaultClasses.mergeUnique(classes) );

		// Tool is empty by default.
		this.jot( 'mode', 'empty' );	// tool is idle to start

		//--------------------------------
		// Create Swatch Container
		//--------------------------------
		/*// Create the inner DOM element(s).
		this.panel.addElements([
			{ name: 'buttons',  tag: 'div', classes: [ 'selector-buttons' ] }
			]); // add to form*/

		//---------------------------------
		// Create Button Toolbar [object]
		//---------------------------------
		/*// Create the toolbar.
		const toolbar	= new JestToolbar( this );
		this.toolbar	= toolbar; // set toolbar
		toolbar.build(); // build the toolbar
		// Add toolbar to client interface.
		this.panel.refs.buttons.addPanel( 'toolbar', toolbar.panel );*/

		//---------------------------------
		// Create Image File Select Input [object]
		//---------------------------------
		// Add file open file-select input [object] to filemenu.
		const filetypes		= this.client.imager.filetypes.join( ', .' );
		const imageSelect	= new JestInputFileSelect( this.client, `.${filetypes}` );
		this.imageSelect	= imageSelect;
		imageSelect.build( 'imageSelect', ['open-image-select'] );
		// Add image file-select input field to buttons toolbar.
		//this.panel.refs.buttons.addPanel( 'imageSelect', imageSelect.panel );

		//--------------------------------
		// Create Button(s)
		//--------------------------------
		/*// Create an "import sprite" button.
		this.toolbar.createButton( { name: 'sprite', text: 'New Sprite' } );
		// Register click event.
		this.toolbar.buttons.sprite.register(
			'click', 'importSprite', ()=>this.emit('import') );*/

		//--------------------------------
		// Create Frame Control(s)
		//--------------------------------
		// Create frames limit input slider.
		const frameRange = new JestInputRange( this.client, 'frame', null, 1, 'Frame' );
		frameRange.setMin( 0 );		// set default minimum frame
		frameRange.setMax( 0 );		// set default maximum frame
		frameRange.setStep( 1 );	// set default frame
		frameRange.build( 'input-frames' );
		this.frameRange	= frameRange; // store ref

		//--------------------------------
		// Create Layer Control(s)
		//--------------------------------
		// Create layers limit input slider.
		const layerRange = new JestInputRange( this.client, 'layer', null, 1, 'Layer' );
		layerRange.setMin( 0 );		// set default minimum layer
		layerRange.setMax( 0 );		// set default maximum layer
		layerRange.setStep( 1 );	// set default layer
		layerRange.build( 'input-layers' );
		this.layerRange	= layerRange; // store ref
	}

	//---------------------------------
	// Set File
	//---------------------------------
	// Set the canvas [object] to make selectable.
	// RETURNS: [void]
	// * target		- [ElementCanvas] The target to allow selectability on.
	/*setTarget( target ) {
		// If no selection is made, return null.
		const enabled	= this.skim( 'enabled' );
		const mode		= this.skim( 'mode' );
		if ( enabled || mode!=='empty' ) {
			console.warn( `Scrapbook cannot change target while enabled or active.` );
		}
		// Validate argument(s)
		if ( !(target instanceof ElementCanvas) ) {
			console.warn( `Argument "canvas" must be of type ElementCanvas.` );
			return false; // failed
		}
		// Continue to set the canvas.
		this.target	= target;
	}*/

	//---------------------------------
	// Enable & Disable
	//---------------------------------
	// Enable the scrapbook tool.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	enable() {
		// Check parent constructor.
		if ( !super.enable() ) return false;
		// Add event listener(s)
		this.reset(); // reset the tool
		this.jot( 'enabled', true ); // enable selectability
	}
	// Disable the scrapbook tool.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	disable() {
		// Check parent constructor.
		if ( !super.disable() ) return false;
		// Reset the selection.
		this.reset(); // deselect if selected
		// Remove event listener(s)
		this.removeTargetListeners();	// remove target events
		this.removeGlobalListeners();	// remove window events
		// Mark as disabled.
		this.jot( 'enabled', false );	// disable selectability
	}

	//-------------------------
	// Resetting Methods
	//-------------------------
	// Reset the scrapbook tool.
	// RETURNS: [void].
	// * drop	- [bool] Whether to drop the selection (true, else false).
	reset( /*drop=true*/ ) {
		//-------------------------
		// Clear Selection
		//-------------------------
		//this.deselect( drop ); // deselect if selected
		//-------------------------
		// Reset Data
		//-------------------------
		// Update the Scrapbook

		//-------------------------
		// Remove Event Listener(s)
		//-------------------------
		// Tear down all listener(s).
		this.removeTargetListeners();	// remove target events
		this.removeGlobalListeners();	// remove window events
		//-------------------------
		// Add Event Listener(s)
		//-------------------------
		// Create the mouse click event for selection start.
		//this.target.register( 'mousedown', 'selectStart', e=>this.checkClick(e), 'dom' );
		//-------------------------
		// Emit Reset Event
		//-------------------------
		// Trigger reset event.
		this.emit( 'reset', null, this );
	}

	//-------------------------
	// Remove Listeners
	//-------------------------
	// Remove scrapbook listener(s).
	removeTargetListeners() {
		/*// Remove selection listener(s).
		this.target.unregister( 'mousedown', 'selectStart' );
		// Remove mouse move listener(s).
		this.target.unregister( 'mousemove', 'selecting' );
		this.target.unregister( 'mousemove', 'dragging' );*/
	}
	// Remove window listener(s).
	removeGlobalListeners() {
		/*// Remove window event(s) for selecting release.
		this.target.unregister( jsos.mouseUps, 'selected' );
		// Remove window  event(s) for dragging release.
		this.target.unregister( jsos.mouseUps, 'dragged' );*/
	}
}
