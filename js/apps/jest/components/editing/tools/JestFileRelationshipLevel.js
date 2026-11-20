//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/editing/tools/JestFileRelationshipLevel.js loaded' );

//-------------------------
// JestFileRelationshipLevel Class
//-------------------------
// Links open level views and draws their adjoining edges.
class JestFileRelationshipLevel extends JestFileRelationship {
	// Grid offsets relative to the active level. Positive Y moves south.
	static directions =
		Object.freeze({
			northwest   : [ -1, -1 ],
			north       : [  0, -1 ],
			northeast   : [  1, -1 ],
			west        : [ -1,  0 ],
			east        : [  1,  0 ],
			southwest   : [ -1,  1 ],
			south       : [  0,  1 ],
			southeast   : [  1,  1 ]
			});

	//--------------------------------
	// Assign a Neighbor
	//--------------------------------
	// Set or clear a level view at a compass direction.
	// RETURNS: [boolean] `true` when the assignment was accepted.
	// * direction - [string] Compass direction relative to the owner.
	// * view      - [JestFileViewEditorPainterLevel|null] Target view.
	setView( direction, view ) {
		// Require a known direction and a level view when assigning a target.
		if ( !Object.hasOwn(JestFileRelationshipLevel.directions,direction) )
			return false; // fail
		if ( view!==null && !(view instanceof JestFileViewEditorPainterLevel) )
			return false; // fail

		// Let the parent validate and store the link.
		return super.setView( direction, view );
	}

	//--------------------------------
	// Draw a Neighbor Edge
	//--------------------------------
	// Composite the visible part of the neighbor into a preview canvas.
	// RETURNS: [boolean] `true` when a linked level was available.
	// * direction   - [string] Compass direction of the linked view.
	// * destination - [ElementCanvas] Canvas for this edge or corner.
	// * edge        - [int] Preview depth in unzoomed pixels.
	drawNeighbor( direction, destination, edge ) {
		// Resolve the level through the current target view.
		const level = this.getView(direction)?.file?.context;
		if ( !level ) return false; // fail

		//--------------------------------
		// Calculate Source Crop
		//--------------------------------
		// Keep the full span on axes that line up with the active level.
		const [x,y] = JestFileRelationshipLevel.directions[direction];
		const span  = this.owner.client.config.levelSpan;
		const w     = x===0 ? span : edge;
		const h     = y===0 ? span : edge;

		// West uses the neighbor's right edge. North uses its bottom edge.
		const sx    = x<0 ? span-w : 0;
		const sy    = y<0 ? span-h : 0;

		//--------------------------------
		// Draw Visible Layers
		//--------------------------------
		// Keep the backing canvas at the crop's original pixel size.
		if ( destination.width!==w || destination.height!==h )
			destination.resize( w, h );

		// Clear the old preview, then composite layers from bottom to top.
		destination.clear(); // clear canvas
		for ( const layer of level.getLayers() ) {
			// Skip hidden layers and layers whose canvas is unavailable.
			if ( !layer.visible || !layer.canvas?.width || !layer.canvas?.height )
				continue; // skip

			// Copy only the part of this layer facing the active level.
			destination.draw(
				layer.canvas, false, false,
				0, 0, sx, sy,
				w, h
				);
		}

		return true; // success
	}
}
