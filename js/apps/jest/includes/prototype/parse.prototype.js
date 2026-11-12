//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/includes/prototype/parse.prototype.js loaded' );

//==================================================
// Adds file path helpers
//==================================================
// Get the filename without extension from file path.
// RETURNS: [string] Filename without extension
// * filepath - [string] Full URL or path
Jest.prototype.getFilename = function( filepath ) {
	let filename	= this.getFullFilename( filepath );
	let dotIndex	= filename.lastIndexOf( '.' );
	if ( dotIndex===-1 ) return filename;
	return filename.slice( 0, dotIndex );
};

// Get filename fom file path.
// RETURNS: [string] Filename (with extension)
// * filepath - [string] Full URL or path
Jest.prototype.getFullFilename = function( filepath ) {
	let cleaned		= _stripQueryHash( filepath );
	let parts		= cleaned.split( '/' );
	return parts[ parts.length-1 ];
};

//Get file extension from file path.
// RETURNS: [string] File extension (no dot)
// * filepath - [string] Full URL or path
Jest.prototype.getExtension = function( filepath ) {
	let filename	= this.getFullFilename( filepath );
	let dotIndex	= filename.lastIndexOf( '.' );
	if ( dotIndex===-1 ) return '';
	return filename.slice( dotIndex+1 );
};

// Get the folder path from file path.
// RETURNS: [string] Folder path with trailing slash
// * filepath - [string] Full URL or path
Jest.prototype.getFolderPath = function( filepath ) {
	if ( !filepath ) return ''; // nothing
	// In browser File API, path is never present
	if ( typeof filepath !== 'string' ) return '';
	// Safe normalize slashes
	let cleaned		= filepath.replace(/\\/g, '/');
	let lastSlash	= cleaned.lastIndexOf('/');
	if ( lastSlash===-1 ) return '';
	return cleaned.slice( 0, lastSlash+1 );
};

//-------------------------
// Strip ?query and #hash from URL or path
// RETURNS: [string] cleaned path
Jest.prototype.stripQueryHash = function( path ) {
	return path.split( '?' )[0].split( '#' )[0];
}

//--------------------------------
// File Reading & Opening
//--------------------------------
// Convert a URL to fileInfo [object]
Jest.prototype.urlFileinfo = function( url ) {
	// Break URL down info down into parts.
	const folderpath	= this.getFolderPath( url );
	const filename		= this.getFilename( url );
	const extension		= this.getExtension( url );
	// Return fileInfo [object]
	return this.getFileInfo( url, null, null, null, 'remote' );
}
// Convert raw file components into a normalized FileInfo [object].
// RETURNS: [object]
// 		{
// 		extension,	// file extension (e.g. "txt")
// 		stem,		// filename without extension (e.g. "pics1")
// 		filename,	// filename with extension (e.g. "pics1.png")
// 		path,		// file path
// 		file,
// 		handle,
// 		data,
// 		network,	// 'local', 'remote', 'none'
// 		address		// full address
// 		}
// * path		- [string] URL or local file path
// * file		- [object|null] File reference (optional)
// * data		- [any|null] Optional data payload
// * handle		- [any|null] Optional file handle reference
// * network	- [string] One of: 'local', 'remote', 'none'
Jest.prototype.getFileInfo = function( path=null, file=null, data=null, handle=null, network='none' ) {
	//--------------------------------
	// Validate and normalize inputs
	//--------------------------------
	let rawPath			= ( typeof path==='string' && path.trim() ) ? path.trim() : null;
	let fileObj			= ( file && typeof file==='object' ) ? file : null;
	let resultData		= data ?? null;
	let resultHandle	= handle ?? null;

	// Check if filename supplied.
	if ( !rawPath && fileObj?.name )
		rawPath = fileObj.name;

	// If no raw path exists, return false.
	if ( !rawPath ) {
		console.warn( 'Invalid path or file input in getFileInfo.' );
		return false;
	}

	//--------------------------------
	// Determine filename from input
	//--------------------------------
	let baseFilename	=
		fileObj?.name
			?? this.getFullFilename(rawPath)
			?? null;

	if ( typeof baseFilename==='string' )
		baseFilename	= baseFilename.trim();

	if ( !baseFilename )
		baseFilename	= null;

	//--------------------------------
	// Extract folder path
	//--------------------------------
	let folderPath		= null;
	const cleanedPath	= this.stripQueryHash( rawPath );
	const lastSlash		= Math.max( cleanedPath.lastIndexOf('/'), cleanedPath.lastIndexOf('\\') );

	if ( lastSlash!==-1 ) {
		const sliced = cleanedPath.slice( 0, lastSlash + 1 ).trim();
		if ( sliced ) folderPath = sliced;
	}

	//--------------------------------
	// Normalize network type
	//--------------------------------
	const validNetworks	= [ 'local', 'remote', 'none' ];
	if ( !validNetworks.includes( network ) )
		network = 'none';

	//--------------------------------
	// Resolve extension and stem
	//--------------------------------
	let fullFilename	= baseFilename ?? 'untitled';
	let extension		= this.getExtension( fullFilename )?.trim() || null;
	let stem			= this.getFilename( fullFilename )?.trim() || null;

	if ( extension==='' ) extension = null;
	if ( stem==='' ) stem = null;

	//--------------------------------
	// Build and return FileInfo
	//--------------------------------
	const fileInfo	= {
		path      : folderPath ?? null,
		filename  : fullFilename,
		extension : extension,
		stem      : stem,
		file      : fileObj,
		handle    : resultHandle,
		data      : resultData,
		network   : network,
		address   : (folderPath && fullFilename) ? folderPath + fullFilename : fullFilename
		};
	return fileInfo; // return [object]
};


// PRIVATE: _stripQueryHash
// RETURNS: [string] Stripped path
// * str - [string] Path with optional ?query or #hash
function _stripQueryHash( str ) {
	return str.split('#')[0].split('?')[0];
}

//--------------------------------
// convertDataType( data, fromType, toType )
//--------------------------------
// Universal data converter for file I/O.
// RETURNS: converted data in target type.
// * data      - raw data (ArrayBuffer, Buffer, string, DataURL)
// * fromType  - 'arrayBuffer', 'buffer', 'text', 'dataURL'
// * toType    - 'arrayBuffer', 'buffer', 'text', 'dataURL'
Jest.prototype.convertData = function( data, fromType, toType ) {
	//--------------------------------
	// Identity Pass-through
	//--------------------------------
	if ( fromType===toType )
		return data;
	//--------------------------------
	// ArrayBuffer → Text
	//--------------------------------
	if ( fromType==='arrayBuffer' && toType==='text' ) {
		return new TextDecoder().decode( data );
	}
	//--------------------------------
	// Buffer → Text
	//--------------------------------
	if ( fromType==='buffer' && toType==='text' ) {
		return Buffer.isBuffer(data) ? data.toString( 'utf8' ) : null;
	}
	//--------------------------------
	// Text → ArrayBuffer
	//--------------------------------
	if ( fromType==='text' && toType==='arrayBuffer' ) {
		return new TextEncoder().encode( data ).buffer;
	}
	//--------------------------------
	// Text → Buffer
	//--------------------------------
	if ( fromType==='text' && toType==='buffer' ) {
		return Buffer.from( data, 'utf8' );
	}
	//--------------------------------
	// ArrayBuffer → Buffer
	//--------------------------------
	if ( fromType==='arrayBuffer' && toType==='buffer' ) {
		return Buffer.from( new Uint8Array(data) );
	}
	//--------------------------------
	// Buffer → ArrayBuffer
	//--------------------------------
	if ( fromType==='buffer' && toType==='arrayBuffer' ) {
		return data.buffer.slice( data.byteOffset, data.byteOffset + data.byteLength );
	}
	//--------------------------------
	// Text → DataURL
	//--------------------------------
	if ( fromType==='text' && toType==='dataURL' ) {
		const blob = new Blob( [data], { type: 'text/plain' } );
		return URL.createObjectURL( blob );
	}
	//--------------------------------
	// ArrayBuffer → DataURL
	//--------------------------------
	if ( fromType==='arrayBuffer' && toType==='dataURL' ) {
		const blob = new Blob( [data] );
		return URL.createObjectURL( blob );
	}
	//--------------------------------
	// Buffer → DataURL
	//--------------------------------
	if ( fromType==='buffer' && toType==='dataURL' ) {
		const blob = new Blob( [data] );
		return URL.createObjectURL( blob );
	}
	//--------------------------------
	// DataURL → Text (warning: async not handled)
	//--------------------------------
	if ( fromType==='dataURL' && toType==='text' ) {
		// WARNING: This is incomplete - parsing DataURL sync is non-trivial.
		const parts = data.split( ',' );
		if ( parts.length===2 ) {
			return decodeURIComponent( atob( parts[1] ) );
		}
	}
	//--------------------------------
	// Text → Blob
	//--------------------------------
	if ( fromType==='text' && toType==='blob' ) {
		return new Blob( [data], { type: 'text/plain' } );
	}
	//--------------------------------
	// ArrayBuffer → Blob
	//--------------------------------
	if ( fromType==='arrayBuffer' && toType==='blob' ) {
		return new Blob( [data] );
	}
	//--------------------------------
	// Buffer → Blob
	//--------------------------------
	if ( fromType==='buffer' && toType==='blob' ) {
		return new Blob( [data] );
	}
	//--------------------------------
	// DataURL → Blob (sync not possible, warn)
	//--------------------------------
	if ( fromType==='dataURL' && toType==='blob' ) {
		console.warn('convertDataType: Cannot convert dataURL to Blob synchronously.');
		return null;
	}
	//--------------------------------
	// Unknown conversion
	//--------------------------------
	console.warn( `convertDataType: Unsupported conversion "${fromType}" → "${toType}".` );
	return null;
};


Jest.prototype.isNumber = function( value ) {
  return typeof value==='number' && isFinite(value);
}

Jest.prototype.isNumberObject = function( n ) {
  return (Object.prototype.toString.apply(n)==='[object Number]');
}

Jest.prototype.isCustomNumber = function( n ) {
  return isNumber(n) || isNumberObject(n);
}

//--------------------------------
// Convert Whitespace to Token
//--------------------------------
// Replaces all whitespace characters in a string.
// RETURNS: [string] converted string
// * str    – [string] input string
// * token – [string] replacement token (default = '␣')
Jest.prototype.encodeWhitespace = function( str, token='%20' ) {
	return ( typeof str==='string' ) ? str.replace( /\s/g, token ) : str;
}

//--------------------------------
// Revert Token to Whitespace
//--------------------------------
// Replaces token with space characters in a string.
// RETURNS: [string] reverted string
// * str    – [string] tokenized string
// * token – [string] token to replace (default = '␣')
Jest.prototype.decodeWhitespace = function( str, token='%20' ) {
	return ( typeof str==='string' )
		? str.replace( new RegExp( token, 'g' ), ' ' )
		: str;
}

//-------------------------
// Clone Object Array ("Obray")
//-------------------------
// Deep-clones an [array] of flat objects by shallow copying each item.
// RETURNS: [array] of cloned objects.
// * list - [array] of object(s) with simple key:value pairs.
Jest.prototype.cloneObray = function( list ) {
	if ( !Array.isArray(list) ) return [];
	return list.map( o => ({ ...o }) ); // shallow clone per object
}
