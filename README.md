# jest0.41

```text
//-------------------------------------------------------
//              ██╗███████╗███████╗████████╗ ®
//              ██║██╔════╝██╔════╝╚══██╔══╝ JS
//              ██║█████╗  ███████╗   ██║
//         ██   ██║██╔══╝  ╚════██║   ██║
//         ╚█████╔╝███████╗███████║   ██║
//          ╚════╝ ╚══════╝╚══════╝   ╚═╝
//-------------------------------------------------------
//        JEST® Engine JS • Copyright© 1999-2026
// Antago (God of Gravity), author of Graal2001 & Destiny
//-------------------------------------------------------
                     CONFIGURATION
//-------------------------------------------------------

Edit the following files to configure your application:
• index.html
• css/vars_local.css
• js/apps/jest/components/JestConfiguration_loc.js
• js/apps/jest/components/JestConfiguration_rem.js

//-------------------------------------------------------
       DEVELOPER NOTES • CHANGES from v0.4 to v0.41
//-------------------------------------------------------

• New _Grid_ feature in the options panel to display a light grid lattice at a minimum of 1 tile units up to half the canvas width & height.
  - slider starts at 0 (no grid)
  - max value is canvas dimensions/2

• The Level Marquee has a new transform control. The rectangle appears around floating marquee selections with scale controls.

//-------------------------------------------------------
       DEVELOPER NOTES • CHANGES from v0.3 to v0.4
//-------------------------------------------------------

• The _Eyedropper_ tool now has a new "sample preview" zoom-in feature.

• _Layers_ are now possible; levels are migrating to v. JESTNW02 encoding.
  - add, remove, name and rename layers
  - show/hide & lock/unlock layers

• New _Crosshair_ option to show perpendicular intersection highlights to the mouse cursor.

• The _Hand_ grab tool is now available to more easily navigate your canvas scrollable window boundaries.

• New _Eraser_ tool will draw with the background tile on the base layer, and will change upper tiles on higher layers transparent when erased.

• The _Login_ system & cloud synchronization ironed out some bugs.
  - install the database using the attached SQL file: /jest_play.sql
  - login using the generic credentials u="admin" & p="admin"
  - still under development

//-------------------------------------------------------
       DEVELOPER NOTES • CHANGES from v0.2 to v0.3
//-------------------------------------------------------

• Various bugs and glitches fixed.

• The marquee tool is now integrated into the undo/redo governor.
  - selecting/deselecting a marquee can be undone
  - floating/defloating a marquee can be undone
  - deleting a marquee can be undone

• A beta JANI editor is now available for composing new animation script files.
  - nearly identical to GANI files from Graal
  - experimental, needs bug-tested
  - can be toggled via the _js/embed/embed.js_ file

• NPCs can now be added to levels.
  - use the new "Entities" tool in the level editor
  - add an NPC via the sidebar "Entities" menu
  - equip the "Entities" using the E key, then click & select NPCs
  - NPCs with an invisible or 1x1PX image can be found in the Entities sidebar
  - consequently, all NPCs can be viewed in the Entities sidebar
  - a large "Script" editing box can be opened to manipulate your NPC's code
  - NPCs are generally referred to as "Hooks" in the JEST® engine
  - "Hooks" refer to the ability to hook a custom code into a level
  - all images are relative to the _webfiles/files/images/_ folder
    → if testing Graal levels, try uploading images to _webfiles/files/images/misc_
    → e.g. change a level's entities hook path value to "misc/[filename]"
    → e.g. if the image is in _webfiles/files/images/misc_, it will load & appear

//-------------------------------------------------------
       DEVELOPER NOTES • CHANGES from v0.1 to v0.2
//-------------------------------------------------------

• Includes a Websocket class for plugging into a remote server.
  - accessed via the _JestOnline_ class

• Data can be synchronized to your custom cloud server using _JestCloud_ (very beta).

• A beta account system with a generic PHP login now exists.
  - mostly for creator applications
  - will integrate into _JestPlay_ later

• Application can optionally be wrapped inside Electron (desktop/mobile).

• Load order is handled in load_order.txt
  - generate via **/build_js_bundle.py**

• New UI system for form building.

• Includes:
  - Tile Editor
  - Sprite Animator
    → splice spritesheets into animation sequences

  Located in:
  /js/jest/app/clients

  Toggle app in:
  /js/embed/embed.js

• Game worlds defined as JSON (multiverse-ready).

• All files now handled by JestFileLoader system
  - example:
    /js/apps/jest/components/file/JestFileLoader.js

• Image system:
  JestImager → extends JestFileLoader
  JestGraphic → wraps image data

• Lots of other changes.
```
