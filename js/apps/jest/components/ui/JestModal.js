//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/ui/JestModal.js loaded' );

//-----------------------------
// JestModal Class
//-----------------------------
// Lightweight modal dialog with header, text, input, and buttons.
// Extends: JestElement
class JestModal extends JestElement {
	// Object properties
	titleText		= '';				// [string] title of modal
	bodyText		= '';				// [string] body content
	noticeText		= '';				// [string] modal notice message
	inputs			= {};				// [object] map of name -> JestInputText
	box				= null;				// DOM [object] of the inner box
	payload			= null;				// [any] contextual data passed to modal when opened.
	// Button storage & sequencing
	buttons			= {};				// [object<string,JestButton>] keyed by our own keys (e.g., 'ok','cancel')
	buttonSeq		= 0;				// [int] monotonically increasing counter to build unique button ids

	//--------------------------------
	// Constructor
	//--------------------------------
	// Construct the [object].
	// * client		- [object] parent controller
	constructor( client ) {
		super( client ); // call parent constructor
	}

	// Destroy the dialog.
	// RETURNS: [void]
	destroy() {
		this.panel.el.remove(); // remove from DOM
	}

	//--------------------------------
	// Build Component
	//--------------------------------
	// Build modal layout.
	// * name		- [string] unique identifier
	// * classes	- [array] extra CSS class names
	build( name='modal', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		super.build( 'div', name, ['jest-modal'].mergeUnique(classes) );
		this.panel.addElements([
			{
				name     : 'overlay',
				tag      : 'div',
				classes  : [ 'modal-overlay' ]
			},
			{
				name     : 'box',
				tag      : 'div',
				classes  : [ 'modal-box' ],
				elements : [
					{ name: 'title',     tag: 'div', classes: [ 'modal-title' ] },
					{ name: 'text',      tag: 'div', classes: [ 'modal-text' ] },
					{ name: 'notice',    tag: 'div', classes: [ 'modal-notice' ] },
					{ name: 'inputwrap', tag: 'div', classes: [ 'modal-input' ] },
					{ name: 'buttons',   tag: 'div', classes: [ 'modal-buttons' ] }
					]
			}
		]);
		// Keep inner box reference.
		this.box = this.panel.refs.box;
		// Close on overlay click
		this.panel.refs.overlay.register( 'click', 'close', ()=>this.close(), 'dom' );
	}

	//--------------------------------
	// Set Modal Title
	//--------------------------------
	// RETURNS: [void]
	// * value	- [string] title text
	setTitle( value ) {
		// Set prompt title.
		this.titleText	= value;
		this.box.refs.title.el.innerText = value;
	}

	//--------------------------------
	// Set Modal Message Text
	//--------------------------------
	// RETURNS: [void]
	// * value	- [string] body content
	setText( value ) {
		// Prompt message.
		this.bodyText	= value;
		this.box.refs.text.setHTML( value );
	}

	//--------------------------------
	// Set Modal Message Notice
	//--------------------------------
	// RETURNS: [void]
	// * value	- [string] notice message
	setNotice( value ) {
		// Prompt message.
		this.noticeText	= value;
		this.box.refs.notice.setHTML( value );
	}

	//--------------------------------
	// Add Input Field to Modal
	//--------------------------------
	// Adds a named text input to the modal panel.
	// RETURNS: [JestInputText]
	// * name			- [string] unique input name (required)
	// * id				- [string] optional HTML id
	// * defaultValue	- [string] pre-filled text
	// * placeholder	- [string] field hint
	// * labelText		- [string] label element
	//   type			- [string] value of input type ("text", "password")
	addTextfield(
		name, id=null, defaultValue=null, placeholder=null, labelText=null, type="text" ) {
		// Validate input name
		if ( !name ) {
			console.warn( 'JestModal.addTextfield: Input must have a valid name.' );
			return null; // abort
		}
		// Check for duplicate
		if ( this.inputs[name] ) {
			console.warn( `Input "${name}" already exists.` );
			return this.inputs[name];
		}
		// Create input [object]
		const input	= new JestInputText( this.client, name, id, defaultValue, placeholder, labelText );
		input.setType( type );
		input.build( `input-${name}` );
		// Show the text field label.
		if ( labelText!==null ) input.showLabel();
		// Append to panel
		this.box.refs.inputwrap.addPanel( name, input.panel );
		// Store reference
		this.inputs[name] = input;
		// Return input
		return input;
	}

	//--------------------------------
	// Add Checkbox Input Field
	//--------------------------------
	// Adds a boolean [checkbox] input to the modal.
	// RETURNS: [JestInputCheckbox]
	// * name			- [string] unique key name
	// * id				- [string|null] optional HTML id
	// * defaultValue	- [bool] initial checked state
	// * labelText		- [string|null] visible label
	addCheckbox( name, id=null, defaultValue=false, labelText=null ) {
		// Check for existing field
		if ( this.inputs[name] ) return this.inputs[name];

		// Create Checkbox field
		const input = new JestInputCheckbox( this.client, name, id, defaultValue, labelText );
		input.build( `input-${name}` );

		// Append to modal UI
		this.box.refs.inputwrap.addPanel( name, input.panel );

		// Store reference
		this.inputs[name] = input;
		return input;
	}

	//--------------------------------
	// Add Textarea Input Field
	//--------------------------------
	// Adds a multiline [textarea] input to the modal.
	// RETURNS: [JestInputTextarea]
	// * name			- [string] unique input name
	// * id				- [string|null] optional HTML id
	// * defaultValue	- [string|null] default content
	// * placeholder	- [string|null] input placeholder
	// * labelText		- [string|null] field label
	addTextarea( name, id=null, defaultValue=null, placeholder=null, labelText=null ) {
		// Check for existing field
		if ( this.inputs[name] ) return this.inputs[name];

		// Create input field
		const input = new JestInputTextarea( this.client, name, id, defaultValue, placeholder, labelText );
		input.build( `input-${name}` );

		// Append to modal UI
		this.box.refs.inputwrap.addPanel( name, input.panel );

		// Store reference
		this.inputs[name] = input;
		return input;
	}

	//--------------------------------
	// Add Select Dropdown Field
	//--------------------------------
	// Adds a dropdown [select] input to the modal.
	// RETURNS: [JestInputSelect]
	// * name			- [string] unique field key
	// * id				- [string|null] HTML id override
	// * defaultValue	- [string|null] selected value
	// * options		- [array] list of value options
	// * labelText		- [string|null] visible label
	addSelect( name, id=null, defaultValue=null, options=null, labelText=null ) {
		// Check for existing field
		if ( this.inputs[name] ) return this.inputs[name];

		// Create input field
		const input = new JestInputSelect( this.client, name, id, null, options, labelText );
		input.build( `input-${name}` );

		// Load initial options if provided.
		if ( options )
			input.setOptions( options );

		// Select default option if supplied.
		if ( defaultValue )
			input.setDefault( defaultValue );

		// Append to modal UI
		this.box.refs.inputwrap.addPanel( name, input.panel );

		// Store reference
		this.inputs[name] = input;
		return input;
	}

	//--------------------------------
	// Add Radio Set Input Field
	//--------------------------------
	// Adds a radio button group to the modal.
	// RETURNS: [JestInputRadioSet]
	// * name			- [string] field name
	// * id				- [string|null] HTML id
	// * defaultValue	- [string|null] selected value
	// * options		- [array] set of string labels
	// * labelText		- [string|null] group label
	addRadioSet( name, id=null, defaultValue=null, options=null, labelText=null ) {
		// Check for existing field
		if ( this.inputs[name] ) return this.inputs[name];

		// Create input field
		const input = new JestInputRadioSet( this.client, name, id, defaultValue, options, labelText );
		input.build( `input-${name}` );

		// Append to modal UI
		this.box.refs.inputwrap.addPanel( name, input.panel );

		// Store reference
		this.inputs[name] = input;
		return input;
	}

	//--------------------------------
	// Add Range Slider Input Field
	//--------------------------------
	// Adds a numeric slider input (0–100 default).
	// RETURNS: [JestInputRange]
	// * name			- [string] unique name key
	// * id				- [string|null] HTML id
	// * defaultValue	- [number] initial slider value
	// * labelText		- [string|null] field label
	addRange( name, id=null, defaultValue=0, labelText=null ) {
		// Check for existing field
		if ( this.inputs[name] ) return this.inputs[name];

		// Create input field
		const input = new JestInputRange( this.client, name, id, defaultValue, labelText );
		input.build( `input-${name}` );

		// Append to modal UI
		this.box.refs.inputwrap.addPanel( name, input.panel );

		// Store reference
		this.inputs[name] = input;
		return input;
	}

	//--------------------------------
	// Add Number Input Field
	//--------------------------------
	// Adds a numeric [step input] field.
	// RETURNS: [JestInputNumber]
	// * name			- [string] unique field key
	// * id				- [string|null] optional HTML id
	// * defaultValue	- [number] initial value
	// * placeholder	- [string|null] placeholder hint
	// * labelText		- [string|null] visible label
	addNumber( name, id=null, defaultValue=0, placeholder=null, labelText=null ) {
		// Check for existing field
		if ( this.inputs[name] ) return this.inputs[name];

		// Create input field
		const input = new JestInputNumber( this.client, name, id, defaultValue, placeholder, labelText );
		input.build( `input-${name}` );

		// Append to modal UI
		this.box.refs.inputwrap.addPanel( name, input.panel );

		// Store reference
		this.inputs[name] = input;
		return input;
	}

	//--------------------------------
	// Add File Select Input Field
	//--------------------------------
	// Adds a file picker input (open file dialog).
	// RETURNS: [JestInputFileSelect]
	// * name			- [string] unique field name
	// * id				- [string|null] HTML id override
	// * defaultValue	- [string|null] initial file path
	// * labelText		- [string|null] field label
	addFileSelect( name, id=null, defaultValue=null, labelText=null ) {
		// Check for existing field
		if ( this.inputs[name] ) return this.inputs[name];

		// Create input field
		const input = new JestInputFileSelect( this.client, name, id, defaultValue, labelText );
		input.build( `input-${name}` );

		// Append to modal UI
		this.box.refs.inputwrap.addPanel( name, input.panel );

		// Store reference
		this.inputs[name] = input;
		return input;
	}

	//--------------------------------
	// Get Input Value by Name
	//--------------------------------
	// Get an input field by its field name.
	// RETURNS: [string|null]
	// * name - [string] field name
	getField( name ) {
		return this.inputs?.[name] ?? null;
	}

	//--------------------------------
	// Get Input Value by Name
	//--------------------------------
	// Get an input field input value by its field name.
	// RETURNS: [string|null]
	// * name - [string] field name
	getInputValue( name ) {
		return this.inputs[name]?.getValue?.() ?? null;
	}

	//--------------------------------
	// Get All Input Values
	//--------------------------------
	// RETURNS: [object] key-value pairs
	getAllInputs() {
		const result = {};
		for ( const key in this.inputs )
			result[key] = this.inputs[key].getValue();
		return result;
	}

	//--------------------------------
	// Remove Input Field by Name
	//--------------------------------
	// RETURNS: [bool] success
	removeInput( name ) {
		// Check if input field exists.
		const input = this.inputs[name];
		// Remove the input field if it exists.
		if ( input ) {
			input.remove(); // remove DOM
			delete this.inputs[name];
			return true; // success
		}
		return false; // failed
	}

	//--------------------------------
	// Reset All Input Fields
	//--------------------------------
	// Clears all fields to their default values.
	resetInputs() {
		// Iterate all inputs & reset.
		for ( const key in this.inputs )
			this.inputs[key].reset?.();
	}

	//--------------------------------
	// Add Button to Modal
	//--------------------------------
	// Creates a new button, appends to footer, and stores it in a keyed map.
	//	• If the key already exists, remove the old button cleanly first.
	//	• Uses a per-instance counter for id sequencing (no array .length hacks).
	// RETURNS: [JestButton]
	// * key	- [string] button key name (e.g., 'ok','cancel','overwrite')
	// * label	- [string] button text
	// * callback - [function|null] click handler
	addButton( key, label, callback=null ) {
		// If a button with this key exists, remove it before adding a new one.
		if ( this.buttons[key] )
			this.removeButton( key );

		// Build a unique id using a per-instance monotonic counter.
		const nextId = `modal-button-${++this.buttonSeq}`;

		// Create button [object].
		const button = new JestButton( this.client, nextId );
		button.build( 'modal-button', [], label );	// build [object]

		// Register click event (primary action)
		if ( typeof callback==='function' )
			button.register( 'click', `btn-${key}`, callback );

		// Optional SFX (leave exactly as you had it)
		button.register( 'mousedown', 'sfx',
			() => this.client.soundboard.playSound( 'jest_mouse_down', 'mp3', 1.1 ) );
		button.register( 'mouseup', 'sfx',
			() => this.client.soundboard.playSound( 'jest_mouse_up', 'mp3', 1.1 ) );

		// Append into footer container
		this.box.refs.buttons.addPanel( key, button.panel );

		// Store by key in the map
		this.buttons[key] = button;
		return button; // return button [object]
	}

	//--------------------------------
	// Remove One Button by Key
	//--------------------------------
	// Safely removes the button DOM and its map entry.
	// RETURNS: [bool] true if removed
	removeButton( key ) {
		// Check if button exists.
		const btn = this.buttons?.[key];
		if ( !btn ) return false; // button not found
		// Remove from DOM if present
		this.box.refs.buttons.removePanel( key );
		// Drop reference
		delete this.buttons[key];
		return true; // successfully removed
	}

	//--------------------------------
	// Clear All Buttons
	//--------------------------------
	// Nukes the footer container and resets the map.
	//	• Call before repopulating a modal with new actions.
	// RETURNS: [void]
	clearButtons() {
		// Remove known buttons by key (lets GC reclaim)
		if ( this.buttons && typeof this.buttons==='object' ) {
			for ( const key in this.buttons )
				this.removeButton( key );
		}

		// Hard clear footer container just in case
		const footer = this.box?.refs?.buttons?.el;
		if ( footer )
			while ( footer.firstChild )
				footer.removeChild( footer.firstChild );

		// Reset map
		this.buttons = {};
	}

	//--------------------------------
	// Dismissing Modal
	//--------------------------------
	// Reset the dialog.
	// RETURNS: [void]
	reset() {
		// Reset the panel.
		this.close(); // remove from visibility
		// Clear the input.
		this.setText( '' );		// clear input field
		this.setTitle( '' );	// clear title
		this.resetInputs();		// clear all input values
	}

	// Close the dialog.
	// RETURNS: [void]
	// * data	- [any] optional override payload (if different from open)
	close( data=null ) {
		// Hide the panel.
		this.hide(); // remove from visibility
		// Emit close event.
		this.emit( 'close', null, this.payload, data ); // emit close event
		this.payload	= null; // clear context
	}

	// Hide the dialog.
	// RETURNS: [void]
	hide() {
		// Hide the panel.
		this.panel.addClass( 'hidden' ); // hide the dialog
	}

	//--------------------------------
	// Showing Modal
	//--------------------------------
	// Open the dialog.
	// RETURNS: [void]
	// * data	- [any] optional payload for event context
	open( data=null ) {
		// Store optional payload (accessible via open & close events).
		this.payload	= data;	// store context
		// Emit pre-open event.
		this.emit( 'preopen', null, this.payload );
		// Open the panel.
		this.show();			// show the dialog
		// Play a "prompt" sound-effect for affirmation.
		this.client.soundboard.playSound( 'jest_prompt', 'mp3', 1.1 );
		// Emit open event.
		this.emit( 'open' );
	}

	// Show the dialog.
	// RETURNS: [void]
	show() {
		// Hide the panel.
		this.panel.removeClass( 'hidden' ); // show the dialog
	}
}
