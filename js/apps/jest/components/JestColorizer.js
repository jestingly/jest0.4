//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/JestGameboard.js loaded' );

//-------------------------
// JestGameboard Class
//-------------------------
class JestColorizer extends JestSavable {
	// Object properties
	
	//-------------------------
	// Constructor
	//-------------------------
	// Creates the object.
	// * client		- [object] Application client creating the object.
	constructor( client ) {
		// Call the parent object constructor
		super( client );				// construct the parent
		this.client		= client;		// store the client [object] reference
		//---------------------------------
		// Setup object
		//---------------------------------
		this.setup();					// setup the object
		this.build();					// render the object
	}

	//-------------------------
	// Initialization Methods
	//-------------------------
	// Setup the object [object].
	// RETURNS: [boolean] `true` on success else `false` on fail.
	function applyPalette( ctx, x, y, colors ) {
		const imageData = ctx.getImageData( x, y, 32, 32 );
		const data = imageData.data;
		for ( let i = 0; i < data.length; i += 4) {
			const r = data[i], g = data[i+1], b = data[i+2];
			const hex = rgbToHex(r, g, b);
			if (hex === '#ff0000') setColor(data, i, colors.sleeve);
			if (hex === '#ffad6b') setColor(data, i, colors.glove);
			if (hex === '#ffffff') setColor(data, i, colors.coat);
			if (hex === '#0000ff') setColor(data, i, colors.belt);
			if (hex === '#ce1829') setColor(data, i, colors.shoe);
		}
		ctx.putImageData(imageData, x, y);
	}

	function setColor(data, i, color) {
		data[i] = parseInt(color.substr(1,2), 16);
		data[i+1] = parseInt(color.substr(3,2), 16);
		data[i+2] = parseInt(color.substr(5,2), 16);
	}

	function rgbToHex(r, g, b) {
		return "#" + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
	}

	function getRandomColor() {
		const letters = '0123456789ABCDEF';
		let color = '#';
		for (let i = 0; i < 6; i++) {
			color += letters[Math.floor(Math.random() * 16)];
		}
		return color;
	}
}
