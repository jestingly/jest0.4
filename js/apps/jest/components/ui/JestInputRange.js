//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/ui/JestInputRange.js loaded' );

//-----------------------------
// JestInputRange Class
//-----------------------------
// Slider input for range selection with live display.
// Emits: 'input', 'change'
class JestInputRange extends JestInput {
	// Object Properties
	name			= null;		// [string|null] input name
	id				= null;		// [string] HTML id
	defaultValue	= 0;		// [number] starting value
	min				= 0;		// [number] minimum range value
	max				= 100;		// [number] maximum range value
	step			= 1;		// [number] increment step
	valueLabel		= null;		// [object|null] text element to display current value

	//-------------------------
	// Constructor
	//-------------------------
	// Initializes a range input with limits and step.
	// * name			- [string] optional field name
	// * id				- [string] HTML id (auto-generated if not provided)
	// * defaultValue	- [string] Default fallback value
	// * labelText		- [string] label content
	// * min			- [number|null] minimum value
	// * max			- [number|null] maximum value
	// * step			- [number|null] increment step
	constructor( client, name=null, id=null, defaultValue=null, labelText=null,
				 min=0, max=100, step=1 ) {
		super( client );
		// Determine default value, placholder field hint & label.
		this.setName( name ?? null );				// [string] value of field name
		this.setId( id ?? this.skey );				// [string] HTML id
		this.setDefault( defaultValue ?? null );	// [string] default input value
		this.setLabel( labelText ?? null );			// [string] the text for the label
		this.min	= min;
		this.max	= max;
		this.step	= step;
	}

	//-------------------------
	// Build UI
	//-------------------------
	// Builds the slider and value display.
	build( name='range', classes=[] ) {
		if ( classes === null ) classes = [];
		super.build( name, ['range'].mergeUnique( classes ));

		// build input[type=range]
		this.panel.addElements([
			{
				name		: 'input',
				tag			: 'input',
				attributes	:
					{
					type	: 'range',
					id		: this.id,
					name	: this.name,
					value	: this.defaultValue,
					min		: this.min,
					max		: this.max,
					step	: this.step
					}
			},
			{
				name		: 'valueLabel',
				tag			: 'span',
				text		: `${this.defaultValue}`,
				classes		: ['range-value']
			}
		]);

		// store references
		this.field		= this.panel.refs.input;
		this.valueLabel	= this.panel.refs.valueLabel;

		// register DOM events
		this.registerDOMEvent( 'input' );
		this.registerDOMEvent( 'change' );
		this.registerDOMEvent( 'mousedown' );
		this.registerDOMEvent( 'mouseup' );
	}

	//-------------------------
	// Event: Input
	//-------------------------
	// Handles sliding the range.
	// EMITS: input event and updates label
	input( e ) {
		const val = parseFloat( e.target.value );
		this.updateLabel( val );
		this.emit( 'input', null, val );
	}

	//-------------------------
	// Event: Change
	//-------------------------
	// EMITS: change event when range is committed
	change( e ) {
		const val = parseFloat( e.target.value );
		this.updateLabel( val );
		this.emit( 'change', null, val );
	}

	//-------------------------
	// MouseEvent: Down, Up
	//-------------------------
	// Emits change event when mousedown is pressed.
	mousedown( e ) { this.emit( 'mousedown', null, this.getValue() ); }
	// Emits change event when mousedown is released.
	mouseup( e ) { this.emit( 'mouseup', null, this.getValue() ); }

	//-------------------------
	// Update Label
	//-------------------------
	// Syncs text label with slider value
	updateLabel( val ) {
		if ( this.valueLabel )
			this.valueLabel.el.textContent = val;
	}

	//-------------------------
	// Get Current Value
	//-------------------------
	// RETURNS: [number]
	getValue() {
		return this.field ? parseFloat(this.field.el.value) : this.defaultValue;
	}

	//-------------------------
	// Set Current Value
	//-------------------------
	// Sets slider value with clamping and step normalization.
	// * val	– [number] value to set to.
	// * emit	- [boolean] whether to emit an event (defaults to true).
	setValue( val, emit=true ) {
		//--------------------------------
		// Require Field
		//--------------------------------
		// Require field to exist.
		if ( !this.field ) return;

		//--------------------------------
		// Validate Input
		//--------------------------------
		// Value must be a number.
		val	= parseFloat( val );
		if ( isNaN(val) ) return; // skip bad input

		//--------------------------------
		// Empty Range Check
		//--------------------------------
		// If bounds are illegal, fix.
		if ( this.max < this.min )
			this.setMax( this.min );

		//--------------------------------
		// Clamp to [min, max]
		//--------------------------------
		// clamp to [min,max] range
		val	= Math.max( this.min, Math.min(this.max,val) );

		//--------------------------------
		// Snap to Step
		//--------------------------------
		// snap to closest step if step > 0
		if ( this.step>0 ) {
			const offset	= val - this.min;
			const steps		= Math.round( offset / this.step );
			val	= this.min + ( steps * this.step );
		}

		//--------------------------------
		// Prevent Redundant Set
		//--------------------------------
		// Value already set to value.
		if ( parseFloat(this.field.el.value) === val ) {
			// Ensure 'input' event runs (if requested).
			/*if ( emit===true )
				this.input( { target: this.field.el } );*/
			this.updateLabel( val );
			return true; // already set
		}

		//--------------------------------
		// Set UI & Emit
		//--------------------------------
		// update slider and label.
		this.field.el.value = val;
		this.updateLabel( val );
		// Emit the changed event.
		if ( emit )
			this.emit( 'change', null, val );
	}

	//-------------------------
	// Get Minimum Value
	//-------------------------
	// RETURNS: [number]
	getMin() {
		return this.min;
	}

	// -------------------------
	// setMin()
	// -------------------------
	// Sets minimum and clamps max if needed.
	// * val – [number]
	setMin( val ) {
		// Set new minimum range value.
		this.min = val;
		// Ensure min ≤ max
		if ( this.min>this.max ) {
			console.warn( `JestInputRange: min (${this.min}) is greater than max (${this.max}). Clamping max to match.` );
			this.max = this.min;
			if ( this.field )
				this.field.el.max = this.max;
		}
		// Set the new minimum value in the input field.
		if ( this.field )
			this.field.el.min = this.min;
		// Set the value.
		this.setValue( this.getValue() );
	}

	//-------------------------
	// Get Maximum Value
	//-------------------------
	// RETURNS: [number]
	getMax() {
		return this.max;
	}

	// -------------------------
	// setMax()
	// -------------------------
	// Sets maximum and clamps max if needed.
	// * val – [number]
	setMax( val ) {
		// Set new maximum range value.
		this.max = val;
		// Ensure max ≥ min
		if ( this.max < this.min ) {
			console.warn( `JestInputRange: max (${this.max}) is less than min (${this.min}). Clamping min to match.` );
			this.max = this.min;
		}
		// Set the new maximum value in the input field.
		if ( this.field )
			this.field.el.max = this.max;
		// Set the value.
		this.setValue( this.getValue() );
	}

	// -------------------------
	// Convenient Method(s)
	// -------------------------
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
		if ( current<min || current>max ) {
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

	// Updates slider step and revalidates value.
	// * val – [number|string] Must be > 0 or 'any'.
	setStep( val ) {
		// Reject zero step (invalid).
		if ( val===0 ) {
			console.warn( `JestInputRange: step cannot be 0. Defaulting to 1.` );
			val = 1;
		}
		// Allow 'any' or numeric > 0 only.
		if ( val!=='any' && (typeof val!=='number' || val<=0) ) {
			console.warn( `JestInputRange: invalid step "${val}". Using 1.` );
			val = 1;
		}
		this.step = val;
		if ( this.field ) this.field.el.step = val;
		this.setValue( this.getValue() );
	}

}
