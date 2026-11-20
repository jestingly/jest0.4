//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/dom/element/ElementAudio.js loaded' );

//-------------------------
// ElementAudio Class
//-------------------------
// Plays loaded soundbyte built-in JS audio components.
class ElementAudio extends OSElement {
	// Attribute properties
	url      = null;		// [string] value of src URL
	// Playback status properties
	playing  = false;		// [bool] Value indicating playing status (unreliable).
	// Playback timing
	queued   = false;		// [bool] Whether sound is queued to play as soon as ready
	volume   = 1;			// [float] Volume sound should play at.

	//-------------------------
	// Setup [Object]
	//-------------------------
	// Creates the class [object] with configurable components.
	// RETURNS: [void].
	// * options - [object] Configuration options for the class [object].
	constructor( options={} ) {
		// Parse some data
		options.tag = 'audio';
		super( options ); // call OSObject parent constructor
		this.jot( 'source', 'empty' );         // set status
		this.jot( 'playback', 'unplayed' );    // playback empty
		// Store volume.
		this.volume = options.volume ?? 0.2;   // Store internal volume default
		// Setup the [object] before creating the element
		this.setup();   // setup the [object]
		this.render();  // render the [object]
		// Determine if audio should autoplay upon load
		this.queued = options.queued ?? false; // whether to auto-play
		// Call load complete if source preloaded
		if ( this.isReady() ) this.onLoad();
	}

	// Setup the [object].
	// RETURNS: [boolean] true or false.
	setup() {
		super.setup();  // call parent setup method
		// Ensure class(es) include element base class(es)
		this.classes.push( 'jest-audio' );
		return true;    // success
	}

	// Render the [object].
	// RETURNS: [boolean] true or false.
	render() {
		// Remove 'src' attribute if supplied
		let url	= null;
		if ( this.attributes.src ) {
			url	= this.attributes.src;   // save source
			delete this.attributes.src;  // delete attribute src
		}
		super.render(); // call parent render method
		// Apply listener(s)
		this.register( 'loadeddata', 'status', e=>this.onLoad(e), 'dom' );
		// Apply listener(s)
		this.register( 'play', 'playback', e=>this.onPlay(e), 'dom' );
		this.register( 'playing', 'playback', e=>this.onResume(e), 'dom' );
		const stops	=
			[
				'pause', 'ended',
				'abort', 'error',
				'waiting', 'stalled', 'suspend',
				'emptied'
			];
		stops.forEach(
			type => {
				this.register(
					'interrupt', `playback_${type}`,
					e => this.onInterrupt(e), 'dom'
					);
			});
		this.register( 'ended', 'playback', e=>this.onEnd(e), 'dom' );
		// Set source if exists
		const finalURL = url ?? this._options?.objectURL;
		if ( finalURL )
			this.setSrc( finalURL ); // set supplied source
		return true; // success
	}

	//-------------------------
	// Set Playback Volume
	//-------------------------
	// Sets the audio element volume and stores internally.
	// * volume - [float] Value between 0.0 and 1.0
	setVolume( volume ) {
		// Require volume to be a number.
		if ( typeof volume==='number' )
			this.volume = Math.min( 1, Math.max(0,volume) ); // clamp
		// Set volume on element.
		this.el.volume  = this.volume; // apply immediately
	}

	//-------------------------
	// Setting Source
	//-------------------------
	// Set the element src attribute.
	// RETURNS: [boolean] true or false.
	// * url - [string] value of attribute source URL.
	setSrc( url ) {
		// Change status to unloaded & parse URL
		this.jot( 'source', 'unloaded' );  // set status
		this.url = jestGetURL( url );      // update URL
		// Apply the src URL
		this.el.setAttribute( 'src', this.url );
		return true;
	}

	// Determine if media is ready
	// RETURNS: [boolean] true or false.
	isReady() {
		// Determine if media is ready
		const status = this.skim( 'source' )
		// 2 = HAVE_CURRENT_DATA, means it has loaded enough to play
		const ready  = this.el.readyState >= 2;
		if ( ready && status!=='loaded' )
			this.jot( 'source', 'loaded' );
		return ready; // return ready state
	}

	//-------------------------
	// Playback Handling
	//-------------------------
	// Plays the audio from the beginning.
	// * volume		- [float] Playback volume.
	play( volume=null ) {
		// Make sure file is already loaded
		if ( !this.isReady() ) {
			// console.warn( `Cannot play audio before load.` );
			return; // abort (not ready)
		}
		// If queued, it is not queued anymore
		if ( this.queued===true )
			this.queued = false; // no longer queued
		// Set audio volume.
		if ( typeof volume==='number' )
			this.setVolume( volume ); // override
		else this.setVolume( this.volume ); // use internal
		// Play audio stream.
		this.el.play().catch(
			err => console.error( `Error playing ${this.name}:`, err )
			);
	}

	// Safely attempts to play an audio element.
	// RETURNS: [Promise<boolean>] Whether playback started successfully.
	//----------------------------
	// NOTE: Browser autoplay policies may prevent audio from playing until
	// the user interacts with the page.
	// Autoplay restrictions are expected browser behavior and should
	// not be treated as fatal application errors.
	//----------------------------
	// * audio	- [HTMLAudioElement] Audio element to play
	async safePlayAudio( audio ) {
		// Reject invalid audio elements before attempting playback.
		if ( !audio || typeof audio.play!=="function" ) {
			console.warn( "[ElementAudio] Invalid audio element." );
			return false; // failed
		}

		// Try to safely play the audo playback.
		try {
			// Attempt normal audio playback.
			await audio.play();
			// Playback successfully started.
			return true;
		}
		catch ( error ) {
			// Autoplay restrictions are expected and nonfatal.
			if ( error.name==="NotAllowedError" ) return false;
			// Report unexpected playback failures.
			console.error( "[ElementAudio] Audio playback failed:", error );
			return false;
		}
	}

	// Plays the audio from the beginning.
	// * volume		- [float] Playback volume.
	replay( volume=null ) {
		// Make sure file is already loaded
		if ( !this.isReady() ) {
			// console.warn( `Cannot replay audio before load.` );
			return;
		}
		// Set audio volume.
		if ( typeof volume==='number' )
			this.setVolume( volume ); // override
		else this.setVolume( this.volume ); // use internal
		// Reset audio stream & play
		this.el.currentTime	= 0; // reset the audio stream time
		this.el.play().catch(
			err => console.error( `Error replaying ${this.name}:`, err )
			);
	}

	// Stops the audio.
	// * volume - [float] Playback volume.
	stop() {
		// Make sure file is already loaded
		if ( !this.isReady() ) {
			// console.warn( `Cannot stop audio before load.` );
			return;
		}
		// Stop the audio
		this.el.currentTime	= 0; // reset the audio stream time
		this.el.stop().catch(
			err => console.error( `Error stopping ${this.name}:`, err )
			);
	}

	//-------------------------
	// Event Listener(s)
	//-------------------------
	// onLoad event handler callback for attribute src
	// RETURNS: [void].
	onLoad() {
		this.jot( 'source', 'loaded' );         // src loaded
		this.emit( 'loaded' );                  // emit src load event
		// Play sound if queued
		if ( this.queued===true ) this.play();
	}

	// onPlay event handler callback for playback start.
	// RETURNS: [void].
	onPlay() {
		this.jot( 'playback', 'playing' );      // playback begin
		this.playing = true;                    // sound started playing
		this.emit( 'started' );                 // emit playback start event
	}

	// onResume event handler callback for when playback resumes.
	// RETURNS: [void].
	onResume() {
		this.jot( 'playback', 'playing' );      // playback resumed
		this.playing = true;                    // sound resumed playing
		this.emit( 'resumed' );                 // emit playback resume event
	}

	// onInterrupt event handler callback for playback interrupt.
	// RETURNS: [void].
	onInterrupt() {
		this.jot( 'playback', 'interrupted' );  // playback interrupted
		this.playing = false;                   // sound playing interrupted
		this.emit( 'interrupted' );             // emit playback interrupted event
	}

	// onEnd event handler callback for playback complete.
	// RETURNS: [void].
	onEnd() {
		this.jot( 'playback', 'ended' );        // playback finished
		this.playing = false;                   // sound playing interrupted
		this.emit( 'ended' );                   // emit playback end event
	}
}
