//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/methods/painter.plugin.js loaded' );

// Canvas painter "methods" plugin.
(function( window ) {
	// Define the plugin [object]
	var type	= 'methods';
	var subtype	= 'painter';
	var plugin	= {
		//--------------------------------
		// Plugin Setup Function
		//--------------------------------
		init: function( client ) {	},

		//--------------------------------
		// New Method(s) In Tiler Application
		//--------------------------------
		extend: function( Klass, proto ) {
			//--------------------------------
			// Level Editing Method(s)
			//--------------------------------
			// Replace a region in the level matrix with a tile.
			// RETURNS: [boolean] `true` on success else `false` on fail.
			// * ctx		- Canvas context [object] to draw on.
			// * bounds		- [object] of arena-target or canvas boundaries to clamp to.
			// * cx,cy		- [int] Values of mask top-left x,y coordinates on canvas.
			// * mask		- 2d [array<boolean>] of add/subtract regions to draw.
			//   fill		– [string|null] fill style for inside area
			//   stroke		– [string|array] stroke style or array of multiple { color, weight, dash, offset }
			//   shadow		– [object|null] { color, blur, offsetX, offsetY } if any
			//   contents	– [object|null] { img, x, y, w, h } image and draw target info
			proto.drawCompositeRect = function(
				ctx, bounds, cx, cy, mask,
				fill=null, stroke=null, shadow=null, contents=null ) {
				//--------------------------------
				// Validate Drawing Mask
				//--------------------------------
				// An empty mask contains no drawable cells. This can legitimately occur
				// while a selection is being cleared, rebuilt, or reduced to zero cells.
				if ( !mask?.length || !mask[0]?.length )
					return false; // nothing to draw

				//--------------------------------
				// Resolve Composite Dimension(s)
				//--------------------------------
				// Get grid units of board.
				const { units } = bounds;

				// Get the column and row span of the validated mask.
				const rows = mask.length;
				const cols = mask[0].length;
				
				// -------------------------
				// Compute Composite Mask
				// -------------------------
				// Build boolean tile grid
				/*const mask	=
					Array.from(
						{ length: rows },
						() => Array(cols).fill(false)
						);

				// Merge add/subtract regions into mask
				for ( const r of regions ) {
					const sx = Math.floor( r.x / units );
					const sy = Math.floor( r.y / units );
					const w  = Math.ceil( r.w / units );
					const h  = Math.ceil( r.h / units );
					// Iterate each cell of the region & render [bool] in mask.
					for ( let y=sy; y<sy+h; y++ ) {
						for ( let x=sx; x<sx+w; x++ ) {
							if ( x<0 || y<0 || x>=cols || y>=rows ) continue;
							if ( r.mype==='sub' )
								mask[y][x]	= false;
							else mask[y][x]	= true;
						}
					}
				}*/

				// -------------------------
				// Fill Background Shadow
				// -------------------------
				// Check if shadow supplied.
				if ( shadow ) {
					// Save context state & render stroke.
					ctx.save();
					ctx.shadowColor		= shadow.color;
					ctx.shadowBlur		= shadow.blur;
					ctx.shadowOffsetX	= shadow.offsetX;
					ctx.shadowOffsetY	= shadow.offsetY;
					ctx.fillStyle		= shadow.fill || fill || 'black';
					for ( let my=0; my<rows; my++ ) {
						for ( let mx=0; mx<cols; mx++ ) {
							if ( mask[my][mx] )
								ctx.fillRect( (cx+mx)*units, (cy+my)*units, units, units );
						}
					}
					ctx.restore(); // restore state
				}

				// -------------------------
				// Fill Active Selection Area
				// -------------------------
				// Check if fill value supplied.
				if ( fill ) {
					// Save context state & render stroke.
					ctx.save();
					ctx.fillStyle = fill;
					// Iterate columns & rows & draw each tile rectangle.
					for ( let my=0; my<rows; my++ ) {
						for ( let mx=0; mx<cols; mx++ ) {
							if ( mask[my][mx] )
								ctx.fillRect( (cx+mx)*units, (cy+my)*units, units, units );
						}
					}
					ctx.restore(); // restore state
				}

				// -------------------------
				// Draw Contents (Image)
				// -------------------------
				// Check for contents to draw.
				if ( contents && contents.img ) {
					// Draw image onto canvas.
					ctx.drawImage(
						contents.img,
						0, 0, contents.w, contents.h, // source rect
						contents.x, contents.y, contents.w, contents.h // dest rect
						);
				}

				// -------------------------
				// Stroke Masked Perimeter
				// -------------------------
				// Use Path2D to draw an irregular rectangle region.
				const path = new Path2D();
				for ( let my=0; my<rows; my++ ) {
					for ( let mx=0; mx<cols; mx++ ) {
						if ( !mask[my][mx] ) continue;
						// Determine which tile edges are not adjacent to another solid
						const top    = my === 0         || !mask[my-1][mx];
						const right  = mx === cols - 1  || !mask[my][mx+1];
						const bottom = my === rows - 1  || !mask[my+1][mx];
						const left   = mx === 0         || !mask[my][mx-1];
						// Determine actual tile x,y in pixels.
						const tx = (cx+mx) * units;
						const ty = (cy+my) * units;
						// Determine if cell is around perimeter.
						if ( top ) {
							path.moveTo( tx, ty );
							path.lineTo( tx+units, ty );
						}
						if ( right ) {
							path.moveTo( tx+units, ty );
							path.lineTo( tx+units, ty+units );
						}
						if ( bottom ) {
							path.moveTo( tx+units, ty+units );
							path.lineTo( tx, ty+units );
						}
						if ( left ) {
							path.moveTo( tx, ty+units );
							path.lineTo( tx, ty );
						}
					}
				}
				// -------------------------
				// Render Stroke(s)
				// -------------------------
				// Check for stroke to draw.
				if ( stroke ) {
					const strokes = Array.isArray(stroke) ? stroke : [stroke];
					for ( const s of strokes ) {
						// Save context state & render irregular path stroke.
						ctx.save();
						if ( typeof s==='string' ) {
							ctx.strokeStyle	= s;
							ctx.lineWidth	= 1;
							ctx.setLineDash( [] );
							ctx.lineDashOffset = 0;
						}
						else {
							ctx.strokeStyle	= s.color || '#000';
							ctx.lineWidth	= s.weight || 1;
							ctx.setLineDash( s.dash || [] );
							ctx.lineDashOffset = s.offset || 0;
						}
						ctx.stroke(path);
						ctx.restore(); // restore state
					}
				}
			}
		}
	};

	// register with JestCreator
	if ( window.JestCreator && typeof window.JestCreator.use==='function' )
		window.JestCreator.use( type, plugin );
	else console.error( 'methods/painter.plugin.js load error: JestCreator.use() not found' );
})( window );
