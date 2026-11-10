//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/ui/JestTooltip.js loaded' );

//-----------------------------
// JestTooltip Class
//-----------------------------
// Floating tooltip element that follows mouse cursor.
// Binds to any target element and displays styled caption.
class JestTooltip extends JestElement {
	// Tooltip element properties
	box                = null;          // [object] DOM box for tooltip content
	active             = false;         // [bool] true if visible
	text               = '';            // [string] current caption content
	mouseFollower      = null;          // [JestMouseFollower] tooltip element following the mouse.
	_target            = null;          // [Element|null] target owning the visible tooltip
	_attributeObserver = null;          // [MutationObserver|null] watches active target attributes
	_lastPointer       = null;          // [object|null] last page coordinates for repositioning
	_autoBindings      = new WeakSet(); // [WeakSet] bound targets; allows removed elements to be collected
	_liveModeEnabled   = false;         // [bool] prevents duplicate delegated hover listeners

	//--------------------------------
	// Constructor
	//--------------------------------
	// Create tooltip system and floating panel.
	// * client  - [object] app or parent instance
	constructor( client ) {
		super( client );	// call parent constructor
	}

	//--------------------------------
	// Build Tooltip DOM
	//--------------------------------
	// Creates the floating tooltip DOM box.
	// RETURNS: [void].
	// * name    - unique [string] value of component name in the system.
	// * classes - [array] of classes to add to panel element.
	build( name='tooltip', classes=[] ) {
		// --------------------------------
		// Construct Main Panel
		// --------------------------------
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		super.build( 'div', name, ['jest-tooltip'].mergeUnique(classes) );

		// --------------------------------
		// Create Tooltip Content Box
		// --------------------------------
		// Add internal box to display text.
		this.panel.addElements([{
			name     : 'box',
			tag      : 'div',
			classes  : ['tooltip-box']
			}]);
		this.box = this.panel.refs.box; // keep ref
		// Append DOM element to the document.
		document.body.appendChild( this.panel.el );

		// --------------------------------
		// Create Mouse Follower
		// --------------------------------
		// Construct the mouse follower [object].
		this.mouseFollower =
			new JestMouseFollower(
				this.client, { offsetX: 12, offsetY: 12 }
				);
		this.mouseFollower.setFollowerElement( this.panel );
		this.hide(); // hidden by default
	}

	//--------------------------------
	// Bind Tooltip to Element
	//--------------------------------
	// Hooks hover and movement on a target element.
	// RETURNS: [void]
	// * el   - [object] DOM element
	// * text - [string|function] caption or callback returning the current caption
	bind( el, text ) {
		// Require element.
		if ( !el ) return;
		// Show & move on-enter.
		el.addEventListener(
			'mouseenter',
			( e ) => {
				// Watch this target, then resolve its latest caption before displaying it.
				this._activateTarget( el, text );
				this.text = typeof text==='function' ? text() : text;
				this.show( e );		// show tooltip
			});
		// Follow pointer movement while the tooltip is visible.
		el.addEventListener( 'mousemove', (e)=>this.move(e) );
		// Only the current target may dismiss the shared tooltip.
		el.addEventListener(
			'mouseleave',
			() => { if ( this._target===el ) this.hide(); }
			);
	}

	//--------------------------------
	// Observe Active Tooltip Target
	//--------------------------------
	// Refreshes visible content when tooltip attributes change, including on click.
	// RETURNS: [void]
	// * el   - [Element] target whose tooltip attributes should be observed
	// * text - [string|function] caption or callback reading current attributes
	_activateTarget( el, text ) {
		// Stop watching the previous target before switching ownership.
		this._attributeObserver?.disconnect();
		this._target = el;
		// Attribute changes are delivered after the current synchronous code finishes.
		this._attributeObserver =
			new MutationObserver(
				() => {
					// Ignore notifications if this tooltip was hidden or another target took over.
					if ( !this.active || this._target !== el ) return;
					// Re-read dynamic captions instead of reusing the value captured on hover.
					this.text = typeof text==='function' ? text() : text;
					this.box.setHTML( this.text ?? '' );
					// Recheck screen edges because the replacement caption may have a different size.
					if ( this._lastPointer ) this.move( this._lastPointer );
				});
		// Observe only caption-related attributes on this element, not its descendants.
		this._attributeObserver.observe( el,
			{
			attributes: true,
			attributeFilter: ['data-tooltip', 'data-tooltip-html', 'data-tooltip-keys']
			});
	}

	//--------------------------------
	// Show Tooltip
	//--------------------------------
	// Displays and positions the tooltip.
	// RETURNS: [void]
	// * e - [object] MouseEvent
	show( e ) {
		// Require box element.
		if ( !this.box ) return;
		// Render caption markup, including formatted keyboard shortcuts.
		this.box.setHTML( this.text ?? '' );
		this.panel.removeClass( 'hidden' ); // show
		this.active = true;              // set active
		this.mouseFollower?.enable();    // enable mouse follower
		this.move( e );                  // position immediately
		this.emit( 'show', { text:this.text } );
	}

	//--------------------------------
	// Hide Tooltip
	//--------------------------------
	// Hides the floating element.
	// RETURNS: [void]
	hide() {
		// Toggle off & deactivate.
		this.panel.addClass( 'hidden' ); // hide
		this.active       = false;       // deactivate
		this.mouseFollower?.disable();   // disable mouse follower
		// Release the active target and stop processing attribute updates while hidden.
		this._attributeObserver?.disconnect();
		this._target      = null;
		this._lastPointer = null;
		this.emit( 'hide', null );       // emit hide event
	}

	//--------------------------------
	// Move Tooltip with Mouse
	//--------------------------------
	// Follows cursor position.
	// RETURNS: [void]
	// * e - [object] MouseEvent
	move( e ) {
		// Require tooltip to be active.
		if ( !this.active || !this.box || !e ) return;

		// Keep coordinates so live caption changes can reposition without mouse movement.
		this._lastPointer = { pageX: e.pageX, pageY: e.pageY };
		// Move the mouse follower into position.
		this.mouseFollower?.move( e );
	}

	//--------------------------------
	// Auto-Bind Data Attributes
	//--------------------------------
	// Finds all `[data-tooltip]` elements and binds tooltips.
	// RETURNS: [void]
	autoBind() {
		// Find all DOM elements with tooltip & bind.
		const all = document.querySelectorAll( '[data-tooltip],[data-tooltip-html],[data-tooltip-keys]' );
		all.forEach( el=>this._bindAutoTooltip(el) );
	}

	//--------------------------------
	// Enable Live Mode
	//--------------------------------
	// Automatically binds any new element with data-tooltip on hover.
	// RETURNS: [void]
	enableLiveMode() {
		// Avoid double-binding the live mod & log its state as on, if off.
		if ( this._liveModeEnabled ) return; // avert double-bind
		this._liveModeEnabled = true;        // capture live mode as "on"
		// Install the body listener once even when initialization runs repeatedly.
		document.body.addEventListener(
			'mouseover',
			e => {
				// Resolve the nearest tooltip target when hovering one of its child elements.
				const el  = e.target.closest( '[data-tooltip],[data-tooltip-html],[data-tooltip-keys]' );
				// Both autoBind() and live mode may encounter the same target.
				if ( !el || this._autoBindings.has(el) ) return;
				// Register future hover events; the binding method handles duplicate prevention.
				this._bindAutoTooltip( el );
				// Show on this first hover too; the mouseenter listener was only just installed.
				this._activateTarget( el, ()=>this._readTooltipText(el) );
				this.text = this._readTooltipText( el );
				this.show( e );
			});
	}

	//--------------------------------
	// Detects and Binds Tooltip Data
	//--------------------------------
	// Registers one dynamic caption binding per element.
	// RETURNS: [void]
	// * el - [object] DOM element
	_bindAutoTooltip( el ) {
		// Both autoBind() and live mode may encounter the same target.
		if ( !el || this._autoBindings.has(el) ) return;
		this._autoBindings.add( el );
		// Defer reading attributes until hover or a visible attribute change occurs.
		this.bind( el, ()=>this._readTooltipText(el) );
	}

	//--------------------------------
	// Read Current Tooltip Caption
	//--------------------------------
	// Combines the current caption with its optional keyboard shortcut.
	// RETURNS: [string] caption markup
	// * el - [Element] source of tooltip attributes
	_readTooltipText( el ) {
		// Prefer the HTML caption when present; otherwise use the plain caption.
		let base     = el.getAttribute('data-tooltip-html') ?? el.getAttribute('data-tooltip') ?? '';
		// Get keyboard shortcut (if any)
		const keyStr = el.getAttribute( 'data-tooltip-keys' );
		if ( keyStr )
			base += ` <span class="tooltip-shortcut">${this._formatShortcut(keyStr)}</span>`;
		// Return base [string].
		return base;
	}

	//--------------------------------
	// Format Keyboard Shortcut
	//--------------------------------
	// Converts "ctrl+s" → "<kbd>Ctrl</kbd> + <kbd>S</kbd>"
	// RETURNS: [string] HTML
	// * shortcut - [string] like "cmd+shift+d"
	_formatShortcut( shortcut='' ) {
		const map = {
			cmd     : '⌘',
			ctrl    : 'Ctrl',
			control : 'Ctrl',
			shift   : '⇧',
			alt     : 'Alt',
			option  : '⌥',
			enter   : '↵',
			esc     : 'Esc',
			delete  : '⌫',
			del     : '⌫',
			up      : '↑',
			down    : '↓',
			left    : '←',
			right   : '→'
			};
		// Normalize each shortcut token and wrap it for keyboard-key styling.
		return shortcut
			.split( '+' )
			.map( k => `<kbd>${map[k.toLowerCase()] || k.toUpperCase()}</kbd>` )
			.join( ' + ' );
	}
}
