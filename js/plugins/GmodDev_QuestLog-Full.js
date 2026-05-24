/*:
 * @target MZ
 * @plugindesc Quest Log Plugin Full - Managed quests with interactive popups, hints, and dynamic updates (Popup Confirm Delay Fix)
 * @license MIT License with Itch.io Restrictions
 * @author Low & Assistant
 *
 * @param MenuButtonIcon
 * @text Menu Button Icon
 * @type number
 * @desc The icon index for the quest log menu button. Leave empty or set to 0 to not show an icon.
 * @default 0
 *
 * @param HintFaceImage
 * @text Hint Face Image
 * @type file
 * @dir img/faces/
 * @desc The face graphic file to show alongside hint messages.
 * @default Actor1
 *
 * @param HintFaceIndex
 * @text Hint Face Index
 * @type number
 * @desc The index of the face inside the face image file (0 to 7).
 * @default 0
 *
 * @param PopupOpacity
 * @text Popup Background Opacity
 * @type number
 * @min 0
 * @max 255
 * @desc The opacity of the popup window background. 255 is completely solid full color, 0 is fully transparent.
 * @default 255
 *
 * @param PopupDelay
 * @text Popup Dismiss Delay (Frames)
 * @type number
 * @min 0
 * @desc The number of frames the popup must remain on screen before the player can dismiss it.
 * @default 120
 *
 * @command AddQuest
 * @text Add Quest
 * @desc Adds a new quest to the quest log.
 *
 * @arg id
 * @text Quest ID
 * @type string
 * @desc Unique quest ID
 *
 * @arg title
 * @text Title
 * @type string
 * @desc Title of the quest
 *
 * @arg description
 * @text Description
 * @type multiline_string
 * @desc Detailed description of the quest
 *
 * @arg hint
 * @text Hint Text
 * @type multiline_string
 * @desc Hint provided to the player when the hint button is pressed.
 * @default No hints available for this quest.
 *
 * @arg giver
 * @text Giver
 * @type string
 * @default Unknown
 * @desc Name of the NPC giving the quest
 *
 * @arg area
 * @text Area
 * @type string
 * @default Unknown
 * @desc Area or location of the quest
 *
 * @command UpdateQuestStatus
 * @text Update Quest Status
 * @desc Updates the status, description, or hint of an existing quest.
 *
 * @arg id
 * @text Quest ID
 * @type string
 * @desc The quest ID to update
 *
 * @arg status
 * @text Status
 * @type select
 * @option Ongoing
 * @option Completed
 * @default Ongoing
 * @desc New status for the quest
 *
 * @arg description
 * @text New Description (Optional)
 * @type multiline_string
 * @desc Update the description text. Leave blank to keep the current description.
 *
 * @arg hint
 * @text New Hint Text (Optional)
 * @type multiline_string
 * @desc Update the hint text. Leave blank to keep the current hint.
 *
 * @command ShowQuestPopup
 * @text Show Quest Pop-up
 * @desc Displays a mid-screen announcement pop-up for a quest.
 *
 * @arg id
 * @text Quest ID
 * @type string
 * @desc The ID of the quest you want to feature in the pop-up.
 *
 * @arg popupText
 * @text Announcement Text
 * @type string
 * @default New quest! See the log for details
 * @desc The header message displayed at the top of the window.
 *
 * @command OpenQuestLog
 * @text Open Quest Log
 * @desc Opens the quest log scene.
 *
 * @help
 * ============================================================================
 * Quest Logs | https://github.com/gmoddev
 * ============================================================================
 * Support for forced layout view durations prior to user dismiss updates.
 * ============================================================================
 */
(() => {
    const esvihed = _0x12(0);
    const rmpwq = PluginManager.parameters(esvihed);
    const xgkjc = rmpwq[_0x12(1)] || _0x12(2);
    
    const faceImageParam = rmpwq["HintFaceImage"] || "Actor1";
    const faceIndexParam = Number(rmpwq["HintFaceIndex"]) || 0;
    const popupOpacityParam = rmpwq["PopupOpacity"] !== undefined ? Number(rmpwq["PopupOpacity"]) : 255;
    const popupDelayParam = rmpwq["PopupDelay"] !== undefined ? Number(rmpwq["PopupDelay"]) : 120;

    function getQuestArray() {
        if (!$gameSystem) return [];
        if (!$gameSystem._questLogData) {
            $gameSystem._questLogData = [];
        }
        return $gameSystem._questLogData;
    }

    function nfbvsk(a, b, c, d, e, f, h = _0x12(3)) {
        const bgpfv = getQuestArray();
        const existingIdx = bgpfv.findIndex(q => q.id === a);
        const dvhct = { id: a, title: b, description: c, hint: d, giver: e, area: f, status: h };
        
        if (existingIdx > -1) {
            bgpfv[existingIdx] = dvhct;
        } else {
            bgpfv.push(dvhct);
        }
        qosrt();
    }

    function qosrt() {
        const bgpfv = getQuestArray();
        bgpfv.sort((g, h) => {
            if (g.status === _0x12(4) && h.status !== _0x12(4)) return 1;
            if (g.status !== _0x12(4) && h.status === _0x12(4)) return -1;
            return 0;
        });
    }

    PluginManager.registerCommand(esvihed, _0x12(5), (args) => {
        nfbvsk(
            args.id,
            args.title,
            args.description,
            args.hint || "No hints available for this quest.",
            args.giver || _0x12(6),
            args.area || _0x12(6)
        );
    });

    PluginManager.registerCommand(esvihed, _0x12(7), (args) => {
        const xjdfe = args.id;
        const nqeps = args.status;
        const bgpfv = getQuestArray();
        const pncvk = bgpfv.find((q) => q.id === xjdfe);
        
        if (pncvk) {
            pncvk.status = nqeps;
            if (args.description && args.description.trim() !== "") {
                pncvk.description = args.description;
            }
            if (args.hint && args.hint.trim() !== "") {
                pncvk.hint = args.hint;
            }
            qosrt();
        }
    });

    PluginManager.registerCommand(esvihed, "ShowQuestPopup", (args) => {
        const bgpfv = getQuestArray();
        const targetQuest = bgpfv.find(q => q.id === args.id);
        if (targetQuest && SceneManager._scene) {
            SceneManager._scene.showCustomQuestPopup(args.popupText, targetQuest);
        }
    });

    PluginManager.registerCommand(esvihed, _0x12(14), () => {
        SceneManager.push(XqzScene);
    });

    const _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        
        if ($gameSystem && $gameSystem._questPopupLockFrames > 0) {
            $gameSystem._questPopupLockFrames--;
        }

        if (this._questPopupWin && this._questPopupWin.isOpen() && this._questPopupWin.active) {
            // Tick down the active display delay restriction timer
            if (this._questPopupWin._delayFrames > 0) {
                this._questPopupWin._delayFrames--;
            } else {
                // Only register closing buttons if the display delay has bottomed out to zero
                if (Input.isTriggered("ok") || Input.isTriggered("cancel") || TouchInput.isTriggered()) {
                    SoundManager.playOk();
                    this._questPopupWin.close();
                    this._questPopupWin.deactivate();
                    if ($gameSystem) $gameSystem._questPopupLockFrames = 30;
                }
            }
        }
    };

    const _Game_Player_canMove = Game_Player.prototype.canMove;
    Game_Player.prototype.canMove = function() {
        if ($gameSystem && $gameSystem._questPopupLockFrames > 0) {
            return false;
        }
        return _Game_Player_canMove.call(this);
    };

    Scene_Base.prototype.showCustomQuestPopup = function(announcement, quest) {
        if (!this._questPopupWin) {
            const width = 500;
            const height = 260;
            const x = (Graphics.boxWidth - width) / 2;
            const y = (Graphics.boxHeight - height) / 2;
            const rect = new Rectangle(x, y, width, height);
            this._questPopupWin = new Window_QuestPopup(rect);
            this.addWindow(this._questPopupWin);
        }
        this._questPopupWin.setup(announcement, quest);
    };

    class Window_QuestPopup extends Window_Base {
        initialize(rect) {
            super.initialize(rect);
            this.openness = 0;
            this.active = false;
            this._delayFrames = 0;
        }
        updateBackgroundOpacity() {
            this.setBackgroundType(0);
            this.opacity = popupOpacityParam;
        }
        setup(announcement, quest) {
            this.contents.clear();
            this.updateBackgroundOpacity();
            const lh = this.lineHeight();
            
            // Set up the internal un-skippable dismiss window lock frame timer
            this._delayFrames = popupDelayParam;

            this.changeTextColor(ColorManager.systemColor());
            this.drawText(announcement, 0, 0, this.contentsWidth(), "center");
            this.drawShapeLine(lh + 5);

            this.resetTextColor();
            this.contents.fontBold = true;
            this.drawText(quest.title, 0, lh * 1.5, this.contentsWidth(), "center");
            this.contents.fontBold = false;

            const descY = lh * 3;
            this.changeTextColor(ColorManager.normalColor());
            this.contents.fontSize = 20;
            
            const parsedDesc = this.convertEscapeCharacters(quest.description);
            const words = parsedDesc.split(" ");
            let line = "";
            let currentY = descY;
            
            words.forEach(word => {
                let testLine = line + word + " ";
                if (this.textWidth(testLine) > this.contentsWidth() - 20) {
                    this.drawText(line.trim(), 10, currentY, this.contentsWidth() - 20, "left");
                    line = word + " ";
                    currentY += 24;
                } else {
                    line = testLine;
                }
            });
            this.drawText(line.trim(), 10, currentY, this.contentsWidth() - 20, "left");
            
            this.open();
            this.activate();
        }
        drawShapeLine(y) {
            const width = this.contentsWidth();
            this.contents.fillRect(10, y, width - 20, 2, ColorManager.normalColor());
        }
    }

    class Window_QuestHintPopup extends Window_Base {
        initialize(rect) {
            super.initialize(rect);
            this.openness = 0;
            this.active = false;
            this.loadFaceImage();
        }
        loadFaceImage() {
            ImageManager.loadFace(faceImageParam);
        }
        setup(quest) {
            this.contents.clear();
            this.drawFace(faceImageParam, faceIndexParam, 0, 10, 144, 144);
            
            const textX = 165;
            const lh = 32;
            
            this.contents.fontSize = 20;
            this.changeTextColor(ColorManager.systemColor());
            this.drawText("Hint Details:", textX, 12, this.contentsWidth() - textX, "left"); 
            
            this.changeTextColor(ColorManager.normalColor());
            const textHint = quest.hint || "No clues available.";
            
            const parsedHint = this.convertEscapeCharacters(textHint);
            const words = parsedHint.split(" ");
            let currentLine = "";
            let currentY = lh + 24;
            
            words.forEach(word => {
                if (currentLine === "") {
                    currentLine = word;
                } else {
                    if (this.textWidth(currentLine + " " + word) > this.contentsWidth() - textX - 10) {
                        this.drawText(currentLine, textX, currentY, this.contentsWidth() - textX, "left");
                        currentLine = word;
                        currentY += lh;
                    } else {
                        currentLine += " " + word;
                    }
                }
            });
            
            if (currentLine !== "") {
                this.drawText(currentLine, textX, currentY, this.contentsWidth() - textX, "left");
            }
            
            this.open();
            this.activate();
        }
    }

    class XqzList extends Window_Selectable {
        initialize(rect) {
            super.initialize(rect);
            this.refresh();
            this.select(0);
            this.activate();
        }
        maxItems() { return getQuestArray().length; }
        drawItem(idx) {
            const cptjk = getQuestArray()[idx];
            const jhvis = this.itemLineRect(idx);
            this.changePaintOpacity(cptjk.status !== _0x12(4));
            this.drawText(cptjk.title, jhvis.x, jhvis.y, jhvis.width);
            this.changePaintOpacity(true);
        }
        currentQuest() { return getQuestArray()[this.index()]; }
        refresh() {
            this.contents.clear();
            this.drawAllItems();
        }
        select(index) {
            super.select(index);
            if (SceneManager._scene && SceneManager._scene._questDetailsWindow) {
                SceneManager._scene._questDetailsWindow.setQuest(this.currentQuest());
            }
        }
    }

    class XqzDetail extends Window_Base {
        initialize(rect) {
            super.initialize(rect);
            this._quest = null;
            this._buttonRect = null;
            this.setQuest(null);
        }
        setQuest(q) {
            this._quest = q;
            this.refresh();
        }
        refresh() {
            this.contents.clear();
            this._buttonRect = null;
            this.resetFontSettings();

            if (this._quest) {
                const lnH = this.lineHeight();
                const maxW = this.contentsWidth() - this.padding * 2;

                const parsedTitle = this.convertEscapeCharacters(this._quest.title);
                const parsedGiver = this.convertEscapeCharacters(_0x12(9) + this._quest.giver);
                const parsedArea = this.convertEscapeCharacters(_0x12(11) + this._quest.area);

                this.drawText(parsedTitle, 0, 0, maxW, _0x12(8));
                this.drawText(parsedGiver, 0, lnH, maxW, _0x12(10));
                this.drawText(parsedArea, 0, lnH * 2, maxW, _0x12(10));

                this.resetFontSettings();
                const dY = lnH * 4;
                const dText = this._quest.description;
                const wrapped = this.convertTextToWrapped(dText, maxW);
                this.drawWrappedText(wrapped, dY, maxW);

                this.resetFontSettings();
                this.drawText(_0x12(12) + this._quest.status, 0, this.contentsHeight() - lnH, maxW, _0x12(10));
                
                if (this._quest.hint && this._quest.hint.trim() !== "") {
                    this.drawInlineHintButton();
                }
            }
        }
        convertTextToWrapped(txt, maxW) {
            const arr = [];
            const parsedTxt = this.convertEscapeCharacters(txt);
            const words = parsedTxt.split(" ");
            let ln = "";
            words.forEach(word => {
                const testLn = ln + word + " ";
                const testWidth = this.textWidth(testLn);
                if (testWidth > maxW && ln) {
                    arr.push(ln.trim());
                    ln = word + " ";
                } else {
                    ln = testLn;
                }
            });
            if (ln) arr.push(ln.trim());
            return arr;
        }
        drawWrappedText(wrapped, startY, maxW) {
            this._lastTextY = startY;
            const lnH = this.lineHeight();
            this.contents.fontSize = $gameSystem.mainFontSize ? $gameSystem.mainFontSize() : 26; 
            
            for (let i = 0; i < wrapped.length; i++) {
                const line = wrapped[i];
                if (this._lastTextY + lnH < this.contentsHeight() - lnH * 2) {
                    this.drawText(line, 0, this._lastTextY, maxW, "left");
                    this._lastTextY += lnH; 
                } else {
                    this.drawText(_0x12(13), 0, this._lastTextY, maxW, "left");
                    break;
                }
            }
        }
        drawInlineHintButton() {
            const btnW = 160;
            const btnH = 36;
            const btnX = (this.contentsWidth() - btnW) / 2;
            const btnY = Math.min(this._lastTextY + 20, this.contentsHeight() - this.lineHeight() * 2.5);

            this._buttonRect = {
                x: this.x + this.padding + btnX,
                y: this.y + this.padding + btnY,
                width: btnW,
                height: btnH
            };

            this.contents.strokeRect(btnX, btnY, btnW, btnH, ColorManager.normalColor());
            this.contents.fontSize = 20;
            this.drawText("Hint", btnX, btnY - 2, btnW, "center");
        }
        update() {
            super.update();
            if (this.visible && this._buttonRect && TouchInput.isTriggered()) {
                const tx = TouchInput.x;
                const ty = TouchInput.y;
                if (tx >= this._buttonRect.x && tx <= this._buttonRect.x + this._buttonRect.width &&
                    ty >= this._buttonRect.y && ty <= this._buttonRect.y + this._buttonRect.height) {
                    if (SceneManager._scene && typeof SceneManager._scene.onExecuteHintPopup === "function") {
                        SoundManager.playOk();
                        SceneManager._scene.onExecuteHintPopup();
                    }
                }
            }
        }
    }

    class XqzScene extends Scene_MenuBase {
        create() {
            super.create();
            this.createQuestListWindow();
            this.createQuestDetailsWindow();
            this.createHintPopupSubWindow();
        }
        start() {
            super.start();
            this._questListWindow.activate();
            if (getQuestArray().length > 0) {
                const initialQuest = getQuestArray()[0];
                this._questDetailsWindow.setQuest(initialQuest);
            }
        }
        update() {
            super.update();
            if (this._hintPopupWin && this._hintPopupWin.isOpen() && this._hintPopupWin.active) {
                if (Input.isTriggered("ok") || Input.isTriggered("cancel") || TouchInput.isTriggered()) {
                    SoundManager.playCancel();
                    this._hintPopupWin.close();
                    this._hintPopupWin.deactivate();
                    this._questListWindow.activate();
                }
            }
        }
        createQuestListWindow() {
            const rect = this.questListWindowRect();
            this._questListWindow = new XqzList(rect);
            this._questListWindow.setHandler("ok", this.onQuestSelect.bind(this));
            this._questListWindow.setHandler("cancel", this.popScene.bind(this));
            this.addWindow(this._questListWindow);
        }
        createQuestDetailsWindow() {
            const rect = this.questDetailsWindowRect();
            this._questDetailsWindow = new XqzDetail(rect);
            this.addWindow(this._questDetailsWindow);
        }
        createHintPopupSubWindow() {
            const width = 600;
            const height = 220;
            const x = (Graphics.boxWidth - width) / 2;
            const y = (Graphics.boxHeight - height) / 2;
            const rect = new Rectangle(x, y, width, height);
            this._hintPopupWin = new Window_QuestHintPopup(rect);
            this.addWindow(this._hintPopupWin);
        }
        questListWindowRect() {
            const w = Graphics.boxWidth / 3;
            const h = Graphics.boxHeight - 100;
            const x = 20;
            const y = 60;
            return new Rectangle(x, y, w, h);
        }
        questDetailsWindowRect() {
            const w = (Graphics.boxWidth / 3) * 2 - 40;
            const h = Graphics.boxHeight - 100;
            const x = Graphics.boxWidth / 3 + 40;
            const y = 60;
            return new Rectangle(x, y, w, h);
        }
        onQuestSelect() {
            this._questListWindow.activate();
        }
        onExecuteHintPopup() {
            const q = this._questListWindow.currentQuest();
            if (q && q.hint && q.hint.trim() !== "") {
                this._questListWindow.deactivate();
                this._hintPopupWin.setup(q);
            }
        }
    }

    function cKpO() {
        const qCmd = {
            Symbol: _0x12(15),
            Subcategory: "",
            Icon: Number(rmpwq["MenuButtonIcon"]) || 165,
            TextStr: xgkjc,
            TextJS: "return '" + xgkjc + "';",
            ShowJS: "return true;",
            EnableJS: "return true;",
            ExtJS: "return null;",
            CallHandlerJS: "SceneManager.push(XqzScene);",
            PersonalHandlerJS: "const ext = arguments[0];"
        };

        if (typeof VisuMZ !== "undefined" && VisuMZ.MainMenuCore && VisuMZ.MainMenuCore._commands) {
            const cmds = VisuMZ.MainMenuCore._commands;
            const exists = cmds.some(cmd => cmd.Symbol === qCmd.Symbol);
            if (!exists) {
                cmds.push(qCmd);
            }
        } else {
            Window_MenuCommand.prototype.addOriginalCommands = function() {
                this.addCommand(xgkjc, _0x12(15), true);
            };
            const _scCmdWin = Scene_Menu.prototype.createCommandWindow;
            Scene_Menu.prototype.createCommandWindow = function() {
                _scCmdWin.call(this);
                this._commandWindow.setHandler(_0x12(15), () => {
                    SceneManager.push(XqzScene);
                });
            };
        }
    }

    cKpO();

    function _0x12(index) {
        const _0x34 = [
            "GmodDev_QuestLog-Full", 
            "Quest Log Name",          
            "Quests",                  
            "Ongoing",                 
            "Completed",               
            "AddQuest",                
            "Unknown",                 
            "UpdateQuestStatus",       
            "center",                  
            "From: ",                  
            "left",                    
            "Area: ",                  
            "Status: ",                
            "... [Scroll for more]",   
            "OpenQuestLog",            
            "questLog"                 
        ];
        return _0x34[index];
    }
})();