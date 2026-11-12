//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/level/JestLevel.js loaded' );

//-------------------------
// JestLevel Class
//-------------------------
// Class for generating & handling "level" (decorative grids of tiles) objects.
class JestLevel extends JestSavable {
	// Ensure a meta scaffold exists
	meta          = null;      // [object] Cloud meta data.
	// Level architecture
	overworld     = null;      // [object] JestOverworld reference level is within.
	layers        = [];        // Ordered collection of level layers
	activeLayerId = null;      // [int] Value of active layer (the id).

	// --------------------------------
	// Constructor
	// --------------------------------
	// Construct the [object].
	// * client		- [object] Application client creating the object.
	// * name		- [string] Value of level name (e.g. 'level1').
	constructor( client, name ) {
		// Call the parent object constructor
		super( client, name );	// construct the parent
		this.jot( 'status', 'constructed' ); // set status
		this.resetCloudBinding();	// initialize cloud meta data
		console.log( `Level ${this.name} constructed.` );
	}

	//-------------------------
	// Teardown Method(s)
	//-------------------------
	// Destroy the view [object]
	// RETURNS: [void].
	destroy() {
		// Prevent double‐destroy
		if ( this.skim('status')==='destroyed' ) return;
		this.jot( 'status', 'destroyed' );
		// Call each layer's individual destructor.
		for ( const layer of this.layers )
			layer.destroy(); // destroy layer
		// Remove from the gameboard registry
		if ( this.client?.gameboard?.levels )
			delete this.client.gameboard.levels[this.name];
		// Call parent destroy if it exists
		if ( super.destroy ) super.destroy();
	}

	//-------------------------
	// Initialization Methods
	//-------------------------
	// Setup the object [object].
	// RETURNS: [boolean] `true` on success else `false` on fail.
	async setup() {
		// Check if setup is possible.
		const status = this.skim( 'status' );
		if ( status!=='constructed' ) return false;
		// --------------------------------
		// Build Level
		// --------------------------------
		this.jot( 'status', 'building' );	// set status
		this.build();						// build the object
		// --------------------------------
		// Load File(s) Data
		// --------------------------------
		this.jot( 'status', 'loading' );	// set status
		await this.load();					// load the data
		this.jot( 'status', 'empty' );		// set status
		return true; // success
	}

	// Build the [object].
	// RETURNS: [boolean] `true` on success else `false` on fail.
	build() {
		// Check if setup is possiblexxw.
		const status = this.skim( 'status' );
		if ( status!=='building' ) return false;
		return true; // success
	}

	//-------------------------
	// Data Handling
	//-------------------------
	// Load the data.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	async load() {
		// Check if setup is possible.
		const status = this.skim( 'status' );
		if ( status!=='loading' ) return false;
		super.load();		// call parent load start method
		this.complete();	// call complete method
		return true;		// success
	}

	// Complete data load.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	complete() {
		super.complete();	// call parent complete method
		return true;		// success
	}

	//--------------------------------
	// setCloudMeta( partial )
	//--------------------------------
	// Merge new cloud fields into Level.meta and emit a change event.
	// RETURNS: [void]
	// * partial – [object] e.g. { cloud_id:123, version:4, type:'manual' }
	setCloudMeta( partial={} ) {
		// Reset the meta data for update.
		if ( !this.meta || typeof this.meta!=='object' )
			this.resetCloudBinding();
		// Assign the updated meta data.
		Object.assign( this.meta, partial );
		// Emit an event for meta data change.
		this.emit( 'meta:cloud:update', null, { ...this.meta } );
	}

	// Returns a copy of current cloud meta for serializers/UI.
	// RETURNS: [object]
	getCloudMeta() { return { ...this.meta }; }

	// Remove binding to any cloud record (used for "Fork" / "Save As").
	// RETURNS: [void]
	resetCloudBinding() {
		// Check the meta is set.
		if ( !this.meta ) this.meta = {};
		// Delete the cloud id & version #.
		this.meta.cloud_id  = null;	// reset cloud record #
		this.meta.version   = null;	// reset version #
		// Default the meta data to local save.
		this.meta.type      = 'local';
		// Time-stamp the file.
		this.meta.timestamp = new Date().toISOString();
		// Emit an event for meta data change.
		this.emit( 'meta:cloud:update', null, { ...this.meta } );
	}

	//-------------------------
	// Layer Management
	//-------------------------
	// Creates and registers a new layer.
	// RETURNS: [JestLevelLayer] Created layer.
	//   name      - [string] value of layer name.
	//   options   - [object] of layer options.
	async addLayer( name='Layer', options={} ) {
		// Create a new layer.
		const layer   = new JestLevelLayer( this.client, name );

		// Assign properties.
		layer.id      = options.id ?? this.layers.reduce( (max,item)=>Math.max(max,item.id), -1 )+1;
		layer.name	  = name;
		layer.level   = this;
		layer.visible = options.visible ?? true;
		layer.locked  = options.locked ?? false;

		// Prevent duplicate IDs.
		if ( this.getLayer(layer.id) )
			throw new Error( `Layer ID ${layer.id} already exists.` );

		// Initialize layer.
		await layer.setup();

		// Assign tilemap, if supplied.
		layer.tilemap =
			options.tilemap ?? Array.from(
			    { length: this.client.config.levelGrid },
			    () => Array(this.client.config.levelGrid).fill(null)
				);

		// Register layer.
		this.layers.push( layer );

		// Automatically select the first layer.
		if ( this.activeLayerId===null )
			this.setActiveLayer( layer.id );

		// Return created layer.
		return layer;
	}

	// Removes a layer by ID.
	// RETURNS: [boolean] Whether removal succeeded.
	// * id		- [int] value of layer id.
	removeLayer( id ) {
		// Look for layer @ supplied id.
		const index    = this.layers.findIndex( layer=>layer.id===id );
		if ( index<0 ) return false;
		// Destructure first item spliced [array].
		const [layer]  = this.layers.splice( index, 1 );
		// Select another layer if the active layer was removed.
		if ( this.activeLayerId===id ) {
			const next = this.layers[index] ?? this.layers[index-1] ?? null;
			this.activeLayerId = next?.id ?? null;
		}
		// Remove its canvas from the DOM, if attached.
		layer.destroy(); // destruct layer
		layer.level    = null; // nullify level property
		// Release its association with the level.
		layer.level    = null; // nullify layer level
		return true; // success
	}

	// Retrieves a layer by ID.
	// RETURNS: [JestLevelLayer|null] Matching layer.
	//   id       - [int] value of layer id.
	//   fallback - [boolean] whether to fallback to active layer.
	getLayer( id=null, fallback=false ) {
		//--------------------------------`
		// Resolve Level Fallback Layer
		//--------------------------------`
		// Check for initial fallback.
		if ( id===null && fallback===true )
			return this.getActiveLayer(); // get active level layer

		//--------------------------------
		// Resolve Target Level Layer
		//--------------------------------
		// Attempt to get layer by id.
		let layer	= this.layers.find(layer=>layer.id===id) ?? null;

		// If layer does not exist, check for fallback.
		//if ( !layer && fallback===true )
			// Resolve to active level layer.
			//layer = this.getActiveLayer(); // get active level layer

		// Return resolved level layer.
		return layer; // resolved layer
	}

	// Returns all registered layers in rendering order.
	// RETURNS: [array<JestLevelLayer>] Layer collection.
	getLayers() { return this.layers; }

	//--------------------------------
	// Set/Get Active Layer
	//--------------------------------
	// Set the currently active layer by ID.
	// RETURNS: [boolean] Whether selection succeeded.
	// * id		- [int] Layer identifier.
	setActiveLayer( id ) {
		// Get the layer @ id.
		const layer = this.getLayer( id );
		if ( !layer ) return false; // not found
		// Set active layer to requested id.
		this.activeLayerId = layer.id;
		return true; // success
	}

	// Retrieve the currently active layer.
	// RETURNS: [JestLevelLayer|null]
	getActiveLayer() {
		// Get the active layer.
		return this.getLayer( this.activeLayerId );
	}

	//--------------------------------
	// Reorder Level Layers
	//--------------------------------
	// Rearrange the level's existing layers according to an
	// ordered array of layer IDs, from bottommost to topmost.
	// Preserves each layer object, its data, and active selection.
	// RETURNS: [boolean] true if the layer order changed.
	// * ids - [array] layer IDs in their desired rendering order.
	reorderLayers( ids ) {
		//--------------------------------
		// Validate Layer Order
		//--------------------------------
		// Require an array containing every existing layer.
		if ( !Array.isArray(ids) ) return false;
		if ( ids.length!==this.layers.length ) return false;

		// Build a lookup table using the existing layer IDs.
		const lookup = new Map( this.layers.map(layer=>[layer.id,layer]) );

		// Reject duplicate, missing, or unknown layer IDs.
		if ( new Set(ids).size!==ids.length ) return false;
		if ( ids.some(id=>!lookup.has(id)) )  return false;

		//--------------------------------
		// Resolve New Layer Order
		//--------------------------------
		// Retrieve existing layer objects in the requested order.
		const ordered = ids.map( id=>lookup.get(id) );

		// Ignore requests that do not change the existing order.
		const changed = ordered.some( (layer,index)=>layer!==this.layers[index] );
		if ( !changed ) return false;

		//--------------------------------
		// Apply New Layer Order
		//--------------------------------
		// Modify the existing array rather than replacing its reference.
		// Other systems holding this.layers remain synchronized.
		this.layers.splice( 0, this.layers.length, ...ordered );
		return true; // layer order changed
	}

	// --------------------------------
	// Level Rendering
	// --------------------------------
	// Clear all boards belonging to each layer.
	// RETURNS: [void].
	clear() {
		// Clear each layer's existing tilemap.
		for ( const layer of this.layers )
			layer.clear(); // clear layer
		// Update level status.
		this.jot( 'status', 'empty' );
		return true; // success
	}

	//-------------------------
	// Render Level
	//-------------------------
	// Render all layers belonging to this level.
	// RETURNS: [boolean] true on success.
	render() {
		// Render each layer's existing tilemap.
		for ( const layer of this.layers ) {
			// Skip layers without tile data.
			if ( !layer.tilemap ) continue;
			// Render the individual layer.
			layer.render( layer.tilemap );
		}

		// Update level status.
		this.jot( 'status', 'rendered' );
		return true; // success
	}

	// -------------------------
	// State‐Snapshot Utilities
	// -------------------------
	// Export the entire level’s state as a JSON‐serializable object.
	// RETURNS: { tilemap: [ [ {ts,tx,ty}, … ], … ] }  or null if tilemap is not set.
	exportState() {
		// Deep‐clone the 2D array of tile objects (so undo/redo won’t be affected
		// by later mutations to the original tilemap).
		return {
			layers:
				this.layers.map(
					layer => ({
						id      : layer.id,
						name    : layer.name,
						visible : layer.visible,
						locked  : layer.locked,
						tilemap :
							// If tile is null or undefined, keep it that way
							// Otherwise return a shallow copy of {ts,tx,ty}
							layer.tilemap?.map(
								row => row.map( tile=>tile?{...tile}:null) )
								?? null
						}))};
	}

	// Import a previously exported state, replacing the level’s tilemap
	// and re‐rendering everything.
	// RETURNS: [bool] true on success, false if the state is invalid.
	// * state – the object returned by exportState(), e.g. { tilemap: […] }.
	async importState( state ) {
		// Validate that `state` has the shape we expect
	    if ( !state || !Array.isArray(state.layers) ) return false;

	    // Destroy existing layers.
	    for ( const layer of [...this.layers] )
	        this.removeLayer( layer.id );

	    // Restore layers.
	    for ( const record of state.layers ) {
			// Deep‐clone the incoming record.tilemap into this.tilemap
	        const tilemap =
				record.tilemap?.map(
		            row => row.map( tile=>tile ? {...tile} : null )
		        	) ?? null;

			// Add a new layer to the level.
	        await this.addLayer(
				record.name,
				{
		            id      : record.id,
		            visible : record.visible,
		            locked  : record.locked,
					tilemap : tilemap
	        	});
	    }

		// Clear the level first.
		//this.clear();
		// Rebuild any derived data from the tilemap
		this.render();
		return true; // success
	}

	//--------------------------------
	// Snapshot a Level Layer
	//--------------------------------
	// Capture all persistent layer properties and tile data.
	// Runtime objects such as canvases are deliberately excluded.
	// The original array index preserves the layer's rendering order.
	// RETURNS: [object|null] a standalone layer snapshot.
	// * id - [int] ID of the layer to capture.
	snapshotLayer( id ) {
		//--------------------------------
		// Resolve Target Layer
		//--------------------------------
		// Locate the requested layer within this level.
		const layer = this.getLayer( id );
		if ( !layer ) return null; // no layer found

		// Preserve its bottom-to-top rendering position.
		const index = this.layers.indexOf( layer );

		//--------------------------------
		// Capture Layer Data
		//--------------------------------
		// Clone the tilemap so later painting operations cannot
		// mutate the contents retained by the history record.
		const tilemap =
			layer.tilemap?.map(
				row => row.map( tile => tile ? {...tile} : null )
				) ?? null;

		// Return a plain-data snapshot suitable for JestGovernor.
		return {
			id		: layer.id,
			name	: layer.name,
			index	: index,
			visible	: layer.visible,
			locked	: layer.locked,
			tilemap	: tilemap
			};
	}

	//--------------------------------
	// Restore a Level Layer
	//--------------------------------
	// Reconstruct a previously removed layer, retaining its original
	// identity, position, name, visibility, locking, and tile contents.
	//
	// This method is synchronous so a history Undo finishes restoring
	// the layer before the next history operation can be replayed.
	//
	// RETURNS: [JestLevelLayer|null] restored layer or failure.
	// * snapshot - [object] data returned by snapshotLayer().
	restoreLayer( snapshot ) {
		//--------------------------------
		// Validate Snapshot
		//--------------------------------
		// Reject missing or malformed snapshots.
		if ( !snapshot || !Number.isInteger(snapshot.id) )
			return null; // no snapshot

		// Never overwrite an existing layer with the same ID.
		if ( this.getLayer(snapshot.id) )
			return null; // no layer found

		//--------------------------------
		// Reconstruct Layer Instance
		//--------------------------------
		// Create the same class used by addLayer().
		const layer   = new JestLevelLayer( this.client, snapshot.name );

		// Restore its original persistent properties.
		layer.id      = snapshot.id;
		layer.name    = snapshot.name;
		layer.level   = this;
		layer.visible = snapshot.visible;
		layer.locked  = snapshot.locked;

		//--------------------------------
		// Initialize Layer Rendering
		//--------------------------------
		// Reproduce JestLevelLayer.setup()'s current synchronous
		// construction sequence. In particular, build() creates
		// the layer canvas and stamp objects.
		layer.jot( 'status', 'building' );

		// Abort if its canvas cannot be constructed.
		if ( layer.build()!==true ) {
			layer.destroy(); // destroy the layer
			return null;     // finish early
		}

		// Make the layer ready for rendering.
		layer.jot( 'status', 'empty' );

		//--------------------------------
		// Restore Tile Data
		//--------------------------------
		// Always rebuild independent tile objects from the snapshot.
		// If no tilemap was stored, use the standard empty grid.
		layer.tilemap =
			snapshot.tilemap?.map(
				row => row.map( tile => tile ? { ...tile } : null )
				)
			??
			Array.from(
				{ length: this.client.config.levelGrid },
				() => Array(this.client.config.levelGrid).fill( null )
				);

		//--------------------------------
		// Restore Layer Position
		//--------------------------------
		// Clamp the original position to the current valid range.
		const index =
			Number.isInteger(snapshot.index)
				? Math.max( 0, Math.min(snapshot.index,this.layers.length) )
				: this.layers.length;

		// Reinsert into the existing layer array, preserving its reference.
		this.layers.splice( index, 0, layer );

		//--------------------------------
		// Restore Layer Rendering
		//--------------------------------
		// Rebuild the layer's chunks, tile definitions, and canvas.
		layer.render( layer.tilemap );

		// If the level currently has no active layer, select this one.
		if ( this.activeLayerId===null )
			this.activeLayerId = layer.id;
		return layer; // return layer [object] ref
	}

	//--------------------------------
	// Check Tile Types Across Layers
	//--------------------------------
	// Check whether any layer has any requested type at this tile.
	// RETURNS: [boolean] `true` if any requested type matches.
	// * x, y  - [int] Exact board tile coordinates.
	// * types - [string|string[]] One or more tile types to check.
	isPointType( x, y, types ) {
		// Normalize a single type so both input forms use the same check.
		const requestedTypes = Array.isArray(types) ? types : [types];
		const layers = this?.getLayers?.() ?? [];
		// Read the tile types once per layer and stop at the first match.
		return layers.some(
			layer => {
				const tileTypes = layer?.getTileTypes( x, y );
				return requestedTypes.some( type => tileTypes?.has(type) );
			});
	}
}
