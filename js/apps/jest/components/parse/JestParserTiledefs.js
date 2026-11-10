//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/parse/JestParserTiledefs.js loaded' );

//-------------------------
// JestParserTiledefs Class
//-------------------------
class JestParserTiledefs extends JestGamepiece {
	// Declare properties
	keywords		= null;				// [object] Set array of acceptable keyword(s).

	//-------------------------
	// Instantiation
	//-------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client		- client [object] that this piece belongs to.
	constructor( client ) {
		super( client ); // call parent constructor
		// Define reserved keywords
		this.keywords = new Set( ['NONBLOCK', 'BLOCK'] );
	}

	//-------------------------
	// Initialization Methods
	//-------------------------
	// Parse tileset definition file content.
	// RETURNS: [object] { defs, types } else `false` on fail.
	parse( { data: fileContent } ) {
		// Separate lines by hard-return & filter out empty lines
		const lines		= fileContent.split('\n').map( line=>line.trim() ).filter( line=>line.length>0 );
		// Instantiate return data
		let defs		= {};
		let types		= [];
		// Instantiate temporary variables
		let currentType	= null;
		// Iterate each line & separate numeric from text
		for ( let line of lines ) {
			if ( !currentType ) {
				// Look for a new type declaration (any uppercase word)
				if ( /^[A-Z]+$/.test(line) ) {
					currentType			= line;
					//console.log( `${currentType}END` );
					defs[currentType]	= [];
					types.push( currentType );
				}
			}
			else {
				// Look for the END marker
				if ( line===`END${currentType}` )
					currentType		= null;
				else {
					// Otherwise, capture indices (numbers or encoded strings)
					const indices	= line.split(',').map( item=>item.trim() ).filter( item=>item.length>0 );
					defs[currentType].push( ...indices );
				}
			}
		}
		// Return parsed file content
		return { defs, types };
	}
}
