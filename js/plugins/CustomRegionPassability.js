/*:
 * @target MZ
 * @plugindesc Region-based passability with optional Two-Way blocking.
 * @author Gemini
 *
 * @param RegionSettings
 * @text Region Passability Rules
 * @type struct<RegionRule>[]
 * @desc Define passability for specific Region IDs.
 * @default []
 *
 * @help
 * REGION SETTINGS:
 * 1. Set the Region ID.
 * 2. Toggle which directions are allowed.
 * 3. Two-Way Logic: 
 *    - If TRUE: If "Left" is blocked, you can't move Left OUT of the tile,
 *      and you can't move INTO the tile from the Right side.
 *    - If FALSE: The rules only apply when you are STANDING on the tile.
 */

/*~struct~RegionRule:
 * @param regionId
 * @text Region ID
 * @type number
 * @min 1
 * @max 255
 * @desc The ID of the region you are configuring.
 *
 * @param allowUp
 * @text Allow UP
 * @type boolean
 * @default true
 *
 * @param allowDown
 * @text Allow DOWN
 * @type boolean
 * @default true
 *
 * @param allowLeft
 * @text Allow LEFT
 * @type boolean
 * @default true
 *
 * @param allowRight
 * @text Allow RIGHT
 * @type boolean
 * @default true
 * 
 * @param isTwoWay
 * @text Two-Way Logic?
 * @type boolean
 * @default true
 * @desc If true, this tile also blocks incoming movement from the forbidden directions.
 */

(() => {
    const pluginName = "CustomRegionPassability";
    const parameters = PluginManager.parameters(pluginName);
    const regionSettings = JSON.parse(parameters['RegionSettings'] || '[]').map(s => JSON.parse(s));

    const getRegionRule = (id) => {
        return regionSettings.find(rule => Number(rule.regionId) === id);
    };

    const reverseDir = (d) => {
        if (d === 2) return 8; // Down -> Up
        if (d === 4) return 6; // Left -> Right
        if (d === 6) return 4; // Right -> Left
        if (d === 8) return 2; // Up -> Down
        return 0;
    };

    const isDirectionAllowed = (rule, d) => {
        if (!rule) return true;
        if (d === 2) return String(rule.allowDown) === "true";
        if (d === 4) return String(rule.allowLeft) === "true";
        if (d === 6) return String(rule.allowRight) === "true";
        if (d === 8) return String(rule.allowUp) === "true";
        return true;
    };

    const _Game_Map_isPassable = Game_Map.prototype.isPassable;
    Game_Map.prototype.isPassable = function(x, y, d) {
        
        // --- 1. DEPARTURE CHECK ---
        const currentRegionId = this.regionId(x, y);
        const currentRule = getRegionRule(currentRegionId);
        
        if (currentRule && !isDirectionAllowed(currentRule, d)) {
            return false; 
        }

        // --- 2. ARRIVAL CHECK ---
        const targetX = $gameMap.roundXWithDirection(x, d);
        const targetY = $gameMap.roundYWithDirection(y, d);
        const targetRegionId = this.regionId(targetX, targetY);
        const targetRule = getRegionRule(targetRegionId);

        // Only block entry if the TARGET tile has Two-Way logic enabled
        if (targetRule && String(targetRule.isTwoWay) === "true") {
            if (!isDirectionAllowed(targetRule, reverseDir(d))) {
                return false;
            }
        }

        return _Game_Map_isPassable.call(this, x, y, d);
    };
})();