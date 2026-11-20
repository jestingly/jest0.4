//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/ui/JestInputNumber.js loaded' );

//-----------------------------
// JestInputNumber Class
//-----------------------------
// Single-line number input with optional constraints.
// Extends: JestInput
class JestInputNumber extends JestInput {
	// Object properties
	name			= null;			// [string|null] input name
	id				= null;			// [string] HTML id
	defaultValue	= null;			// [number|null] starting value
	placeholder		= null;			// [string|null] optional hint text
	min				= null;			// [number|null] minimum value
	max				= null;			// [number|null] maximum value
	step			= null;			// [number|null] increment step	// Input method tracking
	lastMethod		= null;			// [string|null] 'spinner' | 'keyboard' | null

	//-------------------------
	// Constructor
	//-------------------------
	// Initializes number input field with optional constraints.
	// RETURNS: [void].
	// * client			- client [object] that this piece belongs to.
	// * name			- [string|null] input name
	// * id				- [string] HTML id
	// * defaultValue	- [number|null] starting value
	// * placeholder	- [string|null] optional hint text
	// * labelText		- [string] label content
	// * min			- [number|null] minimum value
	// * max			- [number|null] maximum value
	// * step			- [number|null] increment step
	constructor( client, name=null, id=null, defaultValue=0, placeholder=null,
				 labelText=null, min=null, max=null, step=null ) {
		super( client );	// call parent constructor
		this.setName( name ?? null );				// [string] value of field name
		this.setId( id ?? this.skey );				// [string] HTML id
		this.setDefault( defaultValue ?? null );	// [string] default input value
		this.setPlaceholder( placeholder ?? null );	// [string] field hint (if no default input)
		this.setLabel( labelText ?? null );			// [string] the text for the label
		this.min	= min;		// minimum value
		this.max	= max;		// maximum value
		this.step	= step;		// step value
	}

	//-------------------------
	// Build UI
	//-------------------------
	// creates input[type=number] and attaches DOM events
	build( name='number', classes=[] ) {
		if ( classes === null ) classes = [];
		super.build( name, ['number'].mergeUnique( classes ));

		// dynamically apply only relevant attributes
		this.panel.addElements([{
			name		: 'input',
			tag			: 'input',
			attributes	:
				Object.assign(
					{
						type	: 'number',
						id		: this.id,
						name	: this.name,
						value	: this.defaultValue
					},
					this.placeholder !== null ? { placeholder:this.placeholder } : {},
					this.min         !== null ? { min:this.min } : {},
					this.max         !== null ? { max:this.max } : {},
					this.step        !== null ? { step:this.step } : {}
					)
			}]);

		// store reference to DOM field
		this.field = this.panel.refs.input;

		// wire DOM events
		this.registerDOMEvent( 'pointerdown' );
		this.registerDOMEvent( 'keydown' );
		this.registerDOMEvent( 'input' );
		this.registerDOMEvent( 'change' );
	}

	//--------------------------------
	// Reset to Default
	//--------------------------------
	// RETURNS: [void]
	reset() {
		// Reset the field to its default value.
		this.setValue( this.defaultValue );
	}

	//-------------------------
	// Event: Input
	//-------------------------
	// Called on live value input.
	pointerdown( e ) {
		// Log type event.
		this.lastMethod = 'spinner';
		// Parse field value to number.
		const val = parseFloat( e.target.value );
		// Emit value input event.
		this.emit( 'spinner', null, val );
	}

	// Called when a key is pressed inside the input.
	keydown( e ) {
		// Include number keys, arrows, delete, backspace
		if ( e.key.length===1 ||
			[
			'ArrowUp', 'ArrowDown',
			'ArrowLeft', 'ArrowRight',
			'Backspace', 'Delete'
			].includes(e.key)
			)
			this.lastMethod = 'keyboard';
		// Parse field value to number.
		const val = parseFloat( e.target.value );
		// Emit value input event.
		this.emit( 'keydown', null, val );
	}

	// Called on live value input.
	input( e ) {
		// Parse field value to number.
		const val = parseFloat( e.target.value );
		// Emit value input event.
		this.emit( `${this.lastMethod}:input`, null, val );
		this.emit( `input`, null, val );
		this.lastMethod = null; // reset after emit
	}

	// Called on finalized change (blur).
	change( e ) {
		// Parse field value to number.
		const val = parseFloat( e.target.value );
		// Emit value changed event.
		this.emit( `${this.lastMethod}:change`, null, val );
		this.emit( `change`, null, val );
		this.lastMethod = null; // reset after emit
	}

	//-------------------------
	// Set Minimum Value
	//-------------------------
	// Updates minimum constraint and DOM attribute.
	// * val – [number|null]
	setMin( val ) {
		// Update internal variable.
		this.min = val;
		// Change the field min attribute.
		if ( this.field ) {
			if ( val===null )
				this.field.el.removeAttribute( 'min' );
			else this.field.el.min = val;
		}
	}

	//-------------------------
	// Set Maximum Value
	//-------------------------
	// Updates maximum constraint and DOM attribute.
	// * val – [number|null]
	setMax( val ) {
		// Update internal variable.
		this.max = val;
		// Change the field min attribute.
		if ( this.field ) {
			if ( val===null )
				this.field.el.removeAttribute( 'max' );
			else this.field.el.max = val;
		}
	}

	//--------------------------
	// Convenient Method(s)
	//--------------------------
	// Updates the slider range to match limit(s).
	// current selected tab's animation layer.
	//   min – [number] minimum value (default = 0)
	//   max – [number|null] maximum value (exclusive upper limit or total length)
	//   step – [number] increment step (default = 1)
	setRange( min=0, max=0, step=1 ) {
		//--------------------------------
		// Sanitize Input(s)
		//--------------------------------
		min		= parseInt( min );
		max		= parseInt( max );
		step	= parseInt( step );

		// Force sane defaults
		if ( isNaN(max) || max<min ) max = min;

		//--------------------------------
		// Update Range
		//--------------------------------
		// Update range limit(s).
		this.setMin( min );		// minimum range value
		this.setMax( max );		// maximum range value
		this.setStep( step );	// set selected value

		//--------------------------------
		// Clamp Value
		//--------------------------------
		// Clamp value if it exceeds new range
		const current = this.getValue();
		if ( current<min || current>=max ) {
			if ( max>min ) {
				this.setValue( max-1 ); // select last valid index
			}
			else {
				this.setValue( null ); // or -1 if preferred
			}
		}
	}

	//-------------------------
	// Set/Get Step Value
	//-------------------------
	// Get the current step value.
	// RETURNS: [number]
	getStep() { return this.step; }

	// Updates step constraint and DOM attribute.
	// * val – [number|null]
	setStep( val ) {
		// Update internal variable.
		this.step = val;
		// Change the field min attribute.
		if ( this.field ) {
			if ( val===null )
				this.field.el.removeAttribute( 'step' );
			else this.field.el.step = val;
		}
	}
}
