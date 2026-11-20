//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/editing/type/subtype/JestFilePNG.js loaded' );

//-------------------------
// JestFilePNG Class
//-------------------------
// A sidebar menu for graphical user interfaces.
class JestFilePNG extends JestFileImage {
	// Object properties
	//modes			= null;				// [array] of possible modes.

	//---------------------------------
	// Constructor
	//---------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client		- client [object] that this piece belongs to.
	// * origin		- [string] Value of file data origin ("local", "remote", etc.).
	// * stem		- [string] Value of stem (e.g. 'head1').
	constructor( client, origin, stem ) {
		super( client, origin, stem, 'png' ); // call parent constructor
	}

	//--------------------------------
	// Load Tileset File
	//--------------------------------
	// Build the element [object].
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * context	- pre-loaded & rendered JestLevel [object].
	setContext( context ) {
		// Validate argument(s).
		if ( !(context instanceof JestLevel) ) {
			console.warn( `Argument "context" must be of type JestLevel.` );
			return false; // fail
		}
		// Set context reference.
		this.context	= context ?? null;
		return true; // success
	}

	//--------------------------------
	// Load File Data as ElementImage [object]
	//--------------------------------
	// Open a level file.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * url	- [string] Value of URL path to web image file.
	async openFile( url ) {
		// Validate argument(s)
		if ( !url ) return; // if no url, return
		// Use the secretary to a download a file.
		try {
			// Use "this" stem.
			const name		= this.getFilename( url );
			const extension	= this.getExtension( url );




			await this.gallery.loadImages(
				imageFiles.concat([
					{ category: 'TILESET', stem: 'body', extension: 'PNG' },
					{ category: 'BODY', stem: 'body2', extension: 'PNG' },
					{ category: 'BODY', stem: 'body_black', extension: 'PNG' },
					{ category: 'SWORD', stem: 'sword1', extension: 'PNG' }
					])
				);
			// Attempt to get the asset
			const asset		= this.client.gallery.getAsset( category, stem );
			if ( !asset ) {
				console.warn( `Image asset '${category}' not found: ${stem}` );
				return false;
			}



			//---------------------------------
			// Load Image
			//---------------------------------
			// Try loading tileset image into gallery
			await this.client.gallery.loadImages([
				{ category: 'TILESET', stem: stem, extension: 'PNG' }
				])
				.then(
					() => {
						console.log( `Tileset '${stem}' image successfully loaded!` );
						// Update this [object] name.
						this.setName( stem ); // store stem [string]
						// Attempt to get the asset
						const asset		= this.client.gallery.getAsset( 'TILESET', stem );
						// Set the asset as the current image
						this.image		= asset;
					})
				.catch( (err) => console.error(`Tileset "${stem}" image could not be loaded: ${err}`) );




			// Use the Secretary to read a local file's data.
			console.log( `Attempting to read local level file data...` );
			await this.client.secretary.readFile( file );
			console.log( `Local level file data read successfully!` );
			// Create a new level [object] with stem.
			const level		= new JestLevel( this.client, name );
			await level.setup(); // setup new [object]
			// Load-in retrieved data & render its bitmap in the level [object].
			console.log( `Rendering "${name}" level data into level [object]...` );
			/*console.log( this.client.secretary.records );
			console.log( name );*/
			const board		= this.client.secretary.records.levels[name].board;
			level.render( board ); // render level bitmap
			console.log( `Converted "${name}" successfully into level [object]!` );
			// Set new level as this file [object] context.
			this.setContext( level );
			// Call parent openFile method to finish.
			super.openFile();
			return true; // success
		}
		catch ( err ) {
			console.warn( `Level data corrupt or unreadable: ${err.message}` );
			return false; // fail
		}
	}
}
