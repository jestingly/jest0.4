//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/editing/tools/JestFileView.js loaded' );

//-------------------------
// JestFileViewEditor Class
//-------------------------
// This class enhances file views with various editing capabilities.
class JestFileViewEditor extends JestFileView {
	// Undo / redo handing.
	governor		= null;				// [JestGovernor] object for state changes.
	history			= null;				// [JestList] for visually logging state changes.

	// --------------------------------
	// Constructor
	// --------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client		- [object] Application client that this piece belongs to.
	constructor( client, file ) {
		super( client );		// call parent constructor
	}

	//-------------------------
	// Teardown Method(s)
	//-------------------------
	// Destroy the view [object]
	// RETURNS: [void].
	destroy() {
		//-------------------------
		// Cleanup Event(s)
		//-------------------------
		// Unregister all governor event(s).
		this.governor?.unregisterAll();

		//-------------------------
		// Teardown Governor
		//-------------------------
		// Teardown the governor log.
		delete this.governor;
		// Teardown history panel.
		this.history.panel.remove();
		delete this.history;
		// Call parent constructor.
		super.destroy(); // parent destroy()
	}

	//-------------------------
	// Initialization
	//-------------------------
	// Build the element [object].
	// RETURNS: [void].
	// * name		- unique [string] value of component name in the system.
	// * classes	- [array] of classes to add to panel element.
	build( name='file-view-editor', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		const defaultClasses	= [ 'file-view-editor' ];
		super.build( name, defaultClasses.mergeUnique(classes) );

		//-------------------------
		// Create History Logging Mechanism
		//-------------------------
		// Instantiate the governor.
		this.governor	= new JestGovernor( this.client );

		// Listen for undo event.
		this.governor.register(
			'undo', 'fileView',
			( action, snapshot ) => this.emit('undo',null,this.skey,snapshot) );

		// Listen for redo event.
		this.governor.register(
			'redo', 'fileView',
			( action, snapshot ) => this.emit('redo',null,this.skey,snapshot) );
	}

	//-------------------------
	// Setup Method(s)
	//-------------------------
	// Build the view [object].
	// RETURNS: [void].
	setupHistoryUI() {
		// Do not recreate.
		if ( this.history ) return;

		// Create a history (undo/redo) list for the level view.
		const history	= new JestList( this );
		this.history	= history;
		history.build( 'history-list', ['history-scroll'] );
		history.mode	= 'linear'; // enable sequential undo tracking

		// Listen for overwrite event(s) when in undo state + new action made.
		this.governor.register(
			'overwrote', 'historyTruncateFuture',
			( key, count ) => {
				// Only care if we're handling an 'edit' history.
				if ( key!=='edit' ) return;
				// Remove count items from the end of the list
				for ( let i=0; i<count; i++ )
					this.history.removeItem( this.history.items.length-1 );
				// Optional: force reindex to match stack
				const items = this.history.getItems();
				items.forEach(
					( item, idx ) => {
						item.data.index = idx;
					});
				// Synchronize the selection after removing abandoned redo states.
				this.history.selectItemAt( this.governor.getStack('edit').index );
				// Emit an event signaling the history was updated.
				this.emit( 'history:updated', null );
			});

		// Listen for when the list is pruned (expired undo states).
		this.governor.register(
			'overflow', 'historyOverflow',
			( key, overflowCount, newIndex ) => {
				// Only care if we're handling an 'edit' history.
				if ( key!=='edit' ) return;

				// Remove the first `overflowCount` items.
				for ( let i=0; i<overflowCount; i++ )
					this.history.removeItem( 0 );

				// Re-index & re-label all items.
				const items = this.history.getItems();
				items.forEach(
					( item, idx ) => {
						item.data.index  = idx;
						//item.setLabel( `Step ${idx + 1}` );
					});

				// Update selected pointer.
				this.history.selectItemAt( newIndex );

				// Emit an event signaling the history was updated.
				this.emit( 'history:updated', null );
			});

		// Allow mass undo/redo (item clicking).
		this.history.register(
			'clickedItem', 'historyClick',
			( item ) => {
				// Determine offset difference.
				const clickedIdx	= item.data.index;
				const stack			= this.governor.getStack( 'edit' );
				const currentIdx	= stack.index;
				const diff			= clickedIdx - currentIdx;
				// Revert by # of difference.
				this.governor.revert( diff, 'edit' );
				// Emit an event signaling the history was updated.
				this.emit( 'history:updated', null );
			});

		// Add an item to list when a new "edit" log occurs inside governor.
		this.governor.register(
			'logged', 'historySync',
			( key, stack, log ) => {
				// Only care if we're handling an 'edit' history.
				if ( key!=='edit' ) return;
				const index	= stack.index;
				const label	= `Step ${index + 1}`;
				const item	= this.history.addItem( label, { index } );
				// Synchronize the History list with the governor's actual index.
				this.history.selectItemAt( index );
				//item.highlight(); // Optional visual cue
				// Emit an event signaling the history was updated.
				this.emit( 'history:updated', null );
				this.emit( 'history:logged', null, item, log );
			});

		// Shift selected item when a undo is made in the governor.
		this.governor.register(
			'undo', 'historySelectUndo',
			( key, state, total, i ) => {
				// Only care if we're handling an 'edit' history.
				if ( key==='edit' ) {
					this.history.selectItemAt( i );
					// Emit an event signaling the history was updated.
					this.emit( 'history:updated', null );
				}
			});

		// Shift selected item when a redo is made in the governor.
		this.governor.register(
			'redo', 'historySelectRedo',
			( key, state, total, i ) => {
				// Only care if we're handling an 'edit' history.
				if ( key==='edit' ) {
					this.history.selectItemAt( i );
					// Emit an event signaling the history was updated.
					this.emit( 'history:updated', null );
				}
			});

		// Clear history when governor resets list.
		this.governor.register(
			'reset', 'historyReset',
			() => {
				//console.log('reset');
				// Clear the history list (remove all items).
				this.history.clear();
				// Emit an event signaling the history was updated.
				this.emit( 'history:updated', null );
			});
	}
}
