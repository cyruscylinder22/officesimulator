/*:
 * @target MZ
 * @plugindesc Bottom-left Region Names. Size 42, Off-Grey, Sans-Serif, Smooth Fade.
 * @author Gemini
 * 
 * @param RegionSettings
 * @text Region Map List
 * @type struct<RegionEntry>[]
 * @desc Map Region IDs to Display Names. Leave Name empty to create a "Reset" tile.
 * @default []
 *
 * @help
 * - Font: Modern Sans-Serif
 * - Text Size: 42px
 * - Color: Off-Grey (#cccccc)
 * - No background box / Gradual fade-in/out.
 */

/*~struct~RegionEntry:
 * @param regionId
 * @text 1. Region ID
 * @type number
 * @min 1
 * @max 255
 * @desc The Region ID number on the map.
 *
 * @param regionName
 * @text 2. Display Name
 * @type string
 * @desc The name to display.
 */

(() => {
    const pluginName = "RegionAnnouncer";
    const params = PluginManager.parameters(pluginName);
    const rawSettings = JSON.parse(params['RegionSettings'] || "[]");
    const regionMap = {};
    
    rawSettings.forEach(item => {
        const parsed = JSON.parse(item);
        if (parsed.regionId) {
            regionMap[Number(parsed.regionId)] = {
                name: parsed.regionName ? parsed.regionName.trim() : "",
                isDefined: true
            };
        }
    });

    let _currentActiveRegionId = -1;

    const _Game_Player_performTransfer = Game_Player.prototype.performTransfer;
    Game_Player.prototype.performTransfer = function() {
        _Game_Player_performTransfer.apply(this, arguments);
        _currentActiveRegionId = -1;
    };

    const _Game_Player_update = Game_Player.prototype.update;
    Game_Player.prototype.update = function(sceneActive) {
        _Game_Player_update.call(this, sceneActive);
        if (sceneActive && !$gameMessage.isBusy()) {
            this.checkRegionState();
        }
    };

    Game_Player.prototype.checkRegionState = function() {
        const currentTileId = this.regionId();
        const regionData = regionMap[currentTileId];

        if (regionData && regionData.isDefined) {
            if (currentTileId !== _currentActiveRegionId) {
                if (regionData.name !== "") {
                    if (SceneManager._scene instanceof Scene_Map) {
                        SceneManager._scene.showRegionPopup(regionData.name);
                    }
                }
                _currentActiveRegionId = currentTileId;
            }
        }
    };

    function Window_RegionAnnounce() {
        this.initialize(...arguments);
    }

    Window_RegionAnnounce.prototype = Object.create(Window_Base.prototype);
    Window_RegionAnnounce.prototype.constructor = Window_RegionAnnounce;

    Window_RegionAnnounce.prototype.initialize = function(rect) {
        Window_Base.prototype.initialize.call(this, rect);
        this.padding = 0; 
        this.opacity = 0;         
        this.contentsOpacity = 0; 
        this._showCount = 0;
        this._text = "";
    };

    Window_RegionAnnounce.prototype.lineHeight = function() {
        return 70; 
    };

    Window_RegionAnnounce.prototype.setup = function(text) {
        this._text = text;
        this._showCount = 300; 
        this.contentsOpacity = 0; 
        this.refresh();
    };

    Window_RegionAnnounce.prototype.update = function() {
        Window_Base.prototype.update.call(this);
        if (this._showCount > 0) {
            if (this.contentsOpacity < 255) this.contentsOpacity += 8; 
            this._showCount--;
        } else if (this.contentsOpacity > 0) {
            this.contentsOpacity -= 8;
        }
    };

    Window_RegionAnnounce.prototype.refresh = function() {
        this.contents.clear();
        if (this._text) {
            // Set Modern Sans-Serif Font
            this.contents.fontFace = "Inter, Roboto, Helvetica, Segoe UI, sans-serif";
            this.contents.fontSize = 42; 
            this.contents.textColor = "#cccccc"; 
            
            const w = this.contents.measureTextWidth(this._text) + 20;
            const h = this.lineHeight(); 
            
            // Draw text with headroom for lower-case descenders
            this.drawText(this._text, 10, -5, w, 'left');
            
            this.resetFontSettings();
        }
    };

    const _Scene_Map_createAllWindows = Scene_Map.prototype.createAllWindows;
    Scene_Map.prototype.createAllWindows = function() {
        const width = 800;
        const height = 90;
        const x = 15; // Slightly away from absolute edge for sans-serif readability
        const y = Graphics.boxHeight - height - 10;
        const rect = new Rectangle(x, y, width, height);
        
        this._regionPopupWindow = new Window_RegionAnnounce(rect);
        this.addWindow(this._regionPopupWindow);

        _Scene_Map_createAllWindows.call(this);
    };

    Scene_Map.prototype.showRegionPopup = function(text) {
        if (this._regionPopupWindow) this._regionPopupWindow.setup(text);
    };
})();