//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/ui/JestListItem.js loaded' );

//-----------------------------
// JestListItem Class
//-----------------------------
// An individual item in the JestList.
// Extends: JestElement
class JestListItem extends JestElement {
	// Object Properties
	label			= '';			// [string] display text
	enabled			= true;			// [bool] whether item is enabled
	timestamp		= Date.now();	// [int] creation time
	data			= null;			// [any] optional payload
	draggable		= false;		// [bool] wheter item is draggable
	children		= null;			// [array] list of all children
	// Other list properties
	folded			= false;		// [bool]
	isGroup			= false;		// [bool]

	//--------------------------------
	// Constructor
	//--------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client		- client [object] that this piece belongs to.
	// * label		- [string] text label
	// * data		– [any] optional payload
	constructor( client, label='', data=null ) {
		super( client ); // call parent constructor
		// Set properties.
		this.label		= label;
		this.data		= data;
		this.draggable	= data?.draggable ?? false;
	}

	//--------------------------------
	// Initialization
	// --------------------------------
	// Build the element [object].
	// RETURNS: [void].
	// * name		- unique [string] value of component name in the system.
	// * classes	- [array] of classes to add to panel element.
	build( name='jest-item', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		super.build( "div", name, ['jest-list-item'].mergeUnique(classes) );

		// --------------------------------
		// Begin Creating List Item
		// --------------------------------
		// Create item as Panel [object].
		//const icon	= new Panel({ tag: 'img', classes: ['item-icon'], attributes: { src: this.data?.iconURL ?? 'default.png' } });
		//this.panel.addPanel( 'icon',  icon );
		const label	= new Panel( { tag: 'div', classes: ['item-label'] } );
		this.panel.addPanel( 'label', label );
		// Preset label if supplied.
		if ( this.label ) this.setLabel( this.label );

		// Create custom context menu.
		this.panel.el.addEventListener(
			'contextmenu',
			( e ) => {
				e.preventDefault();
				this.emit( 'contextmenu', null, this, e );
			});

		// Enable the list item by default.
		this.setEnabled( true );
	}

	//-----------------------------
	// Enable Dragging
	//-----------------------------
	enableDrag() {
		if ( this.draggable ) return; // already enabled
		this.draggable = true;
		this.panel.el.setAttribute( 'draggable', true );

		this.panel.el.addEventListener( 'dragstart', this.onDragStart );
		this.panel.el.addEventListener( 'dragend',   this.onDragEnd );
	}

	//-----------------------------
	// Disable Dragging
	//-----------------------------
	disableDrag() {
		this.draggable = false;
		this.panel.el.setAttribute( 'draggable', false );

		this.panel.el.removeEventListener( 'dragstart', this.onDragStart );
		this.panel.el.removeEventListener( 'dragend',   this.onDragEnd );
	}

	//-----------------------------
	// Handle Drag Start
	//-----------------------------
	onDragStart = (e) => {
		e.dataTransfer.setData( 'text/plain', this.panel.el.dataset.index );
		this.panel.el.classList.add( 'dragging' );
	}

	//-----------------------------
	// Handle Drag End
	//-----------------------------
	onDragEnd = (e) => {
		this.panel.el.classList.remove( 'dragging' );
	}

	//-----------------------------
	// Check Draggable Status
	//-----------------------------
	isDraggable() {
		return !!this.draggable;
	}

	//--------------------------------
	// Set Enabled State
	//--------------------------------
	// Sets the enabled (interactable) state of this item.
	// Adds or removes the 'disabled' class accordingly.
	// RETURNS: [void]
	// * enabled – [bool] true to enable, false to disable
	setEnabled( enabled ) {
		this.enabled = enabled;
		this.panel.toggleClass( 'disabled', !enabled );
	}

	//--------------------------------
	// Enable Item
	//--------------------------------
	// Shortcut wrapper for setEnabled( true ).
	// RETURNS: [void]
	enable() {
		// Enable the [object].
		this.setEnabled( true );
	}

	//--------------------------------
	// Disable Item
	//--------------------------------
	// Shortcut wrapper for setEnabled( false ).
	// RETURNS: [void]
	disable() {
		// Disable the [object].
		this.setEnabled( false );
	}

	//--------------------------------
	// Toggle Enabled State
	//--------------------------------
	// RETURNS: [bool] new enabled state
	toggle() {
		// Toggle the enability the [object].
		this.setEnabled( !this.enabled );
		return this.enabled; // return status
	}

	//-----------------------------
	// Set Label Text
	//-----------------------------
	// Update the dedicated label without modifying
	// the list item's other child elements.
	// RETURNS: [void]
	// * text - [string] new label text
	setLabel( text ) {
		// Store the current label value.
		this.label = text;
		// Update only the label panel.
		// Preserve any other elements belonging to the list item.
		this.panel.refs.label.setText( text );
	}

	//-----------------------------
	// Get Label Text
	//-----------------------------
	// RETURNS: [string]
	getLabel() {
		return this.label;
	}

	//-----------------------------
	// Set Data Payload
	//-----------------------------
	// RETURNS: [void]
	// * data – [any]
	setData( data ) {
		this.data = data;
	}

	//-----------------------------
	// Get Data Payload
	//-----------------------------
	// RETURNS: [any]
	getData() {
		return this.data;
	}

	//-----------------------------
	// Highlight Item
	//-----------------------------
	// Visually emphasize the item (e.g. current state).
	// RETURNS: [void]
	highlight() {
		this.panel.addClass( 'highlighted' );
	}

	//-----------------------------
	// Remove Highlight
	//-----------------------------
	// RETURNS: [void]
	unhighlight() {
		this.panel.removeClass( 'highlighted' );
	}

	//-----------------------------
	// Activate Item (interactive)
	//-----------------------------
	// RETURNS: [void]
	activate() {
		this.panel.removeClass( 'inactive' );
		//this.panel.el.style.pointerEvents = 'auto';
	}

	//-----------------------------
	// Deactivate Item (no interaction)
	//-----------------------------
	// RETURNS: [void]
	deactivate() {
		this.panel.addClass( 'inactive' );
		//this.panel.el.style.pointerEvents = 'none';
	}

	//-----------------------------
	// Hide Item from Display
	//-----------------------------
	hide() {
		this.panel.addClass( 'hidden' );
	}

	//-----------------------------
	// Show Item in Display
	//-----------------------------
	show() {
		this.panel.removeClass( 'hidden' );
	}

	//-----------------------------
	// Enable Group Header Mode
	//-----------------------------
	// Mark this item as a group. Creates a toggle button.
	// RETURNS: [void]
	enableGroup( children=[] ) {
		this.isGroup	= true;
		this.children	= children; // [array] of JestListItem
		this.folded		= false;
		this.disableDrag(); // disable group draggability

		// Add fold button
		this.foldToggle = new OSElement( { tag: 'span', classes: ['fold-toggle'], text: '▾' } );
		this.panel.prepend( this.foldToggle );

		this.foldToggle.register(
			'click', 'foldGroup',
			( e ) => {
				e.stopPropagation();
				this.toggleFold();
			},
			'dom' );
	}

	//-----------------------------
	// Toggle Folded/Unfolded
	//-----------------------------
	toggleFold() {
		// Determine if list item is already folded or not.
		this.folded = !this.folded;
		this.foldToggle.setText( this.folded ? '▸' : '▾' );

		// Iterate each childrne & toggle visibility.
		for ( const child of this.children ) {
			if ( this.folded ) child.hide();
			else child.show();
		}
	}

	//-----------------------------
	// Add a Child to Group
	//-----------------------------
	addChild( item ) {
		if ( !this.children ) this.children = [];
		this.children.push( item );
	}
}
