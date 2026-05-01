/*:
 * @target MZ
 * @plugindesc Smooth 5px Quicksand: Smooth emergence when exiting sand.
 * @author Gemini
 *
 * @param DefaultRegions
 * @text Default Quicksand Regions
 * @type number[]
 * @default []
 *
 * @param DefaultTerrains
 * @text Default Quicksand Terrains
 * @type number[]
 * @default []
 *
 * @param DamageAmount
 * @text Sandsink Damage
 * @type number
 * @default 50
 */

(() => {
    const pluginName = "QuicksandSystem";
    const parameters = PluginManager.parameters(pluginName);
    
    const defaultRegions = JSON.parse(parameters['DefaultRegions'] || "[]").map(Number);
    const defaultTerrains = JSON.parse(parameters['DefaultTerrains'] || "[]").map(Number);
    const sinkDamage = Number(parameters['DamageAmount'] || 50);

    const getQuicksandRegions = () => {
        if (!$dataMap || !$dataMap.meta) return defaultRegions;
        const note = $dataMap.meta['Quicksand Region'] || $dataMap.meta['Quicksand Regions'];
        return note ? note.split(',').map(s => Number(s.trim())) : defaultRegions;
    };

    const getQuicksandTerrains = () => {
        const tileset = $gameMap.tileset();
        if (!tileset) return defaultTerrains;
        if (tileset.meta) {
            const note = tileset.meta['Quicksand Terrain Tag'] || tileset.meta['Quicksand Terrain Tags'];
            if (note) return note.split(',').map(s => Number(s.trim()));
        }
        return defaultTerrains;
    };

    // --- Game_CharacterBase ---
    const _Game_CharacterBase_initMembers = Game_CharacterBase.prototype.initMembers;
    Game_CharacterBase.prototype.initMembers = function() {
        _Game_CharacterBase_initMembers.call(this);
        this._sinkBase = 0;       
        this._visualSinkShift = 0; // The actual smooth value used by the sprite
        this._safeX = -1;
        this._safeY = -1;
        this._respawnLock = 0;
        this._flickerTimer = 0;
        this._isWaitingToRespawn = false;
    };

    Game_CharacterBase.prototype.isQuicksand = function() {
        if (this.isAntiSandsink()) return false;
        const regions = getQuicksandRegions();
        const terrains = getQuicksandTerrains();
        return regions.includes($gameMap.regionId(this.x, this.y)) || 
               terrains.includes($gameMap.terrainTag(this.x, this.y));
    };

    Game_CharacterBase.prototype.isAntiSandsink = function() { return false; };

    const _Game_CharacterBase_update = Game_CharacterBase.prototype.update;
    Game_CharacterBase.prototype.update = function() {
        _Game_CharacterBase_update.call(this);
        if (this._respawnLock > 0) this._respawnLock--;
        if (this._flickerTimer > 0) this._flickerTimer--;

        // Handle Smooth Emergence Logic
        this.updateSandsinkVisuals();
    };

    Game_CharacterBase.prototype.updateSandsinkVisuals = function() {
        if (this.isQuicksand()) {
            // While in sand, calculate target based on steps + movement progress
            const fractionalPart = Math.abs(this._realY - this.y) + Math.abs(this._realX - this.x);
            const targetShift = (this._sinkBase + (1.0 - fractionalPart)) * 5;
            this._visualSinkShift = Math.min(48, targetShift);
        } else if (this._isWaitingToRespawn || this._respawnLock > 0) {
            this._visualSinkShift = 48;
        } else {
            // If on safe ground but still "sunken", decrease shift quickly (8px per frame)
            if (this._visualSinkShift > 0) {
                this._visualSinkShift = Math.max(0, this._visualSinkShift - 8);
            }
        }
    };

    const _Game_CharacterBase_increaseSteps = Game_CharacterBase.prototype.increaseSteps;
    Game_CharacterBase.prototype.increaseSteps = function() {
        _Game_CharacterBase_increaseSteps.call(this);
        if (this.isQuicksand()) {
            this._sinkBase++;
            if (this._sinkBase >= 10) this.onFullSink();
        } else {
            if (!this._isWaitingToRespawn) {
                this._sinkBase = 0; // Logical step reset
                this._safeX = this.x;
                this._safeY = this.y;
            }
        }
    };

    Game_CharacterBase.prototype.onFullSink = function() {};

    // --- Game_Player ---
    const _Game_Player_onFullSink = Game_Player.prototype.onFullSink;
    Game_Player.prototype.onFullSink = function() {
        if (this._isWaitingToRespawn) return;
        $gameParty.members().forEach(a => a.gainHp(-sinkDamage));
        $gameScreen.startShake(5, 5, 20);
        
        this._isWaitingToRespawn = true;
        $gameMap._quicksandCamX = $gameMap.displayX();
        $gameMap._quicksandCamY = $gameMap.displayY();
        $gameMap._quicksandCamLocked = true;

        setTimeout(() => {
            const rx = this._safeX >= 0 ? this._safeX : this.x;
            const ry = this._safeY >= 0 ? this._safeY : this.y;
            this.locate(rx, ry);
            this.followers().synchronize(rx, ry, this.direction());
            this._sinkBase = 0;
            this._visualSinkShift = 0; // Reset visual on respawn
            this._isWaitingToRespawn = false;
            this._respawnLock = 15; 
            this._flickerTimer = 120;
            this.followers().data().forEach(f => f._flickerTimer = 120);
            $gameMap._quicksandCamLocked = false;
        }, 2000);
    };

    // --- Camera ---
    const _Game_Map_updateScroll = Game_Map.prototype.updateScroll;
    Game_Map.prototype.updateScroll = function() {
        if (this._quicksandCamLocked) {
            this._displayX = this._quicksandCamX;
            this._displayY = this._quicksandCamY;
        } else {
            _Game_Map_updateScroll.call(this);
        }
    };

    // --- Sprite Logic ---
    const _Sprite_Character_updatePosition = Sprite_Character.prototype.updatePosition;
    Sprite_Character.prototype.updatePosition = function() {
        _Sprite_Character_updatePosition.call(this);
        // Use the character's pre-calculated smooth shift
        if (this._character) {
            this._visualSinkDepth = this._character._visualSinkShift || 0;
        }
    };

    const _Sprite_Character_updateCharacterFrame = Sprite_Character.prototype.updateCharacterFrame;
    Sprite_Character.prototype.updateCharacterFrame = function() {
        _Sprite_Character_updateCharacterFrame.call(this);
        const sink = this._visualSinkDepth || 0;
        if (sink > 0) {
            const pw = this.patternWidth();
            const ph = this.patternHeight();
            const sx = (this.characterBlockX() + this.characterPatternX()) * pw;
            const sy = (this.characterBlockY() + this.characterPatternY()) * ph;
            const ch = Math.max(0, ph - sink);
            this.setFrame(sx, sy, pw, ch);
        }
    };

    const _Sprite_Character_update = Sprite_Character.prototype.update;
    Sprite_Character.prototype.update = function() {
        _Sprite_Character_update.call(this);
        if (this._character && this._character._flickerTimer > 0) {
            this.opacity = (Math.floor(Graphics.frameCount / 4) % 2 === 0) ? 128 : 255;
        } else {
            this.opacity = 255;
        }
    };

    // --- Event Logic ---
    Game_Event.prototype.isAntiSandsink = function() {
        if (this.event().meta['Anti-Sandsink'] || this.checkCommentTag('Anti-Sandsink')) return true;
        return !(this.event().meta['Can Sandsink'] || this.checkCommentTag('Can Sandsink'));
    };
    Game_Event.prototype.checkCommentTag = function(tag) {
        if (!this.page()) return false;
        return this.page().list.some(c => (c.code === 108 || c.code === 408) && c.parameters[0].includes(`<${tag}>`));
    };
    Game_Event.prototype.onFullSink = function() { this.erase(); };

})();