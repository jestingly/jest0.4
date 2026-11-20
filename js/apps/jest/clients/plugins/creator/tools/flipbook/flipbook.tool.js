//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/tools/flipbook/flipbook.tool.js loaded' );

//-------------------------
// JestToolFlipbook Class
//-------------------------
// This class frames an [object] that serves as a base usable tool.
class JestToolFlipbook extends JestTool {
	// UI handling properties
	stickerForm		= null;		// [JestForm] for controlling sticker(s).
	frameToolbar	= null;		// Navigator [JestToolbar] for frame buttons
	frameForm		= null;		// [JestForm] for navigating frame(s).
	layerToolbar	= null;		// Navigator [JestToolbar] for layer buttons
	layerForm		= null;		// [JestForm] for navigating layer(s).

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
	build( name='tool-flipbook', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		const defaultClasses	= [ 'tool-flipbook' ];
		super.build( name, defaultClasses.mergeUnique(classes) );

		// Tool is empty by default.
		this.jot( 'mode', 'empty' );	// tool is idle to start

		//--------------------------------
		// Create Data Form (to edit sticker)
		//--------------------------------
		// Calculate the full area + bleed.
		const config	= this.client.config;
		const halfJFS	= config.janiFullSpan / 2;

		//---------------------------------
		// Sticker Control(s) Form
		//---------------------------------
		// Create DOM Panel element [object].
		const stickerForm	= new JestForm( this.client );
		this.stickerForm	= stickerForm; // store form
		stickerForm.build( 'flipbook', ['tool-flipbook-sticker-form'] );

		// Create x coordinate control(s).
		const xRange = new JestInputNumericRange( this.client, 'x', null, 0, 'X' );
		xRange.build( 'input-x' );
		xRange.setMin( 0-halfJFS );	// set default minimum x coordinate
		xRange.setMax( halfJFS );	// set default maximum x coordinate
		xRange.setStep( 1 );		// set default step
		stickerForm.addField( 'x', xRange ); // add field to form
		xRange.showLabel();			// show the label

		// Create y coordinate control(s).
		const yRange = new JestInputNumericRange( this.client, 'y', null, 0, 'Y' );
		yRange.build( 'input-y' );
		yRange.setMin( 0-halfJFS );	// set default minimum y coordinate
		yRange.setMax( halfJFS );	// set default maximum y coordinate
		yRange.setStep( 1 );		// set default step
		stickerForm.addField( 'y', yRange ); // add field to form
		yRange.showLabel();			// show the label

		// Create z coordinate control(s).
		const zRange = new JestInputNumericRange( this.client, 'z', null, 0, 'Z' );
		zRange.build( 'input-z' );
		zRange.setMin( 0 );			// set default minimum z coordinate
		zRange.setMax( 0 );			// set default maximum z coordinate
		zRange.setStep( 1 );		// set default step
		stickerForm.addField( 'z', zRange ); // add field to form
		zRange.showLabel();			// show the label

		//--------------------------------
		// Create Frame Control(s)
		//--------------------------------
		// Create DOM Panel element [object].
		const frameForm		= new JestForm( this.client );
		this.frameForm		= frameForm; // store form
		frameForm.build( 'flipbook', ['tool-flipbook-frame-form'] );
		// Create the inner DOM element(s).
		frameForm.panel.addElements([
			{ name: 'buttons',  tag: 'div', classes: [ 'selector-buttons' ] }
			]); // add to panel

		// Create the toolbar.
		const frameToolbar	= new JestToolbar( this );
		this.frameToolbar	= frameToolbar; // set toolbar
		frameToolbar.build(); // build the toolbar
		frameForm.panel.refs.buttons.addPanel( 'toolbar', frameToolbar.panel );

		// Add frame buttons & actions.
		frameToolbar.createButton( { name: 'addFrameBefore', text: '+ Frame' } );
		frameToolbar.createButton( { name: 'addFrameAfter', text: 'Frame +' } );
		frameToolbar.buttons.addFrameBefore.register(
			'click', 'add-object', () => this.emit('btnAddFrame',null,0) );
		frameToolbar.buttons.addFrameAfter.register(
			'click', 'add-object', () => this.emit('btnAddFrame',null,1) );

		// Remove frame button & action.
		frameToolbar.createButton( { name: 'removeFrame', text: '- Frame' } );
		frameToolbar.buttons.removeFrame.register(
			'click', 'remove-object', () => this.emit('btnRemoveFrame') );

		// Create frames limit input slider.
		const frameRange = new JestInputRange( this.client, 'frame', null, 0, 'Frame' );
		frameRange.setMin( 0 );		// set default minimum frame
		frameRange.setMax( 0 );		// set default maximum frame
		frameRange.setStep( 1 );	// set default step
		frameRange.build( 'input-frames' );
		frameForm.addField( 'frameRange', frameRange ); // add field to form
		frameRange.showLabel();		// show the label

		//--------------------------------
		// Create Layer Control(s)
		//--------------------------------
		// Create DOM Panel element [object].
		const layerForm		= new JestForm( this.client );
		this.layerForm		= layerForm; // store form
		layerForm.build( 'flipbook', ['tool-flipbook-layer-form'] );
		// Create the inner DOM element(s).
		layerForm.panel.addElements([
			{ name: 'buttons',  tag: 'div', classes: [ 'selector-buttons' ] }
			]); // add to panel

		// Create the toolbar.
		const layerToolbar	= new JestToolbar( this );
		this.layerToolbar	= layerToolbar; // set toolbar
		layerToolbar.build(); // build the toolbar
		layerForm.panel.refs.buttons.addPanel( 'toolbar', layerToolbar.panel );

		// Add layer buttons & actions.
		layerToolbar.createButton( { name: 'addLayerBefore', text: '+ Layer' } );
		layerToolbar.createButton( { name: 'addLayerAfter', text: 'Layer +' } );
		layerToolbar.buttons.addLayerBefore.register(
			'click', 'add-object', () => this.emit('btnAddLayer',null,0) );
		layerToolbar.buttons.addLayerAfter.register(
			'click', 'add-object', () => this.emit('btnAddLayer',null,1) );

		// Remove layer button & action.
		layerToolbar.createButton( { name: 'removeLayer', text: '- Layer' } );
		layerToolbar.buttons.removeLayer.register(
			'click', 'remove-object', () => this.emit('btnRemoveLayer') );

		// Create layers limit input slider.
		const layerRange = new JestInputRange( this.client, 'layer', null, 0, 'Layer' );
		layerRange.setMin( 0 );		// set default minimum layer
		layerRange.setMax( 0 );		// set default maximum layer
		layerRange.setStep( 1 );	// set default step
		layerRange.build( 'input-layers' );
		layerForm.addField( 'layerRange', layerRange ); // add field to form
		layerRange.showLabel();		// show the label
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
			console.warn( `Flipbook cannot change target while enabled or active.` );
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
	// Enable the flipbook tool.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	enable() {
		// Check parent constructor.
		if ( !super.enable() ) return false;
		// Add event listener(s)
		this.reset(); // reset the tool
		this.jot( 'enabled', true ); // enable selectability
	}
	// Disable the flipbook tool.
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
	// Reset the flipbook tool.
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
		// Update the Flipbook

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
	// Remove flipbook listener(s).
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
