/*:
 * @target MZ
 * @plugindesc Fixes tall sprites being cut off by Star tiles when standing in front of them.
 * @help Use the Notetag <TallSprite> in an Event's Note box to make it 
 * always render above star tiles when the player is "in front" of it.
 */

(() => {
    const _Sprite_Character_updatePosition = Sprite_Character.prototype.updatePosition;
    Sprite_Character.prototype.updatePosition = function() {
        _Sprite_Character_updatePosition.call(this);
        
        // Default Z for characters is 3. Star tiles are usually 4-5.
        // We check if the character is the Player or a specific Event.
        if (this._character instanceof Game_Player || this._character instanceof Game_Event) {
            
            // Check if the character has a custom property or if we are 
            // just applying this logic globally to the player.
            if (this._character instanceof Game_Player) {
                const map = $gameMap;
                const x = this._character.x;
                const y = this._character.y;
                
                // Check the tile directly ABOVE the player
                // If that tile is a 'Star' tile, we boost the player's Z-axis
                if (map.isStarPassable(x, y - 1)) {
                    this.z = 5; 
                } else {
                    this.z = 3;
                }
            }
        }
    };

    // Helper to check if a tile at a specific coordinate is a Star (*) tile
    Game_Map.prototype.isStarPassable = function(x, y) {
        const flags = this.allTiles(x, y).map(tileId => this.tileset().flags[tileId]);
        // 0x10 is the internal bitmask for the 'Star' passability flag
        return flags.some(flag => (flag & 0x10) !== 0);
    };
})();