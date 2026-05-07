/*:
 * @target MZ
 * @plugindesc Plays hint animation with a solid text box and a 5-second auto-hide timer.
 * @author Gemini
 *
 * @param progressVariableId
 * @text Progress Variable ID
 * @desc The ID of the in-game variable (0-20).
 * @type variable
 * @default 1
 *
 * @param successHints
 * @text Success Hints (0-20)
 * @desc Define the hint text for each progress level (0-20).
 * @type string[]
 * @default ["Hint 0", "Hint 1"]
 *
 * @help
 * 1. Place "hint coin.png" in /img/characters/.
 * 2. Setup the variable and hints in the Plugin Manager.
 * 3. The hint box will automatically vanish after 5 seconds (300 frames).
 */

(() => {
    const pluginName = "HintAnimation";
    const parameters = PluginManager.parameters(pluginName);
    const PROGRESS_VAR_ID = Number(parameters['progressVariableId'] || 1);
    
    // Proper JSON parsing for MZ array parameters
    const HINTS_LIST = JSON.parse(parameters['successHints'] || "[]");

    // --- Menu Commands ---
    const _Window_MenuCommand_addMainCommands = Window_MenuCommand.prototype.addMainCommands;
    Window_MenuCommand.prototype.addMainCommands = function() {
        _Window_MenuCommand_addMainCommands.call(this);
        this.addCommand("Hint", "hint", true);
    };

    const _Scene_Menu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
    Scene_Menu.prototype.createCommandWindow = function() {
        _Scene_Menu_createCommandWindow.call(this);
        this._commandWindow.setHandler("hint", this.commandHint.bind(this));
    };

    Scene_Menu.prototype.commandHint = function() {
        const isSuccess = Math.random() < 0.5;
        const currentProgress = $gameVariables.value(PROGRESS_VAR_ID);
        let hintText = HINTS_LIST[currentProgress] || "No hint defined for this level.";
        
        this._hintSprite.startAnimation(isSuccess, hintText);
        this._commandWindow.activate(); 
    };

    // --- Scene & Sprite Logic ---
    const _Scene_Menu_create = Scene_Menu.prototype.create;
    Scene_Menu.prototype.create = function() {
        _Scene_Menu_create.call(this);
        this.createHintSprite();
    };

    Scene_Menu.prototype.createHintSprite = function() {
        this._hintSprite = new Sprite_HintCoin();
        this.addChild(this._hintSprite);
    };

    function Sprite_HintCoin() {
        this.initialize(...arguments);
    }

    Sprite_HintCoin.prototype = Object.create(Sprite.prototype);
    Sprite_HintCoin.prototype.constructor = Sprite_HintCoin;

    Sprite_HintCoin.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this.bitmap = ImageManager.loadCharacter("hint coin");
        this.anchor.x = 0.5;
        this.anchor.y = 0.5;
        this.x = Graphics.width / 2;
        this.y = Graphics.height / 2 - 50; // Move up slightly to make room for box
        
        this._frameWidth = 144;
        this._frameHeight = 144;
        this._maxFrames = 14;
        this._index = 0;
        this._waitCount = 0;
        this._loopCount = 0;
        this._isPlaying = false;
        this._displayTimer = 0; // Timer for the 5-second fade
        
        this.visible = false;
        
        // Create the Text Box (Background)
        this._textBox = new Sprite(new Bitmap(600, 80));
        this._textBox.anchor.x = 0.5;
        this._textBox.y = 100; 
        this.addChild(this._textBox);
    };

    Sprite_HintCoin.prototype.startAnimation = function(success, text) {
        this._isSuccess = success;
        this._finalText = success ? text : "Sorry, no hint for you!";
        this._index = 0;
        this._waitCount = 0;
        this._loopCount = 0;
        this._displayTimer = 0; 
        this._isPlaying = true;
        this.visible = true;
        this.opacity = 255;
        this._textBox.bitmap.clear();
        this.updateFrame();
    };

    Sprite_HintCoin.prototype.update = function() {
        Sprite.prototype.update.call(this);
        if (this._isPlaying) {
            this.updateAnimation();
        } else if (this.visible) {
            this.updateDisplayTimer();
        }
    };

    Sprite_HintCoin.prototype.updateAnimation = function() {
        this._waitCount++;
        if (this._waitCount >= 6) {
            this._waitCount = 0;
            this._index++;

            if (this._index >= this._maxFrames) {
                this._index = 0;
                this._loopCount++;
            }

            if (this._isSuccess) {
                if (this._loopCount >= 3) this.finishAnimation(0);
            } else {
                if (this._loopCount >= 3 && this._index === 7) this.finishAnimation(7);
            }
            this.updateFrame();
        }
    };

    Sprite_HintCoin.prototype.updateDisplayTimer = function() {
        this._displayTimer++;
        // 5 seconds * 60 FPS = 300 frames
        if (this._displayTimer > 300) {
            this.opacity -= 10; // Fade out effect
            if (this.opacity <= 0) {
                this.visible = false;
            }
        }
    };

    Sprite_HintCoin.prototype.finishAnimation = function(finalFrame) {
        this._isPlaying = false;
        this._index = finalFrame;
        this.showHintText(this._finalText);
    };

    Sprite_HintCoin.prototype.updateFrame = function() {
        this.setFrame(this._index * this._frameWidth, 0, this._frameWidth, this._frameHeight);
    };

    Sprite_HintCoin.prototype.showHintText = function(text) {
        const bitmap = this._textBox.bitmap;
        const w = bitmap.width;
        const h = bitmap.height;

        // Draw solid background box (Dark Gray/Black)
        bitmap.fillRect(0, 0, w, h, "rgba(0, 0, 0, 0.8)");
        // Draw a simple border
        bitmap.strokeRect(0, 0, w, h, "white");

        // Draw Text
        bitmap.fontFace = $gameSystem.mainFontFace();
        bitmap.fontSize = 24;
        bitmap.textColor = "white";
        bitmap.drawText(text, 10, 0, w - 20, h, "center");
    };

})();