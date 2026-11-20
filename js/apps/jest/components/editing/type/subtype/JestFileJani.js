//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/editing/type/subtype/JestFileJani.js loaded' );

//-------------------------
// JestFileJani Class
//-------------------------
// A system file class for loading and viewing loaded jani file data.
class JestFileJani extends JestFileImage {
	// Object properties
	//modes			= null;				// [array] of possible modes.
	view			= null;				// AnimationView [object]

	//---------------------------------
	// Constructor
	//---------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client		- client [object] that this piece belongs to.
	// * origin		- [string] Value of file data origin ("local", "remote", etc.).
	// * stem		- [string] Value of stem (e.g. 'jani1').
	constructor( client, origin, stem ) {
		super( client, origin, stem, 'nw' ); // call parent constructor
	}

	//-------------------------
	// Teardown Method(s)
	//-------------------------
	// Destroy the view [object]
	// RETURNS: [void].
	destroy() {
		//-------------------------
		// Teardown Method(s)
		//-------------------------
		// Call parent constructor.
		super.destroy(); // parent destroy()

		//-------------------------
		// Teardown Method(s)
		//-------------------------
		// Delete [object] references.
		this.data		= null;
		this.context	= null;
	}

	//--------------------------------
	// Context Handling Method(s)
	//--------------------------------
	// Build the element [object].
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * context	- pre-loaded & rendered JestJani [object].
	setContext( context ) {
		// Validate argument(s).
		if ( !(context instanceof JestJani) ) {
			console.warn( `Argument "context" must be of type JestJani.` );
			return false; // fail
		}
		// Set context reference.
		console.log( `Setting JestJani [object] as "context".` );
		this.context	= context ?? null;
		return true; // success
	}

	//--------------------------------
	// Load File Data as JestJani [object]
	//--------------------------------
	// Open a jani file.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * fileInfo	- [object] { path, handle, file, data } or [null] for new.
	async openFile( fileInfo ) {
		//--------------------------------
		// Create New Jani [object]
		//--------------------------------
		// Call parent to begin opening the file.
		await super.openFile( fileInfo );	// pass file info to parent
		const stem	= this.stem;			// Use filename "stem" as shorthand for filename.
		let jani	= null;					// default jani value

		//--------------------------------
		// Build New Empty JANI From Scratch
		//--------------------------------
		// Create empty jani if no file opened.
		if ( fileInfo.network==='none' ) {
			console.log( 'No File Data Supplied: Generating jani using empty file data...' );
			//--------------------------------
			// Setup JestJani [object]
			//--------------------------------
			// Instantiate the JestJani [object].
			jani		= new JestJani( this.client, stem, this.client.config.janiSpan );
			await jani.setup();			// setup new [object]
			// Create animation [object]
			const ani	= new AnimationAnimation( stem );
			// Load animation into JestJani [object].
			jani.setAnimation( ani );	// set reference
			//--------------------------------
			// Setup Animation
			//--------------------------------
			// Setup default options.
			ani.options['LOOP']			= true;
			ani.options['CONTINUOUS']	= true;
		}

		//--------------------------------
		// Generate JANI From Loaded File Data
		//--------------------------------
		else {
			console.log( 'File Data Supplied: Generating jani using file data...' );
			//--------------------------------
			// Clear Newly Downloaded Record Cache
			//--------------------------------
			// Attempt to get the downloaded record (to clear cache).
			const secretary		= this.client.secretary;	// secretary [object]
			const transmitter	= this.client.transmitter;	// transmitter [object]
			const record		= secretary.getRecord( fileInfo.address, 'local' );
			//console.log( record );
			// Clear the record from secretary & transmitter cache.
			secretary.removeRecord( fileInfo.address, 'local' );
			transmitter.removeFromCache( fileInfo.address, true );
			//--------------------------------
			// Access Generated [JestJani] Instance
			//--------------------------------
			// Access the generated JestJani [object] by address.
			jani	= this.client.fantascope.getFile( fileInfo.address, 'local' );
			//console.log( jani );
		}

		//--------------------------------
		// Render Animation Into JANI
		//--------------------------------
		console.log( `Converted "${stem}" successfully into JANI [object]!` );
		// Load generated animation into JestJani [object].
		console.log( `Validating "${stem}" animation data inside JANI [object]...` );
		if ( !(jani.animation instanceof AnimationAnimation) ) {
			console.warn( `Animation failed to generate: ${stem}` );
		}
		else {
			console.log( `Animation successfully generated: ${stem}` );
			//console.log( jani.animation );
			//--------------------------------
			// Create Default Animation View
			//--------------------------------
			// Create a generic default animation view.
			const view		= jani.addView( 'default' );
			this.view		= view; // set view
			//--------------------------------
			// Center View On Canvas
			//--------------------------------
			// Calculate the full area + bleed to compute center.
			const config	= this.client.config;
			let centerX, centerY;
			centerX = centerY = (config.janiFullSpan/2) - (config.janiSpan/2);
			// Move view to the center of the canvas.
			this.view.move( centerX, centerY );
			//--------------------------------
			// Pause View On First Frame
			//--------------------------------
			// Turn off existing avatar
			view.reset().enable().pause();	// reset, enable, then pause
			view.setFrameIndex( 0 );		// default to first frame
		}

		//--------------------------------
		// Finish & Set Context
		//--------------------------------
		// Set the jani context.
		this.setContext( jani );

		//-----------------------------
		// Emit Various Event(s)
		//-----------------------------
		// Emit a load file event with data [objects].
		this.emit( 'openFile', null, { jani } );
		return true; // success
	}

	//-------------------------
	// Save to Disk
	//-------------------------
	// Save the current data to disk using File System Access API (or fallback).
	// • Try primary save method
	// 	- if success → return true
	// 	- if user canceled → return false (skip fallback!)
	// 	- if error → fallback (if allowed)
	// RETURNS: [Promise<boolean>] true on success.
	// * method		- [string] Value: "new", "overwrite", "cloud", "download"
	// * fallback	- [bool] Allow fallback forced download (default: true)
	async saveToDisk( method="overwrite", fallback=true ) {
		//--------------------------------
		// Parse Animation Into Writeable File Data
		//--------------------------------
		// Parse the animation into file data.
		const ani	= this.context.animation;
		const data	= this.parseAnimationToJANI( ani );

		// Check if animation parsed properly.
		if ( !data ) {
			console.warn( 'File could not be saved!' );
			console.log( ani );
			return false; // failed
		}
		// Update internal data (to be saved).
		else this.data	= data;

		//--------------------------------
		// Attempt to Write Parsed Data
		//--------------------------------
		// Save data to file on local disk.
		switch ( method ) {
			case "cloud":
				// Check for cloud handler.
				if ( this.client.cloud ) {
					// Get JestCloud [object]
					await this.client.cloud.save( this, "manual" );
				}
				break;
			case "download":
			case "overwrite":
			case "new":
				const forceSaveAs = method==="new" ? true : false;
				super.saveToDisk( 'text/plain', forceSaveAs, fallback );
				break;
		}
	}

	// Convert `animation` object to JANI-compatible format (text output)
	// INPUT:
	// • animation.frames	– [array] Frame objects
	// • animation.groups	– [object] groupName => defaultFile
	// • animation.sprites	– [object] sid => SpriteObject (sx, sy, w, h, label)
	// OUTPUT:
	// • [string] Raw text for JANI file
	parseAnimationToJANI( animation ) {
		//--------------------------------
		// Generate SPRITE block
		//--------------------------------
		// Compile each defined sprite as a sprite line for the final parsed file data.
		const spriteLines =
			Object.entries( animation.sprites ).map(
				( [ sid, sprite ] ) => {
					const id		= parseInt( sid );
					const group		= sprite.group || "UNKNOWN";
					const sx		= sprite.sx;
					const sy		= sprite.sy;
					const width		= sprite.width;
					const height	= sprite.height;
					const label		= sprite.label || '';
					return `SPRITE ${id.toString().padStart(4,' ')}${group.padEnd(12)}${sx.toString().padStart(4)}${sy.toString().padStart(4)}${width.toString().padStart(4)}${height.toString().padStart(4)}${label}`;
				});

		//--------------------------------
		// Generate OPTS block
		//--------------------------------
		// Begin animation option(s) lines.
		const optsLines = [ 'OPTS' ]; // opening tag
		// Compile options inside of the file data.
		if ( animation.loop===true ) optsLines.push( 'LOOP' );
		//optsLines.push( 'SETBACKTO idle' );
		Object.entries( animation.groups ).map(
			( [ group, defaultImage ] ) => {
				optsLines.push( `DEFAULT${group.toUpperCase()} ${defaultImage}` );
			}),
		// Append animation option(s) closer tag.
		optsLines.push( 'OPTSEND' );

		//--------------------------------
		// Generate ANI block
		//--------------------------------
		// Begin animation frame(s) lines.
		const aniLines = [ 'ANI' ]; // opening tag
		// Iterate each frame & compile lineup of sprite reference(s) in each layer.
		animation.frames.forEach(
			frame => {
				// Each frame has 4 layers, treated as one frame (multidirectional)
				frame.layers.forEach(
					layer => {
						const line =
							layer.stickers.map(
								sticker => {
									const sid	= sticker.sid;
									const x		= sticker.x;
									const y		= sticker.y;
									return `${sid.toString().padStart(4)}${x.toString().padStart(4)}${y.toString().padStart(4)}`;
								}).join( ', ' );
						aniLines.push( line );
					});
				// Add a blank space between each frame.
				aniLines.push( '' );
			});
		// Append animation frame(s) closer tag.
		aniLines.push( 'ANIEND' );

		//--------------------------------
		// Combine All
		//--------------------------------
		// Push all parts into the file output data.
		const outputLines =
			[
				...spriteLines,
				'',
				...optsLines,
				'',
				...aniLines
			];
		// Return the final output data.
		return outputLines.join( '\n' );
	}
}
