//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestconsole.log: js/apps/jest/components/editing/tools/JestTool.js loaded' );

//-------------------------
// JestTool Class
//-------------------------
// This class frames an [object] that serves as a base usable tool.
class JestTool extends JestElement {
	// Object propert(ies)
	name           = 'tool';           // [string] Value of tool name.
	curators       = {};               // [object] Stack of JestCurators for organizing tool objects.
	_cooptedTools  = [];               // [array] Co-opted tools (they auto-enable when this enabled).
	// Tool properties
	flags          = new Set();        // [Set<string>] App-defined tool requirements and capabilities.

	// --------------------------------
	// Constructor
	// --------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client		- [object] Application client that this piece belongs to.
	// * name		- [string] Value of tool name.
	constructor( client, name ) {
		super( client );               // call parent constructor
		this.name = name;              // set tool name
		this.jot( 'mode', 'idle' );    // default mode is idle
	}

	//-------------------------
	// Initialization
	//-------------------------
	// Build the element [object].
	// RETURNS: [void].
	// * name		- unique [string] value of component name in the system.
	// * classes	- [array] of classes to add to panel element.
	build( name='tool', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		const defaultClasses = [ 'tool' ];
		super.build( "div", name, defaultClasses.mergeUnique(classes) );
		// Tool is disabled by default.
		this.jot( 'enabled', false );	// disable tool to start
	}

	// Setup a curator for the tool.
	// RETURNS: [void].
	// * name	– [string] Name of curator.
	addCurator( name ) {
		// Check if curator already exists.
		if ( this.curators?.[name] ) {
			console.warn( 'addCurator(): Curator with supplied name already exists.' );
			return;
		}
		// Generate a curator for UI data.
		const curator       = new JestCurator( this.client );
		curator.build( `${name}-curator-${name}` ); // build curator DOM
		this.curators[name] = curator; // keep ref
	}

	//-------------------------
	// Coopt External Tools
	//-------------------------
	// Declare one or more external tool names to automatically enable
	// when this tool is enabled.
	// RETURNS: [void]
	// * tools	– [string|string[]] Name(s) of tools to co-opt.
	coopt( tools ) {
		//console.error( this.name, tools );
		//--------------------------------
		// Normalize Input
		//--------------------------------
		// Convert to array if single string.
		if ( typeof tools === 'string' ) tools = [ tools ];
		if ( !Array.isArray(tools) ) {
			console.warn( `coopt(): Invalid tool list`, tools );
			return;
		}

		//--------------------------------
		// Store Coopted Tools
		//--------------------------------
		// Initialize coopt list if not present.
		if ( !this._cooptedTools )
			this._cooptedTools = [];

		// Add unique tool names.
		tools.forEach(
			tool => {
				if ( typeof tool==='string' && !this._cooptedTools.includes(tool) )
					this._cooptedTools.push( tool );
			});
	}

	//-------------------------
	// Check If Tool Is Co-opted
	//-------------------------
	// Determines if a given tool name is co-opted by this tool.
	// RETURNS: [boolean] `true` if the tool is co-opted.
	// * name	– [string] Name of tool to check.
	isCoopted( name ) {
		// Sanity check
		if ( typeof name!=='string' || !this._cooptedTools ) return false;
		// Return true if name is in the co-opted tool list.
		return this._cooptedTools.includes( name );
	}

	// --------------------------------
	// Enable & Disable
	// --------------------------------
	// Toggle enabled/disabled using [boolean] argument.
	// RETURNS: [bool] true if state changed.
	// * lever	– [bool] `true` to enable, `false` to disable.
	toggle( lever ) {
		return lever ? this.enable() : this.disable();
	}

	// Enables this tool and co-opted tools if applicable.
	// RETURNS: [boolean] `true` on success else `false`.
	enable() {
		//--------------------------------
		// Enable Coopted Tool(s)
		//--------------------------------
		// Iterate each co-opted tool & enable.
		if ( this._cooptedTools?.length>0 && this.client?.toolbox ) {
			this._cooptedTools.forEach(
				name => {
					if ( name===this.name ) return;
 					const tool	= this.client.toolbox.tools?.[name];
					if ( tool && typeof tool.enable==='function' ) {
						tool.enable(); // enable tool
					}
				});
		}
		//--------------------------------
		// Attempt to Enable Tool
		//--------------------------------
		// Skip if already enabled.
		const enabled = this.skim( 'enabled' );
		if ( enabled === true ) return false; // fail
		// Set enabled state.
		this.jot( 'enabled', true );
		return true; // success
	}

	// Disable tool.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	disable() {
		// Do not double-disable.
		const enabled	= this.skim( 'enabled' );
		if ( enabled===false ) return false; // fail
		// Unset enabled state.
		// NOTE: Is best to set this manually since breakdown
		// methods might be called.
		//this.jot( 'enabled', false );
		return true; // success
	}

	// Determine if tool is enabled.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	enabled() { return this.skim('enabled'); }

	// --------------------------------
	// Keyboard Handling Method(s)
	// --------------------------------
	// Map a [key] to switch from one tool to another when held.
	// RETURNS: [boolean] `true` on success else `false` on fail.
	// * key      – [string] e.g. "Alt", "Control"
	// * to       – [string|null] tool to switch to (null = don't switch)
	holdkey( key, to ) {
		return this.client.toolbox.registerHoldkey( key, this.name, to )
	}

	//-----------------------------
	// (Override) Jot Method
	//-----------------------------
	// Intercepts changes to "mode" and emits entering/leaving events.
	// Still delegates all other .jot() calls to the parent class.
	// RETURNS: [bool] true on success.
	// * key	- [string] Variable key to set
	// * val	- [any] Value to assign
	jot( key, val ) {
		// --------------------------
		// Intercept 'mode' Changes
		// --------------------------
		// Only intercept if key='mode'
		if ( key==='mode' ) {
			// Check for previous (existing) value.
			const prev = this._vars?.mode ?? null;
			// Emit event for leaving previous mode (if different)
			if ( prev!==val && prev )
				this.emit( `exit:${prev}` );
			// Emit event for entering new mode
			if ( prev!==val && val )
				this.emit( `enter:${val}` );
		}
		// --------------------------
		// Delegate to Base Jot Method
		// --------------------------
		// Call parent jot method.
		return super.jot?.( key, val ) ?? false;
	}

	//--------------------------------
	// Set Tool Flag
	//--------------------------------
	// Register an application-defined capability or requirement.
	// A flag does not automatically enable, disable, or block a tool.
	// RETURNS: [boolean] true if the flag was newly added.
	// * flag - [string] unique flag identifier.
	setFlag( flag ) {
		// Validate the supplied flag.
		if ( typeof flag!=='string' || !flag.trim() )
			return false; // fail

		// Avoid registering the same flag multiple times.
		if ( this.flags.has(flag) )
			return false; // prevent duplicate flag

		// Register the flag.
		this.flags.add( flag );
		return true; // success
	}

	//--------------------------------
	// Unset Tool Flag
	//--------------------------------
	// Remove a previously registered tool flag.
	// RETURNS: [boolean] true if the flag existed and was removed.
	// * flag - [string] flag identifier.
	unsetFlag( flag ) {
		// Remove the flag from the tool's capability set.
		return this.flags.delete( flag );
	}

	//--------------------------------
	// Check Tool Flag
	//--------------------------------
	// Determine whether this tool declares a specific requirement.
	// RETURNS: [boolean] true if the flag exists.
	// * flag - [string] flag identifier.
	hasFlag( flag ) {
		// Check the tool's registered flags.
		return this.flags.has( flag );
	}

	//--------------------------------
	// Determine Tool Usability
	//--------------------------------
	// Check whether this tool is equipped and permitted to operate.
	// Refresh application-defined restrictions before an operation.
	// RETURNS: [boolean] true if the tool may operate.
	usable() {
		//--------------------------------
		// Validate Tool Selection
		//--------------------------------
		// An unequipped tool cannot operate.
		if ( !this.enabled() ) return false;

		//--------------------------------
		// Refresh Current Restrictions
		//--------------------------------
		// Allow applications that support tool blocking to reevaluate
		// the tool immediately before an editing action.
		this.client.toolBlockCheck?.( this );

		// Permit operation only when no restrictions are active.
		return !this.skim('blocked');
	}

	//--------------------------------
	// Determine Tool Blocking
	//--------------------------------
	// Set the tool's block status state.
	// * blocked  - [boolean] Whether to block the tool or not.
	//   reasons  - [array<strings>|null] Reasons why tool is blocked.
	block( blocked, reasons=null ) {
		// Jot down the new blocked status & reasons.
		this.jot( 'blocked', blocked );
		this.jot( 'blockReason', reasons );
		// Emit event depending upon block state.
		if ( blocked===true )
			this.emit( 'blocked', null, reasons );
		else this.emit( 'unblocked' );
	}

	//--------------------------------
	// Determine Tool Blocking
	//--------------------------------
	// A blocked tool remains equipped but cannot currently operate.
	// RETURNS: [boolean] true if equipped but restricted.
	blocked() {
		// Distinguish a blocked tool from an unequipped tool.
		return this.enabled() && !!this.skim('blocked');
	}
}
