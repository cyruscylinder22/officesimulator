/*:
 * @target MZ
 * @plugindesc Restricts NPC movement to specific Region IDs using a note tag.
 * @author Gemini
 *
 * @help MZ_RegionRestrictNPC.js
 *
 * This plugin allows you to restrict an event's movement to a specific 
 * Region ID. The event will treat any tile NOT matching this Region ID 
 * as impassable wall.
 *
 * --- How to Use ---
 * In the "Note" box of your Event (at the top of the event window), 
 * type the following tag:
 *
 * <restrictRegion: X>
 *
 * Replace X with the Region ID number you painted around your table.
 * Example: <restrictRegion: 5>
 *
 * If you want the NPC to be allowed on standard unregioned tiles (Region 0)
 * AND your track, you can list them with commas:
 * <restrictRegion: 0, 5>
 */

(() => {
    const _Game_Event_isMapPassable = Game_Event.prototype.isMapPassable;
    Game_Event.prototype.isMapPassable = function(x, y, d) {
        // First check standard engine passability
        if (!_Game_Event_isMapPassable.call(this, x, y, d)) {
            return false;
        }

        // Get target coordinates based on direction
        const targetX = $gameMap.roundXWithDirection(x, d);
        const targetY = $gameMap.roundYWithDirection(y, d);
        const targetRegionId = $gameMap.regionId(targetX, targetY);

        // Check for the <restrictRegion> note tag
        const eventData = this.event();
        if (eventData && eventData.note) {
            const match = eventData.note.match(/<restrictRegion:\s*([\d\s,]+)>/i);
            if (match) {
                // Parse allowed regions into an array of integers
                const allowedRegions = match[1].split(',').map(num => parseInt(num.trim(), 10));
                
                // If the target tile's region isn't in the allowed list, block movement
                if (!allowedRegions.includes(targetRegionId)) {
                    return false;
                }
            }
        }

        return true;
    };
})();