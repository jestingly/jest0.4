//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/message/JestNoticer.js loaded' );

//-------------------------
// JestNoticer Class
//-------------------------
// A modular manager for creating, displaying, and tracking notifications.
class JestNoticer extends JestElement {
	// Object property(ies)
	container		= null;			// [Panel] Container panel for notifications.
	notices			= [];			// [array] Active JestNotice instances.

	// --------------------------------
	// Constructor
	// --------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client		- client [object] that this piece belongs to.
	constructor( client ) {
		super( client ); // call parent constructor
	}

	// --------------------------------
	// Initialization
	// --------------------------------
	// Build the element [object].
	// RETURNS: [void].
	// * name		- unique [string] value of component name in the system.
	// * classes	- [array] of classes to add to panel element.
	build( name='noticer', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		super.build( 'div', name, ['noticer'].mergeUnique(classes) );
	}

	//--------------------------------
	// Show Notification
	//--------------------------------
	// Show a new notification inside the container.
	// RETURNS: [string] Notification ID.
	// * options	- [object] Notification options (text, buttons, icon, etc.).
	notify( options ) {
		// Create a notice [object].
		const panel	= new JestNotice( this.client, this, options );
		this.notices.push( panel ); // push notice into stack
		// Play close sound effect.
		//this.client.soundboard.playSound( 'jest_alert', 'mp3', 1 );
		// Emit notification event.
		this.emit( 'show', null, panel.id );
		return panel.id; // panel id
	}

	//--------------------------------
	// Close Notification
	//--------------------------------
	// Close and remove a notification by ID.
	// * id		- [string] ID of notification to close.
	close( id ) {
		// Get index # using id.
		const index  = this.notices.findIndex( panel => panel.id===id );
		if ( index<0 ) return; // not found
		// Get notice [object] using index.
		const notice = this.notices[index];
		notice.close(); // close target notice
		this.notices.splice( index, 1 ); // remove notice from stack
		// Readjust all notices.
		this.reposition( index );
		// Emite close notification event.
		this.emit( 'close', null, id );
	}

	//--------------------------------
	// Reposition Notifications
	//--------------------------------
	// Reposition remaining notifications after one is closed.
	reposition( removedIndex ) {
		// Iterate all notices & animate a bounce from only items above.
		//for ( let i=0; i<removedIndex; i++ )
			//this.notices[i].animateBounceDown();
		// Iterate all notices & animate a bounce.
		this.notices.forEach( notice => notice.animateBounceDown() );
	}
}
