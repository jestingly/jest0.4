//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/ui/JestForm.js loaded' );

//-------------------------
// JestForm Class
//-------------------------
// Create a form for grouping input field(s).
class JestForm extends JestMenu {
	// Object properties
	fields		= {};			// [object] Input fields included in the form.

	// --------------------------------
	// Constructor
	// --------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client		- client [object] that this piece belongs to.
	constructor( client ) {
		super( client ); // call parent constructor
	}

	// --------------------------------
	// Initialization
	// --------------------------------
	// Build the element [object].
	// RETURNS: [void].
	// * name		- unique [string] value of component name in the system.
	// * classes	- [array] of classes to add to panel element.
	build( name='form', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		super.build( name, ['form'].mergeUnique(classes) );
	}

	//--------------------------------
	// Add Input Field to Form
	//--------------------------------
	// RETURNS: [bool]
	// * name  – [string] field key
	// * input – [JestInput] instance
	addField( name, input ) {
		// Require element to exist.
		if ( !input?.panel?.el ) return false;
		// Store input field reference by name.
		this.fields[name] = input;
		// Add input DOM element to the panel.
		this.panel.addPanel( name, input.panel );
		return true; // success
	}

	//--------------------------------
	// Remove Field from Form
	//--------------------------------
	// RETURNS: [bool]
	// * name – [string]
	removeField( name ) {
		// Require input [object] to exist.
		const field = this.fields[name];
		if ( !field ) return false;
		delete this.fields[name]; // delete it
		// Remove input DOM element from panel.
		this.panel.removePanel( name );
		field.destroy();
		return true; // success
	}

	//--------------------------------
	// Get Field Reference
	//--------------------------------
	// RETURNS: [JestInput|null]
	// * name – [string]
	getField( name ) {
		return this.fields[name] ?? null;
	}

	//--------------------------------
	// Get Single Field Value
	//--------------------------------
	// RETURNS: [any]
	// * name – [string]
	getValue( name ) {
		// Get the field input [object].
		const field = this.getField( name );
		return field?.getValue?.(); // return value
	}

	//--------------------------------
	// Get All Field Values
	//--------------------------------
	// RETURNS: [object]
	getValues() {
		const out = {};
		// Iterate all fields by key-name.
		for ( const name in this.fields ) {
			const field = this.fields[name];
			if ( field?.getValue )
				out[name] = field.getValue();
		}
		return out;
	}

	//--------------------------------
	// Set Single Field Value
	//--------------------------------
	// RETURNS: [void]
	// * name – [string] Name of field.
	// * val  – [any]
	setValue( name, val ) {
		// Get the field input [object].
		const field = this.getField( name );
		// Attempt to set the value.
		if ( field?.setValue )
			field.setValue( val );
	}

	//--------------------------------
	// Set Multiple Field Values
	//--------------------------------
	// RETURNS: [void]
	// * obj – [object] of key/value pairs
	setValues( obj ) {
		// Iterate all properties by key-name.
		for ( const name in obj )
			this.setValue( name, obj[name] );
	}

	//--------------------------------
	// Clear All Fields
	//--------------------------------
	// RETURNS: [void]
	clearFields() {
		// Iterate all fields by key-name.
		for ( const name in this.fields )
			this.removeField( name );
	}

	//--------------------------------
	// Validate All Fields
	//--------------------------------
	// RETURNS: [object] { valid:bool, errors:object }
	// * validators – [object] optional map: { fieldName: (val)=>bool|string }
	validate( validators=null ) {
		let isValid = true;
		const errors = {};
		// Iterate all fields by key-name.
		for ( const name in this.fields ) {
			// Get input [object].
			const field	= this.fields[name];
			const value	= field?.getValue?.(); // get field value
			// Run custom validator if provided
			if ( validators?.[name] ) {
				const result = validators[name]( value );
				if ( result!==true ) {
					isValid			= false;
					errors[name]	= result || 'Invalid value';
				}
			}
			// Default required check if no validator and field has .required
			else if ( field?.required && (value===null || value==='') ) {
				isValid			= false;
				errors[name]	= 'Required';
			}
		}
		// Return valid status & error(s).
		return { valid: isValid, errors: errors };
	}

	//--------------------------------
	// Enable/Disable Single Field
	//--------------------------------
	// RETURNS: [void]
	// * name   – [string]
	// * active – [bool] true = enabled
	setDisabled( name, active=false ) {
		// Get the field input [object].
		const field = this.getField( name );
		if ( field?.setDisabled )
			field.setDisabled( !active );
	}

	//--------------------------------
	// Enable/Disable Entire Form
	//--------------------------------
	// RETURNS: [void]
	// * active – [bool] true = enabled
	setAllDisabled( active=false ) {
		// Iterate all fields by key-name.
		for ( const name in this.fields )
			this.setDisabled( name, active );
	}

	//--------------------------------
	// Handle Input
	//--------------------------------
	// Compares field values in the form against the given data.
	// Highlights mismatched fields with a CSS class and toggles apply button.
	// RETURNS: [bool] True if any mismatches were found.
	// * dataValues			- [object] Source of expected data values.
	// * fieldMapCompare	- [object] { formFieldKey: dataKey }
	checkFieldInput( dataValues, fieldMapCompare ) {
		// Track if any mismatches found
		let foundMismatch = false;

		// Iterate over comparison map
		Object.entries(fieldMapCompare).forEach(
			( [ f, d ] ) => {
				//--------------------------------
				// Grab field and data values
				//--------------------------------
				// Compare field(s).
				const fieldVal = this.fields[f]?.getValue?.()?.toString() ?? '';
				const dataVal  = dataValues[d]?.toString();

				//--------------------------------
				// Compare values
				//--------------------------------
				// Log mismatch if fields don't match.
				const mismatch = fieldVal !== dataVal;

				// Apply unsaved highlight
				this.fields[f]?.panel?.toggleClass?.( 'unsaved', mismatch );

				// Track mismatch found
				if ( mismatch===true )
					foundMismatch = true;
			});
		// Return whether any fields have changed.
		return foundMismatch;
	}
}
