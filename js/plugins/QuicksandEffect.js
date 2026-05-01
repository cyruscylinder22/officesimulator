/*:
 * @target MZ
 * @plugindesc Quicksand with sinking depth, step limits, and damage.
 * @author CustomAI
 * 
 * @help
 * Use Region ID 10 for Quicksand tiles.
 * 1. Character sinks 5px deeper per step.
 * 2. After 10 steps, player takes damage and resets to the last safe tile.
 *
 * @param QuicksandRegion
 * @text Quicksand Region ID
 * @type number
 * @default 10
 */

(() => {
    const pluginName = "QuicksandEffect";
    const parameters = PluginManager.parameters(pluginName);
    const regionId = Number(parameters['QuicksandRegion'] || 10);

    const _Game_Player_initMembers = Game_Player.prototype.initMembers;
    Game_Player.prototype.initMembers = function() {
        _Game_Player_initMembers.call(this);
        this._quicksandSteps = 0;
        this._lastSafePos = { x: 0, y: 0, mapId: 0 };
    };

    // Track movement and safety
    const _Game_Player_onMoveEnd = Game_Player.prototype.onMoveEnd;
    Game_Player.prototype.onMoveEnd = function() {
        _Game_Player_onMoveEnd.call(this);
        
        if (this.regionId() === regionId) {
            this._quicksandSteps++;
            
            // Check if max depth reached
            if (this._quicksandSteps >= 10) {
                this.executeQuicksandPenalty();
            }
        } else {
            // Reset counter and save "Safe" tile when on normal ground
            this._quicksandSteps = 0;
            this._lastSafePos = { x: this.x, y: this.y, mapId: $gameMap.mapId() };
        }
    };

    Game_Player.prototype.executeQuicksandPenalty = function() {
        // 1. Take Damage (10% of Max HP)
        const damage = Math.floor(this.actor().mhp * 0.10);
        this.actor().gainHp(-damage);
        
        // 2. Play Sound/Effect
        SoundManager.playActorDamage();
        $gameScreen.startFlash([255, 0, 0, 128], 20);

        // 3. Reset Position
        this.locate(this._lastSafePos.x, this._lastSafePos.y);
        this._quicksandSteps = 0;
    };

    // Speed Penalty
    const _Game_CharacterBase_realMoveSpeed = Game_CharacterBase.prototype.realMoveSpeed;
    Game_CharacterBase.prototype.realMoveSpeed = function() {
        const speed = _Game_CharacterBase_realMoveSpeed.call(this);
        return (this.regionId() === regionId) ? speed - 1 : speed;
    };

    // Visual Sinking (Dynamic Depth)
    const _Sprite_Character_updatePosition = Sprite_Character.prototype.updatePosition;
    Sprite_Character.prototype.updatePosition = function() {
        _Sprite_Character_updatePosition.call(this);
        if (this._character instanceof Game_Player && this._character.regionId() === regionId) {
            // Sinks 5px multiplied by steps taken
            const depth = this._character._quicksandSteps * 5;
            this.y += depth;
        }
    };

    // Disable Dash in sand
    const _Game_Player_updateDashing = Game_Player.prototype.updateDashing;
    Game_Player.prototype.updateDashing = function() {
        if (this.regionId() === regionId) {
            this._dashing = false;
            return;
        }
        _Game_Player_updateDashing.call(this);
    };
})();