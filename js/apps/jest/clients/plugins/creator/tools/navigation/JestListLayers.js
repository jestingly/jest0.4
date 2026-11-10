//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/clients/plugins/creator/tools/navigation/JestListLayers.js loaded' );

//-----------------------------
// JestListLayers Class
//-----------------------------
class JestListLayers extends JestList {
    //--------------------------------
    // Add Layer Item
    //--------------------------------
    addLayer( layer ) {
		//--------------------------------
		// Create Lock On/Off Checkbox
		//--------------------------------
        // Generate a new layer.
        const item = new JestListLayerItem( this.client, layer );
        // Generate a unique id.
        const id   = `layer-${this.nextItemId++}`;

		//--------------------------------
        // Set Item ID & Build Element
		//--------------------------------
        // Set the id & build it.
        item.setId( id ); // set id
        item.build( id ); // build element

		//--------------------------------
        // Add Item to List
		//--------------------------------
        // Push item into items list.
        this.items.push( item );
        // Add layer element to list element panel.
        this.container.addPanel( id, item.panel );

		//--------------------------------
        // Register Event(s)
		//--------------------------------
        // Register a layer list item click event.
        item.panel.register( 'click', 'clicked', ()=>this.handleClick(item), 'dom' );

		//--------------------------------
        // Enable Drag & Drop
		//--------------------------------
        // Disable drag if the list is not currently sortable.
        if ( !this.dragEnabled ) item.disableDrag();
        // Enable draggability.
        if ( this.dragEnabled ) item.enableDrag();
        // Return a reference to new layer list item.
        return item; // layer list item
    }
}
