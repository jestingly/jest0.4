//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/mediacore/animation/AnimatorTickerEvent.js loaded' );

//-------------------------
// Extend Array Prototype
//-------------------------
// Remove value from [array] if it exists.
// RETURNS: new modified [array].
// * value		- [...] value to remove if inside [array].
Array.prototype.remove = function( value ) {
	return this.filter( cls => cls!==value );
}

// Obtain first value of an [array].
// RETURNS: [...] first value of [array].
Array.prototype.first = function() {
	return this[0]; // first element
}

//-----------------------------
// Array.prototype.mergeUnique
//-----------------------------
// Description: Merges this array with another and removes duplicates.
// * otherArray - [array] Array to merge
// RETURNS: [array|string] New value(s) to merge as unique strings.
Array.prototype.mergeUnique = function ( otherArray ) {
	// The argument must be an array or a string.
	if ( typeof otherArray==="string" )
		otherArray = [otherArray]; // make [array]
	else if ( !Array.isArray(otherArray) )
		throw new TypeError('Argument must be an array');
	// Concatenate arrays & filter out non-unique values.
	return Array.from(new Set([...this, ...otherArray]));
};
