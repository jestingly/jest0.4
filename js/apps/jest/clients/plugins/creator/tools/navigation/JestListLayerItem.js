//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/tools/navigation/JestListLayerItem.js loaded' );

//-----------------------------
// JestListLayerItem Class
//-----------------------------
class JestListLayerItem extends JestListItem {
    // Object properties
	layer       = null;   // [JestLevelLayer] object reference.
	visibility  = null;   // [JestInputCheckbox] object reference (toggle visibility).
	locking     = null;   // [JestInputCheckbox] object reference (toggle lock on/off).

    //--------------------------------
    // Constructor
    //--------------------------------
	// Initializes the layer list item.
	// RETURNS: [void]
	// * client  – [object] parent application client
	// * layer   – [JestLevelLayer] parent reference [object]
    constructor( client, layer ) {
		// Call parent constructor.
        super( client, layer.name, { layerId: layer.id } );
		// Set layer list parent.
		this.layer = layer; // [JestLevelLayer]
    }

	//-------------------------
	// Build UI
	//-------------------------
	// Constructs the HTML structure and initializes DOM references.
	// RETURNS: [void]
	// * name     – [string] internal identifier name for this field type
	// * classes  – [array] list of extra CSS class names
    build( name='layer-item', classes=[] ) {
		// Construct the parent panel.
        super.build( name, ['jest-layer-item'].mergeUnique(classes) );

		//--------------------------------
		// Create Visibility Checkbox
		//--------------------------------
        // Visibility checkbox
        this.visibility =
			new JestInputCheckbox(
	            this.client, 'visible', null, this.layer.visible );
		this.visibility.build( 'layer-visible' );

		//--------------------------------
		// Handle Visibility Changes
		//--------------------------------
		// Capture the old value before updating the layer.
		// Emit both old and new states for undo/redo.
		this.visibility.register(
			'change', 'layer-visibility',
			() => {
				// Read the requested checkbox state.
				const checked =
					this.visibility.panel.el
						.querySelector('input[type="checkbox"]').checked;
				// Synchronize tooltip.
				this.visibility.panel.addAttribute( 'data-tooltip', (checked?'Hide':'Show')+' Layer' );

				// Preserve the original value before applying changes.
				const before  = this.layer.visible;
				// Ignore unchanged values.
				if ( before===checked ) return;

				// Notify the application of impending state change.
				this.client.emit( 'levelLayerPrevisibilityChange', null, this.layer, checked );

				// Apply the new visibility.
				this.layer.visible = checked;

				// Notify the application of both states.
				this.client.emit( 'levelLayerVisibilityChange', null, this.layer, before, checked );
			});
		// Initialize from the actual layer without emitting a change.
		this.visibility.setChecked( this.layer.visible, true );

		//--------------------------------
		// Create Lock On/Off Checkbox
		//--------------------------------
        // Lock checkbox
        this.locking =
			new JestInputCheckbox(
	            this.client, 'locked', null, this.layer.locked );
		this.locking.build( 'layer-locked' );

		//--------------------------------
		// Handle Lock Changes
		//--------------------------------
		// Capture the old locked state before applying the new one.
		// This gives the history system a reversible transition.
		this.locking.register(
			'change', 'layer-locking',
			() => {
				// Read the requested checkbox state.
				const checked =
					this.locking.panel.el
						.querySelector('input[type="checkbox"]').checked;
				// Synchronize tooltip.
				this.locking.panel.addAttribute( 'data-tooltip', (checked?'Unlock':'Lock')+' Layer' );

				// Preserve the old value before changing it.
				const before  = this.layer.locked;
				// Ignore unchanged values.
				if ( before===checked ) return;

				// Notify the application of impending state change.
				this.client.emit( 'levelLayerPrelockChange', null, this.layer, checked );

				// Apply the new locking state.
				this.layer.locked = checked;

				// Notify the application of both states.
				this.client.emit( 'levelLayerLockChange', null, this.layer, before, checked );
			});

		// Initialize from the actual layer without emitting a change.
		this.locking.setChecked( this.layer.locked, true ); // triggers 'change' event

		//--------------------------------
		// Insert Layer Controls
		//--------------------------------
		// Move controls before the label using DOM prepend.
		// Reverse insertion order preserves Visibility → Lock → Name.
		this.panel.prepend( this.locking.panel );
		this.panel.prepend( this.visibility.panel );

		//--------------------------------
		// Block Propagation
		//--------------------------------
        // Prevent checkbox clicks from selecting/toggling the row.
        for ( const checkbox of [this.visibility, this.locking] )
            checkbox.panel.el.addEventListener( 'click', e=>e.stopPropagation() );
    }

	//--------------------------------
	// Synchronize Layer Display
	//--------------------------------
	// Refresh the layer name and checkbox states without
	// reconstructing the row or replacing its child controls.
	// RETURNS: [void]
	refresh() {
		//--------------------------------
		// Update Layer Name
		//--------------------------------
		// Locate the existing label element.
		const label = this.panel.refs.label?.el ?? this.panel.el.querySelector('.item-label');

		// Update the label without affecting sibling controls.
		if ( label )
			label.textContent = this.layer.name;

		//--------------------------------
		// Synchronize Checkbox States
		//--------------------------------
		// Update both controls without emitting change events.
		this.visibility.setChecked( this.layer.visible, false );
		this.locking.setChecked( this.layer.locked, false );
	}
}
