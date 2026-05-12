/*:
 * @target MZ
 * @plugindesc Standalone Fall Platforms - Robust Detection & Visibility.
 * @author Hakuen Studio (Extracted/Modified)
 *
 * @param holeRegions
 * @text Hole Regions
 * @type text
 * @desc Region IDs that count as holes. Safe positions will NEVER be saved here.
 * @default 1
 *
 * @param fallDelay
 * @text Fall Grace Period
 * @type number
 * @desc Frames before falling.
 * @default 10
 *
 * @param platformMaxHealth
 * @text Platform Life
 * @type number
 * @default 60
 *
 * @param platformDangerHealth
 * @text Danger Threshold (%)
 * @type number
 * @default 50
 *
 * @param fallCommonEvent
 * @text Fall Common Event
 * @type common_event
 * @default 0
 *
 * @command cmd_returnSafePos
 * @text Return Safe Position
 */

(() => {
    const pluginName = "StandalonePlatform";
    const params = PluginManager.parameters(pluginName);
    const holeRegions = (params.holeRegions || "").split(",").map(n => Number(n.trim()));
    const fallDelay = Number(params.fallDelay || 10);
    const maxHealth = Number(params.platformMaxHealth || 60);
    const dangerHealthPct = Number(params.platformDangerHealth || 50);
    const fallCE = Number(params.fallCommonEvent || 0);

    PluginManager.registerCommand(pluginName, "cmd_returnSafePos", () => {
        $gamePlayer.goToSafePosition();
    });

    // --- HOLE LOGIC ---
    Game_CharacterBase.prototype.isOnHoleTile = function() {
        return holeRegions.includes(this.regionId());
    };

    // --- PLAYER LOGIC ---
    const _Game_Player_initMembers = Game_Player.prototype.initMembers;
    Game_Player.prototype.initMembers = function() {
        _Game_Player_initMembers.call(this);
        this._timeOnHole = 0;
        this._isFalling = false;
        this._safePos = { x: 0, y: 0 };
    };

    const _Game_Player_increaseSteps = Game_Player.prototype.increaseSteps;
    Game_Player.prototype.increaseSteps = function() {
        _Game_Player_increaseSteps.call(this);
        // Only save checkpoint if the floor is NOT a hole region
        if (!this.isOnHoleTile()) {
            this._safePos = { x: this._x, y: this._y };
            this._isFalling = false;
            this._timeOnHole = 0;
        }
    };

    const _Game_Player_update = Game_Player.prototype.update;
    Game_Player.prototype.update = function(active) {
        _Game_Player_update.call(this, active);
        if (!this.isJumping() && this.isOnHoleTile() && !this._isFalling) {
            this.updatePlatformFallLogic();
        }
    };

    Game_Player.prototype.updatePlatformFallLogic = function() {
        const platform = $gameMap.events().find(e => 
            e.pos(this._x, this._y) && e._isPlatform && !e._isDead
        );
        
        if (platform) {
            this._timeOnHole = 0; 
        } else {
            this._timeOnHole++;
            if (this._timeOnHole >= fallDelay) {
                this.triggerFall();
            }
        }
    };

    Game_Player.prototype.triggerFall = function() {
        if (this._isFalling) return;
        this._isFalling = true;
        this._timeOnHole = 0;
        $gameTemp.clearDestination(); 
        if (fallCE > 0) $gameTemp.reserveCommonEvent(fallCE);
    };

    Game_Player.prototype.goToSafePosition = function() {
        this.setPosition(this._safePos.x, this._safePos.y);
        const followers = this.followers();
        if (followers && typeof followers.data === 'function') {
            followers.data().forEach(f => f.setPosition(this._safePos.x, this._safePos.y));
        }
        this._isFalling = false;
        this._timeOnHole = 0;
        $gameTemp.clearDestination(); 
    };

    // --- EVENT LOGIC ---
    const _Game_Event_setupPage = Game_Event.prototype.setupPage;
    Game_Event.prototype.setupPage = function() {
        _Game_Event_setupPage.call(this);
        // Note tag check
        this._isPlatform = !!this.event().meta.FallPlatform;
        if (this._isPlatform) {
            this._pHealth = maxHealth;
            this._pMax = maxHealth;
            this._isDead = $gameSelfSwitches.value([this._mapId, this._eventId, 'B']);
        }
    };

    const _Game_Event_update = Game_Event.prototype.update;
    Game_Event.prototype.update = function() {
        _Game_Event_update.call(this);
        if (this._isPlatform && !this._isDead && this.page()) {
            this.updateFallPlatform();
        }
    };

    Game_Event.prototype.updateFallPlatform = function() {
        // Direct coordinate check to avoid passability/through issues
        const playerOnTop = ($gamePlayer.x === this.x && $gamePlayer.y === this.y) && !$gamePlayer.isJumping();
        
        if (playerOnTop) {
            this._pHealth--;
            if (this._pHealth <= 0) {
                this._isDead = true;
                $gameSelfSwitches.setValue([this._mapId, this._eventId, 'B'], true);
                // Reset health for when the event eventually respawns/reloads
                this._pHealth = this._pMax; 
            }
        } else {
            if (this._pHealth < this._pMax) this._pHealth++;
        }

        // Danger Threshold (Self Switch A)
        const isDanger = this._pHealth <= (this._pMax * (dangerHealthPct / 100));
        const keyA = [this._mapId, this._eventId, 'A'];
        if ($gameSelfSwitches.value(keyA) !== isDanger) {
            $gameSelfSwitches.setValue(keyA, isDanger);
        }
    };
})();