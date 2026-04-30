//=============================================================================
// RPG Maker MZ - IceTerrainTag
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Ice Slide: 4-frame step, then static slide. Fixes the "sliding off ice" bug.
 * @author Gemini
 * 
 * @param IceTerrainTag
 * @text Ice Terrain Tag
 * @desc The terrain tag number (1-7) that acts as ice.
 * @type number
 * @default 1
 */
/*:
 * @target MZ
 * @plugindesc Ice Slide: Plays exactly 3 animation frames, then stays static.
 * @author Gemini
 * 
 * @param IceTerrainTag
 * @text Ice Terrain Tag
 * @desc The terrain tag number (1-7) that acts as ice.
 * @type number
 * @default 1
 */

(() => {
    const pluginName = "IceSlide";
    
    const getIceTag = () => {
        const params = PluginManager.parameters(pluginName);
        return Number(params['IceTerrainTag'] || 1);
    };

    // We track animation counts to ensure 3 frames of leg movement
    const animeFrameLimit = 3;

    const _Game_Player_initMembers = Game_Player.prototype.initMembers;
    Game_Player.prototype.initMembers = function() {
        _Game_Player_initMembers.call(this);
        this._iceAnimeCount = 0;
    };

    const _Game_Player_update = Game_Player.prototype.update;
    Game_Player.prototype.update = function(sceneActive) {
        _Game_Player_update.call(this, sceneActive);
        this.updateIceSlide();
    };

    Game_Player.prototype.updateIceSlide = function() {
        const iceTag = getIceTag();
        
        if (this.terrainTag() === iceTag) {
            $gameTemp.clearDestination();

            if (!this.isMoving()) {
                if (this.canPass(this.x, this.y, this.direction())) {
                    this.executeIceMove();
                } else {
                    this.restoreWalking();
                    this._iceAnimeCount = 0; 
                }
            }
        } else {
            if (this._iceAnimeCount > 0) {
                this.restoreWalking();
                this._iceAnimeCount = 0;
            }
        }
    };

    Game_Player.prototype.executeIceMove = function() {
        // If we haven't reached the 3-frame limit, keep walking anime on
        if (this._iceAnimeCount < animeFrameLimit) {
            this.setWalkAnime(true);
        } else {
            this.setWalkAnime(false);
            this.setStepAnime(false);
            this.setPattern(1);
        }
        this.moveForward();
    };

    Game_Player.prototype.restoreWalking = function() {
        this.setWalkAnime(true);
        this.setStepAnime(false);
    };

    // Override animation update to count frames and then lock
    const _Game_Player_updateAnimation = Game_Player.prototype.updateAnimation;
    Game_Player.prototype.updateAnimation = function() {
        const iceTag = getIceTag();
        
        if (this.terrainTag() === iceTag && this.isMoving()) {
            // Check if a frame of animation just occurred
            const lastPattern = this._pattern;
            _Game_Player_updateAnimation.call(this);
            
            if (this._pattern !== lastPattern) {
                this._iceAnimeCount++;
            }

            // If we've hit our 3-frame limit, lock to middle frame
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
        const iceTag = getIceTag();
        if (this.terrainTag() === iceTag && this.canPass(this.x, this.y, this.direction())) {
            return;
        }
        _Game_Player_moveByInput.call(this);
    };

})();