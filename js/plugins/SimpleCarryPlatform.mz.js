/*:
 * @target MZ
 * @plugindesc Standalone Carrying Platforms (MZ Fixed Camera).
 * @author Hakuen Studio (Extracted & Simplified)
 *
 * @help 
 * To make an event a carrying platform:
 * 1. Add <CarryPlatform> to the event's Note box.
 * 2. Set Priority to "Below Characters".
 * 3. Set Trigger to "Player Touch".
 * 
 * This version uses MZ-specific setDisplayPos for stable camera tracking.
 */

(() => {
    "use strict";

    // --- Game_Map ---
    const _Game_Map_setupEvents = Game_Map.prototype.setupEvents;
    Game_Map.prototype.setupEvents = function() {
        this._platformEventIds = [];
        _Game_Map_setupEvents.call(this);
    };

    // --- Game_Player ---
    const _Game_Player_initMembers = Game_Player.prototype.initMembers;
    Game_Player.prototype.initMembers = function() {
        _Game_Player_initMembers.call(this);
        this._carryPlatformId = 0;
    };

    const _Game_Player_updateMove = Game_Player.prototype.updateMove;
    Game_Player.prototype.updateMove = function() {
        const x = this._x;
        const y = this._y;
        const realX = this._realX;
        const realY = this._realY;
        
        _Game_Player_updateMove.call(this);

        if (this._carryPlatformId > 0) {
            this._x = x;
            this._y = y;
            this._realX = realX;
            this._realY = realY;
            
            this.updatePlayerPlatformCamera();

            const d = this.getInputDirection();
            if (d > 0) this.setDirection(d);
        }
    };

    // MZ Specific Camera Centering
    Game_Player.prototype.updatePlayerPlatformCamera = function() {
        const centerX = (Graphics.width / $gameMap.tileWidth() - 1) / 2;
        const centerY = (Graphics.height / $gameMap.tileHeight() - 1) / 2;
        $gameMap.setDisplayPos(this._realX - centerX, this._realY - centerY);
    };

    // --- Game_Event ---
    const _Game_Event_afterSetupPage = Game_Event.prototype.afterSetupPage;
    Game_Event.prototype.afterSetupPage = function() {
        _Game_Event_afterSetupPage.call(this);
        if (this.event() && this.event().meta.CarryPlatform) {
            if (!$gameMap._platformEventIds.includes(this.eventId())) {
                $gameMap._platformEventIds.push(this.eventId());
            }
            this.setThrough(true);
        }
    };

    const _Game_Event_updateMove = Game_Event.prototype.updateMove;
    Game_Event.prototype.updateMove = function() {
        _Game_Event_updateMove.call(this);

        if ($gamePlayer._carryPlatformId === this.eventId()) {
            $gamePlayer._x = this._x;
            $gamePlayer._y = this._y;
            $gamePlayer._realX = this._realX;
            $gamePlayer._realY = this._realY;
            
            $gamePlayer.updatePlayerPlatformCamera();
        }
    };

    const _Game_Event_start = Game_Event.prototype.start;
    Game_Event.prototype.start = function() {
        _Game_Event_start.call(this);
        if (this.event() && this.event().meta.CarryPlatform) {
            $gamePlayer._carryPlatformId = this.eventId();
        }
    };

    // --- Game_Interpreter ---
    const _Game_Interpreter_terminate = Game_Interpreter.prototype.terminate;
    Game_Interpreter.prototype.terminate = function() {
        _Game_Interpreter_terminate.call(this);
        if ($gamePlayer._carryPlatformId === this._eventId) {
            $gamePlayer._carryPlatformId = 0;
        }
    };

})();