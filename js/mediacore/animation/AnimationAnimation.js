//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/mediacore/animation/AnimationAnimation.js loaded' );

//-------------------------
// AnimationAnimation Class
//-------------------------
class AnimationAnimation extends AnimationObject {
	// Identification properties.
	name		= 'ani';		// [string] Value of animation name
	// Animation progress.
	duration	= 1000;			// [int] Duration in ms calculated in frame(s)
	// Frame(s) & group(s).
	views		= {};			// [array] List of views to handle individual configurations (branch renders).
	frames		= [];			// [array] of frames with offsets
	sprites		= {};			// [object] Sprites set during parsing.
	options		= {};			// [object] Options set during parsing.
	// Animation progress and layer.
	loop		= false;		// Whether the animation should loop.
	// ID Counter(s)
	// Ensures sprite.id values are always unique even after deletions.
	_spriteIdCounter = 1;		// [int] auto-incrementing ID seed

	//-------------------------
	// Instantiation
	//-------------------------
	// Construct the [object].
	// * name		- [string] Name of the animation.
	constructor( name ) {
		super();				// call parent constructor
		this.name	= name;		// assign the animation name
		// Ensure at least one frame & layer exists:
		this.createFrame();		// creates exactly 1 frame
	}

	//-------------------------
	// Playback Control
	//-------------------------
	// Enable looping for the animation.
	// RETURNS: [void].
	loopOn() {
		this.loop	= true;
		//console.log( `Animation "${this.name}" set to loop.` );
	}

	// Disable looping for the animation.
	// RETURNS: [void].
	loopOff() {
		this.loop	= false;
		//console.log( `Animation "${this.name}" set to stop looping.` );
	}

	//-------------------------
	// Building Methods
	//-------------------------
	// Unset a sprite group (iterates all sprites & removes them).
	// RETURNS: [void].
	// * groupName	- [string] Group name
	unsetGroup( groupName ) {
		//-------------------------
		// Clear Matching Sprites' Group
		//-------------------------
		// Iterate frame sprites & unset matching group.
		for ( const key in this.sprites ) {
			// Get sprite instance.
			const sprite	= this.sprites[key];
			// Unset sprite's group if matching group name.
			if ( sprite.getGroup()===groupName )
				sprite.unsetGroup(); // unset matching group
		}

		//-------------------------
		// Clear Mirrored Views' Group
		//-------------------------
		// Iterate all views & unset matching group.
		for ( const name in this.views ) {
			const view = this.views[name];
			// Unset view's group if matching group name.
			view.unsetGroup( groupName ); // unset mirror group
		}

		//-------------------------
		// Call Parent unsetGroup()
		//-------------------------
		// Call parent unset group method.
		super.unsetGroup( groupName ); // unset animation group
	}

	// Renames an existing group without unsetting or recreating it.
	// All references are updated:
	// - sprites
	// - views
	// - animation group registry
	//
	// RETURNS: [boolean] true on success
	// * oldName	- [string] existing group name
	// * newName	- [string] new group name
	renameGroup( oldName, newName ) {
		//--------------------------------
		// Validate Argument(s)
		//--------------------------------
		if ( typeof oldName!=='string' || typeof newName!=='string' )
			return false; // abort
		if ( oldName===newName )
			return false; // abort

		//--------------------------------
		// Rename Group on Sprites
		//--------------------------------
		// Update sprite.group in-place.
		for ( const id in this.sprites ) {
			// Access [AnimationSprite] & rename group.
			const sprite = this.sprites[id];
			if ( sprite.getGroup?.()===oldName )
				sprite.setGroup( newName );
		}

		//--------------------------------
		// Rename Group on Views
		//--------------------------------
		// Views store groups as keyed maps.
		for ( const key in this.views ) {
			// Access [AnimationView] & rename group (if exists).
			const view = this.views[key];
			view.renameGroup( oldName, newName );
		}

		//--------------------------------
		// Rename Animation Group Registry
		//--------------------------------
		// Update internal group map (AnimationObject).
		if ( this.groups?.[oldName]!==undefined ) {
			// Move old group value to new group name.
			this.groups[newName] = this.groups[oldName];
			// Delete old group value (remove loose duplicate).
			delete this.groups[oldName];
		}

		return true; // success
	}

	//-------------------------
	// Building Methods
	//-------------------------
	// Adds a sprite to this layer.
	// RETURNS: [void].
	// * sprite		- Sprite [object] to add to layer.
	addSprite( sprite ) {
		// Require sprite id.
		if ( !sprite || sprite.id==null )
			return false;
		// Check if sprite already exists.
		if ( this.sprites[sprite.id] )
			return false; // already exists
		// Add sprite.
		this.sprites[sprite.id] = sprite;
		return true; // success
	}

	// Retrieves a sprite by index
	// RETURNS: [object|null] AnimationSprite or [null] if not found.
	// * id		- [int] id of the sprite to retrieve
	getSpriteByID( id ) {
		// Get sprite by id.
		return this.sprites[id] ?? null; // return [null] if id invalid
	}

	// Removes a sprite from this layer.
	// RETURNS: [void].
	// * sprite		- [AnimationSprite] to remove from layer.
	removeSprite( sprite ) {
		// Require sprite id.
		if ( !sprite ) return false;
		// Iterate sprites & remove if a match.
		for ( const key in this.sprites ) {
			const item = this.sprites[key];
			if ( sprite!==item ) continue; // skip
			// Proceed to remove sprite.
			this.removeSpriteByID( sprite.getId() );
			return true; // removed
		}
		return false; // nothing removed
	}

	// Removes a sprite by index
	// RETURNS: [void].
	// * id		- [int] id of the sprite to remove
	removeSpriteByID( id ) {
		// Check if sprite exists.
		if ( this.sprites?.[id] ) {
			delete this.sprites[id];
			return true; // removed
		}
		return false; // not found
	}

	// Checks if a sprite with the given ID exists in this layer.
	// RETURNS: [boolean] True if found, else false.
	// * id		- [string|number] Sprite ID to check for existence
	hasSpriteByID( id ) {
		// Determine if sprite exists.
		return this.sprites?.[id] ? true : false;
	}

	// Generate a new guaranteed-unique sprite ID.
	// RETURNS: [int] next unused sprite ID.
	getNextSpriteId() {
		//--------------------------------
		// Generate ID Using Monotonic Counter
		//--------------------------------
		// Loop in case a previously used ID was reinserted manually
		let id;
		do {
			id = this._spriteIdCounter++;
		} while ( this.sprites[ id ] ); // ensure not in use (paranoid check)
		// Return the safe, unique ID
		return id;
	}

	// Ensure next index id is synced to items in sprites.
	// RETURNS: [void].
	_syncSpriteIdCounter() {
		// Ensure max id pushes the next sprite id counter.
		const maxSpriteId =
			Object.keys( this.sprites )
				.map( id => parseInt(id,10) )
				.filter( n => !isNaN(n) )
				.reduce( (a,b) => Math.max(a,b), 0 );
		// Check if next sprite id exceeds existing max id.
		if ( maxSpriteId >= this._spriteIdCounter )
			this._spriteIdCounter = maxSpriteId + 1;
	}

	//-------------------------
	// View Management
	//-------------------------
	// Adds an animation view configuration to the pile.
	// RETURNS: [object] AnimationView on success else [null] on fail.
	// * name		- [string] Value of view name (e.g. 'user').
	addView( name ) {
		// Validate arguments
		if ( !jsos.argue('name',name,'string') ) return null;
		// Remove view if it exists
		if ( this.views?.[name] ) {
			console.warn( `Animation already contains a view named "${name}"! Remove existing view first, or try a different name.` );
			return null;
		}
		// Create an animation configuration [object]
		const view	= new AnimationView( this, name );
		// Set groups.
		for ( const key in this.groups )
			view.setGroup( key, this.groups[key] );
		this.views[name] = view;	// Add to pile
		return view;				// Return view [object]
	}

	// Adds an animation view configuration to the pile.
	// RETURNS: [object] AnimationView on success else [null] on fail.
	// * name		- [string] Value of view name (e.g. 'user').
	getView( name ) {
		return name in this.views ? this.views[name] : null;
	}

	// Removes an animation configuration (e.g. "AnimationView") from the pile.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * name		- [string] Value of view name (e.g. 'user').
	removeView( name ) {
		// Remove view if it exists
		if ( this.views?.[name] )
			delete this.views[name]; // Remove view
		return true;
	}

	// Calls clampSelected() on all views to resolve invalid frame/layer references.
	// RETURNS: [void]
	_clampAllViews() {
		//--------------------------------
		// Validate Frame(s) Exist
		//--------------------------------
		// If no frame(s) exist, abort.
		if ( this.getFrameCount()===-1 ) return;

		//--------------------------------
		// Iterate All View(s) & Clamp
		//--------------------------------
		// Iterate all views & clamp selection (during removals).
		for ( const name in this.views ) {
			// Access registered [AnimationView] instance.
			const view = this.views[name];

			//--------------------------------
			// Clamp Frame Index
			//--------------------------------
			// Determine view's frame index.
			const maxFindex	= this.getFrameCount() - 1;		// animation's max frame index
			const findex	= Math.max( 0, Math.min(view.getFrameIndex(),maxFindex) );
			view.setFrameIndex( findex ); // apply clamped index

			//--------------------------------
			// Clamp Layer Index (if frame exists)
			//--------------------------------
			// Access current frame in view & clamp layer index.
			const frame		= this.getFrameAt( findex );	// view's active frame
			if ( !frame ) continue;
			const lindex	= view.getLayerIndex();			// view's active layer index
			const maxLindex = frame.getLayerCount() - 1;	// frame's max layer index
			view.setLayerIndex( Math.max(0,Math.min(lindex,maxLindex)) );
		}
	}

	// Removes all layer(s) from all frame(s).
	// RETURNS: [boolean] true if removed
	clearLayers() {
		//--------------------------------
		// Remove All Layer(s) from All Frame(s)
		//--------------------------------
		// Iterate all frames & remove every layer.
		for ( const frame of this.frames )
			for ( let i=frame.getLayerCount()-1; i>=0; i-- )
				frame._removeLayerAt( i );

		//--------------------------------
		// Update Layer Count & Clamp View(s)
		//--------------------------------
		this._clampAllViews();		// Clamp selection.
		return true;				// success
	}

	//-------------------------
	// Frame Handling Method(s)
	//-------------------------
	// Returns the animation's # of frame(s).
	// RETURNS: [int] count
	getFrameCount() {
		return this.frames.length;
	}

	//-------------------------
	// Frame Handling
	//-------------------------
	// Adds a frame to the animation.
	// RETURNS: [AnimationFrame].
	createFrame() {
		return this.createFrames(1)[0];
	}

	// Adds new frame(s) to the animation and clones global layer count.
	// RETURNS: [array] of [AnimationFrame].
	// * amount – [int] number of frames to create (default = 1)
	createFrames( amount=1 ) {
		// Validate amount
		if ( amount<1 ) return [];

		//-------------------------
		// Create Exactly Requested Amount
		//-------------------------
		// Prepare result
		const result = [];
		// Create total # of frames
		for ( let i=0; i<amount; i++ ) {
			// Create empty frame
			const frame = this.createFrameAt( null );
			// Push frame into return result [array].
			result.push( frame );
		}

		//-------------------------
		// Return Data
		//-------------------------
		// Return the newly created frame(s).
		return result; // [array of AnimationFrame]
	}

	// Instantiates and inserts a new frame at the specified index.
	// RETURNS: [AnimationFrame]
	// * index – [int] Index to insert the new frame
	createFrameAt( index=null ) {
		//-------------------------
		// Validate argument(S).
		//-------------------------
		// Validate argument(s).
		if ( index===null || index<0 || index>this.frames.length )
			index	= this.frames.length;

		//-------------------------
		// Create & Add Frame
		//-------------------------
		// Generate name from index.
		const name	= `frame_${index}`;
		const frame	= new AnimationFrame( this, name, null, index );
		this._insertFrameAt( frame, index ); // Insert it

		//-------------------------
		// Return Data
		//-------------------------
		// Return the newly created frame.
		return frame; // [AnimationFrame] instance
	}

	// Inserts a frame into the timeline at a given index.
	// If already exists, will relocate it.
	// RETURNS: [void].
	// * frame – [AnimationFrame] to insert (containing layers with sprites)
	// * index	– [int] Index to insert the new frame
	_insertFrameAt( frame, index=null ) {
		//-------------------------
		// Validate argument(S).
		//-------------------------
		// Frame must be object type specific.
		if ( !(frame instanceof AnimationFrame) )
			throw new Error( 'Invalid frame object' );

		// Validate argument(s).
		if ( index===null || index>this.frames.length )
			index	= this.frames.length;
		// Clamp insertion index
		index	= Math.max( 0, index );

		//--------------------------
		// Move Frame If Already In Animation
		//--------------------------
		// Check if frame is inside animation.
		const currentIndex = this.frames.indexOf( frame );
		if ( currentIndex !== -1 ) {
			this.moveFrameTo( frame, index ); // relocate
			return; // abort
		}

		//-------------------------
		// Add to Animation Frames
		//-------------------------
		// Insert new frame.
		this.frames.splice( index, 0, frame );

		//--------------------------------
		// Reindex + Recalculate
		//--------------------------------
		// Increase sprite duration to include frame duration.
		this._resortFrameIndexes();	// Ensure frame.index = array index
		this._clampAllViews();		// Clamp selection.
		this._calculateDuration();	// Ensure duration stays consistent
	}

	// Get the frame at the specified index.
	// RETURNS: [AnimationFrame] or [null].
	// * index – [int] Index of frame retrieve.
	getFrameAt( index=null ) {
		// Validate argument(s).
		if ( index===null || index<0 || index>=this.frames.length || this.frames.length<1 )
			return null; // invalid index
		else return this.frames[index]; // [AnimationFrame] instance
	}

	// Removes frame at index, clamps views referencing it.
	// RETURNS: [void].
	// * index	– [int] index of frame to remove.
	removeFrameAt( index ) {
		//--------------------------------
		// Validate Index
		//--------------------------------
		// Check if index is within bounds.
		if ( index<0 || index>=this.frames.length )
			return; // no frame found

		//--------------------------------
		// Deconstruct the Frame
		//--------------------------------
		// Access [AnimationFrame] being removed.
		const frame	= this.frames[index];
		// Splice frame out the frames [array].
		this.frames.splice( index, 1 );
		/*🛑 frame._clearLayers(); // wipe layers*/

		//--------------------------------
		// Clamp All Views Using This Frame
		//--------------------------------
		// Iterate all views & clamp selected frame.
		for ( const key in this.views ) {
			const view		= this.views[key];
			// After removing frame, index is next frame.
			const findex	= view.getFrameIndex();
			if ( findex === index ) {
				// If pointing to the deleted frame,
				// keep index as-is (next frame slides into position)
				// If that makes it out of bounds, clamp later.
			}
			else if ( findex > index ) {
				// Shift left to follow frame shuffle
				view.setFrameIndex( findex - 1 );
			}
		}

		//--------------------------------
		// Reindex + Recalculate
		//--------------------------------
		// Recalibrate frame indices & re-calculate duration.
		this._resortFrameIndexes();	// Ensure frame.index = array index
		this._calculateDuration();	// Update duration after removal

		//--------------------------------
		// Ensure At Least One Frame Exists
		//--------------------------------
		// If no frames remain, create an empty frame.
		if ( this.frames.length === 0 ) {
			const newFrame = this.createFrame();
			console.warn( '[AnimationAnimation] No frames remaining. Auto-created fallback frame:', newFrame.name );
		}

		//--------------------------------
		// Clamp View Selections
		//--------------------------------
		// Clamp view index selection(s).
		this._clampAllViews();
	}

	//-------------------------
	// Frame Ordering Utilities
	//-------------------------
	// Reindexes all frames so that index = position in array.
	// Internal: Call after mutation to maintain consistency.
	// RETURNS: [void].
	_resortFrameIndexes() {
		// Iterate and reindex all frames chronologically.
		for ( let i=0; i<this.frames.length; i++ )
			this.frames[i].setIndex( i ); // Set logical index
	}

	// Moves a frame to a new index in the timeline.
	// Shifts others to maintain strict 0..n order.
	// RETURNS: [void].
	// * frame  – [AnimationFrame] to move
	// * newIndex – [int] target index
	moveFrameTo( frame, newIndex ) {
		// Check if frame is inside animation.
		const currentIndex = this.frames.indexOf( frame );
		if ( currentIndex === -1 )
			throw new Error( `AnimationAnimation.moveFrameTo(): frame not found.` );

		// Remove & insert @ new index.
		this.frames.splice( currentIndex, 1 );
		this.frames.splice( newIndex, 0, frame );
		this._resortFrameIndexes();	// Ensure frame.index = array index
		this._calculateDuration();	// Sync animation duration
	}

	// Sorts frames with a comparator function.
	// Useful for timeline manipulations or custom logic.
	// RETURNS: [void].
	// * compareFn – [function] sort callback
	sortFrames( compareFn ) {
		this.frames.sort( compareFn );	// Sort in-place
		this._resortFrameIndexes();		// Sync .index properties
	}

	//-------------------------
	// Time Handling Method(s)
	//-------------------------
	// Recalibrate the duration of the animation based upon frames
	// RETURNS: [void].
	_calculateDuration() {
		this.duration =
			this.frames.reduce(
				( sum, frame ) => sum+frame.duration, 0 );
	}
}
