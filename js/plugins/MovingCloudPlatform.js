/*:
 * @target MZ
 * @plugindesc v1.1 - Smoothly ride on moving events (clouds/rafts)
 * @author Gemini
 * 
 * @help MovingCloud.Platform.js
 * 
 * Instructions:
 * 1. Put <moving_platform> in the Event Note field.
 * 2. Set Event Priority to "Below Characters".
 * 3. Ensure the event has a Movement Route.
 * 
 * The player will stop their stepping animation and be locked to the 
 * platform until it stops moving.
 */

(() => {
    let _onPlatform = false;

    // Helper: Check if event is a platform
    const isPlatform = (event) => {
        return event && event.event().note.includes("<moving_platform>");
    };

    // 1. Update Loop: Lock player to the event
    const _Game_Player_update = Game_Player.prototype.update;
    Game_Player.prototype.update = function(sceneActive) {
        _Game_Player_update.call(this, sceneActive);
        
        const eventsAtPos = $gameMap.eventsXy(this.x, this.y);
        const platform = eventsAtPos.find(e => isPlatform(e));

        if (platform) {
            _onPlatform = true;
            // Force coordinates to match exactly
            this._realX = platform._realX;
            this._realY = platform._realY;
            this._x = platform._x;
            this._y = platform._y;
            
            // Stop the "stepping" animation while riding
            this.setWalkAnime(false);
            this.setStepAnime(false);
            this.resetStopCount(); 
        } else {
            if (_onPlatform) {
                this.setWalkAnime(true); // Restore walking when off
                _onPlatform = false;
            }
        }
    };

    // 2. Hard Lock Movement: Character cannot move if the platform is moving
    const _Game_Player_canMove = Game_Player.prototype.canMove;
    Game_Player.prototype.canMove = function() {
        const eventsAtPos = $gameMap.eventsXy(this.x, this.y);
        const platform = eventsAtPos.find(e => isPlatform(e));

        // If on a platform and it is currently in motion, DISABLE all input
        if (platform && platform.isMoving()) {
            return false;
        }
        
        return _Game_Player_canMove.call(this);
    };

    // 3. Prevent "Jitter" by overriding the moveByInput
    const _Game_Player_moveByInput = Game_Player.prototype.moveByInput;
    Game_Player.prototype.moveByInput = function() {
        if (_onPlatform) {
            const platform = $gameMap.eventsXy(this.x, this.y).find(e => isPlatform(e));
            if (platform && platform.isMoving()) return; 
        }
        _Game_Player_moveByInput.call(this);
    };

})();