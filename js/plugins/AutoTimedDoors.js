/*:
 * @target MZ
 * @plugindesc Automatic timed doors that open on player touch and close after 2 seconds.
 * @author Gemini
 * 
 * @param enableSound
 * @text Enable Sound Effect
 * @desc Turn the door opening sound effect on or off.
 * @type boolean
 * @default true
 * 
 * @param doorSound
 * @text Door Sound Effect
 * @desc The SE to play when the door begins to open.
 * @type struct<SoundEffect>
 * @default {"name":"Open1","volume":"90","pitch":"100","pan":"0"}
 * 
 * @help AutoTimedDoors.js
 * 
 * To turn an event into an automatic door, simply add this tag to the 
 * Event "Note" field (at the top of the event window, next to the Name):
 *   <door>
 * 
 * Mechanics:
 * - The door triggers instantly when the player touches it (Player Touch).
 * - If you select a middle or bottom frame for the door image, the plugin
 *   automatically forces it to start at the top row (Closed position).
 * - It animates downward through all 4 sprite rows:
 *     Row 1 (Top)    -> Closed (Direction 2)
 *     Row 2          -> Quarter-Open (Direction 4)
 *     Row 3          -> Three-Quarter Open (Direction 6)
 *     Row 4 (Bottom) -> Fully Open (Direction 8)
 * - 2 seconds (120 frames) after opening, it reverses the animation to close.
 * - While open, its priority shifts below the player so you can walk through.
 */

/*~struct~SoundEffect:
 * @param name
 * @text SE Name
 * @desc The filename of the sound effect (without extension).
 * @type file
 * @dir audio/se/
 * @default Open1
 * 
 * @param volume
 * @text Volume
 * @desc The volume of the sound effect (0 to 100).
 * @type number
 * @min 0
 * @max 100
 * @default 90
 * 
 * @param pitch
 * @text Pitch
 * @desc The pitch of the sound effect (50 to 150).
 * @type number
 * @min 50
 * @max 150
 * @default 100
 * 
 * @param pan
 * @text Pan
 * @desc The audio panning (-100 to 100).
 * @type number
 * @min -100
 * @max 100
 * @default 0
 */

(() => {
    const pluginName = "AutoTimedDoors";
    const TAG_DOOR = 'door';
    const CLOSE_DELAY = 120; // 120 frames = 2 seconds at 60fps

    // Parse Plugin Parameters Safely
    const parameters = PluginManager.parameters(pluginName);
    const enableSound = parameters['enableSound'] === 'true';
    
    let doorSe = null;
    if (parameters['doorSound']) {
        try {
            const rawSe = JSON.parse(parameters['doorSound']);
            doorSe = {
                name: rawSe.name || "",
                volume: Number(rawSe.volume || 90),
                pitch: Number(rawSe.pitch || 100),
                pan: Number(rawSe.pan || 0)
            };
        } catch (e) {
            console.error("AutoTimedDoors: Failed to parse door sound parameters.", e);
        }
    }

    // 1. Initialize custom properties when the event is created
    const _Game_Event_initialize = Game_Event.prototype.initialize;
    Game_Event.prototype.initialize = function(mapId, eventId) {
        _Game_Event_initialize.call(this, mapId, eventId);
        this._isAutoDoor = false;
        this._doorTimer = 0;
        this._doorState = 'closed'; // 'closed', 'opening', 'open', 'closing'
        
        this.checkAutoDoorTag();
    };

    Game_Event.prototype.checkAutoDoorTag = function() {
        const eventData = this.event();
        if (eventData && eventData.note) {
            if (eventData.note.toLowerCase().includes(`<${TAG_DOOR}>`)) {
                this._isAutoDoor = true;
                this._trigger = 2; // Dynamic override to Player Touch
            }
        }
    };

    // 2. Enforce the Closed State (Top Row) on setup or page change
    const _Game_Event_setupPageSettings = Game_Event.prototype.setupPageSettings;
    Game_Event.prototype.setupPageSettings = function() {
        _Game_Event_setupPageSettings.call(this);
        if (this._isAutoDoor) {
            this.setDirection(2); // Direction 2 = Row 1 (Top)
            this.setDirectionFix(true); // Prevent player looking at it from shifting it
            this._doorState = 'closed';
            this._doorTimer = 0;
        }
    };

    // 3. Handle what happens when the player touches the door
    const _Game_Event_start = Game_Event.prototype.start;
    Game_Event.prototype.start = function() {
        if (this._isAutoDoor) {
            if (this._doorState === 'closed') {
                this._doorState = 'opening';
                // Play custom sound if enabled and configured properly
                if (enableSound && doorSe && doorSe.name) {
                    AudioManager.playSe(doorSe);
                }
            }
            return; 
        }
        _Game_Event_start.call(this);
    };

    // 4. Overwrite priority so the player can walk through it when open
    const _Game_Event_isNormalPriority = Game_Event.prototype.isNormalPriority;
    Game_Event.prototype.isNormalPriority = function() {
        if (this._isAutoDoor && this._doorState === 'open') {
            return false; 
        }
        return _Game_Event_isNormalPriority.call(this);
    };

    // 5. Main update loop for the door animation state machine
    const _Game_Event_update = Game_Event.prototype.update;
    Game_Event.prototype.update = function() {
        _Game_Event_update.call(this);
        if (this._isAutoDoor) {
            this.updateDoorAnimation();
        }
    };

    Game_Event.prototype.updateDoorAnimation = function() {
        const animSpeed = 6; // Frames per step (~0.1 seconds per frame step)

        switch (this._doorState) {
            case 'opening':
                this._doorTimer++;
                if (this._doorTimer === animSpeed) {
                    this.setDirection(4); // Row 2
                } else if (this._doorTimer === animSpeed * 2) {
                    this.setDirection(6); // Row 3
                } else if (this._doorTimer === animSpeed * 3) {
                    this.setDirection(8); // Row 4 (Fully Open)
                    this._doorState = 'open';
                    this._doorTimer = 0; 
                }
                break;

            case 'open':
                this._doorTimer++;
                // Wait 2 seconds, and ensure the player has stepped off the tile before closing
                if (this._doorTimer >= CLOSE_DELAY && !this.isTileOccupied()) {
                    this._doorState = 'closing';
                    this._doorTimer = 0;
                }
                break;

            case 'closing':
                this._doorTimer++;
                if (this._doorTimer === animSpeed) {
                    this.setDirection(6); // Row 3
                } else if (this._doorTimer === animSpeed * 2) {
                    this.setDirection(4); // Row 2
                } else if (this._doorTimer === animSpeed * 3) {
                    this.setDirection(2); // Row 1 (Fully Closed)
                    this._doorState = 'closed';
                    this._doorTimer = 0;
                }
                break;
        }
    };

    Game_Event.prototype.isTileOccupied = function() {
        return $gamePlayer.x === this.x && $gamePlayer.y === this.y;
    };
})();