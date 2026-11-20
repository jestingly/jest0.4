//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/includes/prototype/drawing.prototype.js loaded' );

//==================================================
// Drawing Helper Method(s)
//==================================================
// Check if a canvas is available to copy, draw, etc.
// RETURNS: [bool] if canvas is ready / readable.
// * canvas - [HTMLCanvasElement] to check
Jest.prototype.isCanvasEmpty = function( canvas ) {
	//---------------------------------
	// Validate Argument(s)
	//---------------------------------
	// Check if canvas is a valid type.
	if ( !(canvas instanceof HTMLCanvasElement) ) {
		console.warn( `Canvas is not of type HTMLCanvasElement` );
		return true; // empty
	}

	//---------------------------------
	// Determine If Canvas Is Empty
	//---------------------------------
	// Get the internal width and height
	const width		= canvas.width;
	const height	= canvas.height;
	if ( width===0 || height===0 ) return true; // empty
	return false; // readable
}

// Check if a canvas is empty picture.
// RETURNS: [bool] if canvas is empty picture.
// * canvas - [HTMLCanvasElement] to check
Jest.prototype.isCanvasBlank = function( canvas ) {
	//---------------------------------
	// Validate Argument(s)
	//---------------------------------
	// Check if canvas is a valid type.
	if ( !(canvas instanceof HTMLCanvasElement) ) {
		console.warn( `Canvas is not of type HTMLCanvasElement` );
		return false; // abort
	}

	//---------------------------------
	// Determine If Canvas Is Empty
	//---------------------------------
	// Access the canvas drawable context.
	const context	= canvas.getContext( '2d' );
	// Get all pixel data as a Uint32Array for better performance
	const pixelBuffer =
		new Uint32Array(
			context.getImageData( 0, 0, canvas.width, canvas.height ).data.buffer
			);
	// Check if every single pixel value is 0 (fully transparent black)
	return !pixelBuffer.some( color => color!==0 );
}
