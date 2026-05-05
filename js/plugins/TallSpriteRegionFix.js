/*:
 * @target MZ
 * @plugindesc Boosts Sprite Z-Priority based on Region ID or Terrain Tag.
 * @author Gemini
 * 
 * @param BoostRegionId
 * @text Region ID
 * @desc When standing on this Region ID, the sprite renders above Star tiles. Set to 0 to disable.
 * @type number
 * @default 10
 *
 * @param BoostTerrainTag
 * @text Terrain Tag
 * @desc When standing on this Terrain Tag, the sprite renders above Star tiles. Set to 0 to disable.
 * @type number
 * @default 0
 *
 * @help
 * This plugin fixes "scalped" tall sprites.
 * 
 * 1. Set a Region ID (e.g., 10) or a Terrain Tag (e.g., 1).
 * 2. Apply that Region or Terrain to the floor tile where the player stands
 *    in front of the tall object.
 * 3. The sprite will jump to Z-Priority 5 while standing there.
 */

(() => {
    const pluginName = "TallSpriteRegionFix";
    const parameters = PluginManager.parameters(pluginName);
    const boostRegionId = Number(parameters['BoostRegionId'] || 0);
    const boostTerrainTag = Number(parameters['BoostTerrainTag'] || 0);

    const _Sprite_Character_updatePosition = Sprite_Character.prototype.updatePosition;
    Sprite_Character.prototype.updatePosition = function() {
        _Sprite_Character_updatePosition.call(this);
        
        if (this._character) {
            const charX = this._character.x;
            const charY = this._character.y;
            
            const currentRegion = $gameMap.regionId(charX, charY);
            const currentTerrain = $gameMap.terrainTag(charX, charY);

            // Check if either the Region ID or the Terrain Tag matches
            const isRegionMatch = boostRegionId > 0 && currentRegion === boostRegionId;
            const isTerrainMatch = boostTerrainTag > 0 && currentTerrain === boostTerrainTag;

            if (isRegionMatch || isTerrainMatch) {
                // Priority 5 sits above the Star layer
                this.z = 5; 
            } else {
                // Reset to standard character priority
                this.z = 3;
            }
        }
    };
})();