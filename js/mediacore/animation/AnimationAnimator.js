//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/mediacore/animation/AnimationAnimator.js loaded' );

//-------------------------
// AnimationAnimator Class
//-------------------------
// Manages a pile of animations for sequential updates.
class AnimationAnimator {
	// Declare properties
	canvas			= null;				// ElementCanvas [object] (for CanvasRenderingContext2D [object] drawing)
	animations		= new Set();		// [object] Set of animations to manage & update sequentially.

	// Initializes the Sequencer.
	// RETURNS: [void].
	constructor() { }

	//-------------------------
	// Canvas Management
	//-------------------------
	// Sets the canvas element
	// * canvas		- [object] Canvas element to set
	setCanvas( canvas ) {
		if ( !(canvas instanceof HTMLCanvasElement) )
			throw new Error( 'Invalid canvas element' );
		this.canvas = canvas;
	}

	//-------------------------
	// Animation Management
	//-------------------------
	// Adds an animation to the stack of animations.
	// RETURNS: [void].
	// * animation		- [object] Animation instance to add.
	add( animation ) {
		this.animations.add( animation ); // Add animation
	}

	// Removes an animation from the stack of animations.
	// RETURNS: [void].
	// * animation		- [object] Animation instance to remove.
	remove( animation ) {
		this.animations.delete( animation ); // Remove animation
	}

	//-------------------------
	// Rendering Methods
	//-------------------------
	// Renders all animation views passed to the method.
	// RETURNS: [void].
	// * e		- Ticker data [object] {}
	// 		* elapsedTime	- [int] how much time has passed since the ticker started.
	// 		* tickDelay		- [int] how much time between each tick (ie. 60ms)
	// 		* tickCount		- [int] how many ticks have occurred
	// * views	- [array] of AnimationViews to render
	render( e, views ) {
		// Iterate each animation view & render it.
		for ( const name in views ) {
			// Access view & update it
			const view	= views[name];
			if ( typeof view.update==='function' )
				view.update( e.tickDelay );
			else console.warn( 'Animation view missing update method' );
		}
	}

	// Draws all animation(s).
	// RETURNS: [void].
	// *views	- [array] of AnimationViews to draw
	draw( views=null ) {
		// Determine if canvas is set
		if ( !this.canvas || !this.canvas.el ) {
			console.warn( 'Canvas is not set or invalid' );
			return;
		}
		// Access context & clear the board
		const ctx = this.canvas.el.getContext( '2d' );

		//------------------------------------------
		// Render all view layers onto canvas
		//------------------------------------------
		// * views	- [array] of View objects sorted by Y.
		// * ctx	- [CanvasRenderingContext2D] target canvas
		// RETURNS: [void].
		views.forEach(
			view => {
				//-----------------------------------------
				// Skip views missing key render properties
				//-----------------------------------------
				const frame	= view.frame;
				if ( !frame ) {
					console.warn( "⛔ View missing frame:", view.id, view );
					return false; // skip
				}
				if ( !view.active ) {
					console.warn( "⛔ View inactive:", view.id );
					return false; // skip
				}

				//-----------------------------------------
				// Acquire animation + target layer
				//-----------------------------------------
				const animation	= view.animation;
				const lindex	= view.getLayerIndex();
				const layer		= frame.layers[lindex] ?? null;

				if ( !animation ) {
					console.error( "🚨 Missing animation on view:", view.id );
					return false; // skip
				}
				if ( layer===null ) {
					console.warn( "⛔ No layer found at index", lindex, "for view:", view.id );
					return false; // skip
				}

				//-----------------------------------------
				// Iterate and render sticker(s)
				//-----------------------------------------
				layer.stickers.forEach(
					sticker => {
						//-----------------------------------------
						// Get [AnimationSprite] from animation.
						//-----------------------------------------
						const sprite = animation.getSpriteByID( sticker.sid );
						if ( !sprite ) {
							console.warn( "⚠️ Sprite not found for sticker:", sticker.sid );
							return false; // skip
						}

						try {
							//-----------------------------------------
							// Get image from sprite group
							//-----------------------------------------
							const image = view.getGroup( sprite.group );
							if ( !image ) {
								console.warn( "⚠️ Image missing for sprite group:", sprite.group );
								return false; // skip
							}
							if ( !image.file ) {
								//console.warn("⚠️ Image file missing:", image);
								return false; // skip
							}
							if ( image.file.skim('source')!=='loaded' ) {
								console.warn( "⏳ Image not loaded yet:", image.file );
								return false; // skip
							}

							//-----------------------------------------
							// Calculate draw values
							//-----------------------------------------
							const sx	= sprite.sx;
							const sy	= sprite.sy;
							const width	= sprite.width;
							const height= sprite.height;
							const x		= Math.round( view.globalX + sticker.globalX );
							const y		= Math.round( view.globalY + sticker.globalY );

							/*console.log("🖼 Drawing sprite:", {
								id         : view.id,
								spriteID   : sprite.sid,
								group      : sprite.group,
								x, y, width, height,
								sourceX    : sx, sourceY: sy,
								imgElement : image.file.el
								});*/

							//-----------------------------------------
							// Draw sprite to canvas
							//-----------------------------------------
							ctx.drawImage(
								image.file.el,
								sx, sy, width, height,		// Source crop
								x, y, width, height			// Destination
								);
						}
						catch ( error ) {
							console.error( "🔥 Error drawing sticker:", {
								viewID    : view.id,
								spriteID  : sprite?.sid,
								error     : error.message,
								stack     : error.stack
								});
						}
					});
			});
	}
}
