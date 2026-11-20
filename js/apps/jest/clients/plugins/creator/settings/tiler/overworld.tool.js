//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/tools/overworld/overworld.tool.js loaded' );

//-------------------------
// JestToolOverworld Class
//-------------------------
// Edit neighboring level links through an overview and an open-tab picker.
// Changes remain in a draft until the user applies the complete assignment.
class JestToolOverworld extends JestTool {
	// Direction labels use the same compass keys as the relationship class.
	static labels = {
		northwest : 'NW',
		north     : 'N',
		northeast : 'NE',
		west      : 'W',
		east      : 'E',
		southwest : 'SW',
		south     : 'S',
		southeast : 'SE'
		};

	// UI handling properties
	launcher       = null;      // [JestButton] Open the neighbor overview.
	modal          = null;      // [JestModal] Neighbor overview and apply controls.
	picker         = null;      // [JestModal] Open-level candidate picker.
	overview       = null;      // [Panel] Main modal content owned by the modal box.
	pickerContent  = null;      // [Panel] Picker content owned by the picker box.
	grid           = null;      // [Panel] Proportional compass layout.
	center         = null;      // [Panel] Current level preview.
	hint           = null;      // [Panel] Padding and assignment explanation.
	error          = null;      // [Panel] Assignment validation message.
	reel           = null;      // [Panel] Candidate card and navigation arrows.
	card           = null;      // [Panel] Candidate preview and filename.
	count          = null;      // [Panel] Candidate position and tab number.
	slots          = new Map();	// [Map<string,JestButton>] Compass controls.
	previousButton = null;      // [JestButton] Browse to the preceding level.
	nextButton     = null;      // [JestButton] Browse to the following level.

	// Relationship editing properties
	owner          = null;      // [JestFileViewEditorPainterLevel|null] Source level.
	draft          = new Map();	// [Map<string,JestFileView|null>] Staged neighbor links.
	padding        = 0;         // [number] Preview depth in unzoomed tiles.
	direction      = null;      // [string|null] Compass slot currently being chosen.

	// Candidate navigation properties
	candidates      = [];       // [array] Other live level views, in tab order.
	index           = 0;        // [int] Current candidate within that array.
	wheelAmount     = 0;        // [number] Accumulated wheel movement in pixels.
	wheelTime       = 0;        // [number] Time of the previous wheel step.
	returnFocus     = null;     // [HTMLElement|null] Focus to restore after closing.

	//---------------------------------
	// Constructor
	//---------------------------------
	// Construct the tool; build() creates its panels and dialogs separately.
	// * client	- [JestTiler] Application containing the open level tabs.
	// * name	- [string] Toolbox registration name.
	constructor( client, name='overworld' ) {
		super( client, name ); // call parent constructor
	}

	//-------------------------
	// Initialization
	//-------------------------
	// Build the launcher, dialogs, and their internal event handlers once.
	// * name		- [string] Unique component name.
	// * classes	- [array|null] Additional panel classes.
	build( name='tool-overworld', classes=[] ) {
		// Match the panel construction used by the other JestTool subclasses.
		if ( this.panel ) return; // already built
		if ( classes===null ) classes = [];
		const defaultClasses = [ 'tool-overworld' ];
		super.build( name, defaultClasses.mergeUnique(classes) );

		// Build each part independently so layout and input setup stay readable.
		this.buildLauncher();
		this.buildDialogs();
		this.buildOverview();
		this.buildPicker();
		this.registerDialogEvents();

		// Keep both registered dialogs hidden until explicitly opened.
		this.modal.hide();  // auto-hide the modal
		this.picker.hide(); // auto-hide the level picker
	}

	//--------------------------------
	// Build Sidebar Launcher
	//--------------------------------
	// Add the overview button to the tool's own sidebar panel.
	buildLauncher() {
		// Use the existing JestButton click handling and native focus behavior.
		this.launcher =
			this.makeButton(
				this.panel, 'open', 'Graph',
				()=>this.open(), ['ow-launcher','toolbar']
				);
	}

	//--------------------------------
	// Build Registered Dialogs
	//--------------------------------
	// Create both popups through the application's existing modal factory.
	buildDialogs() {
		// Main overview: cancel discards the draft, apply commits all slots.
		this.client.addModal( 'overworldNeighbors', {
			title   : 'Overworld neighbors',
			text    : 'Choose an edge or corner.',
			buttons : {
				cancel : {
					label   : 'Cancel',
					onClick :
						() => {
							// Close the dialog & play closed "cancel" SFX.
							this.close();
							this.client.soundboard.playSound( 'jest_close0', 'mp3', 1.1 );
						}
					},
				set : {
					label   : 'Update',
					onClick :
						() => {
							// Apply the changes and play the "success" SFX if successful.
							if ( this.apply()===true )
								this.client.soundboard.playSound( 'jest_success', 'mp3', 1.1 );
							else this.client.soundboard.playSound( 'jest_deflect', 'mp3', 1.1 );
						}
					}
				}
			});

		// Candidate picker: clear is an explicit choice, separate from Back.
		this.client.addModal( 'overworldNeighborPicker', {
			title   : 'Choose level',
			text    : 'Browse the other open level tabs.',
			buttons : {
				cancel : {
					label   : 'Back', // cancel set level
					onClick : () => this.picker.close()
					},
				clear  : {
					label   : 'Clear Slot', // clear level slot
					onClick :
						() => {
							// Apply the changes and play the "none" SFX if successful.
							const success = this.choose( null );
							if ( success===true )
								this.client.soundboard.playSound( 'jest_none', 'mp3', 1.1 );
							else this.client.soundboard.playSound( 'jest_deflect', 'mp3', 1.1 );
						}
					},
				select : {
					label   : 'Select Level', // set level
					onClick :
						() => {
							// Apply the changes and play the "select" SFX if successful.
							const success = this.choose( this.candidates[this.index] );
							if ( success===true )
								this.client.soundboard.playSound( 'jest_select0', 'mp3', 1.1 );
							else this.client.soundboard.playSound( 'jest_deflect', 'mp3', 1.1 );
						}
					}
				}
			});

		// Retain the registered modal objects and scope their appearance.
		this.modal	= this.client.modals.overworldNeighbors;
		this.picker	= this.client.modals.overworldNeighborPicker;
		this.modal.panel.addClass( 'jest-overworld-modal' );
		this.picker.panel.addClass( 'jest-overworld-picker' );
	}

	//--------------------------------
	// Build Neighbor Overview
	//--------------------------------
	// Arrange one center preview and eight adjoining direction controls.
	buildOverview() {
		// Give the modal one owned content branch between its text and input area.
		this.overview = new Panel({
			name    : 'overworld-content',
			tag     : 'div',
			classes : [ 'ow-overview' ]
			});
		this.modal.box.addPanel( 'overworldContent', this.overview, 2 );

		// Build the proportional compass grid as a named child panel.
		this.grid = this.overview.createPanel({
			name    : 'grid',
			tag     : 'div',
			classes : [ 'ow-grid' ]
			});

		// Center preview is informational; direction controls remain clickable.
		this.center = this.grid.createPanel({
			name    : 'center',
			tag     : 'div',
			classes : [ 'ow-center' ]
			});

		// Resolve coordinates from the same table used to draw linked levels.
		for ( const [direction,[x,y]] of this.getDirections() ) {
			const button =
				this.makeButton(
					this.grid, direction, JestToolOverworld.labels[direction],
					() => this.openPicker( direction ), 'ow-slot'
					);
			button.panel.el.style.gridArea = `${y+2} / ${x+2}`;
			this.slots.set( direction, button );
		}

		// Keep explanatory text and validation messages outside the grid.
		this.hint  = this.makeText( this.overview, 'hint', 'ow-hint' ).hide();
		this.error = this.makeText( this.overview, 'error', 'ow-error' ).hide();
		this.error.addAttribute( 'role', 'status' );
		// Hide the default notice field (packaged inside the modal).
		this.modal.panel.refs.box.refs.notice.hide();
	}

	//--------------------------------
	// Build Candidate Picker
	//--------------------------------
	// Create the rolodex card, navigation buttons, and position indicator.
	buildPicker() {
		// Give the picker its own content branch inside the existing modal box.
		this.pickerContent = new Panel({
			name    : 'overworld-picker-content',
			tag     : 'div',
			classes : [ 'ow-picker-content' ]
			});
		this.picker.box.addPanel( 'overworldPickerContent', this.pickerContent, 2 );

		// Only the card and arrows belong to the horizontal navigation row.
		this.reel = this.pickerContent.createPanel({
			name    : 'reel',
			tag     : 'div',
			classes : [ 'ow-reel' ]
			});
		this.previousButton =
			this.makeButton(
				this.reel, 'previous', '‹',
				() => this.step(-1), 'ow-arrow'
				);
		this.previousButton.clicker.addAttribute( 'aria-label', 'Previous Level' );

		// The selected candidate gets a full preview rather than an edge crop.
		this.card = this.reel.createPanel({
			name    : 'card',
			tag     : 'div',
			classes : [ 'ow-card' ]
			});
		this.nextButton =
			this.makeButton(
				this.reel, 'next', '›',
				() => this.step(1), 'ow-arrow'
				);
		this.nextButton.clicker.addAttribute( 'aria-label', 'Next level' );

		// Announce browsing changes without moving focus from the controls.
		this.count = this.makeText( this.pickerContent, 'count', 'ow-count' );
		this.count.addAttribute( 'aria-live', 'polite' );
		this.reel.register(
			'wheel', 'overworldPicker', event=>this.onPickerWheel(event),
			'dom', null, { passive:false }
			);
	}

	//--------------------------------
	// Register Dialog Events
	//--------------------------------
	// Route modal dismissal through the same cleanup used by tool methods.
	registerDialogEvents() {
		// Overlay clicks and Escape emit the same close event as Cancel.
		this.modal.register(
			'close', 'overworldCleanup', ()=>this.reset()
			);
		this.picker.register(
			'close', 'overworldPickerCleanup', ()=>this.resetPicker()
			);

		// Keep editor shortcuts outside the dialog's local keyboard handling.
		this.configureKeyboard( this.modal );
		this.configureKeyboard( this.picker );
	}

	//--------------------------------
	// Create Jest Button
	//--------------------------------
	// RETURNS: [JestButton] Engine button owned by the supplied parent panel.
	// * parent    - [Panel] Destination panel.
	// * name      - [string] Unique button name within this tool.
	// * label     - [string] Visible button text.
	// * callback  - [function] Action called by the button's click event.
	//   classes   - [array] of classes to add to panel element.
	makeButton( parent, name, label, callback, classes=[] ) {
		// JestButton owns its clicker and title; the parent owns its outer panel.
		const button = new JestButton( this.client, `overworld-${name}` );
		button.build( `overworld-${name}`, ['overworld-btn'].mergeUnique(classes), label );
		button.register( 'click', 'overworld', callback );
		button.clicker.addAttributes({
			type         : 'button',
			'aria-label' : label
			});
		parent.addPanel( name, button.panel );
		return button; // button reference
	}

	//--------------------------------
	// Create Text Panel
	//--------------------------------
	// Create a named paragraph through the existing Panel ownership system.
	// RETURNS: [Panel] Paragraph panel appended to the supplied parent.
	// * parent    - [Panel] Destination panel.
	// * name      - [string] Unique child reference name.
	// * className - [string] Appearance class for the new paragraph.
	// * text      - [string] Initial plain-text content.
	makeText( parent, name, className, text='' ) {
		// Panel creates, appends, and retains the OSElement reference in one step.
		const panel = parent.createPanel({
			name    : name,
			tag     : 'p',
			classes : [ className ]
			});
		// Use OSElement.setText() so caller content is never parsed as markup.
		panel.setText( text );
		return panel; // text panel
	}

	//--------------------------------
	// Configure Modal Keyboard
	//--------------------------------
	// Install dialog semantics, local keyboard handling, and input isolation.
	// * modal - [JestModal] Dialog to configure.
	configureKeyboard( modal ) {
		// Focus the box when opening, even before a candidate is available.
		modal.box.addAttributes({
			tabindex     : -1,
			role         : 'dialog',
			'aria-modal' : 'true',
			'aria-label' : modal.titleText
			});
		modal.panel.register(
			'keydown', 'overworldKeyboard',
			event=>this.onModalKeyDown(modal,event), 'dom'
			);

		// Prevent modal pointer and key events from reaching editor listeners.
		const events = [ 'keyup', 'keypress', 'pointerdown', 'mousedown', 'mouseup', 'click' ];
		for ( const name of events )
			modal.panel.register(
				name, 'overworldIsolation', event=>event.stopPropagation(), 'dom'
				);
	}

	//--------------------------------
	// Handle Dialog Keyboard
	//--------------------------------
	// Close, browse, or contain focus within the active dialog.
	// * modal - [JestModal] Dialog that received the event.
	// * event - [KeyboardEvent] Native keyboard event.
	onModalKeyDown( modal, event ) {
		// Keep ordinary text and navigation keys away from editor shortcuts.
		event.stopPropagation();

		// Escape follows the modal's normal close event and cleanup path.
		if ( event.key==='Escape' ) {
			event.preventDefault();
			modal.close();
			return; // handled
		}

		// Arrow keys browse only while the candidate picker is active.
		if ( modal===this.picker && ['ArrowLeft','ArrowRight'].includes(event.key) ) {
			event.preventDefault();
			this.step( event.key==='ArrowLeft' ? -1 : 1 );
			return; // handled
		}

		// Other keys retain their native button behavior.
		if ( event.key==='Tab' )
			this.containFocus( modal, event );
	}

	//--------------------------------
	// Contain Dialog Focus
	//--------------------------------
	// Wrap Tab and Shift+Tab between the dialog's available controls.
	// * modal - [JestModal] Current dialog.
	// * event - [KeyboardEvent] Tab key event.
	containFocus( modal, event ) {
		// Exclude disabled and hidden controls from the focus sequence.
		const box      = modal.box.el;
		const selector = 'button,input,select,textarea,a[href],[tabindex]';
		const nodes    = [...box.querySelectorAll(selector)].filter(
			element => element.tabIndex>=0 && !element.disabled && element.getClientRects().length
			);
		const first    = nodes[0];
		const last     = nodes[nodes.length-1];
		const active   = document.activeElement;

		// An empty dialog keeps focus on its own box.
		if ( !first ) {
			event.preventDefault();
			box.focus();
			return; // handled
		}

		// Focus begins on the dialog box, then wraps at either end.
		if ( event.shiftKey && [first,box].includes(active) ) {
			event.preventDefault();
			last.focus();
		}
		else if ( !event.shiftKey && [last,box].includes(active) ) {
			event.preventDefault();
			first.focus();
		}
	}

	//--------------------------------
	// Handle Picker Wheel
	//--------------------------------
	// Accumulate trackpad movement and limit how quickly candidates advance.
	// * event - [WheelEvent] Native scroll event from the rolodex.
	onPickerWheel( event ) {
		// Normalize line and page scrolling to approximately pixel units.
		event.preventDefault();
		const now   = performance.now();
		const delta = Math.abs(event.deltaX)>Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
		const scale = event.deltaMode===1 ? 16 : event.deltaMode===2 ? 300 : 1;
		this.wheelAmount += delta * scale;

		// Require both a useful scroll distance and a pause between steps.
		if ( Math.abs(this.wheelAmount)<60 || now-this.wheelTime<180 )
			return; // wait for more movement

		this.step( Math.sign(this.wheelAmount) );
		this.wheelAmount = 0;
		this.wheelTime   = now;
	}

	//--------------------------------
	// Resolve Compass Directions
	//--------------------------------
	// RETURNS: [array] Direction names and their relative grid offsets.
	getDirections() {
		// Share the relationship class's direction table rather than copying it.
		return Object.entries( JestFileRelationshipLevel.directions );
	}

	//--------------------------------
	// Resolve Open Level Views
	//--------------------------------
	// RETURNS: [array] Live level views in their current tab order.
	getViews() {
		// Exclude unloaded files and tabs belonging to other editor types.
		return this.client.tabbarFile.views.filter(
			view => view instanceof JestFileViewEditorPainterLevel && view.file );
	}

	//--------------------------------
	// Resolve Display Filename
	//--------------------------------
	// RETURNS: [string] Filename including the extension when available.
	// * view - [JestFileViewEditorPainterLevel|null] View being labeled.
	filename( view ) {
		// Empty previews still receive a useful accessible label.
		const file = view?.file;
		if ( !file ) return 'Untitled level';

		// Avoid adding the extension twice when the stem already includes it.
		const stem = String( file.stem ?? 'Untitled' );
		const ext  = String( file.extension ?? '' ).replace( /^\./, '' );
		return ext && !stem.endsWith(`.${ext}`) ? `${stem}.${ext}` : stem;
	}

	//--------------------------------
	// Resolve Padding in Tiles
	//--------------------------------
	// RETURNS: [number] Unzoomed neighbor depth, measured in tiles.
	getPadding() {
		// Prefer the same adapter used by an application's padding slider.
		const value      = this.client.getOverworldPadding?.( this.owner );
		const configured = value===undefined || value===null ? NaN : Number(value);
		if ( Number.isFinite(configured) && configured>=0 )
			return configured; // configured tile depth

		// The workspace origin is meaningful only for the active source view.
		const workspace  = this.client.gameboard.display.getCanvas( 'workspace' );
		const units      = this.owner.anchor.getZoomed().display.units;
		const bounds     = workspace.getEditBounds?.() ?? workspace.editBounds;
		const active     = this.client.tabbarFile.activeView===this.owner;
		if ( active && bounds && units>0 && (bounds.x>0 || this.owner.relationship.size>0) )
			return bounds.x / units; // zoomed pixels to unzoomed tiles

		// Preserve the older editor's eight-tile preview default.
		return 8;
	}

	//--------------------------------
	// Open Neighbor Overview
	//--------------------------------
	// RETURNS: [boolean] Whether a live source level was available.
	open() {
		// Reopening an existing draft must not replace its source or choices.
		if ( this.owner ) {
			const dialog = this.direction===null ? this.modal : this.picker;
			dialog.box.el.focus();
			return true; // already open
		}

		// Match the application's normal busy gate before starting an action.
		if ( this.client.busy() ) return false; // app busy
		const owner = this.client.tabbarFile.activeView;
		if ( !this.getViews().includes(owner) || !owner.relationship )
			return false; // no editable source

		// Capture the source once; changing tabs cannot redirect this draft.
		this.returnFocus = document.activeElement;
		this.owner   = owner;
		this.draft   =
			new Map(
				this.getDirections().map(
					([direction]) => [ direction, owner.relationship.getView(direction) ]
					)
				);
		this.padding = Math.min( this.client.config.levelGrid, Math.max(0,this.getPadding()) );
		this.error.setText( '' ).hide();

		// Track the popup interaction through the existing JestTool state API.
		this.enable();
		this.jot( 'mode', 'overview' );
		this.renderOverview();
		this.modal.open( owner );
		this.modal.box.el.focus();
		return true; // opened
	}

	//--------------------------------
	// Close Neighbor Overview
	//--------------------------------
	// RETURNS: [boolean] Whether an open draft was dismissed.
	close() {
		// Modal.close() emits the event that resets all popup state.
		if ( !this.owner ) return false; // already closed
		this.modal.close(); // close the dialog
		return true; // closed
	}

	//--------------------------------
	// Disable Tool
	//--------------------------------
	// Dismiss an active popup when the toolbox disables this tool.
	// RETURNS: [boolean] Whether the tool was enabled before this call.
	disable() {
		// Let JestTool validate the enabled state before clearing this tool.
		if ( !super.disable() ) return false; // already disabled
		if ( this.owner ) this.close();
		else this.reset();
		return true; // disabled
	}

	//--------------------------------
	// Reset Popup State
	//--------------------------------
	// Discard the draft and restore focus after every overview dismissal.
	reset() {
		// Close the nested dialog first so its inert state is always released.
		if ( this.direction!==null ) this.picker.close();
		this.modal.box.el.inert = false;

		// Release file references before another level can open the tool.
		this.owner       = null;
		this.draft.clear();
		this.candidates  = [];
		this.index       = 0;
		this.direction   = null;
		this.wheelAmount = 0;
		this.wheelTime   = 0;
		this.jot( 'mode', 'idle' );
		this.jot( 'enabled', false );

		// Return focus only when the original element is still in the page.
		const focus      = this.returnFocus;
		this.returnFocus = null;
		if ( focus?.isConnected ) focus.focus();
	}

	//--------------------------------
	// Reset Candidate Picker
	//--------------------------------
	// Return from the picker to its original direction in the overview.
	resetPicker() {
		// Capture the direction before releasing the temporary browsing state.
		const direction  = this.direction;
		this.direction   = null;
		this.candidates  = [];
		this.index       = 0;
		this.wheelAmount = 0;
		this.wheelTime   = 0;
		this.modal.box.el.inert = false;

		// The overview retains its draft when the user presses Back.
		if ( this.owner ) {
			this.jot( 'mode', 'overview' );
			this.slots.get( direction )?.clicker.el.focus();
		}
	}

	//--------------------------------
	// Refresh Open Tab Choices
	//--------------------------------
	// Refresh labels and candidates after tabs change, close, or rename.
	refresh() {
		// No draft exists while the dialog is closed.
		if ( !this.owner ) return;
		this.renderOverview();
		if ( this.direction!==null ) this.step( 0 );
	}

	//--------------------------------
	// Draw Preview Snapshot
	//--------------------------------
	// Reuse the level view's renderer without changing its zoom or anchor.
	// * parent     - [Panel] Container receiving the preview canvas.
	// * view       - [JestFileViewEditorPainterLevel|null] Level to render.
	// * direction  - [string|null] Adjoining edge or corner to crop.
	preview( parent, view, direction=null ) {
		// Closed views must not leave an old preview in a direction control.
		if ( parent.refs?.preview )
			parent.removePanel( 'preview' ); // remove tracked snapshot

		// Check that view is active.
		if ( !view || !this.getViews().includes(view) ) return;
		view.refreshCanvas(); // refresh rendering
		// Get canvas [object] DOM element & verify it has dimension.
		const source  = view.getViewRender()?.el;
		if ( !source?.width || !source?.height ) return;

		// Create an independent preview with a 256×256 pixel bitmap.
		const canvas = new ElementCanvas();
		canvas.resize( 256, 256 );

		// Remove the fixed inline display dimensions added by resize().
		// The existing CSS can then stretch the preview to fill its container.
		canvas.el.style.removeProperty( 'width' );
		canvas.el.style.removeProperty( 'height' );

		// Access the JEST canvas object's actual DOM element canvas node.
		const context = canvas.el.getContext( '2d' );
		context.imageSmoothingEnabled = false; // pixelate it
		// Set source clip to (0,0) @ 100% x 100%.
		let sx = 0,
			sy = 0;
		let sw = source.width,
			sh = source.height;

		// North shows the neighbor's bottom edge; west shows its right edge.
		if ( direction ) {
			// Obtain the coordinates based upon the stored file relationship.
			const [x,y]	= JestFileRelationshipLevel.directions[direction];
			// Measure the neighbor crop as a fraction of the configured level grid.
			const ratio	= this.padding / this.client.config.levelGrid;
			sw = x===0 ? source.width  : Math.max( 1, source.width*ratio );
			sh = y===0 ? source.height : Math.max( 1, source.height*ratio );
			sx = x<0 ? source.width-sw  : 0;
			sy = y<0 ? source.height-sh : 0;
		}

		// CSS fits the snapshot to its overview slot or candidate card.
		context.drawImage( source, sx, sy, sw, sh, 0, 0, 256, 256 );
		parent.addPanel( 'preview', canvas, 0 );
	}

	//--------------------------------
	// Render Neighbor Overview
	//--------------------------------
	// Update proportional geometry, assigned states, and filename tooltips.
	renderOverview() {
		// The layout represents one full level plus two padding strips.
		this.grid.el.style.setProperty( '--ow-edge', `${this.padding}fr` );
		this.grid.el.style.setProperty( '--ow-main', `${this.client.config.levelGrid}fr` );
		this.grid.toggleClass( 'is-zero', this.padding===0 );

		// Zero padding still leaves usable direction handles in the popup.
		const depth = this.padding.toFixed(1).replace( /\.0$/, '' );
		/*this.hint.setText(
			this.padding===0
				? 'Padding is hidden. Direction handles remain available for assigning levels.'
				: `${depth} tiles of padding · Blue: empty · Yellow: assigned`
				).show();*/

		// Render the source level independently from its neighbor controls.
		this.preview( this.center, this.owner );
		this.appendFilename( this.center, this.filename(this.owner) );

		// Each slot retains its JestButton title so labels cannot accumulate.
		for ( const [direction,button] of this.slots ) {
			const view     = this.draft.get( direction );
			const filename = view ? this.filename(view) : 'Choose Level';
			const title    = `${direction}: ${filename}`;
			button.panel.toggleClass( 'is-linked', Boolean(view) );
			button.panel.addAttribute( 'title', title );
			button.clicker.addAttribute( 'aria-label', title );
			this.preview( button.clicker, view, direction );
			button.title.setText(
				JestToolOverworld.labels[direction] + (view ? ` · ${filename}` : '')
				);
		}
	}

	//--------------------------------
	// Append Preview Filename
	//--------------------------------
	// Add or update a plain-text filename with a full-name tooltip.
	// RETURNS: [Panel] Tracked filename label panel.
	// * parent - [Panel] Preview container receiving the label.
	// * text   - [string] Filename or empty-state explanation.
	appendFilename( parent, text ) {
		// Reuse one named Panel so previews never accumulate duplicate labels.
		const label = parent.refs?.label ?? parent.createPanel({
			name    : 'label',
			tag     : 'span',
			classes : [ 'ow-preview-label' ]
			});
		const changed = label.el.textContent!==text;
		label.setText( text );
		label.addAttribute( 'title', text );

		// Fade the new filename in so browsing feels continuous.
		if ( changed && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches )
			label.el.animate?.(
				[ { opacity:0, transform:'translateY(8px)' }, { opacity:1, transform:'none' } ],
				{ duration:380, easing:'cubic-bezier(0.22,1,0.36,1)' }
				);
		return label; // label panel
	}

	//--------------------------------
	// Open Candidate Rolodex
	//--------------------------------
	// Browse other level tabs without changing the active editor tab.
	// RETURNS: [boolean] Whether a valid direction was opened.
	// * direction - [string] Compass slot to edit.
	openPicker( direction ) {
		// The picker needs a draft and one of the relationship's known slots.
		if ( !this.owner || !Object.hasOwn(JestFileRelationshipLevel.directions,direction) )
			return false; // unavailable slot

		// Begin on the slot's assigned level when that tab remains open.
		this.direction   = direction;
		this.candidates  = this.getViews().filter( view => view!==this.owner );
		this.index       = Math.max( 0, this.candidates.indexOf(this.draft.get(direction)) );
		this.wheelAmount = 0;
		this.wheelTime   = 0;

		// Keep assistive labels synchronized with the current compass direction.
		const title = `Choose ${direction} level`;
		this.card.el.dataset.dir = 'none';
		this.picker.setTitle( title );
		this.picker.box.addAttribute( 'aria-label', title );
		this.renderCandidate();
		this.modal.box.el.inert = true;
		this.jot( 'mode', 'picking' );
		this.picker.open();
		this.picker.box.el.focus();
		return true; // opened
	}

	//--------------------------------
	// Advance Candidate
	//--------------------------------
	// Wrap the rolodex and preserve candidate identity when tabs reorder.
	// * offset - [int] Relative step; zero refreshes the current candidate.
	step( offset ) {
		// Refresh the live list while retaining the current view object.
		const current   = this.candidates[this.index];
		this.candidates = this.getViews().filter( view => view!==this.owner );
		const count     = this.candidates.length;
		const index     = Math.max( 0, this.candidates.indexOf(current) );
		this.index      = count ? ((index+offset)%count+count)%count : 0;

		// Tell the stylesheet which way the card should slide in from.
		this.card.el.dataset.dir = offset<0 ? 'prev' : offset>0 ? 'next' : 'none';
		this.renderCandidate();
	}

	//--------------------------------
	// Render Candidate Card
	//--------------------------------
	// Display the selected level, its filename, and its current tab position.
	renderCandidate() {
		// Replace both the old snapshot and its filename on every browse step.
		const view = this.candidates[this.index];
		this.preview( this.card, view );
		this.appendFilename(
			this.card, view ? this.filename(view) : 'No other level tabs are open'
			);

		// Disable actions that require a candidate when the list is empty.
		this.picker.buttons.select.toggle( 'enable', Boolean(view) );
		this.previousButton.toggle( 'enable', this.candidates.length>=2 );
		this.nextButton.toggle( 'enable', this.candidates.length>=2 );
		this.count.setText( view
			? `${this.index+1} / ${this.candidates.length} · Tab ${this.client.tabbarFile.views.indexOf(view)+1}`
			: 'Open another level to assign it'
			);
	}

	//--------------------------------
	// Stage Candidate Assignment
	//--------------------------------
	// Store one choice in the draft without changing the live relationship.
	// RETURNS: [boolean] Whether the candidate was accepted.
	// * view - [JestFileViewEditorPainterLevel|null] Candidate or cleared slot.
	choose( view ) {
		// An empty picker is distinct from explicitly clearing a slot.
		if ( !this.owner || !this.direction || view===undefined )
			return false; // no selection

		// Reject closed candidates and self-links before staging the change.
		if ( view!==null && (view===this.owner || !this.getViews().includes(view)) ) {
			this.step( 0 );
			return false; // stale or invalid candidate
		}

		// The main dialog remains responsible for committing this draft.
		this.draft.set( this.direction, view );
		this.error.setText( '' ).hide();
		this.renderOverview();
		this.picker.close();
		return true; // staged
	}

	//--------------------------------
	// Validate Staged Neighbors
	//--------------------------------
	// RETURNS: [boolean] Whether every referenced level is still available.
	validateDraft() {
		// Validate the source before accessing its relationship object.
		const live = this.getViews();
		if ( !live.includes(this.owner) || !this.owner.relationship ) {
			this.error.setText( 'The source level was closed. Reopen this dialog from a level tab.' ).show();
			return false; // unavailable source
		}

		// Validate all targets before any live relationship is changed.
		for ( const [direction,view] of this.draft ) {
			if ( view!==null && (!live.includes(view) || view===this.owner) ) {
				this.error.setText( `The ${direction} level was closed. Choose another level or clear that slot.` ).show();
				return false; // unavailable target
			}
		}
		return true; // complete draft is available
	}

	//--------------------------------
	// Apply All Staged Neighbors
	//--------------------------------
	// Commit all slots together, restoring previous links if an API rejects one.
	// RETURNS: [boolean] Whether the complete draft was accepted.
	apply() {
		// Reject a stale source or target before touching the live links.
		if ( !this.validateDraft() ) return false; // invalid draft
		const owner  = this.owner;
		const links  = owner.relationship;
		const before =
			new Map(
				this.getDirections().map( ([key]) => [key,links.getView(key)] )
				);

		// The relationship API performs final direction and view validation.
		for ( const [direction,view] of this.draft ) {
			if ( links.setView(direction,view) ) continue; // accepted
			// Restore the original assignment if any slot is rejected.
			for ( const [key,target] of before )
				links.setView( key, target );
			this.error.setText( 'The neighbor assignment was rejected.' ).show();
			return false; // rolled back
		}

		// The regular draw loop renders the committed relationship changes.
		this.client.emit( 'levelNeighborsChanged', null, owner, new Map(this.draft) );
		// Close the dialog & play closed "cancel" SFX.
		this.close(); // close the dialog
		return true;  // committed
	}
}
