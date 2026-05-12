/*:
 * @target MZ
 * @plugindesc High-Priority Event-to-Player Carrying System
 * @author Gemini
 */

(() => {
    const _Game_Player_update = Game_Player.prototype.update;
    Game_Player.prototype.update = function(active) {
        _Game_Player_update.call(this, active);
        this.updateCarryPlatform();
    };

    Game_Player.prototype.updateCarryPlatform = function() {
        // Find platform specifically by Note Tag
        const platform = $gameMap.events().find(event => 
            event.event().meta.CarryPlatform && 
            event.pos(this._x, this._y)
        );

        if (platform) {
            this._carriedByEventId = platform.eventId();
            // Match movement exactly
            this._x = platform._x;
            this._y = platform._y;
            this._realX = platform._realX;
            this._realY = platform._realY;
        } else {
            this._carriedByEventId = 0;
        }
    };

    // Override collision so the player can actually step ONTO the platform
    const _Game_CharacterBase_canPass = Game_CharacterBase.prototype.canPass;
    Game_CharacterBase.prototype.canPass = function(x, y, d) {
        const x2 = $gameMap.roundXWithDirection(x, d);
        const y2 = $gameMap.roundYWithDirection(y, d);
        const events = $gameMap.eventsXyNt(x2, y2);
        
        // If the destination has a CarryPlatform, ignore the usual collision block
        if (this instanceof Game_Player && events.some(e => e.event().meta.CarryPlatform)) {
            return true; 
        }
        return _Game_CharacterBase_canPass.call(this, x, y, d);
    };
})();