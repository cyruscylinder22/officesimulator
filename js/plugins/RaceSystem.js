/*:
 * @target MZ
 * @plugindesc A complete racing system to pit the player against an NPC with native move-routing for accurate event speed. Fixes engine speed limitations and routing overrides.
 * @author Custom AI Collaborator
 *
 * @help RaceSystem.js
 * * This plugin allows you to easily set up a race against an NPC with checkpoint
 * verification to prevent player cheating.
 *
 * ============================================================================
 * Outcome Variable Values:
 * ============================================================================
 * When the race finishes, your designated Outcome Variable will be set to:
 * 1 = Player Won Fairly
 * 2 = NPC Won (Player Lost)
 * 3 = Player Cheated
 *
 * @command startRace
 * @text Start Race
 * @desc Setup and begin the race tracker.
 *
 * @arg npcEventId
 * @text NPC Event ID
 * @type number
 * @desc The ID of the NPC event racing the player.
 * @default 1
 *
 * @arg npcSpeed
 * @text NPC Race Speed
 * @type select
 * @option 1: X2 Slower
 * @value 1
 * @option 2: Slower
 * @value 2
 * @option 3: Normal
 * @value 3
 * @option 4: Faster
 * @value 4
 * @option 5: X2 Faster
 * @value 5
 * @option 6: X4 Faster (Uncapped)
 * @value 6
 * @option 7: Ultra Fast (Uncapped)
 * @value 7
 * @default 4
 *
 * @arg postRaceSpeed
 * @text NPC Post-Race Speed
 * @type select
 * @desc The exact speed the NPC will shift to immediately after passing the finish line.
 * @option 1: X2 Slower
 * @value 1
 * @option 2: Slower
 * @value 2
 * @option 3: Normal
 * @value 3
 * @option 4: Faster
 * @value 4
 * @option 5: X2 Faster
 * @value 5
 * @default 3
 *
 * @arg postRaceFreq
 * @text NPC Post-Race Frequency
 * @type select
 * @desc The movement frequency (delays between movement steps) after the race finishes.
 * @option 1: Lowest
 * @value 1
 * @option 2: Lower
 * @value 2
 * @option 3: Normal
 * @value 3
 * @option 4: Higher
 * @value 4
 * @option 5: Highest
 * @value 5
 * @default 3
 *
 * @arg defeatText
 * @text Defeat Text Banner
 * @type string
 * @desc The text displayed on screen when the NPC beats the player across the finish line.
 * @default Your competitor has won!
 *
 * @arg timerVariable
 * @text Time Record Variable
 * @type variable
 * @desc The Variable ID where the player's final time (in seconds) will be saved.
 * @default 1
 *
 * @arg outcomeVariable
 * @text Race Outcome Variable
 * @type variable
 * @desc Saved variable value: 1 = Win, 2 = Loss, 3 = Cheat. Use this for Conditional Branches.
 * @default 2
 *
 * @arg finishRegion
 * @text Finish Line Region ID
 * @type number
 * @desc The region ID representing the finish line.
 * @default 5
 *
 * @arg check1
 * @text Checkpoint 1 Region ID
 * @type number
 * @desc First region the player must cross.
 * @default 1
 *
 * @arg check2
 * @text Checkpoint 2 Region ID
 * @type number
 * @desc Second region the player must cross.
 * @default 2
 *
 * @arg check3
 * @text Checkpoint 3 Region ID
 * @type number
 * @desc Third region the player must cross.
 * @default 3
 *
 * @arg check4
 * @text Checkpoint 4 Region ID
 * @type number
 * @desc Fourth region the player must cross.
 * @default 4
 *
 * @arg npcDestinations
 * @text NPC Waypoints (X,Y)
 * @type string[]
 * @desc Exactly 4 coordinates for the NPC to move to sequentially. Format: X,Y (e.g. 12,5)
 * @default ["0,0", "0,0", "0,0", "0,0"]
 *
 * @arg winBgm
 * @text Victory BGM
 * @type file
 * @dir audio/bgm/
 * @desc BGM that plays when the player wins fairly.
 *
 * @arg loseBgm
 * @text Defeat BGM
 * @type file
 * @dir audio/bgm/
 * @desc BGM that plays when the NPC wins.
 *
 * @arg cheatBgm
 * @text Cheating BGM
 * @type file
 * @dir audio/bgm/
 * @desc BGM that plays if the player hits the finish line without all checkpoints.
 *
 * @command stopRace
 * @text Stop Race
 * @desc Forcefully ends the race tracking immediately.
 */

(() => {
    const pluginName = "RaceSystem";

    let _raceActive = false;
    let _playerFinished = false;
    let _npcFinished = false;
    let _finishBannerSprite = null;

    let _npcEventId = 0;
    let _timerVariableId = 1;
    let _outcomeVariableId = 2;
    let _finishRegion = 0;
    let _checkpoints = [];
    let _npcWaypoints = [];
    let _currentNpcWaypointIdx = 0;
    
    let _playerCheckpointsHit = [false, false, false, false];
    let _startTime = 0;
    
    let _forcedNpcSpeed = null;
    let _postRaceSpeed = 3;
    let _postRaceFreq = 3;
    let _defeatTextString = "Your competitor has won!";

    // --- ENGINE SPEED SMOOTHING OVERRIDE ---
    const _Game_CharacterBase_distancePerFrame = Game_CharacterBase.prototype.distancePerFrame;
    Game_CharacterBase.prototype.distancePerFrame = function() {
        if (_raceActive && this instanceof Game_Event && this._eventId === _npcEventId && this._moveSpeed >= 6) {
            return (4 + (this._moveSpeed - 6) * 2) / 16;
        }
        return _Game_CharacterBase_distancePerFrame.call(this);
    };

    PluginManager.registerCommand(pluginName, "startRace", args => {
        _npcEventId = Number(args.npcEventId);
        _timerVariableId = Number(args.timerVariable);
        _outcomeVariableId = Number(args.outcomeVariable);
        _finishRegion = Number(args.finishRegion);
        _forcedNpcSpeed = Number(args.npcSpeed);
        
        _postRaceSpeed = Number(args.postRaceSpeed || 3);
        _postRaceFreq = Number(args.postRaceFreq || 3);
        _defeatTextString = String(args.defeatText || "Your competitor has won!");
        
        _checkpoints = [
            Number(args.check1),
            Number(args.check2),
            Number(args.check3),
            Number(args.check4)
        ];

        const rawWaypoints = JSON.parse(args.npcDestinations);
        _npcWaypoints = rawWaypoints.map(wp => {
            const split = wp.split(',');
            return { x: Number(split[0]), y: Number(split[1]) };
        });

        _currentNpcWaypointIdx = 0;
        _playerCheckpointsHit = [false, false, false, false];
        _playerFinished = false;
        _npcFinished = false;

        const npcEvent = $gameMap.event(_npcEventId);
        if (npcEvent) {
            npcEvent.setMoveSpeed(_forcedNpcSpeed);
            npcEvent.setMoveFrequency(5);
            
            const route = {
                list: [
                    { code: Game_Character.ROUTE_MOVE_SPEED, parameters: [_forcedNpcSpeed] },
                    { code: Game_Character.ROUTE_MOVE_FREQUENCY, parameters: [5] },
                    { code: Game_Character.ROUTE_END, parameters: [] }
                ],
                repeat: false,
                skippable: true,
                wait: false
            };
            npcEvent.forceMoveRoute(route);
        }

        $gameSystem._raceAudio = {
            win: { name: args.winBgm, volume: 90, pitch: 100, pan: 0 },
            lose: { name: args.loseBgm, volume: 90, pitch: 100, pan: 0 },
            cheat: { name: args.cheatBgm, volume: 90, pitch: 100, pan: 0 }
        };

        _startTime = Date.now();
        $gameVariables.setValue(_outcomeVariableId, 0);
        $gameVariables.setValue(_timerVariableId, 0); 
        _raceActive = true;
    });

    PluginManager.registerCommand(pluginName, "stopRace", () => {
        cleanUpRace();
    });

    function cleanUpRace() {
        _raceActive = false;
        _playerFinished = false;
        _npcFinished = false;
        _forcedNpcSpeed = null;
        
        const npcEvent = $gameMap ? $gameMap.event(_npcEventId) : null;
        if (npcEvent) {
            releaseNpcEvent(npcEvent);
        }
    }

    function releaseNpcEvent(npcEvent) {
        _forcedNpcSpeed = null;
        
        npcEvent.setMoveSpeed(_postRaceSpeed);
        npcEvent.setMoveFrequency(_postRaceFreq);

        const cleanRoute = {
            list: [
                { code: Game_Character.ROUTE_MOVE_SPEED, parameters: [_postRaceSpeed] },
                { code: Game_Character.ROUTE_MOVE_FREQUENCY, parameters: [_postRaceFreq] },
                { code: Game_Character.ROUTE_END, parameters: [] }
            ],
            repeat: false,
            skippable: true,
            wait: false
        };
        npcEvent.forceMoveRoute(cleanRoute);
        npcEvent._forcedMoveRoute = null;
        npcEvent.refresh(); 
    }

    const _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        if (_raceActive) {
            updateRaceLogic();
        }
        if (_finishBannerSprite) {
            updateBannerLogic();
        }
    };

    function updateRaceLogic() {
        if (!$gameMap || !$gamePlayer) return;

        // 1. Monitor Player Position
        if (!_playerFinished) {
            const playerX = $gamePlayer.x;
            const playerY = $gamePlayer.y;
            const playerRegion = $gameMap.regionId(playerX, playerY);

            for (let i = 0; i < _checkpoints.length; i++) {
                if (playerRegion === _checkpoints[i]) {
                    if (i === 0 || _playerCheckpointsHit[i - 1]) {
                        _playerCheckpointsHit[i] = true;
                    }
                }
            }

            if (playerRegion === _finishRegion) {
                _playerFinished = true;
                
                // FIXED: Changed rounding format from .toFixed(2) to .toFixed(1)
                const finalTime = ((Date.now() - _startTime) / 1000).toFixed(1);
                $gameVariables.setValue(_timerVariableId, Number(finalTime));

                // Only spawn player-centric triggers if player crossed first
                if (!_npcFinished) {
                    createFinishBanner("FINISH!");
                    const passedAll = _playerCheckpointsHit.every(hit => hit === true);
                    if (passedAll) {
                        $gameVariables.setValue(_outcomeVariableId, 1); // Win
                        playRaceBgm($gameSystem._raceAudio.win);
                    } else {
                        $gameVariables.setValue(_outcomeVariableId, 3); // Cheat
                        playRaceBgm($gameSystem._raceAudio.cheat);
                    }
                }
            }
        }

        // 2. Monitor NPC Position & Handle A* Smart Pathing 
        if (!_npcFinished) {
            const npcEvent = $gameMap.event(_npcEventId);
            if (npcEvent && _npcWaypoints.length > 0) {
                
                if (_forcedNpcSpeed !== null && npcEvent._moveSpeed !== _forcedNpcSpeed) {
                    npcEvent.setMoveSpeed(_forcedNpcSpeed);
                    npcEvent.setMoveFrequency(5);
                }

                const currentTarget = _npcWaypoints[_currentNpcWaypointIdx];
                
                // Waypoint checkpoint reached
                if (npcEvent.x === currentTarget.x && npcEvent.y === currentTarget.y) {
                    if (_currentNpcWaypointIdx < _npcWaypoints.length - 1) {
                        _currentNpcWaypointIdx++;
                    } else {
                        _npcFinished = true;
                        releaseNpcEvent(npcEvent);
                        
                        // FIXED: Spawn custom defeat banner text strictly when player loses
                        if (!_playerFinished) {
                            $gameVariables.setValue(_outcomeVariableId, 2); // Loss
                            playRaceBgm($gameSystem._raceAudio.lose);
                            createFinishBanner(_defeatTextString);
                        }
                    }
                }

                if (!npcEvent.isMoving() && !npcEvent.isJumping() && !_npcFinished) {
                    const nextTarget = _npcWaypoints[_currentNpcWaypointIdx];
                    const direction = npcEvent.findDirectionTo(nextTarget.x, nextTarget.y);
                    if (direction > 0) {
                        npcEvent.moveStraight(direction);
                    }
                }
            } else {
                _npcFinished = true; 
            }
        }

        if (_playerFinished && _npcFinished) {
            _raceActive = false;
        }
    }

    // FIXED: Banner constructor now accepts dynamic text strings
    function createFinishBanner(bannerText) {
        if (_finishBannerSprite) return; 

        // Dynamic box scale size to accommodate longer strings smoothly
        const width = Math.max(400, bannerText.length * 24);
        const height = 80;
        
        const bitmap = new Bitmap(width, height);
        bitmap.fontFace = $gameSystem.mainFontFace();
        bitmap.fontSize = 40; // Slightly reduced text scaling to ensure zero string clipping
        bitmap.fontBold = true;
        bitmap.textColor = "#FFFFFF";
        bitmap.outlineColor = "#000000";
        bitmap.outlineWidth = 5;
        bitmap.drawText(bannerText, 0, 0, width, height, "center");

        _finishBannerSprite = new Sprite(bitmap);
        _finishBannerSprite.x = (Graphics.width - width) / 2;
        _finishBannerSprite.y = (Graphics.height - height) / 2;
        _finishBannerSprite.anchor = new Point(0, 0);
        _finishBannerSprite.opacity = 255;
        _finishBannerSprite._displayDuration = 180; 

        SceneManager._scene.addChild(_finishBannerSprite);
    }

    function updateBannerLogic() {
        if (!_finishBannerSprite) return;

        if (_finishBannerSprite._displayDuration > 0) {
            _finishBannerSprite._displayDuration--;
        } else {
            _finishBannerSprite.opacity -= 8; 
            if (_finishBannerSprite.opacity <= 0) {
                SceneManager._scene.removeChild(_finishBannerSprite);
                _finishBannerSprite.bitmap.destroy();
                _finishBannerSprite = null;
            }
        }
    }

    function playRaceBgm(audioObj) {
        if (audioObj && audioObj.name) {
            AudioManager.playBgm(audioObj);
        }
    }
})();