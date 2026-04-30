/*:
 * @target MZ
 * @plugindesc 4x4 Sliding Puzzle - High Priority Click Logic.
 * @author Gemini
 *
 * @param StartX
 * @text Starting X (Top-Left)
 * @type number
 * @min 0
 * @desc The X coordinate of the top-left slot.
 * @default 0
 *
 * @param StartY
 * @text Starting Y (Top-Left)
 * @type number
 * @min 0
 * @desc The Y coordinate of the top-left slot.
 * @default 0
 *
 * @param WinSwitch
 * @text Win Switch ID
 * @type switch
 * @desc This switch turns ON when solved.
 * @default 1
 *
 * @help
 * Tag events <Puzzle:1> through <Puzzle:15> and <Puzzle:0>.
 * This version forces the game to ignore player pathfinding 
 * when a puzzle piece is clicked.
 */

var SlidingPuzzle = SlidingPuzzle || {};

(function() {
    const params = PluginManager.parameters('SlidingPuzzle');
    const startX = Number(params['StartX'] || 0);
    const startY = Number(params['StartY'] || 0);
    const winSwitch = Number(params['WinSwitch'] || 1);

    // Override the Map Touch behavior
    const _Scene_Map_processMapTouch = Scene_Map.prototype.processMapTouch;
    Scene_Map.prototype.processMapTouch = function() {
        if (TouchInput.isTriggered()) {
            const tx = $gameMap.canvasToMapX(TouchInput.x);
            const ty = $gameMap.canvasToMapY(TouchInput.y);

            const events = $gameMap.eventsXy(tx, ty);
            const target = events.find(e => e && e.event().meta.Puzzle && e.event().meta.Puzzle !== "0");

            if (target) {
                // We found a piece! Kill the player's movement immediately.
                $gameTemp.clearDestination();
                SlidingPuzzle.Move(target.eventId());
                // Stop the rest of the map touch logic so the player doesn't move.
                return; 
            }
        }
        // If no puzzle piece was clicked, carry on with normal movement logic.
        _Scene_Map_processMapTouch.call(this);
    };

    SlidingPuzzle.Move = function(clickedId) {
        const clickedEv = $gameMap.event(clickedId);
        const emptyEv = $gameMap.events().find(e => e && e.event().meta.Puzzle === "0");

        if (!emptyEv) return;

        const dx = Math.abs(clickedEv.x - emptyEv.x);
        const dy = Math.abs(clickedEv.y - emptyEv.y);

        if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
            const oldX = clickedEv.x;
            const oldY = clickedEv.y;

            clickedEv.locate(emptyEv.x, emptyEv.y);
            emptyEv.locate(oldX, oldY);

            AudioManager.playSe({ name: 'Cursor1', pan: 0, pitch: 100, volume: 90 });
            this.CheckWin();
        }
    };

    SlidingPuzzle.CheckWin = function() {
        let isWin = true;
        for (let i = 1; i <= 15; i++) {
            const ev = $gameMap.events().find(e => e && e.event().meta.Puzzle === String(i));
            const targetX = startX + ((i - 1) % 4);
            const targetY = startY + Math.floor((i - 1) / 4);

            if (!ev || ev.x !== targetX || ev.y !== targetY) {
                isWin = false;
                break;
            }
        }

        if (isWin) {
            $gameSwitches.setValue(winSwitch, true);
        }
    };
})();