//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/editing/JestGovernor.js loaded' );

//-------------------------
// JestGovernor Class
//-------------------------
// A state manager for state changes.
class JestGovernor extends JestElement {
	// Object properties
	stacks		= {};			// [object] { states: [ … ], index: number, limit: number }
	queue		= {};			// [object] Map of { [key]: object } pending metadata to merge on next log

	// --------------------------------
	// Constructor
	// --------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client		- [object] Application client that this piece belongs to.
	constructor( client ) {
		super( client ); // call parent constructor
		// Initialize mode(s) & propert(ies).
		this.jot( 'reverting', false ); // not active
	}

	// --------------------------------
	// Stack Handling
	// --------------------------------
	// Initialize (or re-initialize) a stack under `key`, with an optional limit.
	// If the stack already exists, this will override its limit and clear history.
	// RETURNS: [void].
	// * key		– string identifier for this stack
	// * limit		– max number of entries to keep in history (oldest drop first)
	init( key, limit=100 ) {
		// Enforce that limit is an integer ≥ 1
		const maxLimit		= Number.isInteger(limit) && limit>0 ? limit : 100;
		this.stacks[key]	= {
			states  : [],		// array of JSON snapshots
			index   : -1,		// “pointer” into states; −1 means “no states yet”
			limit   : maxLimit	// max entries to keep
			};
		// Emit event.
		this.emit( `init`, null, key, limit ); // emit event
	}

	// --------------------------------
	// Queue Metadata for Next Log
	// --------------------------------
	// Queues extra data to be merged into the next log() snapshot.
	// * key   – [string] The stack key
	// * data  – [object] Metadata to merge into next log state
	enqueue( key, data ) {
		if ( typeof key!=='string' || !data || typeof data!=='object' ) return;
		if ( !this.queue[key] ) this.queue[key] = {};
		Object.assign( this.queue[key], data );
	}

	// --------------------------------
	// Dequeue Metadata Before Log
	// --------------------------------
	// Removes any queued metadata waiting to be merged into the next log().
	// * key   – [string] Stack key to clear metadata for
	// * fields – [array] Optional [array] of specific field names to remove
	dequeue( key, fields=null ) {
		// No queue? Nothing to remove.
		if ( !this.queue?.[key] ) return;
		// Remove specific fields
		if ( Array.isArray(fields) ) {
			for ( const f of fields )
				delete this.queue[key][f];
			// If empty, nuke the whole key
			if ( Object.keys(this.queue[key]).length===0 )
				delete this.queue[key];
		}
		// No fields? Remove entire metadata block.
		else delete this.queue[key];
	}

	// Record a new state for `key`. If the current index is not at the very end,
	// drop any “redo” states first. Then append newState. Finally, if we exceed
	// the limit, remove the oldest entry(s) from the front.
	// RETURNS: Newly logged snapshot [object|null].
	// * key		– [string] Value of which stack to use.
	// * newState	– any JSON-serializable [object].
	log( key, newState ) {
		// If reverting, skip.
		if ( this.skim('reverting') ) return null;
		// Ensure the stack exists (default limit = 100)
		if ( !this.stacks[key] ) this.init( key );

		// --------------------------------
		// Log New Result
		// --------------------------------
		const stack		= this.stacks[key];
		const i			= stack.index;
		const lastIndex	= stack.states.length - 1;
		// If we’re not at the latest snapshot, drop everything after `index`
		if ( i<lastIndex ) {
			// Find how many states are removed.
			const overwrite	= lastIndex - i;
			// Remove from current state (i+1) through end of list.
			stack.states.splice( i+1, lastIndex-i );
			// Emit event.
			this.emit( `overwrote`, null, key, overwrite ); // emit event
			// No more redos are possible.
			this.emit( `redo:limit`, null, key );
		}

		// Merge queued metadata, if any
		const meta = this.queue[key] || null;
		if ( meta ) delete this.queue[key];
		// Merge queued data or use raw supplied arg.
		const snapshot = ( meta && typeof newState==='object' )
			? Object.assign( {}, newState, meta )
			: newState;

		// Push a deep-cloned copy of newState
		// (so future mutation of the original object won’t affect history)
		stack.states.push( snapshot );
		stack.index		= stack.states.length - 1;

		// Emit new event signaling that an event was logged.
		this.emit( `logged`, null, key, stack, snapshot );
		// Emit new event signaling that something has changed.
		this.emit( `changed`, null, key, snapshot );
		// Emit new event signaling that undo is possible.
		this.emit( `undoable`, null, key, stack.states.length );

		// --------------------------------
		// Clear Overflowed States
		// --------------------------------
		// Call overflow check.
		this.overflow( key );
		// Return snapshot.
		return snapshot; // log [object]
	}

	// --------------------------------
	// Append to Current State
	// --------------------------------
	// Merge additional metadata into the *current* state (if exists).
	// RETURNS: [bool] true if successful, else false
	// * key		– [string] stack key
	// * updates	– [object] fields to merge into the latest snapshot
	domino( key, updates ) {
		// If reverting, abort.
		if ( this.skim('reverting') ) return false;
		// Validate inputs
		if ( typeof key!=='string' || !updates || typeof updates!=='object' ) return false;
		const stack = this.stacks[key];
		if ( !stack || stack.index<0 ) return false;

		// Grab the actual logged object
		const current = stack.states[stack.index];

		// Shallow merge the updates
		Object.assign( current, updates );

		// Emit event for metadata update
		this.emit( 'modified', null, key, current, stack.index );
		return true;
	}

	// --------------------------------
	// Get Current Log Reference
	// --------------------------------
	// Gets a *live reference* to the actual current snapshot object.
	// WARNING: modifying this directly alters undo history!
	// RETURNS: [object|null] the actual state object or null
	// * key     – [string] stack key
	pezLog( key ) {
		const stack = this.stacks[key];
		if ( !stack || stack.index<0 ) return null;
		return stack.states[stack.index]; // live reference
	}

	// --------------------------------
	// Get Stack (if exists)
	// --------------------------------
	// Attempt to get a stack.
	// RETURNS: [void].
	// * key	– [string] Value of which stack to get.
	getStack( key ) {
		// If reverting, skip.
		if ( this.skim('reverting') ) return;
		// Ensure the stack exists
		if ( !this.stacks?.[key] ) return;
		return this.stacks[key]; // return stack
	}

	// --------------------------------
	// Revert Method(s)
	// --------------------------------
	// Attempt to undo an action inside an open level file.
	// RETURNS: [void].
	// * count	- signed [int] value to iterate (negative for undo).
	// * key	– [string] Value of which stack to use.
	revert( count, key ) {
		// If reverting, skip.
		if ( this.skim('reverting') ) return;
		// Determine action by count.
		const action	= count<0 ? 'undo' : 'redo'; // determine action
		// Iterate requested amount of action.
		for ( let i=0; i<Math.abs(count); i++ ) {
			if ( action==='undo' )
				this.undo( key );	// undo
			else this.redo( key );	// redo
		}
	}

	// Step backward one state, if possible.
	// RETURNS: the new “current” snapshot, or null if no undo is possible.
	// * key	– [string] Value of which stack to use.
	undo( key ) {
		// If reverting, skip.
		if ( this.skim('reverting') ) return;
		// Check if undos are possible.
		const stack	= this.stacks[key];
		if ( !stack || stack.index<0 ) return null;
		// Get new current snapshot.
		const snapshot	= stack.states[stack.index];
		// Iterate the stack index back one state.
		stack.index--;
		// If undo max limit reached, emit event.
		if ( stack.index<0 ) // emit event
			this.emit( `undo:limit`, null, key );
		// Emit undo event.
		this.emit( `undo`, null, key, snapshot, stack.states.length, stack.index );
		// Emit new event signaling that something has changed.
		this.emit( `changed`, null, key, snapshot );
		// Emit new event signaling that redo is possible.
		this.emit( `redoable`, null, key, stack.states.length );
		return snapshot; // return snapshot
	}

	// Step forward one state, if possible.
	// RETURNS: the new “current” snapshot, or null if no redo is possible.
	// * key	– [string] Value of which stack to use.
	redo( key ) {
		// If reverting, skip.
		if ( this.skim('reverting') ) return;
		// Check if redos are possible.
		const stack	= this.stacks[key];
		if ( !stack || stack.index>=(stack.states.length-1) ) return null;
		// Iterate the stack index back one state.
		stack.index++;
		// Get new current snapshot.
		const snapshot	= stack.states[stack.index];
		// If redo max limit reached, emit event.
		if ( stack.index>=(stack.states.length-1) ) // emit event
			this.emit( `redo:limit`, null, key );
		// Emit redo event.
		this.emit( `redo`, null, key, snapshot, stack.states.length, stack.index );
		// Emit new event signaling that something has changed.
		this.emit( `changed`, null, key, snapshot );
		return snapshot; // return snapshot
	}

	//-----------------------------
	// Clear All History Immediately
	//-----------------------------
	// Wipes internal governor stack with no undo logic.
	// Emits `clear` event so UI can purge history list.
	// RETURNS: [void]
	// * key – [string] identifier for this stack
	clear( key ) {
		// If reverting, skip.
		if ( this.skim('reverting') ) return;
		// Check if stack for key exists.
		const stack		= this.stacks[key];
		if ( !stack ) return;
		// Empty states [array].
		stack.states	= [];
		stack.index 	= -1; // reset index
		// Emit event.
		this.emit( 'clear', null, key ); // signal UI to clear
	}

	//-----------------------------
	// Reset History by Rewinding
	//-----------------------------
	// Performs full stepwise undo to index -1.
	// Emits 'undo' events for each step, preserving animation.
	// RETURNS: [void]
	// * key – [string] identifier for this stack
	reset( key ) {
		// If reverting, skip.
		if ( this.skim('reverting') ) return;
		// Iterate all undo states & undo.
		while ( this.canUndo(key) )
			this.undo( key ); // each call emits full undo event
		// Emit event.
		this.emit( 'reset', null, key ); // signal UI reset took place
	}

	// Checks if a stack overflowed & trims the excess.
	// RETURNS: [bool] if overflowed, else [false].
	// * key	– which stack to update
	// * limit	– limit to overflow check on.
	overflow( key, limit=null ) {
		// Get the stack.
		const stack	= this.stacks[key];
		if ( !stack ) return false;
		if ( limit==null )
			limit	= stack.limit ?? 0;
		// If we now exceed `limit`, remove oldest entries at the front
		if ( stack.states.length>limit ) {
			// Number of items to drop = currentLength – limit
			const overflow = stack.states.length - limit;
			// Remove `overflow` items from start
			stack.states.splice( 0, overflow );
			// Adjust index downward by however many we removed
			stack.index -= overflow;
			if ( stack.index<0 ) {
				stack.index = -1; // clamp index
				this.emit( `undo:limit`, null, key ); // emit event
			}
			// Emit event.
			this.emit( `overflow`, null, key, overflow, stack.index );
			return true; // overflowed
		}
		return false; // no overflow
	}

	// --------------------------------
	// Log New Result
	// --------------------------------
	// Peek at the current state without modifying anything.
	// RETURNS: the JSON snapshot at `index`, or null if stack is empty.
	current( key ) {
		// Check if current state exists.
		const stack	= this.stacks[key];
		if ( !stack || stack.index<0 ) return null;
		return stack.states[stack.index]; // return state
	}

	// Change the limit for `key`. If the existing history is longer than the
	// new limit, immediately drop the oldest entries.
	// RETURNS: [void].
	// * key      – which stack to update
	// * newLimit – integer ≥ 1; if invalid, no change is made
	setLimit( key, newLimit ) {
		const stack	= this.stacks[key];
		if ( !stack ) return;
		// Validate newLimit
		if ( !Number.isInteger(newLimit) || newLimit<1 ) return;
		stack.limit	= newLimit;
		// Call overflow check.
		this.overflow( key, newLimit );
	}

	// --------------------------------
	// Reporting Method(s)
	// --------------------------------
	// Does `key` exist and have at least one recorded state?
	hasState( key ) {
		const stack	= this.stacks[key];
		return !!( stack && stack.states.length>0 );
	}

	// Can an undo be performed?
	// RETURNS: [bool] true if undo is possible, else false.
	canUndo( key ) {
		const stack = this.stacks[key];
		return !!( stack && stack.index>=0 );
	}

	// Can a redo be performed?
	// RETURNS: [bool] true if redo is possible, else false.
	canRedo( key ) {
		const stack = this.stacks[key];
		return !!( stack && stack.index<(stack.states.length-1) );
	}

	// How many undo steps are possible?
	// RETURNS: [int] number of undos possible.
	getUndoCount( key ) {
		const stack = this.stacks[key];
		if ( !stack ) return 0;
		return stack.index + 1;
	}

	// How many redo steps are possible?
	// RETURNS: [int] number of redos possible.
	getRedoCount( key ) {
		const stack = this.stacks[key];
		if ( !stack ) return 0;
		return stack.states.length - stack.index - 1;
	}

	// Full stack report.
	// RETURNS: [object] with report details.
	report( key ) {
		const stack = this.stacks[key];
		if ( !stack ) {
			return {
				exists:		false,
				states:		0,
				index:		-1,
				limit:		0,
				canUndo:	false,
				canRedo:	false,
				undoCount:	0,
				redoCount:	0,
				current:	null
				};
		}
		return {
			exists:		true,
			states:		stack.states.length,
			index:		stack.index,
			limit:		stack.limit,
			canUndo:	this.canUndo( key ),
			canRedo:	this.canRedo( key ),
			undoCount:	this.getUndoCount( key ),
			redoCount:	this.getRedoCount( key ),
			current:	this.current( key )
			};
	}
}
