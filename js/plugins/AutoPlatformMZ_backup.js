/*:
 * @target MZ
 * @plugindesc v1.1 - Automatic Carry Platforms with Mouse/Touch Fix.
 * @author Gemini & Hakuen Studio
 *
 * @help 
 * To make an event an auto-platform:
 * 1. Add <AutoPlatform> to the event's Note box.
 * 2. Set Priority to "Below Characters".
 * 3. Set Trigger to "Parallel".
 * 
 * FIX IN v1.1:
 * - Clears mouse/touch destination when locked to a platform to prevent 
 *   stepping animations.
 */

(() => {
    "use strict";

    // --- Game_Player ---
    const _Game_Player_initMembers = Game_Player.prototype.initMembers;
    Game_Player.prototype.initMembers = function() {
        _Game_Player_initMembers.call(this);
        this._autoPlatformId = 0;
    };

    const _Game_Player_updateMove = Game_Player.prototype.updateMove;
    Game_Player.prototype.updateMove = function() {
        if (this._autoPlatformId > 0) {
            // FIX: Clear the mouse/touch destination so player doesn't "walk in place"
            if ($gameTemp.isDestinationValid()) {
                $gameTemp.clearDestination();
            }

            const x = this._x;
            const y = this._y;
            const realX = this._realX;
            const realY = this._realY;

            _Game_Player_updateMove.call(this);

            this._x = x;
            this._y = y;
            this._realX = realX;
            this._realY = realY;
            
            this.updateAutoPlatformCamera();
        } else {
            _Game_Player_updateMove.call(this);
        }
    };

    Game_Player.prototype.updateAutoPlatformCamera = function() {
        const centerX = (Graphics.width / $gameMap.tileWidth() - 1) / 2;
        const centerY = (Graphics.height / $gameMap.tileHeight() - 1) / 2;
        $gameMap.setDisplayPos(this._realX - centerX, this._realY - centerY);
    };

    // --- Game_Event ---
    const _Game_Event_update = Game_Event.prototype.update;
    Game_Event.prototype.update = function() {
        _Game_Event_update.call(this);
        if (this.event() && this.event().meta.AutoPlatform) {
            this.updateAutoPlatformLogic();
        }
    };

    Game_Event.prototype.updateAutoPlatformLogic = function() {
        const playerOnMe = ($gamePlayer.x === this.x && $gamePlayer.y === this.y);

        if (this._waitCount > 0) {
            if ($gamePlayer._autoPlatformId === this.eventId()) {
                $gamePlayer._autoPlatformId = 0;
            }
        } else {
            // Lock player if they are on the platform and it's about to move (not waiting)
            if (playerOnMe) {
                 $gamePlayer._autoPlatformId = this.eventId();
            }
        }

        if ($gamePlayer._autoPlatformId === this.eventId()) {
            $gamePlayer._x = this._x;
            $gamePlayer._y = this._y;
            $gamePlayer._realX = this._realX;
            $gamePlayer._realY = this._realY;
            $gamePlayer.updateAutoPlatformCamera();
        }
    };

    const _Game_Event_afterSetupPage = Game_Event.prototype.afterSetupPage;
    Game_Event.prototype.afterSetupPage = function() {
        _Game_Event_afterSetupPage.call(this);
        if (this.event() && this.event().meta.AutoPlatform) {
            this.setThrough(true);
        }
    };

})();