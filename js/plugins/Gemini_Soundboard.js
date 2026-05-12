/*:
 * @target MZ
 * @plugindesc Prevents movement when clicking events with the <soundboard> tag.
 * @author Gemini
 * 
 * @help 
 * Add <soundboard> to the Note field of any event. 
 * When clicked, the event will trigger, but the player will not move.
 */

(() => {
    const _Scene_Map_processMapTouch = Scene_Map.prototype.processMapTouch;
    Scene_Map.prototype.processMapTouch = function() {
        if (TouchInput.isTriggered() || TouchInput.isPressed()) {
            const x = $gameMap.canvasToMapX(TouchInput.x);
            const y = $gameMap.canvasToMapY(TouchInput.y);
            
            // Check if there is a soundboard event at the clicked location
            const targets = $gameMap.eventsXy(x, y);
            const hasSoundboard = targets.some(event => event.event().note.includes("<soundboard>"));

            if (hasSoundboard) {
                // Trigger the events at that location
                targets.forEach(event => {
                    if (event.event().note.includes("<soundboard>")) {
                        event.start();
                    }
                });
                // Clear the destination so the player doesn't move
                $gameTemp.clearDestination();
                return; 
            }
        }
        _Scene_Map_processMapTouch.call(this);
    };
})();