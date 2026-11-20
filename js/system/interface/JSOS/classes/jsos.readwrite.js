//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/system/interface/JSOS/classes/JSOSReadWrite.js loaded' );
//---------------------------------
// JSOSReadWrite
//---------------------------------
// A hybrid storage system supporting:
// - browser.storage (Firefox)
// - chrome.storage (Chrome)
// - localStorage (Embedded Web)
//---------------------------------
class JSOSReadWrite extends JSOSValidation {
	//---------------------------------
	// Class Variables
	//---------------------------------
	storage				= null;			// [object] The selected storage system
	useChrome			= false;		// [bool] Whether Chrome storage is used
	useBrowser			= false;		// [bool] Whether Firefox browser storage is used
	useLocalStorage		= false;		// [bool] Whether fallback localStorage is used

	//---------------------------------
	// Constructor
	//---------------------------------
	// RETURNS: [object] A new hybrid storage system
	// * options	- [object] Configuration (unused)
	constructor( options={} ) {
		super(); // call parent constructor

		//---------------------------------
		// Detect Available Storage System
		//---------------------------------
		if ( typeof browser!=='undefined' && browser.storage ) {
			this.storage		= browser.storage;
			this.useBrowser		= true;
			console.log( 'jestAlert: using browser.storage' );
		}
		else if ( typeof chrome!=='undefined' && chrome.storage ) {
			this.storage		= chrome.storage;
			this.useChrome		= true;
			console.log( 'jestAlert: using chrome.storage' );
		}
		else if ( typeof localStorage!=='undefined' ) {
			this.storage		= localStorage;
			this.useLocalStorage = true;
			console.log( 'jestAlert: using localStorage' );
		}
		else {
			throw new Error( 'No supported storage system found.' );
		}
	}

	//---------------------------------
	// Write Data
	//---------------------------------
	// RETURNS: [promise] resolve or reject value
	// * key	- [string] Data key
	// * val	- [mixed] Value to store
	writeData( key, val ) {
		return new Promise(
			( resolve, reject ) => {
				if ( this.useChrome || this.useBrowser ) {
					this.storage.local.set(
						{ [key]: val },
						() => {
							// Inside writeData and readData
							const hasChromeError	= ( typeof chrome!=='undefined' && chrome?.runtime?.lastError );
							const hasBrowserError	= ( typeof browser!=='undefined' && browser?.runtime?.lastError );

							if ( hasChromeError || hasBrowserError ) {
								reject( hasChromeError ? chrome.runtime.lastError : browser.runtime.lastError );
							}

							else {
								console.log( `jestAlert: writeData('${key}') saved!` );
								resolve( true );
							}
						});
				}
				else if ( this.useLocalStorage ) {
					try {
						this.storage.setItem( key, JSON.stringify(val) );
						console.log( `jestAlert: writeData('${key}') saved to localStorage!` );
						resolve( true );
					}
					catch ( e ) {
						reject( e );
					}
				}
			});
	}

	//---------------------------------
	// Read Data
	//---------------------------------
	// RETURNS: [promise] resolve with data
	// * key	- [string] Data key to read
	readData( key ) {
		return new Promise(
			( resolve, reject ) => {
				if ( this.useChrome || this.useBrowser ) {
					this.storage.local.get(
						[ key ],
						( result ) => {
							// Inside writeData and readData
							const hasChromeError	= ( typeof chrome!=='undefined' && chrome?.runtime?.lastError );
							const hasBrowserError	= ( typeof browser!=='undefined' && browser?.runtime?.lastError );

							if ( hasChromeError || hasBrowserError ) {
								reject( hasChromeError ? chrome.runtime.lastError : browser.runtime.lastError );
							}

							else {
								const data = result[ key ];
								console.log( `jestAlert: readData('${key}') from extension storage!` );
								resolve( data );
							}
						});
				}
				else if ( this.useLocalStorage ) {
					try {
						const data = JSON.parse( this.storage.getItem(key) );
						console.log( `jestAlert: readData('${key}') from localStorage!` );
						resolve( data );
					}
					catch ( e ) {
						reject( e );
					}
				}
			});
	}

	//---------------------------------
	// Download Data
	//---------------------------------
	// Convert a canvas into a downloadable image file.
	// RETURNS: [void].
	// * filename	- [string] Value of filename to download.
	// * canvas		- [object] HTMLCanvasElement to convert to image.
	// * mime		- [string] Value of MIME type (e.g. 'image/jpeg')
	downloadCanvas( filename, canvas, mime='image/png' ) {
		// Convert giant canvas to PNG data URL
		switch ( mime ) {
			case 'image/png':
			case 'image/jpeg':
				const url	= canvas.toDataURL( mime );
				break;
			default: // unknown image mime type
				console.warn( `Unknown image MIME type: ${mime}` );
				break;
		}
		// File: giantMap.js, line 52, char #1
		const download		= document.createElement('a');	// create an anchor element
		download.href		= url;							// use generated canvas URL
		download.download	= `${filename}.png`;			// filename with extension appended
		// Append the link to the document and trigger a click to start the download
		document.body.appendChild( download );
		download.click();
		document.body.removeChild( download );
	}
}
