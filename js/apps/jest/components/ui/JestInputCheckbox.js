//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/ui/JestInputCheckbox.js loaded' );

//-----------------------------
// JestInputCheckbox Class
//-----------------------------
// Versatile single checkbox input with full label support.
// Emits: 'change' – when checked state changes
//        'click'  – when manually clicked
class JestInputCheckbox extends JestInput {
	// Object Properties
	checked         = false;		// [bool] whether the checkbox is initially checked

	//-------------------------
	// Constructor
	//-------------------------
	// Initializes the input field properties.
	// RETURNS: [void]
	// * client          – [object] parent application client
	// * name            – [string|null] name of the input (form use)
	// * id              – [string|null] HTML ID; if null, defaults to auto-generated skey
	// * defaultChecked  – [bool] default state of checkbox (true/false)
	// * labelText       – [string|null] optional text to show in a <label> element
	// * readOnly		- [bool]   Whether field is read-only
	constructor( client, name=null, id=null, defaultChecked=false,
		         labelText=null, readOnly=false ) {
		super( client ); // call parent constructor
		// Determine default value, placholder field hint & label.
		this.setChecked( defaultChecked );     // [bool] whether box is checked
		this.setLabel( labelText ?? null );    // [string] the text for the label
		this.setName( name ?? null );          // [string] value of field name
		this.setId( id ?? this.skey );         // [string] HTML id
		this.setReadonly( readOnly ?? false ); // [bool] set field read-only
	}

	//-------------------------
	// Build UI
	//-------------------------
	// Constructs the HTML structure and initializes DOM references.
	// RETURNS: [void]
	// * name     – [string] internal identifier name for this field type
	// * classes  – [array] list of extra CSS class names (merged with 'checkbox')
	build( name='checkbox', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		super.build( name, ['checkbox'].mergeUnique(classes) );

		//--------------------------------
		// Create Input Field
		//--------------------------------
		// Add actual checkbox input field
		this.panel.addElements([
			{
			name		: 'input',
			tag			: 'input',
			attributes	:
				{
				type	: 'checkbox',
				id		: this.id,
				name	: this.name,
				checked	: this.checked
				}
			}]);
		// Cache input element
		this.field = this.panel.refs.input;
		// Register standard DOM events (auto-wired to this.change() etc)
		this.registerDOMEvent( 'change' );

		//--------------------------------
		// Ensure Default(s) Are Applied
		//--------------------------------
		// Set default(s) (supplied previously).
		this.setChecked( this.checked ); // [bool] whether box is checked
	}

	//-------------------------
	// Set Checked State
	//-------------------------
	// Programmatically set checkbox to checked/unchecked.
	// * val  – [boolean] Value of new checked state.
	//   emit - [boolean] Whether to emit change event.
	setChecked( val=true, emit=true ) {
		// Set checked value.
		this.checked = Boolean( val );
		// Trigger field display.
		if ( this.field )
			this.field.el.checked = this.checked;
		// Emit the changed event.
		if ( emit===true )
			this.emit( 'change', null, val );
	}

	// Quickly check/uncheck the box.
	check()    { this.setChecked(true); }
	uncheck()  { this.setChecked(false); }

	//-------------------------
	// Get Checked State
	//-------------------------
	// RETURNS: [bool] current checkbox state
	getChecked() {
		return this.field ? this.field.el.checked : this.checked;
	}

	//-------------------------
	// Event: Change
	//-------------------------
	// Called when checkbox value is toggled.
	// Emits 'change' with boolean state.
	// * e – [DOMEvent] browser event object
	change( e ) {
		// Set checked value.
		this.setChecked( e.target.checked );
	}

	//-------------------------
	// Event: Click
	//-------------------------
	// Optional click handler. Emits full event.
	// * e – [DOMEvent] browser event object
	click( e ) {
		this.emit( 'click', null, e );
	}
}
