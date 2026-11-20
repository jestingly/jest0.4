//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/ui/JestInput.js loaded' );

//-----------------------------
// JestInput Class
//-----------------------------
// Versatile input element with enable/disable methods.
// Extends: JestElement
class JestInput extends JestElement {
	// Object properties
	field			= null;			// [object] OSElement DOM input reference.
	// Accessibility propert(ies)
	disabled		= false;		// [bool] Whether this input is currently disabled.
	readonly		= false;		// [bool] Whether input field is readonly or not.
	// Identifier propert(ies)
	id				= null;			// [string] HTML id (auto-generated if not provided).
	name			= null;			// [string] optional field name.
	label			= null;			// [object] reference label for input field (optional).
	labelText		= null;			// [string] label content.
	caption			= null;			// [string] reference caption for input field (optional).
	captionText		= null;			// [string] caption content.
	// Value propert(ies)
	placeholder 	= null;			// [string] placeholder text.
	defaultValue	= null;			// [string] Default fallback value.

	//--------------------------------
	// Constructor
	//--------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client		- client [object] that this piece belongs to.
	constructor( client ) {
		super( client ); // call parent constructor
	}

	//--------------------------------
	// Build Component
	//--------------------------------
	// Build the element [object].
	// RETURNS: [void].
	// * name		- unique [string] name of component.
	// * classes	- [array] additional CSS classes to apply.
	build( name='input', classes=[] ) {
		if ( classes===null ) classes = [];
		super.build( 'div', name, ['input'].mergeUnique(classes) );

		//--------------------------------
		// Add Label (if specified)
		//--------------------------------
		// Add input element label if supplied.
		this.panel.addElements([{
			name:		'label',
			tag:		'label',
			classes:	[ 'hidden' ],
			attributes:	{ for: this.id }
			}]);
		this.label		= this.panel.refs.label; // quick-ref
		this.setLabel( this.labelText );         // set initial label
		this.hideLabel(); // hide the label by default

		//--------------------------------
		// Add Caption (if specified)
		//--------------------------------
		// Add input element caption if supplied.
		this.panel.addElements([{
			name:		'caption',
			tag:		'div',
			classes:	[ 'hidden', 'jest-caption' ],
			attributes:	{ for: this.id }
			}]);
		this.caption	= this.panel.refs.caption;	// quick-ref
		this.setCaption( this.captionText );		// set initial label
		this.hideCaption(); // hide the caption by default
		// Set mode as enabled.
		this.jot( 'enabled', true );
	}

	//--------------------------------
	// Register DOM Event (Helper)
	//--------------------------------
	// Register a DOM event and channel through method
	// RETURNS: [void]
	// * eventName		- [string] name of the DOM event
	registerDOMEvent( eventName ) {
		this.field.register(
			eventName,
			`input-${eventName}`,
			( e ) => {
				// Ensure method exists.
				if ( typeof this[eventName]!=='function' )
					return;
				else this[eventName]( e );
			},
			'dom' );
	}

	//--------------------------------
	// Enable Input Field
	//--------------------------------
	// RETURNS: [bool] true if set, else false.
	enable() {
		// Do not double enable.
		const enabled	= this.skim( 'enabled' );
		if ( enabled===true ) return false; // no need to eanble
		// Enable.
		this.jot( 'enabled', true ); // enable
		this.field.el.disabled = false;
		return true; // enabled
	}

	//--------------------------------
	// Disable Input Field
	//--------------------------------
	// RETURNS: [bool] true if set, else false.
	disable() {
		// Do not double enable.
		const enabled	= this.skim( 'enabled' );
		if ( enabled===false ) return false; // no need to disable
		// Disable.
		this.jot( 'enabled', false ); // disable
		this.field.el.disabled = true;
		return true; // disabled
	}

	//--------------------------------
	// Remove Input Field
	//--------------------------------
	// RETURNS: [void]
	remove() {
		// Remove the field from the DOM.
		this.field.el.remove();
		this.field = null; // dereference
	}

	//--------------------------------
	// Reset to Default
	//--------------------------------
	// RETURNS: [void]
	reset() {
		// Reset the field to its default value.
		this.setValue( this.defaultValue );
	}

	//--------------------------------
	// Set Label Text
	//--------------------------------
	// Updates the visible label element (if present).
	// RETURNS: [void]
	// * value	- [string] new label
	setLabel( value ) {
		// Set the field label value.
		this.labelText	= value ?? null;
		if ( this.label )
			this.label.el.innerText = this.labelText;
	}

	//--------------------------------
	// Get Label Text
	//--------------------------------
	// RETURNS: [string]
	getLabel() {
		// Get the field label value.
		return this.labelText;
	}

	//--------------------------------
	// Show Panel Element
	//--------------------------------
	// Makes panel element visible.
	// RETURNS: [void]
	show() {
		// See if panel exists.
		if ( !this.panel ) return;
		// Remove "hidden" class from panel.
		this.panel.removeClass( 'hidden' );
	}

	//--------------------------------
	// Hide Panel Element
	//--------------------------------
	// Hides the panel from display.
	// RETURNS: [void]
	hide() {
		// See if panel exists.
		if ( !this.panel ) return;
		// Add "hidden" class to panel.
		this.panel.addClass( 'hidden' );
	}

	//--------------------------------
	// Show Input Element
	//--------------------------------
	// Makes field element visible.
	// RETURNS: [void]
	showField() {
		// See if field exists.
		if ( !this.field ) return;
		// Remove "hidden" class from field.
		this.field.removeClass( 'hidden' );
	}

	//--------------------------------
	// Hide Input Element
	//--------------------------------
	// Hides the field from display.
	// RETURNS: [void]
	hideField() {
		// See if field exists.
		if ( !this.field ) return;
		// Add "hidden" class to field.
		this.field.addClass( 'hidden' );
	}

	//--------------------------------
	// Show Label Element
	//--------------------------------
	// Makes label element visible.
	// RETURNS: [void]
	showLabel() {
		// Remove "hidden" class from label.
		this.label.removeClass( 'hidden' );
	}

	//--------------------------------
	// Hide Label Element
	//--------------------------------
	// Hides the label from display.
	// RETURNS: [void]
	hideLabel() {
		// Add "hidden" class to label.
		this.label.addClass( 'hidden' );
	}

	//--------------------------------
	// Set Field Name Attribute
	//--------------------------------
	// Used for form key mapping.
	// RETURNS: [void]
	// * value		- [string] name attribute
	setName( value ) {
		// Set the field name value.
		this.name = value ?? null;
		if ( this.field )
			this.field.el.setAttribute( 'name', this.name );
	}

	//--------------------------------
	// Set Unique ID Attribute
	//--------------------------------
	// Also updates label “for”.
	// RETURNS: [void]
	// * value		- [string] new id value
	setId( value ) {
		// If manual ID provided, use it, else use system key.
		this.id	= value ?? this.skey;
		// Require field to be set.
		if ( this.field )
			this.field.el.setAttribute( 'id', this.id );
		if ( this.panel?.refs?.label?.el )
			this.panel.refs.label.el.setAttribute( 'for', this.id );
	}

	//--------------------------------
	// Set Placeholder Text
	//--------------------------------
	// Updates the input’s internal hint text.
	// RETURNS: [void]
	// * value	- [string] placeholder content
	setPlaceholder( value ) {
		// Set the field placeholder value.
		this.placeholder = value ?? null;
		if ( this.field )
			this.field.el.setAttribute( 'placeholder', this.placeholder );
	}

	//--------------------------------
	// Get Placeholder Text
	//--------------------------------
	// RETURNS: [string]
	getPlaceholder() {
		// Get the field placeholder value.
		return this.placeholder;
	}

	//--------------------------------
	// Set Default Value
	//--------------------------------
	// RETURNS: [void]
	// * str	- [string] default input text
	setDefault( value ) {
		// Set the field default value.
		this.defaultValue	= value ?? '';
		if ( this.field ) this.field.el.value = value;
	}

	//--------------------------------
	// Get Current Value
	//--------------------------------
	// RETURNS: [string] current input value
	getValue() {
		// Set the field value.
		return this.field?.el.value ?? '';
	}

	//--------------------------------
	// Set Current Value
	//--------------------------------
	// RETURNS: [void]
	// * str	- [string] value to insert
	setValue( value ) {
		// Set the field value.
		if ( this.field )
			this.field.el.value = value;
		// Emit event indicating setValue was called.
		this.emit( 'value', null, value )
	}

	//--------------------------------
	// Set Caption Text
	//--------------------------------
	// Updates the visible caption element (if present).
	// RETURNS: [void]
	// * value	- [string] new caption
	setCaption( value ) {
		// Set the field caption value.
		this.captionText	= value ?? null;
		if ( this.caption )
			this.caption.el.innerHTML = this.captionText;
	}

	//--------------------------------
	// Get Caption Text
	//--------------------------------
	// RETURNS: [string]
	getCaption() {
		// Get the field caption value.
		return this.captionText;
	}

	//--------------------------------
	// Show Caption Element
	//--------------------------------
	// Makes caption element visible.
	// RETURNS: [void]
	showCaption() {
		// Remove "hidden" class from caption.
		this.caption.removeClass( 'hidden' );
	}

	//--------------------------------
	// Hide Caption Element
	//--------------------------------
	// Hides the caption from display.
	// RETURNS: [void]
	hideCaption() {
		// Add "hidden" class to caption.
		this.caption.addClass( 'hidden' );
	}

	//--------------------------------
	// Toggle Readonly Mode
	//--------------------------------
	// Sets or unsets the readonly attribute on this.field element.
	// RETURNS: [bool] true if change was made; false if no change or missing field.
	// * readonly	– [bool] whether to enable (true) or disable (false) readonly mode.
	// * DEFAULT: true
	setReadonly( readonly=true ) {
		//--------------------------------
		// Check Valid Field
		//--------------------------------
		// Ensure the target field exists before proceeding.
		if ( !this.field || !this.field.el ) return false;

		//--------------------------------
		// Already In Desired State
		//--------------------------------
		// Avoid redundant attribute toggling.
		const already = this.field.el.hasAttribute( 'readonly' );
		if ( readonly && already ) return false;
		if ( !readonly && !already ) return false;

		//--------------------------------
		// Apply Toggle Logic
		//--------------------------------
		// Set or remove attribute depending on input.
		if ( readonly ) {
			this.field.el.setAttribute( 'readonly', 'readonly' );
			this.readonly = true;
		}
		else {
			this.field.el.removeAttribute( 'readonly' );
			this.readonly = false;
		}

		return true;
	}

	//--------------------------------
	// Shortcut: Unset Readonly Mode
	//--------------------------------
	// Convenience method to disable readonly.
	// RETURNS: [bool] result of setReadonly( false )
	unsetReadonly() {
		return this.setReadonly( false );
	}

	//--------------------------------
	// Toggle Readonly Mode
	//--------------------------------
	// Helper toggle between readonly and writable.
	// RETURNS: [bool] true if readonly enabled, false if disabled.
	toggleReadonly() {
		// Toggle the readonly attribute
		if ( this.field?.el.hasAttribute('readonly') ) {
			this.unsetReadonly();
			return false; // now writable
		}
		else {
			this.setReadonly();
			return true; // now readonly
		}
	}
}
