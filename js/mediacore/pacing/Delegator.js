//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/mediacore/pacing/Delegator.js loaded' );

//-----------------------------
// Delegator Class
//-----------------------------
// Manages suppression of specific actions for specific tools/actors,
// allowing temporary suspension of certain interactions during transitions.
//
// USAGE:
//  client.delegator.suppress( 'dragdrop', ['click','mouseup'], 500 );
//  client.delegator.allowed( 'paintbrush', 'click' ); // returns true/false
//
class Delegator extends OSCallback {
	// Object Properties
	suppressions      = {};     // [object] Map of { actor: { action: timestamp } }
	// Permanent suppressions (manual toggle)
	permaSuppressions = {};     // [object] { actor: Set<action> }

	//--------------------------------
	// Constructor
	//--------------------------------
	// Construct the [object].
	constructor() {
		super();	// call parent constructor
	}

	//--------------------------------
	// Suppress Actions for Actor
	//--------------------------------
	// Temporarily disables one or more actions for a given actor/tool.
	// They will be blocked from triggering until the timeout expires.
	// * actor		- [string] name of the actor/tool (e.g. 'dragdrop')
	// * actions	- [string|array<string>] action(s) to suppress (e.g. 'click')
	// * timeout	- [int] duration in ms to suppress action(s)
	suppress( actor, actions, timeout ) {
		if ( !actor || !timeout ) return;
		if ( typeof actions==='string' )
			actions = [ actions ];
		if ( !Array.isArray(actions) ) return;

		// Create actor entry if needed
		if ( !this.suppressions[ actor ] )
			this.suppressions[ actor ] = {};

		const now = Date.now();

		// Set each action with timeout
		for ( const act of actions )
			this.suppressions[actor][act] = now + timeout;
	}

	//--------------------------------
	// Is Actor Allowed for Action?
	//--------------------------------
	// Checks if the given actor is allowed to perform the specified action.
	// RETURNS: [bool] true if allowed, false if suppressed by others
	// * actor		- [string] name of actor/tool (e.g. 'paintbrush')
	// * action		- [string] action being attempted (e.g. 'click')
	allowed( actor, action ) {
		// Validate argument(s).
		if ( !actor || !action ) return true;

		// First check: permanent suppression
		for ( const [suppressor, actions] of Object.entries(this.permaSuppressions) ) {
			if ( suppressor!==actor && actions.has(action) )
				return false; // forbid
		}

		// Then check: temporary suppression
		const now = Date.now();
		for ( const [suppressor, actions] of Object.entries(this.suppressions) ) {
			// Check if actor allowed.
			if ( suppressor===actor ) continue;
			// Actor mismatch, check if suppression expired.
			const expiry = actions[ action ];
			if ( expiry && expiry>now ) return false; // forbid
		}

		// Not blocked by others
		return true; // allowed
	}

	//--------------------------------
	// Is Action Allowed
	//--------------------------------
	// Checks if an action is currently allowed for a given actor/tool.
	// RETURNS: [bool] true if allowed, false if suppressed
	// * actor		- [string] name of actor/tool
	// * action		- [string] action to check (e.g. 'click')
	selfBlocked( actor, action ) {
		// Validate argument(s).
		if ( !actor || !action ) return true;

		// Check permanent suppression.
		const perma = this.permaSuppressions[ actor ];
		if ( perma && perma.has(action) ) return false;

		// Check temporary suppression.
		const map = this.suppressions[ actor ];
		if ( !map ) return true;

		const expiry = map[ action ];
		if ( !expiry ) return true;

		// If expired, remove entry
		if ( Date.now()>=expiry ) {
			delete map[ action ];
			if ( Object.keys(map).length===0 )
				delete this.suppressions[ actor ];
			return true;
		}

		// Still suppressed
		return false;
	}

	//--------------------------------
	// Clear All Suppressions
	//--------------------------------
	// Instantly clears all active suppressions for all actors.
	// RETURNS: [void]
	clearAll() {
		this.suppressions = {};
	}

	//--------------------------------
	// Clear Specific Actor or Action
	//--------------------------------
	// Removes suppression from a specific actor or actor+action.
	// * actor		- [string] name of actor/tool
	// * action		- [string|null] optional action to clear; if null, clears all
	clear( actor, action=null ) {
		if ( !this.suppressions[ actor ] ) return;

		if ( action===null )
			delete this.suppressions[ actor ];
		else {
			delete this.suppressions[ actor ][ action ];
			if ( Object.keys(this.suppressions[ actor ]).length === 0 )
				delete this.suppressions[ actor ];
		}
	}

	//--------------------------------
	// Permanently Suppress Action(s)
	//--------------------------------
	// Prevents action(s) from being allowed for this actor indefinitely.
	// * actor		- [string]
	// * actions	- [string|array<string>]
	permaSuppress( actor, actions ) {
		if ( typeof actions === 'string' ) actions = [ actions ];
		if ( !Array.isArray(actions) ) return;

		if ( !this.permaSuppressions[ actor ] )
			this.permaSuppressions[ actor ] = new Set();

		for ( const act of actions )
			this.permaSuppressions[ actor ].add( act );
	}

	//--------------------------------
	// Remove Permanent Suppression (with optional cooldown)
	//--------------------------------
	// Removes permanent suppression from an actor or specific action(s).
	// If a timeout is supplied, the action(s) will remain suppressed temporarily.
	// * actor		- [string]
	// * action	- [string|array|null] action or list of actions to clear; null = all
	// * timeout	- [int|null] optional cool-off time in ms
	clearPerma( actor, action=null, timeout=null ) {
		if ( !this.permaSuppressions[actor] ) return;

		const wasCleared = [];

		if ( action === null ) {
			// Clear all permanent suppressions for this actor
			for ( const act of this.permaSuppressions[actor] )
				wasCleared.push( act );

			delete this.permaSuppressions[actor];
		}
		else {
			// Normalize to array
			const actions = ( typeof action === 'string' ) ? [ action ] : action;

			for ( const act of actions ) {
				this.permaSuppressions[actor].delete( act );
				wasCleared.push( act );
			}

			// Clean up empty set
			if ( this.permaSuppressions[actor].size === 0 )
				delete this.permaSuppressions[actor];
		}

		// Apply temporary suppression if needed
		if ( timeout && timeout > 0 ) {
			const now = Date.now();
			if ( !this.suppressions[actor] )
				this.suppressions[actor] = {};

			for ( const act of wasCleared )
				this.suppressions[actor][act] = now + timeout;
		}
	}
}
