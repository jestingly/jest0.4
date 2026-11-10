//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/sound/JestSoundboard.js loaded' );

//-------------------------
// JestSoundboard Class
//-------------------------
// Handles preloading, caching, and playing sound from downloaded sources.
class JestSoundboard extends JestSavable {
	// Properties
	filetypes			= [ 'wav', 'mp3' ];	// [array] of filetype extension(s).
	mute				= false;		// [bool] Whether sounds are on or off.
	sounds				= {};			// [object] Preloaded sound objects to play.
	soundCache			= {};			// [Object] Stores preloaded sound files.
	defaultVolume		= 0.2;			// [float] Default volume (20%).
	volume				= 100;			// [float] Volume multiplier value (100%).

	// --------------------------------
	// Constructor
	// --------------------------------
	// Construct the [object].
	// * client		- [object] Application client creating the object.
	// * name		- [string] Value of soundboard name (e.g. 'primary').
	constructor( client, name ) {
		// Call the parent object constructor
		super( client, name );			// construct the parent
	}

	//-------------------------
	// File Information
	//-------------------------
	// Obtain a sound key.
	// RETURNS: [void].
	// * stem		- [string] Sound filename stem (e.g. 'footstep').
	soundKey( stem ) { return `${stem}`; }

	//-------------------------
	// Download File(s)
	//-------------------------
	// Download sound file(s) asynchronously & store as JestSound [objects] for playback.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * addresses	- [array] Full address names (e.g. 'jump.wav').
	//   network	- [string] One of: 'local', 'remote'
	async preload( addresses, network='remote' ) {
		// --------------------------------
		// Validate argument(s)
		// --------------------------------
		// 'addresses' must be an [array<string>].
		if ( !jsos.prove(addresses,'stray') )
			throw new Error( `Argument 'filenames' must be of type [stray].` );
		// Convert [string] to [array].
		if ( !jsos.prove(addresses,'array') )
			addresses = [ addresses ]; // [array]

		// --------------------------------
		// Validate & Build Queue
		// --------------------------------
		// Iterate requested sound file(s) & verify request type(s).
		const queue	= [];
		for ( const address of addresses ) {
			console.log( address );
			// Get file info using the address.
			const fileInfo	= this.client.getFileInfo( address, null, null, null, network );
			// Validate filetype.
			const extension	= fileInfo.extension; // filetype extension [string]
			if ( !this.filetypes.includes(extension) ) {
				console.warn( `Unknown requested file type: ${extension}` );
				continue; // abort
			}
			// Address is okay, add to queue.
			queue.push( address );
		}
		// Check if queue has any item(s).
		if ( queue.length<1 ) {
			console.warn( `No valid sound files requested.` );
			return false; // abort
		}

		// --------------------------------
		// Process Queue & Download
		// --------------------------------
		// Attempt to load requested sound files(s).
		await this.client.secretary.loadFiles( queue );

		// --------------------------------
		// Render Downloaded Sound File(s)
		// --------------------------------
		// Iterate sound file data & create [objects]
		for ( const address of queue ) {
			// Create a new JestSound instance & render parsed sound data.
			const record	= this.client.secretary.getRecord(address) ?? null;
			if ( !record ) { // record not found
				console.warn( `Cannot find sound data: ${address}` );
				continue; // don't cache non-existent sound
			}
			// Continue to create sound [object].
			const sound  = new JestSound( this.client, address );
			const key    = this.soundKey( address );
			this.sounds[key] = sound;		// store sound [object]
			sound.setup();					// call any necessary setup
			sound.render( record.blob );	// render blob into JestSound [object]
		}
		console.log( this.sounds );
		return true; // success
	}

	//-------------------------
	// Play a Sound
	//-------------------------
	// Plays an sound file from memory.
	// RETURNS: [void].
	// * filename		- [string] Sound filename stem (e.g. 'footstep').
	// * type			- [string] Value of type (e.g. 'wav', 'mp3').
	// * volume			- [float] Playback volume (default: `defaultVolume`).
	// * simultaneous	- [bool] If true, plays a separate instance instead of reusing the cached instance.
	playSound( filename, type='wav', volume=this.defaultVolume, simultaneous=true ) {
		//-------------------------
		// Check For Mute
		//-------------------------
		// Check if sound is turned off.
		if ( this.mute ) return;
		//-------------------------
		// Access Sound & Play
		//-------------------------
		// Retrieve the parsed sound object from sounds stack.
		const key	= this.soundKey( `${filename}.${type}` );
		const sound	= this.sounds?.[key] || null; // get sound [object]
		if ( !sound ) {
			console.error( `Sound not found in cache: ${key}` );
			return;
		}
		// Multiply sound by soundboard volume
		volume *= this.volume/100;
		// Attempt to play the sound
		sound.play( volume, simultaneous ); // call JestAudio play
	}

	//-------------------------
	// pauseSound
	//-------------------------
	// Pauses a currently playing sound file.
	// * key		- [string] Sound key.
	// RETURNS: [void].
	//pauseSound( key ) {
		/*const sound = this.soundCache[key];
		if ( sound && !sound.paused ) {
			sound.pause();
			console.log(`Sound paused: ${key}`);
		}
		else console.error( `Sound not found or already paused:`, key );*/
	//}

	//-------------------------
	// stopSound
	//-------------------------
	// Stops playback and resets an sound file.
	// * key		- [string] Sound key.
	// RETURNS: [void].
	//stopSound( key ) {
		/*const sound	= this.soundCache[key];
		if ( sound ) {
			sound.pause();			// Stop playback.
			sound.currentTime = 0;	// Reset to the beginning.
			console.log( `Sound stopped: ${key}` );
		}
		else console.error( `Sound instance not found:`, key );*/
	//}
}
