//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/editing/tools/JestToolbox.js loaded' );

//-------------------------
// JestToolbox Class
//-------------------------
// Manages the currently active tool for the application.
// Handles activation, deactivation, and temporary 'wielded' tool overrides.
class JestToolbox extends JestElement {
	//-------------------------
	// Object Properties
	//-------------------------
	activeTool			= null;				// [object] Current active tool
	prevTool			= null;				// [object] Previous tool before wield
	tools				= {};				// [object] Map of tools by name
	holdkeys		= {};				// [object] Map of key → array of { from, to }
	heldkey				= null;				// [string] Currently held trigger key
	_switchingTemporary = false; // [bool] True only while a temporary switch calls setTool().

	//--------------------------------
	// Constructor
	//--------------------------------
	// Setup toolbox and attach input listeners.
	// * client - [object] Main app instance
	constructor( client ) {
		super( client ); // call parent constructor
		// Listen to key hold/release via central IO system
		client.io.register( 'keyPress',   'holdSwitch',    e => this._onKeyPress(e.event) );
		client.io.register( 'keyRepeat',  'holdMonitor',   e => this._onKeyRepeat(e) );
		client.io.register( 'keyRelease', 'releaseSwitch', e => this._onKeyRelease(e.event) );
		//--------------------------------
		// Lost Key-Release Recovery
		//--------------------------------
		// Browser/OS shortcuts may steal keyboard focus before Alt is released.
		// Without these fallbacks, the eyedropper can remain wielded indefinitely.
		// Treat loss of window focus as the end of any temporary tool hold.
		window.addEventListener( 'blur', () => this.releaseHeldTool() );
		// Also recover when the page becomes hidden (e.g. switching tabs).
		document.addEventListener( 'visibilitychange', () => {
			if ( document.hidden ) this.releaseHeldTool();
		});
		// A lost keyup can occur without blur; mouse events expose modifier state.
		// Capture phase runs this check before tool-specific pointer handlers.
		window.addEventListener( 'pointermove', e => this._checkHeldModifier(e), true );
		window.addEventListener( 'pointerdown', e => this._checkHeldModifier(e), true );
	}

	//--------------------------------
	// Tool Registration
	//--------------------------------
	// Add a new tool to the toolbox.
	// * name - [string] Name key for tool
	// * tool - [JestTool] Tool instance
	registerTool( name, tool ) {
		// Validate argument(s).
		if ( typeof name!=='string' || !tool ) return;
		// Keep tool [object] reference in "tools" stack.
		this.tools[name] = tool;
	}

	//--------------------------------
	// Get Tool
	//--------------------------------
	// Retrieve a tool by name.
	// RETURNS: [JestTool|null].
	getTool( name ) {
		// Get a JestTool [object] by [string] name.
		return this.tools[name] ?? null;
	}

	//--------------------------------
	// Register Hold Trigger Mapping
	//--------------------------------
	// Map a [key] to switch from one tool to another when held.
	// Replaces any existing mapping for same key+from combo.
	// * key      – [string] e.g. "Alt", "Control"
	// * from     – [string|null] active tool to match (null means "any")
	// * to       – [string|null] tool to switch to (null = don't switch)
	registerHoldkey( key, from, to ) {
		//--------------------------------
		// Validate Argument(s) & Propert(ies)
		//--------------------------------
		// Validate argument(s).
		if ( typeof key!=='string' ) return;
		// Initialize array for key if needed.
		if ( !Array.isArray(this.holdkeys[key]) )
			this.holdkeys[key] = [];

		//--------------------------------
		// Prevent Duplicate / Prepare Override
		//--------------------------------
		// Remove existing mapping for this (key, from) pair.
		this.holdkeys[key] = this.holdkeys[key].filter( entry => entry.from!==from );

		//--------------------------------
		// Set Holdkey for Tool
		//--------------------------------
		// Add updated mapping entry.
		this.holdkeys[key].push( { from, to } );

		//--------------------------------
		// Auto-Evaluate if Key Is Held
		//--------------------------------
		// If this key is currently held, force re-eval immediately
		if ( this.heldkey===key ) {
			const activeName	= this.activeTool?.name;
			const prevName		= this.prevTool?.name;
			const entry			=
				this.holdkeys[key].find(
					trig => trig.from===null || trig.from===activeName || trig.from===prevName
					);

			if ( entry ) {
				// Cancel (to=null): go back to previous tool
				if ( entry.to===null && activeName!==prevName )
					this.sheath();
				// New tool to switch to
				else if ( entry.to && activeName!==entry.to )
					this.wield( entry.to );
			}
		}
	}

	//--------------------------------
	// Unregister Hold Trigger Mapping
	//--------------------------------
	// Remove matching mapping from key list.
	// * key   – [string] key to modify
	// * from  – [string|null]
	// * to    – [string|null]
	unregisterHoldkey( key, from, to ) {
		// Check if holdkey exists.
		if ( !this.holdkeys[key] ) return;
		this.holdkeys[key] =
			this.holdkeys[key].filter( entry => entry.from!==from || entry.to!==to );
		if ( this.holdkeys[key].length===0 )
			delete this.holdkeys[key];
	}

	//--------------------------------
	// Set Active Tool
	//--------------------------------
	// Enables one tool and disables all others.
	// * nameOrTool - [string|object] Tool name or tool object
	setTool( nameOrTool ) {
		// Emit pre-equip event(s).
		this.emit( 'preequip', null, nameOrTool );

		// Check if setting a tool using JestTool [object] or [string] name.
		const tool = typeof nameOrTool==='string' ? this.getTool(nameOrTool) : nameOrTool;
		if ( !tool || tool===this.activeTool ) return; // invalid, or already active

		//--------------------------------
		// Cancel Pending Temporary Override
		//--------------------------------
		// setTool() is used by both normal clicks and wield()/sheath().
		// Only a normal tool change should discard the old hold-key state.
		// _switchingTemporary distinguishes those two paths.
		if ( !this._switchingTemporary ) {
			this.prevTool = null;
			this.heldkey = null;
			this.jot( 'wielding', false );
		}

		// Get tool name.
		const toolName	= Object.entries(this.tools).find(([_,v])=>v===tool)?.[0] ?? '';

		// Disable all others
		this.clearActiveTool( nameOrTool );

		// Set tool as the active tool.
		this.activeTool	= tool;
		tool.enable(); // enable the tool

		// Emit equip event(s).
		this.emit( 'equip', null, toolName );
		this.emit( 'postequip', null, toolName );
	}

	// --------------------------------
	// Clear Active Tool
	// --------------------------------
	// Disables all tools except those co-opted by new activeTool.
	// * nameOrTool – optional [string|object] Tool name or tool whose co-opted tools should NOT be disabled.
	clearActiveTool( nameOrTool ) {
		// Emit the unequip event, noting which tool is active.
		this.emit( 'unequip', null, this.activeTool );

		// Check if setting a tool using JestTool [object] or [string] name.
		const tool = typeof nameOrTool==='string' ? this.getTool(nameOrTool) : nameOrTool;
		if ( !tool || tool===this.activeTool ) return; // invalid, or already active

		// Get tool name.
		const toolName	= Object.entries(this.tools).find(([_,v])=>v===tool)?.[0] ?? '';

		// If given, get the list of co-opted tool names.
		// NOTE: Cloning the coopted-tools [object] prevents memory leak.
		const keepAlive	= [ ...(tool?._cooptedTools ?? []) ];
		if ( toolName && !keepAlive.includes(toolName) )
			keepAlive.push( toolName ); // never auto-disable self

		// Iterate all tools and disable those not co-opted
		for ( const [name,tool] of Object.entries(this.tools) )
			if ( !keepAlive.includes(name) )
				tool.disable(); // disable non-coopted tool

		// Null out the active tool.
		this.activeTool = null;
	}

	//--------------------------------
	// TEMPORARY: Wield Tool
	//--------------------------------
	// Temporarily use a tool while keeping track of original.
	// RETURNS: [bool] whether successfully wielded or not.
	// * name - [string] Tool name.
	wield( name ) {
		//--------------------------------
		// Validate Temporary Switch
		//--------------------------------
		// A temporary tool requires a valid target and a tool to return to.
		const tool = this.getTool( name );
		if ( !tool || !this.activeTool || tool===this.activeTool ) return false;
		// Do not overwrite the original tool during another temporary hold.
		if ( this.prevTool ) return false;

		//--------------------------------
		// Request Wield Permission
		//--------------------------------
		// The original tool may veto this switch in its prewield handler.
		const original = this.activeTool;
		this.jot( 'wielding', true );
		original.emit( 'prewield', null, name );
		if ( !this.skim('wielding') ) return false;

		//--------------------------------
		// Equip Temporary Tool
		//--------------------------------
		// Save the original exactly once so sheath() can restore it.
		this.prevTool = original;
		// Suppress the normal setTool() hold-state reset for this transition.
		this._switchingTemporary = true;
		// Always clear the internal transition flag, even if setTool() throws.
		try { this.setTool( tool ); }
		finally { this._switchingTemporary = false; }
		original.emit( 'wielded', null, name );
		return true;
	}

	//--------------------------------
	// TEMPORARY: Sheath Tool
	//--------------------------------
	// Restore the tool that was active before the temporary override.
	// This also clears the wielding flag, even if no original is recorded.
	sheath() {
		// Capture the original before clearing the saved reference.
		const original = this.prevTool;
		this.prevTool = null;
		this.jot( 'wielding', false );
		if ( !original ) return;

		// Restore through the normal tool-selection path, but keep the
		// temporary-transition flag set so it does not cancel itself.
		this._switchingTemporary = true;
		try { this.setTool( original ); }
		finally { this._switchingTemporary = false; }
		const prevName = Object.entries(this.tools).find(([_,v])=>v===original)?.[0];
		this.emit( 'sheath', null, prevName );
	}

	//--------------------------------
	// Release Held Tool
	//--------------------------------
	// Shared cleanup for keyup, window blur, visibility and pointer recovery.
	// RETURNS: [void].
	releaseHeldTool() {
		// Nothing to restore when there is no temporary keyboard state.
		if ( !this.heldkey && !this.prevTool ) return;
		this.heldkey = null;
		this.sheath();
	}

	//--------------------------------
	// Verify Held Modifier
	//--------------------------------
	// Mouse/pointer events carry the actual modifier state at that moment.
	// If JEST missed keyup, recover as soon as the pointer moves or clicks.
	// * e - [PointerEvent] Pointer event containing modifier flags.
	_checkHeldModifier( e ) {
		if ( this.heldkey==='Alt' && !e.altKey ) this.releaseHeldTool();
		else if ( this.heldkey==='Control' && !e.ctrlKey ) this.releaseHeldTool();
		else if ( this.heldkey==='Shift' && !e.shiftKey ) this.releaseHeldTool();
		else if ( this.heldkey==='Meta' && !e.metaKey ) this.releaseHeldTool();
	}

	//--------------------------------
	// Internal Key Handlers
	//--------------------------------
	// Internal keydown handler for handling tool swaps, etc.
	_onKeyPress( e ) {
		// Prevent activation while typing in input fields.
		if ( this.client.io.isTypingInInput() ) return;
		// A second hold must not replace the original tool being restored.
		if ( this.heldkey ) return; // never nest temporary holds

		// Get active key & registered list of triggers.
		const key = e.key;
		const triggerList = this.holdkeys[ key ];
		if ( !triggerList || !Array.isArray(triggerList) ) return;

		// Get active tool name & previous tool name.
		const activeName	= this.activeTool?.name;

		//----------------------------------------
		// First time hold key is pressed
		//----------------------------------------
		// Check for global holdkey or matching registrant.
		const entry =
			triggerList.find(
				trig => trig.from===null || trig.from===activeName
				);
		if ( !entry ) return; // no match

		// Save active key as holdkey.
		this.heldkey = key;

		// If `to` is null → don't switch, but log for sheath
		if ( entry.to===null ) {
			this.prevTool = this.activeTool;
			return; // escape
		}

		// Otherwise, switch tool
		this.wield( entry.to );
	}

	//--------------------------------
	// Ongoing Hold Monitor
	//--------------------------------
	// Re-check current mapping while key is held.
	// * e	- [object] Payload data sent from client I/O keyboard handler.
	_onKeyRepeat( e ) {
		//----------------------------------------
		// While key is already held → check remap
		//----------------------------------------
		// Get active key & registered list of triggers.
		if ( e.key!==this.heldkey ) return;
		// Keep key-repeat from replacing the original tool saved by wield().
		// Normal hold-key release still restores that original tool.
		if ( this.prevTool ) return;
		const triggerList	= this.holdkeys[ e.key ];
		if ( !triggerList || !Array.isArray(triggerList) ) return;

		// Get active tool name & previous tool name.
		const prevName		= this.prevTool?.name;
		const activeName	= this.activeTool?.name;

		//----------------------------------------
		// While key is already held → check remap
		//----------------------------------------
		// Check for global holdkey or matching registrant.
		const entry =
			triggerList.find(
				trig => trig.from===null || trig.from===prevName
				);
		if ( !entry ) return; // no match

		// Cancel: mapping changed to "null", return to original tool
		if ( entry.to===null && activeName!==prevName ) {
			this.sheath();
			return;
		}

		// Switch to updated tool mapping if changed
		if ( entry.to && activeName!==entry.to )
			this.wield( entry.to );
	}

	// Internal key-release handler for handling tool swaps, etc.
	_onKeyRelease( e ) {
		// Check if hold-switch is active & switchback.
		if ( this.heldkey && e.key===this.heldkey ) {
			// Use the same cleanup path as focus-loss and pointer recovery.
			this.releaseHeldTool(); // restore original and clear held state
		}
	}
}
