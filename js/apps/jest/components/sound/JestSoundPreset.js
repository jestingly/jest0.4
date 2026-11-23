//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/sound/JestSoundPreset.js loaded' );

//-------------------------
// JestSoundPreset Class
//-------------------------
// Stores the filename and playback volume for a sound.
class JestSoundPreset {
	// Sound properties
	stem      = '';     // [string] Filename without its extension.
	extension = 'wav';  // [string] Filename extension without the dot.
	volume    = 0.2;    // [float] Playback volume (20%).

	//---------------------------------
	// Constructor
	//---------------------------------
	// Create a sound preset that can be passed to JestSoundboard.
	// * stem      - [string] Sound filename stem (e.g. 'footstep').
	// * extension - [string] Sound extension (e.g. 'wav', 'mp3').
	// * volume    - [float] Playback volume.
	constructor( stem, extension='wav', volume=0.2 ) {
		// Store the requested sound and its playback volume.
		this.stem      = stem;
		this.extension = extension;
		this.volume    = volume;
	}

	//-------------------------
	// Modify Preset
	//-------------------------
	// Change the filename stem and return this preset for chaining.
	// * stem - [string] Sound filename stem.
	setStem( stem ) {
		this.stem = stem; // store filename stem
		return this;      // allow chained changes
	}

	// Change the filename extension and return this preset for chaining.
	// * extension - [string] Extension without the dot.
	setExtension( extension ) {
		this.extension = extension; // store extension
		return this;                // allow chained changes
	}

	// Change the playback volume and return this preset for chaining.
	// * volume - [float] Playback volume.
	setVolume( volume ) {
		this.volume = volume; // store playback volume
		return this;          // allow chained changes
	}
}
