/*:
 * @target MZ
 * @plugindesc v1.0.0 - Prevents NPCs/Events from walking onto specific Region tiles while allowing the player through.
 * @author Gemini
 *
 * @param ImpassableRegionId
 * @text Region ID
 * @desc The Region ID (1-255) that NPCs are forbidden to walk on.
 * @type number
 * @min 1
 * @max 255
 * @default 250
 *
 * @help NPC_ImpassableRegion.js
 *
 * This plugin gives you an easy way to block NPCs from wandering into 
 * areas meant only for the player by painting a specific Region ID on the map.
 *
 * How to use:
 * 1. Set the Region ID in this plugin's parameters (e.g., 250).
 * 2. Go to your Map Editor and switch to the Region tab (R).
 * 3. Draw the chosen region ID over the tiles you want to block NPCs from entering.
 *
 * NPCs will now completely ignore paths that lead onto these region tiles.
 */

(() => {
    const pluginName = "NPC_ImpassableRegion";
    const parameters = PluginManager.parameters(pluginName);
    const restrictedRegion = Number(parameters['ImpassableRegionId'] || 250);

    // Hook into the movement system check for maps
    const _Game_Map_checkPassage = Game_Map.prototype.checkPassage;
    Game_Map.prototype.checkPassage = function(x, y, bit) {
        // Look ahead to find out what character is currently asking if a tile is passable
        if (this._currentMovingCharacter && this._currentMovingCharacter.isNPC()) {
            // Get the region ID of the target tile
            if (this.regionId(x, y) === restrictedRegion) {
                return false; // Block passage immediately
            }
        }
        // Otherwise, fall back to standard RPG Maker passage rules
        return _Game_Map_checkPassage.call(this, x, y, bit);
    };

    // Helper method to determine if a moving character is an NPC event
    Game_CharacterBase.prototype.isNPC = function() {
        return false; 
    };

    Game_Event.prototype.isNPC = function() {
        return true; 
    };

    // Track which character is currently running the passage check
    const _Game_CharacterBase_canPass = Game_CharacterBase.prototype.canPass;
    Game_CharacterBase.prototype.canPass = function(x, y, d) {
        $gameMap._currentMovingCharacter = this;
        const result = _Game_CharacterBase_canPass.call(this, x, y, d);
        $gameMap._currentMovingCharacter = null;
        return result;
    };
})();