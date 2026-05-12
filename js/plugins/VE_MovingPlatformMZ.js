/*:
 * @target MZ
 * @plugindesc (v1.0.2) Fully functional moving platforms for MZ.
 * @author Victor Sant (Ported to MZ by Gemini)
 *
 * @param Void Terrain ID
 * @desc Tiles with this terrain tag will be considered "void".
 * @type number
 * @default 7
 *
 * @param Default Fall Common Event
 * @desc Common Event triggered when the player falls.
 * @type common_event
 * @default 1
 *
 * @help
 * 1. Create an event. 
 * 2. Add a 'Comment' on the active page: <platform>
 * 3. Set the event to 'Through: ON' and 'Priority: Below Characters'.
 * 4. Set 'Frequency: 5 (Highest)' for smooth movement.
 *
 * PLUGIN COMMANDS:
 * Use 'returnToSafe' in your Fall Common Event to teleport the player back.
 *
 * @command returnToSafe
 * @text Return to Safe Position
 * @desc Teleports player back to the last safe tile they stood on.
 */

(() => {
    const pluginName = "VE_MovingPlatformMZ";
    const parameters = PluginManager.parameters(pluginName);
    const globalVoidTag = Number(parameters['Void Terrain ID'] || 7);
    const globalFallEvent = Number(parameters['Default Fall Common Event'] || 1);

    //=============================================================================
    // Game_CharacterBase - Base definitions
    //=============================================================================

    const _Game_CharacterBase_initMembers = Game_CharacterBase.prototype.initMembers;
    Game_CharacterBase.prototype.initMembers = function() {
        _Game_CharacterBase_initMembers.call(this);
        this._isPlatform = false;
        this._isVoidPlatform = false;
        this._lastRealX = this._realX;
        this._lastRealY = this._realY;
    };

    Game_CharacterBase.prototype.isPlatform = function() {
        return this._isPlatform;
    };

    //=============================================================================
    // Game_Event - Detect platform tags
    //=============================================================================

    const _Game_Event_setupPage = Game_Event.prototype.setupPage;
    Game_Event.prototype.setupPage = function() {
        _Game_Event_setupPage.call(this);
        this.checkPlatformComments();
    };

    Game_Event.prototype.checkPlatformComments = function() {
        this._isPlatform = false;
        this._isVoidPlatform = false;
        if (!this.page()) return;

        for (const cmd of this.list()) {
            if (cmd.code === 108 || cmd.code === 408) {
                const comment = cmd.parameters[0];
                if (comment.match(/<platform>/i)) this._isPlatform = true;
                if (comment.match(/<void>/i)) this._isVoidPlatform = true;
            }
        }

        if (this._isPlatform) {
            this._priorityType = 0; // Below Player
            this._through = true;
        }
    };

    // Update last position after movement
    const _Game_Event_update = Game_Event.prototype.update;
    Game_Event.prototype.update = function() {
        this._lastRealX = this._realX;
        this._lastRealY = this._realY;
        _Game_Event_update.call(this);
    };

    //=============================================================================
    // Game_Player - Sticky Logic
    //=============================================================================

    const _Game_Player_initMembers = Game_Player.prototype.initMembers;
    Game_Player.prototype.initMembers = function() {
        _Game_Player_initMembers.call(this);
        this._activePlatform = null;
        this._safeX = 0;
        this._safeY = 0;
        this._falling = false;
    };

    // Override moveStraight to detect platform boarding
    const _Game_Player_moveStraight = Game_Player.prototype.moveStraight;
    Game_Player.prototype.moveStraight = function(d) {
        _Game_Player_moveStraight.call(this, d);
        this.checkPlatformCapture();
    };

    Game_Player.prototype.checkPlatformCapture = function() {
        const platforms = $gameMap.events().filter(e => e.isPlatform() && !e._isVoidPlatform);
        // Match player grid position to platform grid position
        this._activePlatform = platforms.find(p => p.pos(this.x, this.y)) || null;
    };

    const _Game_Player_update = Game_Player.prototype.update;
    Game_Player.prototype.update = function(sceneActive) {
        _Game_Player_update.call(this, sceneActive);
        if (sceneActive) {
            this.updatePlatformLogic();
        }
    };

    Game_Player.prototype.updatePlatformLogic = function() {
        // 1. Re-check if we are still on the platform
        if (this._activePlatform) {
            const p = this._activePlatform;
            
            // 2. If platform moved, move the player by the same amount
            const dx = p._realX - p._lastRealX;
            const dy = p._realY - p._lastRealY;

            if (dx !== 0 || dy !== 0) {
                this._realX += dx;
                this._realY += dy;
                this._x = Math.round(this._realX);
                this._y = Math.round(this._realY);
            }

            // 3. Fall off if we walk away or platform disappears
            if (!p.pos(this.x, this.y) || p._erased) {
                this._activePlatform = null;
            }
        } else {
            // Check for boarding if not already on one (handles landing after jump)
            this.checkPlatformCapture();
        }

        // 4. Void Detection
        const terrain = $gameMap.terrainTag(this.x, this.y);
        if (terrain !== globalVoidTag && !this._activePlatform && !this.isJumping()) {
            this._safeX = this.x;
            this._safeY = this.y;
        }

        if (terrain === globalVoidTag && !this._activePlatform && !this.isJumping() && !this._falling) {
            this._falling = true;
            $gameTemp.reserveCommonEvent(globalVoidTag === terrain ? globalFallEvent : 0);
        }
    };

    //=============================================================================
    // Plugin Commands
    //=============================================================================

    PluginManager.registerCommand(pluginName, "returnToSafe", () => {
        $gamePlayer.locate($gamePlayer._safeX, $gamePlayer._safeY);
        $gamePlayer._falling = false;
        $gamePlayer._activePlatform = null;
    });

})();