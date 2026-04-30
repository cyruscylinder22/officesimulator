//=============================================================================
// RPG Maker MZ - IceTerrainTag
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Ice Slide: 3-frame step, static slide, and 50% speed boost on ice.
 * @author Gemini
 * 
 * @param IceTerrainTag
 * @text Ice Terrain Tag
 * @desc The terrain tag number (1-7) that acts as ice.
 * @type number
 * @default 1
 * 
 * @param SlideSpeed
 * @text Slide Speed
 * @desc The move speed while sliding (Default 4, Faster 5, Very Fast 6).
 * @type number
 * @default 5
 */

(() => {
    const pluginName = document.currentScript.src.split("/").pop().replace(/\.js$/, "");
    
    const getParams = () => {
        const params = PluginManager.parameters(pluginName);
        return {
            tag: params['IceTerrainTag'] ? Number(params['IceTerrainTag']) : 1,
            speed: params['SlideSpeed'] ? Number(params['SlideSpeed']) : 6
        };
    };

    const animeFrameLimit = 3;

    const _Game_Player_initMembers = Game_Player.prototype.initMembers;
    Game_Player.prototype.initMembers = function() {
        _Game_Player_initMembers.call(this);
        this._iceAnimeCount = 0;
        this._normalSpeed = 4; // Storage for your default walking speed
    };

    const _Game_Player_update = Game_Player.prototype.update;
    Game_Player.prototype.update = function(sceneActive) {
        _Game_Player_update.call(this, sceneActive);
        this.updateIceSlide();
    };

    Game_Player.prototype.updateIceSlide = function() {
        const config = getParams();
        
        if (this.terrainTag() === config.tag) {
            $gameTemp.clearDestination();

            // Apply speed boost
            if (this.moveSpeed() !== config.speed) {
                this._normalSpeed = this.moveSpeed() === config.speed ? this._normalSpeed : this.moveSpeed();
                this.setMoveSpeed(config.speed);
            }

            if (!this.isMoving()) {
                if (this.canPass(this.x, this.y, this.direction())) {
                    this.executeIceMove();
                } else {
                    this.stopSliding();
                }
            }
        } else {
            if (this._iceAnimeCount > 0 || this.moveSpeed() === config.speed) {
                this.stopSliding();
            }
        }
    };

    Game_Player.prototype.executeIceMove = function() {
        if (this._iceAnimeCount < animeFrameLimit) {
            this.setWalkAnime(true);
        } else {
            this.setWalkAnime(false);
            this.setStepAnime(false);
            this.setPattern(1);
        }
        this.moveForward();
    };

    Game_Player.prototype.stopSliding = function() {
        this.setWalkAnime(true);
        this.setStepAnime(false);
        this._iceAnimeCount = 0;
        // Restore the speed you had before touching ice
        this.setMoveSpeed(this._normalSpeed);
    };

    const _Game_Player_updateAnimation = Game_Player.prototype.updateAnimation;
    Game_Player.prototype.updateAnimation = function() {
        const config = getParams();
        if (this.terrainTag() === config.tag && this.isMoving()) {
            const lastPattern = this._pattern;
            _Game_Player_updateAnimation.call(this);
            
            if (this._pattern !== lastPattern) {
                this._iceAnimeCount++;
            }

            if (this._iceAnimeCount >= animeFrameLimit) {
                this._pattern = 1;
                this._animeCount = 0;
            }
            return;
        }
        _Game_Player_updateAnimation.call(this);
    };

    const _Game_Player_moveByInput = Game_Player.prototype.moveByInput;
    Game_Player.prototype.moveByInput = function() {
        const config = getParams();
        if (this.terrainTag() === config.tag && this.canPass(this.x, this.y, this.direction())) {
            return;
        }
        _Game_Player_moveByInput.call(this);
    };

})();