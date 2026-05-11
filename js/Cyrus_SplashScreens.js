/*:
 * @target MZ
 * @plugindesc Shows up to 4 splash screens. Bulletproof version to prevent $gameTemp errors.
 * @author Cyrus / Gemini
 *
 * @param SplashScreen1
 * @text Splash Screen 1
 * @type file
 * @dir img/titles1/
 *
 * @param SplashScreen2
 * @text Splash Screen 2
 * @type file
 * @dir img/titles1/
 *
 * @param SplashScreen3
 * @text Splash Screen 3
 * @type file
 * @dir img/titles1/
 *
 * @param SplashScreen4
 * @text Splash Screen 4
 * @type file
 * @dir img/titles1/
 *
 * @param DisplayTime
 * @text Display Duration (Frames)
 * @type number
 * @default 120
 *
 * @param FadeTime
 * @text Fade Duration (Frames)
 * @type number
 * @default 60
 *
 * @param SkipMultiplier
 * @text Skip Speed Multiplier
 * @type number
 * @default 4
 */

(() => {
    const pluginName = "Cyrus_SplashScreens";
    const params = PluginManager.parameters(pluginName);
    
    const splashImages = [
        params['SplashScreen1'],
        params['SplashScreen2'],
        params['SplashScreen3'],
        params['SplashScreen4']
    ].filter(s => s && s !== "");

    const displayTime = Number(params['DisplayTime'] || 120);
    const fadeTime = Number(params['FadeTime'] || 60);
    const skipMultiplier = Number(params['SkipMultiplier'] || 4);

    // CRITICAL FIX: We override the method that actually chooses the next scene
    // This ensures $gameTemp and all other globals are fully initialized first.
    Scene_Boot.prototype.startNormalGame = function() {
        this.checkPlayerLocation();
        DataManager.setupNewGame();
        
        if (splashImages.length > 0) {
            SceneManager.goto(Scene_SplashProvider);
        } else {
            SceneManager.goto(Scene_Title);
        }
        Window_TitleCommand.initCommandPosition();
    };

    // --- Splash Scene Logic ---

    function Scene_SplashProvider() {
        this.initialize(...arguments);
    }

    Scene_SplashProvider.prototype = Object.create(Scene_Base.prototype);
    Scene_SplashProvider.prototype.constructor = Scene_SplashProvider;

    Scene_SplashProvider.prototype.initialize = function() {
        Scene_Base.prototype.initialize.call(this);
        this._splashIndex = 0;
        this._phase = 'fadein'; 
        this._timer = 0;
    };

    // Prevent WindowLayer UI errors
    Scene_SplashProvider.prototype.createWindowLayer = function() {};

    Scene_SplashProvider.prototype.create = function() {
        Scene_Base.prototype.create.call(this);
        this._sprite = new Sprite();
        this._sprite.opacity = 0;
        this.addChild(this._sprite);
        this.loadNextSplash();
    };

    Scene_SplashProvider.prototype.loadNextSplash = function() {
        if (this._splashIndex < splashImages.length) {
            this._sprite.bitmap = ImageManager.loadTitle1(splashImages[this._splashIndex]);
            this._phase = 'fadein';
            this._timer = 0;
        } else {
            SceneManager.goto(Scene_Title);
        }
    };

    Scene_SplashProvider.prototype.update = function() {
        Scene_Base.prototype.update.call(this);
        
        // Skip logic
        let speed = (TouchInput.isPressed() || Input.isPressed('ok') || Input.isPressed('cancel')) ? skipMultiplier : 1;
        this._timer += speed;

        switch (this._phase) {
            case 'fadein':
                this._sprite.opacity = (this._timer / fadeTime) * 255;
                if (this._timer >= fadeTime) {
                    this._sprite.opacity = 255;
                    this._timer = 0;
                    this._phase = 'wait';
                }
                break;
            case 'wait':
                if (this._timer >= displayTime) {
                    this._timer = 0;
                    this._phase = 'fadeout';
                }
                break;
            case 'fadeout':
                this._sprite.opacity = 255 - ((this._timer / fadeTime) * 255);
                if (this._timer >= fadeTime) {
                    this._sprite.opacity = 0;
                    this._splashIndex++;
                    this.loadNextSplash();
                }
                break;
        }
    };
})();