/*:
 * @target MZ
 * @plugindesc v2.3 - Non-Passable Tile Boarding
 * @author Gemini & Hakuen Studio
 *
 * @help 
 * TAGS:
 * <AutoPlatform> - Locked until a Wait command.
 * <FreePlatform> - Allows walking off (Keyboard or Mouse).
 * 
 * Set event Trigger to "Parallel" and Priority to "Below Characters".
 * This version allows you to walk onto the platform even if the 
 * underlying tile is water, a wall, or otherwise impassable.
 */

(() => {
    "use strict";

    // --- Game_Player ---
    const _Game_Player_initMembers = Game_Player.prototype.initMembers;
    Game_Player.prototype.initMembers = function() {
        _Game_Player_initMembers.call(this);
        this._onAutoPlatformId = 0;
    };

    // Kill stepping animation
    const _Game_Player_updateAnimation = Game_Player.prototype.updateAnimation;
    Game_Player.prototype.updateAnimation = function() {
        if (this._onAutoPlatformId > 0) {
            this._pattern = 1; 
            this._animationCount = 0;
            return;
        }
        _Game_Player_updateAnimation.call(this);
    };

    // --- BOARDING OVERRIDE ---
    // This allows the player to move onto a tile that is normally blocked
    // if a platform is currently occupying that tile.
    const _Game_Player_canPass = Game_Player.prototype.canPass;
    Game_Player.prototype.canPass = function(x, y, d) {
        const x2 = $gameMap.roundXWithDirection(x, d);
        const y2 = $gameMap.roundYWithDirection(y, d);
        
        // Check if there is a platform at the target coordinates
        const events = $gameMap.eventsXy(x2, y2);
        const hasPlatform = events.some(ev => ev.event().meta.AutoPlatform || ev.event().meta.FreePlatform);
        
        if (hasPlatform) return true; // Force passability for boarding
        
        return _Game_Player_canPass.call(this, x, y, d);
    };

    // --- Input Logic ---
    const _Game_Player_moveByInput = Game_Player.prototype.moveByInput;
    Game_Player.prototype.moveByInput = function() {
        if (this._onAutoPlatformId > 0 && $gameTemp.isDestinationValid()) {
            const platform = $gameMap.event(this._onAutoPlatformId);
            if (platform && platform.event().meta.FreePlatform) {
                const direction = this.getInputDirection();
                if (direction > 0 && this.canPass(this.x, this.y, direction)) {
                    this._onAutoPlatformId = 0;
                    platform._waitCount = 15;
                    this.moveStraight(direction);
                    $gameTemp.clearDestination();
                    return;
                }
            }
        }
        _Game_Player_moveByInput.call(this);
    };

    const _Game_Player_executeMove = Game_Player.prototype.executeMove;
    Game_Player.prototype.executeMove = function(direction) {
        if (this._onAutoPlatformId > 0) {
            const platform = $gameMap.event(this._onAutoPlatformId);
            if (platform && platform.event().meta.FreePlatform) {
                if (this.canPass(this.x, this.y, direction)) {
                    this._onAutoPlatformId = 0;
                    platform._waitCount = 15; 
                    _Game_Player_executeMove.call(this, direction);
                    return;
                }
            }
            return; 
        }
        _Game_Player_executeMove.call(this, direction);
    };

    // --- DETECTION & SYNC ---
    const _Game_Player_update = Game_Player.prototype.update;
    Game_Player.prototype.update = function(sceneActive) {
        if (sceneActive) {
            this.updateAutoPlatformLogic();
        }
        _Game_Player_update.call(this, sceneActive);
    };

    Game_Player.prototype.updateAutoPlatformLogic = function() {
        if (this._onAutoPlatformId > 0) {
            const platform = $gameMap.event(this._onAutoPlatformId);
            if (!platform || platform._waitCount > 0) {
                this._onAutoPlatformId = 0;
            } else {
                this._x = platform._x;
                this._y = platform._y;
                this._realX = platform._realX;
                this._realY = platform._realY;
                if ($gameTemp.isDestinationValid() && !platform.event().meta.FreePlatform) {
                    $gameTemp.clearDestination();
                }
            }
            return;
        }

        const events = $gameMap.eventsXy(this.x, this.y);
        for (const ev of events) {
            if (ev.event().meta.AutoPlatform || ev.event().meta.FreePlatform) {
                const dist = Math.abs(ev._realX - ev._x) + Math.abs(ev._realY - ev._y);
                // If the player is on the tile, lock them even if visually slightly off
                // to prevent them "sliding" off a non-passable tile before the lock hits.
                if (dist < 0.4 && ev._waitCount === 0 && !this.isMoving()) {
                    this._onAutoPlatformId = ev.eventId();
                    break;
                }
            }
        }
    };

    const _Game_Event_afterSetupPage = Game_Event.prototype.afterSetupPage;
    Game_Event.prototype.afterSetupPage = function() {
        _Game_Event_afterSetupPage.call(this);
        if (this.event() && (this.event().meta.AutoPlatform || this.event().meta.FreePlatform)) {
            this.setThrough(true);
        }
    };

})();