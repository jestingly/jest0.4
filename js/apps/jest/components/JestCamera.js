//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/JestCamera.js loaded' );

//-------------------------
// JestCamera Class
//-------------------------
class JestCamera extends JestMatrix {
	// Object properties
	padding			= 0;			// [int] Optional padding around the viewport (in pixels).

	// --------------------------------
	// Constructor
	// --------------------------------
	// Construct the [object].
	// * client		- [object] Application client creating the object.
	// * padding	- [int] Optional extra padding (in pixels) around the viewport.
	constructor( client, padding=0 ) {
		// Call the parent object constructor
		super( client );			// construct the parent
		this.padding		= padding;
		// The top-left position of the camera in world space:
		this.anchor.move( 0, 0 );	// [object] Anchor is inherited
	}

	// --------------------------------
	// Get [object] Coordinates
	// --------------------------------
	// Get level positioning for user's current level.
	// RETURNS: [object|null] `{ ... }` if found, else `null`.
	//		Returns the world & global coordinates of the user's current level.
	//		levelWorldX/Y	= tile index of level × size of level in tiles (in tile units).
	//		levelGlobalX/Y	= tile index × full pixel span of a level (levelSpan = tileGrid × levelGrid).
	getLevelLocation() {
		// Get level [object] or throw error
		const level			= this.client.user.level ?? null;
		if ( level===null ) {
			//console.error( `Level could not be located.` );
			return null;
		}
		const levelWorldX	= level.anchor.x * this.client.config.levelGrid;
		const levelWorldY	= level.anchor.y * this.client.config.levelGrid;
		const levelGlobalX	= level.anchor.x * this.client.config.levelSpan;
		const levelGlobalY	= level.anchor.y * this.client.config.levelSpan;
		return {
			level, levelX: level.anchor.x, levelY: level.anchor.y,
			levelWorldX, levelWorldY, levelGlobalX, levelGlobalY
			};
	}

	// Get level, world and global positioning + objects for user in current level.
	// RETURNS: [object|null] `{ user, globalX, globalY, level }` if found, else `null`.
	//		Returns the user's global coordinates:
	//		userWorldX/Y	= user's tile position in current level, offset by level's tile position.
	//		userGlobalX/Y	= full pixel position in the overworld.
	getUserLocation() {
		// Get level location data or throw error
		const levelLoc		= this.getLevelLocation();
		if ( !levelLoc ) {
			console.error( `User location could not be computed.` );
			return null;
		}
		// Define level location(s)
		const { levelWorldX, levelWorldY, levelGlobalX, levelGlobalY } = levelLoc;
		// Return user global (x,y) in overworld
		const user			= this.client.user;
		const userWorldX	= levelWorldX + user.anchor.x; // Overworld X (in tiles)
		const userWorldY	= levelWorldY + user.anchor.y; // Overworld Y (in tiles)
		const userGlobalX	= levelGlobalX + (user.anchor.x*this.client.config.tileGrid);
		const userGlobalY	= levelGlobalY + (user.anchor.y*this.client.config.tileGrid);
		return {
			user, userX: user.anchor.x, userY: user.anchor.y,
			userWorldX, userWorldY, userGlobalX, userGlobalY
			};
	}

	// --------------------------------
	// Screen Calculating
	// --------------------------------
	// Get the viewport dimensions (in pixels) directly from gameboard's anchor.
	// RETURNS: [object] { width, height }
	//		Gets the viewport (visible area) width/height, pulled from the gameboard.anchor.
	getViewport() {
		const canvas	= this.client.gameboard.display.getCanvas( 'world' );
		return {
			viewportWidth:	canvas.width,
			viewportHeight:	canvas.height,
			};
	}

	// Compute the global dimensions from the overworld (in pixels).
	// RETURNS: [object] { globalWidth, globalHeight }
	//		Returns the full overworld width & height in pixels
	getGlobalDimensions() {
		// Get level [object] or throw error
		const level			= this.client.user.level ?? null;
		if ( !(level instanceof JestLevel) ) {
			//console.error( `Level could not be located.` );
			return null;
		}
		// Overworld width/height (in pixels) come from the grid dimensions.
		const globalWidth	= level.overworld.anchor.width * this.client.config.levelSpan;
		const globalHeight	= level.overworld.anchor.height * this.client.config.levelSpan;
		return { globalWidth, globalHeight };
	}

	// Returns the camera’s current view rectangle.
	// RETURNS: [object] { x, y, width, height }
	//		Returns the current visible rectangle of the screen (camera's viewport).
	//		Padded version includes extra space for UI/edge effects, etc.
	getViewRect() {
		const { viewportWidth, viewportHeight } = this.getViewport();
		return {
			x:		this.anchor.x,
			y:		this.anchor.y,
			width:	viewportWidth,
			height:	viewportHeight
			};
	}

	// Returns the padded view rectangle.
	// RETURNS: [object] { x, y, width, height }
	getPaddedViewRect() {
		const { viewportWidth, viewportHeight } = this.getViewport();
		return {
			x:		this.anchor.x - this.padding,
			y:		this.anchor.y - this.padding,
			width:	viewportWidth + 2 * this.padding,
			height:	viewportHeight + 2 * this.padding,
			};
	}

	// --------------------------------
	// Coordinate Conversion Method(s)
	// --------------------------------
	// Convert a point from global space to screen space (relative to the camera’s viewport).
	// RETURNS: [object] { x, y } Screen coordinates.
	// * globalX	- [int] X coordinate in global space.
	// * globalY	- [int] Y coordinate in global space.
	globalToScreen( globalX, globalY ) {
		return {
			x:	globalX - this.anchor.x,
			y:	globalY - this.anchor.y,
			};
	}

	// (Optional) Convert a point from screen space to global space.
	// RETURNS: [object] { x, y } Global coordinates.
	// * screenX	- [int] X coordinate in screen space.
	// * screenY	- [int] Y coordinate in screen space.
	screenToGlobal( screenX, screenY ) {
		return {
			x:	screenX + this.anchor.x,
			y:	screenY + this.anchor.y,
			};
	}

	//-------------------------
	// Calculate On-Screen Position Report
	//-------------------------
	// Gets global/screen coordinates for a given [object], and determines
	// whether it is in the same overworld and currently visible on screen.
	// RETURNS: [object] {
	//   globalX, globalY,         // [float] world-space position in pixels
	//   screenX, screenY,         // [float] screen-space position (relative to camera)
	//   visible,                  // [bool] is object on-screen?
	//   reason                    // [string] visibility reason: 'visible', 'offscreen', 'not_in_overworld'
	// }
	// * obj		- [object] Any JestWorldling or level-bound object with anchor + level.
	// * camera		- [object] JestCamera currently active.
	getScreenPositionReport( obj ) {
		// Get current level + overworld from player
		const playerLevel		= this.client.user.level;
		const objOverworld		= obj.level?.overworld;
		const playerOverworld	= playerLevel?.overworld;
		// Abort if object's level is not in same overworld
		if ( !objOverworld || objOverworld!==playerOverworld ) {
			return { visible: false, reason: 'not_in_overworld' };
		}

		//--------------------------------
		// Compute Global Position
		//--------------------------------
		const { level, anchor }			= obj;
		const { levelSpan, tileGrid }	= this.client.config;
		// Global pixel coordinate of object (based on level origin + anchor offset)
		const globalX = (level.anchor.x * levelSpan) + (anchor.x * tileGrid);
		const globalY = (level.anchor.y * levelSpan) + (anchor.y * tileGrid);

		//--------------------------------
		// Convert to Screen Coordinates
		//--------------------------------
		const { x: screenX, y: screenY } = this.globalToScreen( globalX, globalY );

		//--------------------------------
		// Screen Visibility Check
		//--------------------------------
		const objWidth	= anchor.width;		// Object width in pixels
		const objHeight	= anchor.height;	// Object height in pixels
		const viewport	= this.getPaddedViewRect(); // Camera view rectangle (with optional padding)

		// Check if any part of the object intersects the view rectangle
		const isOnScreen =
			(
			screenX + objWidth  >=  0 &&
			screenX              <  viewport.width &&
			screenY + objHeight >=  0 &&
			screenY              <  viewport.height
			);

		//--------------------------------
		// Return Final Report
		//--------------------------------
		return {
			globalX,							// World X space position (pixels)
			globalY,							// World Y space position (pixels)
			screenX : Math.floor(screenX),		// Screen X space position
			screenY : Math.floor(screenY),		// Screen Y space position
			visible : isOnScreen,				// True if within view rect
			reason  : isOnScreen ? 'visible' : 'offscreen' // Explanation
		};
	}

	//-------------------------
	// User Boundary Handling
	//-------------------------
	// Checks and corrects user position if out of bounds.
	// RETURNS: [object] `{ level: [string], x: [int], y: [int] }`
	// * x	- [int] User's attempted X position.
	// * y	- [int] User's attempted Y position.
	checkUserPosition( x, y ) {
		// Get current level info.
		const levelData	= this.getLevelLocation();
		if ( !levelData )
			return { level: this.client.user.level.name, x, y };
		// Destructure level location and current level
		const { levelX, levelY, level } = levelData;
		const overworld	= level.overworld;
		// Use separate config properties for width and height.
		const { levelGrid: levelWidth, levelGrid: levelHeight, tileGrid } = this.client.config;
		const { width: userWidth, height: userHeight } = this.client.user.anchor;
		// Get level neighbors (only N, E, S, W)
		const limits = {
			n: overworld.matrix[levelY - 1]?.[levelX] || null,
			e: overworld.matrix[levelY]?.[levelX + 1] || null,
			s: overworld.matrix[levelY + 1]?.[levelX] || null,
			w: overworld.matrix[levelY]?.[levelX - 1] || null
			};

		// User movement boundaries
		const bleedX = 0;
		const bleedY = 0;
		const minX   = limits.w ? -bleedX : 0;
		const maxX   = limits.e ? levelWidth - bleedX : levelWidth - 1;
		const minY   = limits.n ? -bleedY : 0;
		const maxY   = limits.s ? levelHeight - bleedY : levelHeight - 2;

		// Instantiate dynamic variables to calculate new position
		let newX = x, newY = y, newLevelX = levelX, newLevelY = levelY;
		// Determine overshoots along each axis
		const overshootX = x<minX ? minX-x : x>maxX ? x-maxX : 0;
		const overshootY = y<minY ? minY-y : y>maxY ? y-maxY : 0;
		// Handle transitions
		if ( x<minX && limits.w )      { newLevelX--; newX = levelWidth - bleedX - (minX-x); }
		else if ( x>maxX && limits.e ) { newLevelX++; newX = x-maxX; }
		else newX = Math.max( minX, Math.min(maxX,x) );

		if ( y<minY && limits.n )      { newLevelY--; newY = levelHeight - bleedY - (minY-y); }
		else if ( y>maxY && limits.s ) { newLevelY++; newY = y-maxY; }
		else newY = Math.max( minY, Math.min(maxY,y) );

		// Get new level or stay in the current one
		const nextLevel = overworld.matrix[newLevelY]?.[newLevelX];
		return nextLevel
			? { level: nextLevel.name, x: newX, y: newY }
			: { level: level.name, x: newX, y: newY };
	}

	// --------------------------------
	// Central Rendering Loop
	// --------------------------------
	// Update the camera position so that the given global coordinate (typically the user's position)
	// is centered, clamped to the world boundaries.
	update() {
		// Get user & viewport info
		const { userGlobalX, userGlobalY }      = this.getUserLocation();
		const { viewportWidth, viewportHeight } = this.getViewport();
		const { globalWidth, globalHeight }     = this.getGlobalDimensions();
		// Center the camera on the user:
		let camX = userGlobalX - (viewportWidth/2);
		let camY = userGlobalY - (viewportHeight/2);
		// Clamp to world bounds:
		camX     = Math.max( 0, Math.min(camX,globalWidth-viewportWidth) );
		camY     = Math.max( 0, Math.min(camY,globalHeight-viewportHeight) );
		this.anchor.move( Math.round(camX), Math.round(camY) );
	}
}
