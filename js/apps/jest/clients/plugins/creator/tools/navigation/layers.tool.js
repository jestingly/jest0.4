//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/tools/navigation/layers.tool.js loaded' );

//-------------------------
// JestToolLayers Class
//-------------------------
// This class frames an [object] that serves as a base usable tool.
class JestToolLayers extends JestTool {
	// UI handling properties
	toolbar     = null;         // [object] JestToolbar for buttons
	imageSelect = null;         // [JestInputFileSelect] object for sprite image(s).
	list        = null;         // [JestListLayers] object of layer items display.
	form        = null;         // [JestForm] object for editing layer name.
	// Canvas target
	target      = null;         // [ElementCanvas] workspace canvas

	// --------------------------------
	// Constructor
	// --------------------------------
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
	build( name='tool-layers', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		const defaultClasses	= [ 'tool-layers' ];
		super.build( name, defaultClasses.mergeUnique(classes) );
		// Add panel elements.
		this.panel.addElements([
			{ name: 'selectwrap', tag: 'div', classes: [ 'selector-wrap' ] },
			{ name: 'detail',     tag: 'div', classes: [ 'selector-detail' ] },
			{ name: 'buttons',    tag: 'div', classes: [ 'selector-buttons' ] }
			]);

		// Tool is empty by default.
		this.jot( 'mode', 'empty' );	// tool is idle to start

		// --------------------------------
		// Create Image File Select Input [object]
		// --------------------------------
		// Add file open file-select input [object] to filemenu.
		const filetypes    = this.client.imager.filetypes.join( ', .' );

		//--------------------------------
		// Create Layer List
		//--------------------------------
		// The list is a view of the level's real layer objects.
		this.list          = new JestListLayers( this.client );
		this.list.build( 'level-layers' );
		this.list.sortMode = 'none'; // rendering order, never alphabetical
		this.list.setDragEnabled( true );
		// Permit only one active layer in the list at a time.
		this.list.setMode( 'single' );

		// Add layers to client interface.
		this.panel.refs.detail.addPanel( 'layers', this.list.panel );

		//--------------------------------
		// Create Layer Editing Form
		//--------------------------------
		// Only renaming requires the Apply button.
		this.form          = new JestForm( this.client );
		this.form.build( 'layer-form' );
		const nameInput    = new JestInputText( this.client, 'name', null, null, 'Name' );
		nameInput.build( 'input-layer-name' );
		this.form.addField( 'name', nameInput );
		
		// Add form to client interface.
		this.panel.refs.detail.addPanel( 'editor', this.form.panel );

		//--------------------------------
		// Create Layer Action Toolbar
		//--------------------------------
		// Create a dedicated toolbar for managing layers.
		// This keeps action buttons separate from the editing form
		// and allows them to inherit existing toolbar styling.
		this.toolbar       = new JestToolbar( this.client );
		// Build the toolbar using its standard JEST classes.
		this.toolbar.build( 'layers-toolbar' );
		// Add toolbar to client interface.
		this.panel.refs.buttons.addPanel( 'toolbar', this.toolbar.panel );
	}

	// --------------------------------
	// Enable & Disable
	// --------------------------------
	// Enable the layers tool.
	// RETURNS: [boolean].
	enable() {
		// Check parent constructor.
		if ( !super.enable() ) return false;
		// Add event listener(s)
		this.jot( 'enabled', true ); // enable layers
		this.reset(); // reset the tool
	}

	// Disable the layers tool.
	// RETURNS: [boolean].
	disable() {
		// Check parent constructor.
		if ( !super.disable() ) return false;
		// Cancel active interaction.
		this.reset();
		// Remove mouse listeners.
		this.removeTargetListeners();
		this.removeGlobalListeners();
		this.jot( 'enabled', false );
		this.updateCursor(); // update cursor
		return true;
	}

	//-------------------------
	// Resetting Methods
	//-------------------------
	// Reset tool interaction and selection.
	// RETURNS: [void].
	reset() {
		//--------------------------------
		// Remove Event Listeners
		//--------------------------------
		this.removeTargetListeners();
		this.removeGlobalListeners();
		//--------------------------------
		// Emit Reset Event
		//--------------------------------
		this.emit( 'reset', null, this );
	}

	//-------------------------
	// Remove Listeners
	//-------------------------
	// Remove entity target listener(s).
	removeTargetListeners() {
		if ( !this.target ) return;
		this.target.unregister( 'mousedown', 'entitySelectStart' );
		this.target.unregister( 'mousemove', 'entityDragging' );
		this.target.unregister( 'mousemove', 'entityHover' );
	}
	// Remove window listener(s).
	removeGlobalListeners() {
		if ( !this.target ) return;
		this.target.unregister( jsos.mouseUps, 'entityDragged' );
	}
}
