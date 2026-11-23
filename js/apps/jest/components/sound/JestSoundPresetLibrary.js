//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/sound/JestSoundPresetLibrary.js loaded' );

//-------------------------
// JestSoundPresetLibrary Class
//-------------------------
// Stores named sound presets for one component or interface.
class JestSoundPresetLibrary extends JestSavable {
	// Library properties
	soundboard = null;       // [JestSoundboard] Soundboard used for playback.
	presets    = new Map();  // [Map] Named JestSoundPreset objects.

	//---------------------------------
	// Constructor
	//---------------------------------
	// Create a library and install its initial sound presets.
	// * client     - [object] Application client creating the object.
	// * soundboard - [JestSoundboard] Soundboard used for playback.
	// * presets    - [object] Initial presets keyed by event name.
	constructor( client, presets={} ) {
		// Call the parent object constructor
		super( client, name ); // construct the parent

		// Add each initial preset as an independent copy.
		for ( const [name,preset] of Object.entries(presets) )
			this.add( name, preset );
	}

	//-------------------------
	// Preset Handling
	//-------------------------
	// Add or replace a named sound preset.
	// RETURNS: [JestSoundPresetLibrary] This library for chaining.
	// * name   - [string] Event name (e.g. 'btnRelease').
	// * preset - [JestSoundPreset] Sound assigned to the event.
	add( name, preset ) {
		// Require a sound preset so playback receives the expected properties.
		if ( !(preset instanceof JestSoundPreset) )
			throw new TypeError( `Sound preset '${name}' must be a JestSoundPreset.` );

		// Copy the preset so changes in another component cannot affect this one.
		const copy =
			new JestSoundPreset(
				preset.stem,
				preset.extension,
				preset.volume
				);

		// Add the preset or replace the existing event sound.
		this.presets.set( name, copy );
		return this; // allow chained additions
	}

	// Get the live preset so its properties can be modified directly.
	// RETURNS: [JestSoundPreset|null] Preset if found, otherwise null.
	// * name - [string] Event name.
	get( name ) {
		return this.presets.get(name) ?? null;
	}

	// Remove a sound assignment, leaving that event silent.
	// RETURNS: [boolean] Whether an assignment was removed.
	// * name - [string] Event name.
	remove( name ) {
		return this.presets.delete( name );
	}

	//-------------------------
	// Playback
	//-------------------------
	// Play the sound assigned to an event.
	// RETURNS: [boolean] Whether the event had a sound assignment.
	// * name         - [string] Event name.
	// * simultaneous - [bool] Whether another instance may play.
	play( name, simultaneous=true ) {
		// A missing assignment means this event has no sound.
		const preset = this.get( name );
		if ( !preset ) return false;

		// Let the soundboard handle caching, mute, and master volume.
		this.client.soundboard.play( preset, simultaneous );
		return true;
	}
}
