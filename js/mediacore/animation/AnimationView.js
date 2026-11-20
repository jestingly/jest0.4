//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/mediacore/animation/AnimationView.js loaded' );

//-------------------------
// AnimationView Class
//-------------------------
// Animation configuration "view" [object] for calibrating dynamic variable(s).
class AnimationView extends AnimationObject {
	// Object reference(s).
	animation	= null;				// [object] Animation this View is configuring.
	// Identification properties.
	name		= null;				// [string] Value of animation view name.
	// General animation properties.
	active		= false;			// [bool] Whether the animation is currently active.
	playing		= false;			// [bool] Play state of the animation.
	// Animation progress & layer handling.
	time		= 0;				// [int] Current time in the animation.
	progress	= 0;				// [float] Progress through the animation (0 to 1).
	_layerIndex	= 0;				// [int] Active layer being viewed in frame.
	// Frame(s) and Group(s).
	frame		= null;				// [object] reference of current active frame.

	//-------------------------
	// Instantiation
	//-------------------------
	// Construct the [object].
	// * ani	- [object] Animation instance to add.
	// * name	- [string] Name of the animation.
	//   x		- [int] value of horizontal offset relative to sprite
	//   y		- [int] value of vertical offset relative to sprite
	//   w		- [int] value of animation width
	//   h		- [int] value of animation height
	constructor( ani, name, x=0, y=0, w=null, h=null ) {
		super();		// call parent constructor
		this.move( x, y, 0 );			// Move to location.
		this.resize( w, h );			// Set the anchor point WxH span
		this.animation	= ani;			// store animation reference
		this.name		= name;			// Assign the view name
		this.setFrameIndex( 0 );		// Default to first frame.
	}

	//-------------------------
	// Frame Handlnig
	//-------------------------
	// Set animation frame
	// RETURNS: [this].
	// *index	- [int] value of frame to set to.
	setFrameIndex( index ) {
		// Set [null] if no frames exist.
		if ( this.animation.frames.length>0 ) {
			// Confine index to bounds of possible [array] indices
			index	= Math.min( this.animation.frames.length-1, index );
			index	= Math.max( 0, index );
			// Set the frame
			this.frame	= this.animation.frames[index];
		}
		else this.frame	= null;
		return this; // return `this` for chaining
	}

	// If no frame set, returns 0. If frame not found, clamps safely.
	// RETURNS: [int] the index of the current active frame.
	getFrameIndex() {
		//---------------------------------
		// Validate Frame Reference
		//---------------------------------
		// If frame is null or animation missing, default to 0.
		if ( !this.frame || !this.animation || !Array.isArray(this.animation.frames) )
			return 0; // default to first frame

		//---------------------------------
		// Resolve Index
		//---------------------------------
		// Find index inside animation.frames array.
		let index = this.animation.frames.indexOf( this.frame );

		// If frame not found (rare but possible), clamp to 0.
		if ( index===-1 ) index = 0;

		//---------------------------------
		// Constrain to Valid Range
		//---------------------------------
		// Prevent OOB: clamp within [0 .. frames.length-1].
		index = Math.max( 0, Math.min( index, this.animation.frames.length-1 ));

		// Return resolved index.
		return index;
	}

	// Increment animation frame
	// RETURNS: [this].
	nextFrame() {
		// Calculate next frame index
		let index	= this.animation.frames.indexOf(this.frame) + 1;
		// If looping and out of bounds, wrap to start
		if ( this.animation.loop && index>=this.animation.frames.length )
			index	= 0;
		// Confine index to bounds of possible [array] indices
		index		= Math.min( this.animation.frames.length-1, index );
		index		= Math.max( 0, index );
		// Set the frame
		this.frame	= this.animation.frames[index];
		return this; // return `this` for chaining
	}

	// Decrement animation frame
	// RETURNS: [this].
	previousFrame() {
		// Calculate previous frame index
		let index	= this.animation.frames.indexOf(this.frame) - 1;
		// If looping and out of bounds, wrap to end
		if ( this.animation.loop && index<0 )
			index	= this.animation.frames.length-1;
		// Confine index to bounds of possible [array] indices
		index		= Math.min( this.animation.frames.length-1, index );
		index		= Math.max( 0, index );
		// Set the frame
		this.frame	= this.animation.frames[index];
		return this; // return `this` for chaining
	}

	//-------------------------
	// State Changing
	//-------------------------
	// Get the animation layer [object].
	// RETURNS: [AnimationLayer] instance or [null] if not found.
	getLayer() {
		// Get current layer index.
		const lindex = typeof this._layerIndex==="number" && Number.isInteger(this._layerIndex)
			? this._layerIndex
			: 0; // Default to 0 if _layerIndex is invalid
		// Return the [AnimationLayer] instance.
		return this.frame.getLayerAt( lindex );
	}

	// Attempt to set the layer.
	setLayerIndex( index ) { this._layerIndex = index; }
	// Attempt to get the layer.
	getLayerIndex() { return this._layerIndex; }

	// Return count of layers in the frame.
	getLayerCount( index ) {
		return this.frame.layers.length;
	}

	// Adjusts this._layerIndex to maintain the same layer after a layer is inserted or removed.
	// Call this BEFORE insert/remove happens.
	// RETURNS: [int] new adjusted index.
	// * modifiedIndex	– [int] index where insertion or removal is occurring
	// * isInsert		– [bool] true if inserting, false if removing
	adjustSelectedLayerIndex( modifiedIndex, isInsert ) {
		//--------------------------------
		// Invalid State Handling
		//--------------------------------
		// Check if layer index is out of bounds.
		if ( this._layerIndex===-1 ) {
			this._layerIndex = 0;
			return 0;
		}

		//--------------------------------
		// Insert Case
		//--------------------------------
		// If inserting a new layer, adjust selected index accordingly.
		if ( isInsert ) {
			// If inserting at or before selected index, bump it up
			if ( modifiedIndex<=this._layerIndex )
				this._layerIndex ++;
			return this._layerIndex;
		}

		//--------------------------------
		// Remove Case
		//--------------------------------
		// If removing an existing layer, adjust selected index accordingly.
		if ( modifiedIndex<this._layerIndex )
			this._layerIndex--;		// Pull back index
		else if ( modifiedIndex===this._layerIndex )
			this._layerIndex = -1;	// Selection deleted
		// else: no change

		// Return the current selected index.
		return this._layerIndex;
	}

	//-------------------------
	// Playback Control
	//-------------------------
	// Play the animation.
	// RETURNS: [this].
	play() {
		if ( this.playing ) {
			//console.warn( `Animation "${this.name}" is already playing.` );
			return this;
		}
		this.playing	= true;
		//console.log( `Animation "${this.name}" started.` );
		return this;
	}

	// Pause the animation.
	// RETURNS: [this].
	pause() {
		if ( !this.playing ) {
			//console.warn( `Animation "${this.name}" is already paused.` );
			return this;
		}
		this.playing = false;
		//console.log( `Animation "${this.name}" paused.` );
		return this;
	}

	// Toggle play/pause state.
	// RETURNS: [this].
	togglePlay() {
		this.playing ? this.pause() : this.play();
		return this;
	}

	// Enable the animation.
	// RETURNS: [this].
	enable() {
		this.active		= true;
		//console.log( `Animation "${this.name}" enabled.` );
		return this;
	}

	// Disable the animation.
	// RETURNS: [this].
	disable() {
		this.active		= false;
		//console.log( `Animation "${this.name}" disabled.` );
		return this;
	}

	// Reset the animation to the start.
	// RETURNS: [this].
	reset() {
		this.time			= 0;		// reset the playhead
		this.progress		= 0;		// reset playhead progress % tracking
		this._clocks.start	= null;		// reset the start time
		this.frame			= this.animation.frames[0]; // reset to first frame
		this.pause().disable();			// pause & disable the animation
		//console.log( `Animation "${this.name}" reset.` );
		return this;
	}

	//-------------------------
	// Rendering
	//-------------------------
	// Updates the animation's progress.
	// RETURNS: [void].
	// * tickDelay	- the FPS of the ticker (ie. 60 = 60ms/1000ms or 60fps)
	update( tickDelay ) {
		//-------------------------
		// Determine If Playable
		//-------------------------
		// Determine if animation is paused
		if ( !this.playing ) return;
		else if ( this._clocks.start===null )
			this._clock( 'start' ); // set the start time
		//-------------------------
		// Calculate Time
		//-------------------------
		// Increment the animation's elapsed time
		this.time += tickDelay;
		// Check if the animation has completed
		if ( this.time>=this.animation.duration ) {
			if ( this.animation.loop ) {
				this.time	%= this.animation.duration; // Wrap around for looping animations
			}
			else this.complete();			// Animation complete
		}
		// Calculate progress as a percentage (if needed for sprites)
		const progress	= this.time / this.animation.duration;
		//-------------------------
		// Calculate Current Frame
		//-------------------------
		// Determine the current frame based on time
		let elapsed		= this.time;
		let index		= 0;
		for ( const frame of this.animation.frames ) {
			if ( elapsed<frame.duration ) {
				this.frame	= frame;
				break;
			}
			index++;
			elapsed -= frame.duration;		// Reduce elapsed time by the frame's duration
		}
	}

	// Complete the animation
	complete() {
		//-------------------------
		// Determine If Playing
		//-------------------------
		// Determine if animation is paused
		if ( !this.playing ) return;
		//-------------------------
		// Complete Animation
		//-------------------------
		this.time	 = this.animation.duration; // Cap time at the end
		this.pause();	      				// Pause the animation
		this.emit( 'complete' );			// Emit end of sequence callback(s)
	}
}
