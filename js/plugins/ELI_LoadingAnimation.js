/*:
 * @target MZ
 * @plugindesc v5.6 - Loading fade sequence with bottom-left text and random direction row option.
 * @author Gemini
 * 
 * @param Default File Name
 * @type file
 * @dir img/characters/
 * @desc The character image file to use by default (do not include extension).
 * @default Actor1
 * 
 * @param Default Index
 * @type number
 * @min 0
 * @max 7
 * @desc The index of the sprite on the sheet (0-7 for 8-char sheets. 0 for $big sheets).
 * @default 0
 * 
 * @param Default Direction Row
 * @type select
 * @option Random Direction
 * @value -1
 * @option Walk Down (Forward)
 * @value 0
 * @option Walk Left
 * @value 1
 * @option Walk Right
 * @value 2
 * @option Walk Up (Backward)
 * @value 3
 * @desc Select which row of the sprite sheet to use. "Random Direction" chooses a new row each load screen.
 * @default 2
 * 
 * @param Loading Text
 * @type string
 * @desc The text to display in the bottom-left corner of the screen. Leave blank for no text.
 * @default Now Loading...
 * 
 * @param Font Size
 * @type number
 * @min 1
 * @desc The size of the loading text in pixels.
 * @default 28
 * 
 * @param Minimum Display Time
 * @type number
 * @min 0
 * @decimals 1
 * @desc The minimum number of seconds the loading screen black backdrop must stay active.
 * @default 2.0
 * 
 * @param Sprite Fade Speed
 * @type number
 * @min 1
 * @desc How many frames it takes for the character sprite and text to fade away.
 * @default 20
 * 
 * @param Screen Fade Speed
 * @type number
 * @min 1
 * @desc How many frames it takes for the black background to fade away afterward.
 * @default 30
 * 
 * @param Animation Speed
 * @type number
 * @desc How fast the character walks. Lower is faster (e.g., 6 is normal, 12 is slow).
 * @default 6
 * 
 * @param Scale
 * @type number
 * @decimals 1
 * @desc The scale of the sprite. 1.0 is normal size, 2.0 is double size.
 * @default 1.5
 * 
 * @help ELI_LoadingAnimation.js
 * ============================================================================
 * This plugin creates a sequential fade sequence: First the character and text 
 * fade out into the black screen, then the black screen fades into the game map.
 * 
 * Setting Direction Row to -1 (Random) will dynamically pick a new direction
 * row every time the loading screen appears.
 * ============================================================================
 * 
 * PLUGIN COMMANDS:
 * 
 *   ChangeLoadingSprite
 *     Changes the file, index, and direction row mid-game.
 */

/*~struct~Dummy:
 * @command ChangeLoadingSprite
 * @text Change Loading Sprite
 * @desc Changes the character sheet, index, and direction shown on the loading screen.
 * 
 * @arg fileName
 * @type file
 * @dir img/characters/
 * @text File Name
 * @desc Select the character sheet file.
 * @default Actor1
 * 
 * @arg index
 * @type number
 * @min 0
 * @max 7
 * @text Character Index
 * @desc The position on the sheet (0-7). Use 0 for single $character sheets.
 * @default 0
 * 
 * @arg directionRow
 * @type select
 * @text Direction Row
 * @option Random Direction
 * @value -1
 * @option Walk Down (Forward)
 * @value 0
 * @option Walk Left
 * @value 1
 * @option Walk Right
 * @value 2
 * @option Walk Up (Backward)
 * @value 3
 * @desc Choose which direction row the character will use while loading.
 * @default 2
 */

(() => {
    const pluginName = "ELI_LoadingAnimation";
    const parameters = PluginManager.parameters(pluginName);
    const defaultFile = String(parameters['Default File Name'] || 'Actor1');
    const defaultIndex = Number(parameters['Default Index'] || 0);
    const defaultDirectionRow = Number(parameters['Default Direction Row'] !== undefined ? parameters['Default Direction Row'] : 2);
    const loadingTextSetting = String(parameters['Loading Text'] || '');
    const fontSizeSetting = Number(parameters['Font Size'] || 28);
    const minDisplayTime = Number(parameters['Minimum Display Time'] || 2.0);
    const spriteFadeDuration = Number(parameters['Sprite Fade Speed'] || 20);
    const screenFadeDuration = Number(parameters['Screen Fade Speed'] || 30);
    const animSpeed = Number(parameters['Animation Speed'] || 6);
    const spriteScale = Number(parameters['Scale'] || 1.5);

    let htmlCanvas = null;
    let htmlContext = null;
    let characterImage = new Image();
    let animationId = null;
    let currentPattern = 0;
    let animationCount = 0;
    
    let loadingStartTime = 0;
    let isEngineReadyToEnd = false;
    
    let fadePhase = 0; 
    let spriteOpacity = 1.0;
    let screenOpacity = 1.0;
    let isCustomLoadingActive = false;
    let activeDirectionRow = 2; // Real direction row selected for the current instance

    function isMenuSceneActive() {
        if (typeof SceneManager === 'undefined' || !SceneManager._scene) return false;
        const currentScene = SceneManager._scene;
        return currentScene instanceof Scene_MenuBase;
    }

    // Track chosen Sprite data safely
    const _Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        _Game_System_initialize.call(this);
        this._loadingSpriteFile = defaultFile;
        this._loadingSpriteIndex = defaultIndex;
        this._loadingSpriteDirectionRow = defaultDirectionRow;
    };

    Game_System.prototype.loadingSpriteFile = function() {
        return this._loadingSpriteFile !== undefined ? this._loadingSpriteFile : defaultFile;
    };

    Game_System.prototype.loadingSpriteIndex = function() {
        return this._loadingSpriteIndex !== undefined ? this._loadingSpriteIndex : defaultIndex;
    };

    Game_System.prototype.loadingSpriteDirectionRow = function() {
        return this._loadingSpriteDirectionRow !== undefined ? this._loadingSpriteDirectionRow : defaultDirectionRow;
    };

    Game_System.prototype.setLoadingSprite = function(fileName, index, directionRow) {
        this._loadingSpriteFile = fileName;
        this._loadingSpriteIndex = Number(index || 0);
        this._loadingSpriteDirectionRow = Number(directionRow !== undefined ? directionRow : 2);
    };

    PluginManager.registerCommand(pluginName, "ChangeLoadingSprite", args => {
        if (typeof $gameSystem !== 'undefined') {
            $gameSystem.setLoadingSprite(args.fileName, args.index, args.directionRow);
        }
    });

    // Disable default MZ CSS spinner completely
    Graphics._updateLoadingSpinner = function() {
        if (this._loadingSpinner) {
            this._loadingSpinner.style.opacity = 0;
            this._loadingSpinner.style.display = "none";
            this._loadingSpinner.style.visibility = "hidden";
        }
    };

    const _Graphics_startLoading = Graphics.startLoading;
    Graphics.startLoading = function() {
        _Graphics_startLoading.call(this);
        if (this._loadingSpinner) {
            this._loadingSpinner.style.display = "none";
        }

        if (isMenuSceneActive()) {
            isCustomLoadingActive = false;
            return;
        }

        isCustomLoadingActive = true;
        loadingStartTime = Date.now();
        isEngineReadyToEnd = false;
        fadePhase = 0;
        spriteOpacity = 1.0;
        screenOpacity = 1.0;

        // CALCULATE DIRECTION ROW
        const hasGameSystem = (typeof $gameSystem !== 'undefined' && $gameSystem !== null);
        const configuredRow = hasGameSystem ? $gameSystem.loadingSpriteDirectionRow() : defaultDirectionRow;
        
        if (configuredRow === -1) {
            // Pick a random row between 0 and 3
            activeDirectionRow = Math.floor(Math.random() * 4);
        } else {
            activeDirectionRow = configuredRow;
        }

        createHTMLCanvas();
    };

    const _Graphics_endLoading = Graphics.endLoading;
    Graphics.endLoading = function() {
        if (!isCustomLoadingActive) {
            return _Graphics_endLoading.call(this);
        }

        const hasFinishedAssets = (!this._loadingCount || this._loadingCount <= 1);
        if (hasFinishedAssets) {
            isEngineReadyToEnd = true;
        }

        const elapsedTime = (Date.now() - loadingStartTime) / 1000;
        if (elapsedTime < minDisplayTime || !isEngineReadyToEnd || screenOpacity > 0) {
            return false; 
        }

        if (this._loadingCount > 0) {
            this._loadingCount--;
        }

        const success = this._loadingCount === 0;
        if (success) {
            destroyHTMLCanvas();
        }
        return success;
    };

    function createHTMLCanvas() {
        if (htmlCanvas) return;

        const hasGameSystem = (typeof $gameSystem !== 'undefined' && $gameSystem !== null);
        const fileName = hasGameSystem ? $gameSystem.loadingSpriteFile() : defaultFile;
        
        characterImage.src = `img/characters/${encodeURIComponent(fileName)}.png`;

        htmlCanvas = document.createElement("canvas");
        htmlCanvas.id = "eliLoadingCanvas";
        
        htmlCanvas.style.position = "absolute";
        htmlCanvas.style.left = "0px";
        htmlCanvas.style.top = "0px";
        htmlCanvas.style.width = "100%";
        htmlCanvas.style.height = "100%";
        htmlCanvas.style.zIndex = "9999"; 
        htmlCanvas.style.pointerEvents = "none";
        
        htmlCanvas.width = window.innerWidth || document.documentElement.clientWidth;
        htmlCanvas.height = window.innerHeight || document.documentElement.clientHeight;

        htmlContext = htmlCanvas.getContext("2d");
        htmlContext.imageSmoothingEnabled = false;

        document.body.appendChild(htmlCanvas);

        currentPattern = 0;
        animationCount = 0;
        
        animationId = requestAnimationFrame(updateHTMLFrame);
    }

    function updateHTMLFrame() {
        if (!htmlCanvas) return;

        const currentW = window.innerWidth || document.documentElement.clientWidth;
        const currentH = window.innerHeight || document.documentElement.clientHeight;
        if (htmlCanvas.width !== currentW || htmlCanvas.height !== currentH) {
            htmlCanvas.width = currentW;
            htmlCanvas.height = currentH;
            htmlContext.imageSmoothingEnabled = false;
        }

        if (!characterImage.complete || characterImage.naturalWidth === 0) {
            htmlContext.fillStyle = "black";
            htmlContext.fillRect(0, 0, htmlCanvas.width, htmlCanvas.height);
            animationId = requestAnimationFrame(updateHTMLFrame);
            return;
        }

        animationCount++;
        if (animationCount >= animSpeed) {
            currentPattern = (currentPattern + 1) % 4;
            animationCount = 0;
        }

        const elapsedTime = (Date.now() - loadingStartTime) / 1000;
        if (isEngineReadyToEnd && elapsedTime >= minDisplayTime && fadePhase === 0) {
            fadePhase = 1; 
        }

        if (fadePhase === 1) {
            spriteOpacity -= 1.0 / spriteFadeDuration;
            if (spriteOpacity <= 0) {
                spriteOpacity = 0;
                fadePhase = 2; 
            }
        } else if (fadePhase === 2) {
            screenOpacity -= 1.0 / screenFadeDuration;
            if (screenOpacity <= 0) {
                screenOpacity = 0;
                htmlCanvas.style.opacity = 0;
                
                isCustomLoadingActive = false; 
                Graphics._loadingCount = 1; 
                Graphics.endLoading();
                
                destroyHTMLCanvas();
                return;
            }
            htmlCanvas.style.opacity = screenOpacity;
        }

        renderHTMLSprite();
        animationId = requestAnimationFrame(updateHTMLFrame);
    }

    function renderHTMLSprite() {
        if (!htmlContext) return;
        
        htmlContext.clearRect(0, 0, htmlCanvas.width, htmlCanvas.height);

        // Background
        htmlContext.fillStyle = "black";
        htmlContext.fillRect(0, 0, htmlCanvas.width, htmlCanvas.height);

        htmlContext.save();
        htmlContext.globalAlpha = spriteOpacity;

        // 1. Text (Bottom-Left Corner)
        if (loadingTextSetting) {
            let mainFont = "sans-serif";
            try {
                if (typeof FontManager !== 'undefined' && typeof FontManager.mainFontFace === 'function') {
                    const engineFont = FontManager.mainFontFace();
                    if (engineFont) mainFont = engineFont;
                }
            } catch (e) {
                mainFont = "sans-serif";
            }
            
            htmlContext.font = `${fontSizeSetting}px ${mainFont}`;
            htmlContext.fillStyle = "white";
            htmlContext.textAlign = "left";
            htmlContext.textBaseline = "bottom";
            htmlContext.fillText(loadingTextSetting, 32, htmlCanvas.height - 32);
        }

        // 2. Walking Sprite (Bottom-Right Corner)
        if (spriteOpacity > 0) {
            const hasGameSystem = (typeof $gameSystem !== 'undefined' && $gameSystem !== null);
            const index = hasGameSystem ? $gameSystem.loadingSpriteIndex() : defaultIndex;

            const isBigCharacter = characterImage.src.includes('%24');
            const pw = characterImage.naturalWidth / (isBigCharacter ? 3 : 12);
            const ph = characterImage.naturalHeight / (isBigCharacter ? 4 : 8);

            const patternMapping = [0, 1, 2, 1];
            const currentFrame = patternMapping[currentPattern];

            const sx = ((index % 4) * 3 + currentFrame) * pw;
            // Uses the pre-calculated random or manual active row index
            const sy = (Math.floor(index / 4) * 4 + activeDirectionRow) * ph;

            const destW = pw * spriteScale;
            const destH = ph * spriteScale;

            const targetX = htmlCanvas.width - destW - 32;
            const targetY = htmlCanvas.height - 32;

            htmlContext.drawImage(
                characterImage, 
                sx, sy, pw, ph, 
                targetX, targetY - destH, destW, destH
            );
        }
        
        htmlContext.restore();
    }

    function destroyHTMLCanvas() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        if (htmlCanvas) {
            if (document.getElementById("eliLoadingCanvas")) {
                document.body.removeChild(htmlCanvas);
            }
            htmlCanvas = null;
            htmlContext = null;
        }
    }
})();