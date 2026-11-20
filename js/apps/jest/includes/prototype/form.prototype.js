//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/includes/prototype/form.prototype.js loaded' );

/*//--------------------------
// Layer Handling
//--------------------------
// Updates the layer selector slider range to match.
// current selected tab's animation layer.
// * count - [int] Total number of layers (sets max to count-1).
Jest.prototype.setRange = function( max, min=0, step=1 ) {
	// Clamp count & calculate index.
	if ( typeof count!=='number' || count<=0 ) return;
	count = Math.max( 1, parseInt(count) || 0 ); // ensure at least 1 frame
	const lastIndex = count;

	// Update range limit(s).
	this.layerRange.setMax( lastIndex );	// maximum range value
	this.layerRange.setMin( 1 );			// minimum range value
	this.layerRange.setStep( 1 );			// set selected value

	// Clamp value if it exceeds new range
	const current = this.layerRange.getValue();
	if ( current>lastIndex )
		this.layerRange.setValue( lastIndex );
}*/
