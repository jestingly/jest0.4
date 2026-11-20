//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/mediacore/pacing/Timeout.js loaded' );

//-------------------------
// Timeout Class
//-------------------------
// Drives the center clock loop and emits 'tick' events.
class Timeout extends OSCallback {
	// Declare properties
	delay			= null;						// [number] Time interval between ticks in milliseconds.
	running			= false;					// [bool] Indicates if the ticker is currently running.
	startTime		= performance.now();		// [number] Start time of ticker.
	ticksEmitted	= 0;						// [int] Accumulates ticks to maintain precise # of tick intervals.
	boundTick		= null;						// [function] Binds the tick method to preserve context.
	pauseTime		= null;						// [number|null] Pause time of ticker.
	timerId			= null;						// [] Timer ID if using setInterval

	//---------------------------
	// Initialization
	//---------------------------
	// Initializes the timeout.
	// * delay	- [number] Time interval between ticks in milliseconds.
	// * mode	- [string] 'timer' or 'raf'.
	constructor( mode='timer' ) {
		super();											// call parent constructor
		this.delay			= 1000 / 60;					// [number] Time interval for each tick.
		this.running		= false;						// [bool] Whether the ticker is active.
		this.boundTick		= this.tick.bind( this );		// Preserve context for the tick method.
		// Set the mode.
		if ( mode!=='raf' ) mode = 'timer';
		this.jot( mode );
	}

	//---------------------------
	// Overloaded Method(s)
	//---------------------------
	// Sets the ticker mode.
	// RETURNS: [void].
	// * mode	- [string] 'timer' or 'raf' (requestAnimationFrame).
	jot( mode='timer' ) {
		// Ensure mode is only "ref" or "timer".
		if ( mode!=='timer' && mode!=='raf' )
			throw new Error( `Timeout: invalid mode "${mode}". Use 'raf' or 'timer'.` );
		// Set parent mode.
		super.jot( 'mode', mode );
	}

	//---------------------------
	// Toggling Method(s)
	//---------------------------
	// Starts the ticker.
	// RETURNS: [void].
	start() {
		// Reset & recalibrate ticker if not running
		if ( !this.running ) {
			this.running		= true;						// Set the ticker to running state.
			this.startTime		= performance.now();		// [number] Start time of ticker.
			this.ticksEmitted	= 0;						// [int] # of "frames rendered".
			requestAnimationFrame( this.boundTick );		// Schedule the first tick.
			// Start correct loop
			if ( this.skim('mode')==='raf' )
				requestAnimationFrame( this.boundTick );
			else this.timerId = setInterval( this.boundTick, this.delay );
		}
	}

	// Stops the ticker.
	// RETURNS: [void].
	stop() {
		this.running	= false; // Set the ticker to stopped state.
		// Clear timer if mode is "timer".
		if ( this.skim('mode')==='timer' && this.timerId!==null ) {
			clearInterval( this.timerId );
			this.timerId = null;
		}
	}

	// Pauses the ticker.
	// RETURNS: [void].
	pause() {
		// Do not double-pause
		if ( !this.running ) return;
		this.running	= false;						// Set the ticker to stopped state.
		this.pauseTime	= performance.now();			// Record pause time.
		// Clear timer if mode is "timer".
		if ( this.skim('mode')==='timer' && this.timerId!==null ) {
			clearInterval( this.timerId );
			this.timerId = null;
		}
	}

	// Resumes the ticker from pause.
	// RETURNS: [void].
	resume() {
		// Do not resume if already running
		if ( this.running ) return;
		this.running	= true;							// Set ticker to running state.
		// If resuming from pause → adjust startTime
		if ( this.pauseTime!==null ) {
			this.startTime	+= ( performance.now() - this.pauseTime );
			this.pauseTime	= null;
		}
		else { // fresh start if no pause time
			this.startTime		= performance.now();
			this.ticksEmitted	= 0;
		}
		// Resume correct loop
		if ( this.skim('mode')==='raf' )
			requestAnimationFrame( this.boundTick );	// Schedule next tick.
		else this.timerId = setInterval( this.boundTick, this.delay );
	}


	//---------------------------
	// Rendering
	//---------------------------
	// Main tick method called on each frame.
	// Calculates elapsed time, maintains consistent timing, and emits tick events.
	// RETURNS: [void].
	tick() {
		// Require ticker event to be running
		if ( !this.running ) return;
		// Calculate time elapsed.
		const now			= performance.now();			// Current time.
		const elapsedTime	= now - this.startTime;			// Time since ticker started.
		// Calculate how many ticks should have occurred since the start.
		const expectedTicks	= Math.floor( elapsedTime / this.delay );
		const missedTicks	= expectedTicks - this.ticksEmitted;
		// Notice any spikes/lag in rendering.
		if ( missedTicks>10 )
			console.warn( `Timer logged a spike in lag: ${missedTicks} missed ticks.` );
		// Emit ticks for all missed intervals.
		for ( let i=0; i<missedTicks; i++ ) {
			const tickDelay	= this.delay;					// Each tick is a fixed interval.
			// Pass the time data to listener(s).
			this.emit(
				'tick', null,
				{
					elapsedTime,
					tickDelay,
					tickCount: this.ticksEmitted + i + 1	// Adjust for missed ticks.
				});
		}
		this.ticksEmitted	= expectedTicks;				// Update ticksEmitted count
		// Reset periodically to avoid infinite growth
		if ( this.ticksEmitted>=60 ) {
			this.startTime		= now;						// Adjust startTime forward
			this.ticksEmitted	= this.ticksEmitted % 60;	// Reset counter
		}
		// Only reschedule if using rAF
		if ( this.skim('mode')==='raf' )
			requestAnimationFrame( this.boundTick );		// Schedule the next tick.
	}
}
