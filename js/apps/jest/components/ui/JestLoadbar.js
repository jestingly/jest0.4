//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/ui/JestLoadbar.js loaded' );

//-------------------------
// JestLoadbar Class
//-------------------------
// A loadbar for handling progress event(s).
class JestLoadbar extends JestElement {
	// Declare properties
	percent		= null;			// [element] of percent counter
	bar			= null;			// [element] of animated bar
	current		= 0;			// [int] value of current load progress
	total		= 1;			// [int] value of total to load

	//---------------------------------
	// Constructor
	//---------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client		- client [object] that this piece belongs to.
	constructor( client ) {
		super( client ); // call parent constructor
	}

	//---------------------------------
	// Initialization
	//---------------------------------
	// Build the element [object].
	// RETURNS: [void].
	// * name		- unique [string] value of component name in the system.
	// * classes	- [array] of classes to add to panel element.
	build( name='jest-loadbar', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		super.build( "div", name, ['jest-loadbar'].mergeUnique(classes) );
		//---------------------------------
		// Create Loading Animated Bar Element
		//---------------------------------
		// Add bar element to loadbar panel.
		this.panel.addElements([{
			name		: 'bar',
			tag			: 'div',
			classes     : [ 'jest-loadbar-bar' ]
			}]);
		this.bar		= this.panel.refs.bar;		// cross-reference
		//---------------------------------
		// Create Percent Text Element
		//---------------------------------
		// Add text element to bar.
		this.bar.addElements([{
			name		: 'text',
			tag			: 'div',
			text		: `0%`,
			classes		: ['jest-loadbar-text']
			}])
		this.percent	= this.bar.refs.text;	// cross-reference
		return true; // success
	}

	//---------------------------------
	// Action Handling
	//---------------------------------
	// Reset the loadbar to 0
	// RETURNS: [void].
	reset() {
		// Add end animation.
		this.jot( 'loading', 'pending' );	// set state to pending
		// Toggle visual CSS classes.
		jsos.classflip( this.bar.el, 'pending', ['tracking','complete'] );	// visual classes
		// Reset loadbar width & text
		this.update( 0, 1 );
		this.bar.el.offsetWidth; // trigger reflow
	}

	// Set loadbar to active
	// RETURNS: [void].
	activate() {
		// Activate the bar
		this.jot( 'loading', 'tracking' );	// set state to tracking
		jsos.classflip( this.bar.el, 'tracking', ['pending','complete'] );	// visual classes
	}

	// Set to active
	// RETURNS: [void].
	complete() {
		// Add end animation
		this.jot( 'loading', 'complete' );	// set state to complete
		jsos.classflip( this.bar.el, 'complete', ['pending','tracking'] );	// visual classes
		// Fully expand loadbar width & text
		this.update( 1, 1 );
		// Remove the animation class after completion
		setTimeout(
			() => {
				if ( this.skim('loading')==='complete' )
					this.el.classList.remove( 'complete' );
			}, 1500 );
		return true; // success
	}

	// Update the loadbar visual animation
	// RETURNS: [void].
	// current	- [number] Of current progress.
	// total	- [number] Of total value (used to calculate percent).
	update( current=null, total=null ) {
		// Update total if necessary.
		this.current				= current ?? this.current+1;
		this.total					= total ?? this.total;
		// Update loadbar bar percentage text
		const progress				= Math.min( (this.current/this.total) * 100, 100 );
		// Update style to display progress.
		this.bar.el.style.width		= `${progress}%`;
		this.percent.el.textContent	= `${Math.round(progress)}%`;
	}
}
