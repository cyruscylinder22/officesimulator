/*:
 * @target MZ
 * @plugindesc Intelligent Sprite Changer: Detects single ($) vs. multi-sheets and toggles switches.
 * @author Gemini
 *
 * @param Equipment Map
 * @type struct<ArmorMapping>[]
 * @desc Define which Armor IDs change the sprite and flip which switches.
 * @default []
 *
 * @help
 * This plugin updates Actor 1's sprite when closing the menu.
 * 
 * SMART FEATURES:
 * 1. Automatic Sheet Detection: If the filename starts with '$', 
 *    it treats it as a single character sheet and ignores the index.
 * 2. Switch Sync: Automatically handles ON/OFF states for up to 20+ outfits.
 * 3. Priority: If multiple mapped armors are worn, the last one in your 
 *    plugin list takes priority for the sprite.
 */

/*~struct~ArmorMapping:
 * @param ArmorId
 * @text Armor ID
 * @type armor
 * @desc The armor that triggers the change.
 *
 * @param SpriteName
 * @text Character Sprite Name
 * @type file
 * @dir img/characters/
 * @desc The image file. If it starts with '$', it's treated as a single sheet.
 *
 * @param SpriteIndex
 * @text Character Sprite Index (0-7)
 * @type number
 * @min 0
 * @max 7
 * @default 0
 * @desc Only used for 8-character sheets. Ignored for '$' files.
 *
 * @param SwitchId
 * @text Associated Switch
 * @type switch
 * @desc This switch turns ON when this armor is worn, and OFF otherwise.
 */

(() => {
    const pluginName = "VisualArmorSystem";
    const parameters = PluginManager.parameters(pluginName);
    const rawMap = parameters['Equipment Map'] ? JSON.parse(parameters['Equipment Map']) : [];
    
    const armorMappings = rawMap.map(item => {
        const obj = JSON.parse(item);
        return {
            armorId: Number(obj.ArmorId),
            spriteName: obj.SpriteName,
            spriteIndex: Number(obj.SpriteIndex),
            switchId: Number(obj.SwitchId)
        };
    });

    let defaultSprite = null;
    let defaultIndex = null;

    const _Scene_Menu_terminate = Scene_Menu.prototype.terminate;
    Scene_Menu.prototype.terminate = function() {
        _Scene_Menu_terminate.call(this);
        updateVisualArmor();
    };

    function updateVisualArmor() {
        const actor = $gameActors.actor(1);
        if (!actor) return;

        if (defaultSprite === null) {
            defaultSprite = actor.characterName();
            defaultIndex = actor.characterIndex();
        }

        let newSprite = defaultSprite;
        let newIndex = defaultIndex;
        const equippedArmors = actor.armors();
        
        armorMappings.forEach(mapping => {
            const isEquipped = equippedArmors.some(a => a.id === mapping.armorId);
            
            if (isEquipped) {
                newSprite = mapping.spriteName;
                
                // --- CLEVER CHECK START ---
                // If the filename starts with $, it's a single character sheet.
                // Single sheets ALWAYS use index 0.
                if (newSprite.startsWith('$')) {
                    newIndex = 0;
                } else {
                    newIndex = mapping.spriteIndex;
                }
                // --- CLEVER CHECK END ---

                if (mapping.switchId > 0) $gameSwitches.setValue(mapping.switchId, true);
            } else {
                if (mapping.switchId > 0) $gameSwitches.setValue(mapping.switchId, false);
            }
        });

        actor.setCharacterImage(newSprite, newIndex);
        $gamePlayer.refresh();
    }
})();