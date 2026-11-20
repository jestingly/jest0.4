//-------------------------------------------------------
// JEST ® All Rights Reserved
// Antago (God of Gravity), author of Graal2001 & Destiny
// Copyright ® 1999-2026
//-------------------------------------------------------
console.log( 'jestAlert: js/apps/jest/components/editing/tools/JestFileViewEditorPalette.js loaded' );

//-----------------------------
// JestFileViewEditorPalette Class
//-----------------------------
// CMS-integrated palette [object] for selecting color(s) or tile(s).
class JestFileViewEditorPalette extends JestFileViewEditor {
	// Object properties

	//--------------------------------
	// Constructor
	//--------------------------------
	// Construct the [object].
	// RETURNS: [void].
	// * client		- [object] Application client that this piece belongs to.
	constructor( client ) {
		super( client );		// call parent constructor
		/*this.editor        = editor;
		this.selectedTile  = 0;
		this.fillTile      = null;
		this.tilesetImage  = null;
		this.tileSize      = editor.tileSize;*/
	}

	// Build the element [object].
	// RETURNS: [void].
	// * name		- unique [string] value of component name in the system.
	// * classes	- [array] of classes to add to panel element.
	build( name='palette', classes=[] ) {
		// Construct the parent panel.
		if ( classes===null ) classes = [];
		const defaultClasses	= [ 'file-view-editor-palette' ];
		super.build( name, defaultClasses.mergeUnique(classes) );
	}

	//---------------------------------
	// Set File
	//---------------------------------
	// Set the file object to view/edit.
	// RETURNS: [void]
	// * file - [JestFile] The file to assign.
	setFile( file ) {
		// Validate argument(s)
		if ( !(file instanceof JestFileLevel) ) {
			console.warn( `Argument "file" must be of type JestLevel.` );
			return false; // failed
		}
		// Continue to set the file.
		super.setFile( file ); // call parent method
	}

	//---------------------------------
	// Initialize View
	//---------------------------------
	// Prepares layout and visuals (graticulation, containers, etc.).
	// RETURNS: [void]
	initView() {
		super.initView(); // call parent method
		// Resize to level size.
		const tileGrid	= this.client.config.tileGrid;
		const levelGrid	= this.client.config.levelGrid;
		this.anchor.resize( levelGrid*tileGrid, levelGrid*tileGrid );
	}

	//-------------------------
	// Copy Canvas Content
	//-------------------------
	// Copies the source canvas to the destination canvas at (0,0).
	// RETURNS: [void]
	// * sourceCanvas	- [HTMLCanvasElement] Source canvas.
	// * destCanvas		- [HTMLCanvasElement] Destination canvas.
	refreshCanvas() {
		// Require file to be set.
		if ( !this.file ) return;
		super.refreshCanvas(); // call parent method
		// Obtain file canvas context & copy contents to canvas.
		console.log( this.file );
		const sourceCanvas	= this.file.context.canvas.el;
		const destCanvas	= this.canvas.el;
		const ctx			= destCanvas.getContext('2d');
		ctx.clearRect( 0, 0, destCanvas.width, destCanvas.height ); // optional clear
		ctx.drawImage(
			sourceCanvas, // image contents being copied
			0, 0, // source crop x,y
			sourceCanvas.width, sourceCanvas.height, // source W x H
			0, 0, // destination x,y
			destCanvas.width, destCanvas.height // destination W x H
			);
	}


	

	//--------------------------------
	// Initialize UI
	//--------------------------------
	_initUI ( ) {
		// Load button
		this.loadButton = document.createElement('button');
		this.loadButton.textContent = 'Load Tileset';
		this.loadButton.className = 'tile-btn';
		this.loadButton.addEventListener( 'click', ()=>this.fileInput.click() );

		// Hidden file input
		this.fileInput = document.createElement('input');
		this.fileInput.type = 'file';
		this.fileInput.accept = 'image/*';
		this.fileInput.style.display = 'none';
		this.fileInput.addEventListener( 'change', (e)=>this._loadImage(e) );

		// Preview and list containers
		this.preview   = document.createElement('div');
		this.preview.className = 'tile-preview';

		this.tileList  = document.createElement('div');
		this.tileList.className = 'tile-list';

		// Assemble DOM
		this.append(this.loadButton);
		this.append(this.fileInput);
		this.append(this.preview);
		this.append(this.tileList);

		this._updatePreview();
	}

	//--------------------------------
	// Load image file
	//--------------------------------
	_loadImage ( e ) {
		const file = e.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = () => {
			const img = new Image();
			img.onload = () => {
				this.tilesetImage = img;
				this._generateTiles();
			};
			img.src = reader.result;
		};
		reader.readAsDataURL(file);
	}

	//--------------------------------
	// Generate clickable tile canvases
	//--------------------------------
	_generateTiles ( ) {
		this.tileList.innerHTML = '';

		const cols = Math.floor(this.tilesetImage.width / this.tileSize);
		const rows = Math.floor(this.tilesetImage.height / this.tileSize);
		let index = 1;

		const tileCanvas = document.createElement('canvas');
		tileCanvas.width = tileCanvas.height = this.tileSize;
		const ctx = tileCanvas.getContext('2d');

		for (let y = 0; y < rows; y++) {
			for (let x = 0; x < cols; x++) {
				ctx.clearRect(0, 0, this.tileSize, this.tileSize);
				ctx.drawImage(this.tilesetImage, x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize, 0, 0, this.tileSize, this.tileSize);

				const tile = document.createElement('canvas');
				tile.width = tile.height = this.tileSize;
				tile.getContext('2d').drawImage(tileCanvas, 0, 0);

				tile.className = 'tile';
				tile.dataset.index = index++;

				tile.addEventListener('click', () => {
					this.selectedTile = parseInt(tile.dataset.index);
					this.fillTile = this.selectedTile;
					this._updatePreview();
				});

				this.tileList.appendChild(tile);
			}
		}
	}

	//--------------------------------
	// Update preview text
	//--------------------------------
	_updatePreview ( ) {
		this.preview.textContent = `Selected: ${this.selectedTile}`;
	}
}
