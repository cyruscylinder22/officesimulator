/*:
 * @target MZ
 * @plugindesc Simulates quicksand by slowing down the player on specific tiles.
 * @author Gemini
 *
 * @param QuicksandTerrainTag
 * @text Terrain Tag
 * @desc The Terrain Tag ID (1-7) that acts as quicksand. Set to 0 to disable.
 * @type number
 * @default 1
 *
 * @param QuicksandRegionId
 * @text Region ID
 * @desc The Region ID (1-255) that acts as quicksand. Set to 0 to disable.
 * @type number
 * @default 0
 *
 * @param SlowSpeed
 * @text Slow Speed
 * @desc The move speed when in quicksand (1: slowest, 6: fastest).
 * @type number
 * @default 2
 *
 * @param DisableDash
 * @text Disable Dash
 * @desc Prevent the player from dashing in quicksand?
 * @type boolean
 * @default true
 *
 * @help
 * This plugin mimics Yanfly's quicksand logic.
 * 
 * Assign a Terrain Tag or Region ID to your tiles in the Database. 
 * When the player stands on these tiles:
 * 1. Their speed is lowered to the "Slow Speed" setting.
 * 2. Dashing is disabled (optional).
 * 3. Normal speed returns once they exit the tile.
 */

(() => {
    const pluginName = "Quicksand";
    const parameters = PluginManager.parameters(pluginName);
    const terrainTag = Number(parameters['QuicksandTerrainTag'] || 0);
    const regionId = Number(parameters['QuicksandRegionId'] || 0);
    const slowSpeed = Number(parameters['SlowSpeed'] || 2);
    const disableDash = parameters['DisableDash'] === 'true';

    // Helper function to check if player is in quicksand
    Game_Player.prototype.isInQuicksand = function() {
        const x = this.x;
        const y = this.y;
        if (terrainTag > 0 && $gameMap.terrainTag(x, y) === terrainTag) return true;
        if (regionId > 0 && $gameMap.regionId(x, y) === regionId) return true;
        return false;
    };

    // Override Real Move Speed
    const _Game_Player_realMoveSpeed = Game_Player.prototype.realMoveSpeed;
    Game_Player.prototype.realMoveSpeed = function() {
        if (this.isInQuicksand()) {
            return slowSpeed;
        }
        return _Game_Player_realMoveSpeed.call(this);
    };

    // Disable Dashing
    const _Game_Player_updateDashing = Game_Player.prototype.updateDashing;
    Game_Player.prototype.updateDashing = function() {
        if (this.isInQuicksand() && disableDash) {
            this._dashing = false;
            return;
        }
        _Game_Player_updateDashing.call(this);
    };

})();