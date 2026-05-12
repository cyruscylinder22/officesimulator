//============================================================================
// Eli_PlatformEvent.js
//============================================================================

/*:
@target MZ
@base EliMZ_Book
@orderAfter EliMZ_JumpSystem

@plugindesc ♦1.2.3♦ Transform events into platforms!
@author Hakuen Studio
@url https://hakuenstudio.itch.io/hakuen-studio-platform-events-for-rpg-maker-mv-mz

@help
★★★★★ Rate the plugin! Please, is very important to me ^^
● Terms of Use
https://www.hakuenstudio.com/terms-of-use-5-0-0

==============================================================================
Features
==============================================================================

● Turn events into platforms for the player to jump/walk on it.
● Set holes with region/terrain Ids.
● Play a common event when the player falls into a hole.
● You can make fixed, moving, carrying, or fixed falling platforms!

==============================================================================
How To Use
==============================================================================

https://docs.google.com/document/d/18kj6DTik_t4naqH3lnntif5HCoIA7MfNmaYdWy9Qosg/edit?usp=sharing

==============================================================================

@param opacityThreshold
@text Opacity Threshold
@type number
@min 0
@max 255
@desc If the opacity is equal or less than this value, the platform will be considered inactive.
@default 0

@param holeRegions
@text Hole Regions
@type text
@desc Set here the region ids that will be valid for platforms and holes.
@default

@param holeTerrains
@text Hole Terrains
@type text
@desc Set here the terrain ids that will be valid for platforms and holes.
@default

@param varSafePosX
@text Variable Safe Pos X
@type variable
@desc This variable will hold the last X position of the player before entering in a hole area.
@default 0

@param varSafePosY
@text Variable Safe Pos Y
@type variable
@desc This variable will hold the last Y position of the player before entering in a hole area.
@default 0

@param varLastPlatformId
@text Variable Last Event Id
@type variable
@desc The last platform(event) id the player was.
@default 0

@param fallDelay
@text Fall Delay
@type struct<fallDelaySt>
@desc How much time, in frames, the player can be off the platform before it triggers the fall.
@default {"1":"25","2":"20","3":"15","4":"10","5":"5","6":"5"}

@param fallCommonEvent
@text Fall Common Event
@type common_event
@desc Play this common event everytime the player fall off a platform.
@default 0

@param platformMaxHealth
@text Fall Platform Max Health
@type text
@desc How much time, in frames, the player can be above a fall platform before it falls.
@default 60

@param platformDangerHealth
@text Danger Health %
@type text
@desc The value in % of the max health that will point that the platform is close to fall.
@default 50
@parent platformMaxHealth

@command cmd_returnSafePos
@text Return Safe Position
@desc Return the player to the safe position.

@command cmd_restorePlatformHealth
@text Restore Platform Health
@desc

    @arg eventId
    @text Event Id
    @type text
    @desc
    @default 0


*/

/* ------------------------------ FALL DELAY ST ----------------------------- */
{

/*~struct~fallDelaySt:

@param 1
@text x8 Slower
@default 25

@param 2
@text x4 Slower
@default 20

@param 3
@text x2 Slower
@default 15

@param 4
@text Normal
@default 10

@param 5
@text x2 Faster
@default 5

@param 6
@text x4 Faster
@default 5

*/
}

"use strict"

var Eli = Eli || {}
var Imported = Imported || {}
Imported.Eli_MovingPlatform = true

/* ========================================================================== */
/*                                   PLUGIN                                   */
/* ========================================================================== */

Eli.PlatformEvent = {

    pro: true,
    fallDelay: 0,

    Parameters: class {

        constructor(parameters){
            this.opacityThreshold = Number(parameters.opacityThreshold) ?? 0
            this.holeRegions = (parameters.holeRegions || "-1").split(",").map(region => Number(region))
            this.holeTerrains = (parameters.holeTerrains || "-1").split(",").map(region => Number(region))
            this.varSafePosX = Number(parameters.varSafePosX)
            this.varSafePosY = Number(parameters.varSafePosY)
            this.varLastPlatformId = Number(parameters.varLastPlatformId)
            this.platformMaxHealth = Number(parameters.platformMaxHealth)
            this.platformDangerHealth = Number(parameters.platformDangerHealth)
            this.fallCommonEvent = Number(parameters.fallCommonEvent)
            this.fallDelay = this.parseFallDelayParameters(JSON.parse(parameters.fallDelay))
        }

        parseFallDelayParameters(param){
            return {
                1: Number(param["1"]),
                2: Number(param["2"]),
                3: Number(param["3"]),
                4: Number(param["4"]),
                5: Number(param["5"]),
                6: Number(param["6"]),
            } 
        }
    },

    initialize(){
        this.initParameters()
        this.initPluginCommands()
    },

    initParameters(){
        const parameters = PluginManager.parameters("EliMZ_PlatformEventPro")
        this.parameters = new this.Parameters(parameters)
        this.fallDelay = this.getParam().fallDelay[3]
    },

    initPluginCommands(){
        const commands = ["cmd_returnSafePos", "cmd_restorePlatformHealth"]
        Eli.PluginManager.registerCommands(this, commands)
    },

    getParam(){
        return this.parameters
    },

    cmd_returnSafePos(args){
        $gamePlayer.goToSafePosition()
        $gamePlayer.isFalling = false
    },

    cmd_restorePlatformHealth(args){
        const eventId = Number(args.eventId) || Eli.PluginManager.currentEventId
        const event = $gameMap.event(eventId)

        if(event){
            event.platformHealth.current = event.platformHealth.max
        }
    }, 
}

{

const Plugin = Eli.PlatformEvent
const Alias = {}

Plugin.initialize()

/* -------------------------------- GAME MAP -------------------------------- */
Alias.Game_Map_setupEvents = Game_Map.prototype.setupEvents
Game_Map.prototype.setupEvents = function() {
    this.platformEventIds = []
    Alias.Game_Map_setupEvents.call(this)
}

Game_Map.prototype.getPlatformEventIds = function() {
    return this.platformEventIds
}

/* --------------------------- GAME CHARACTER BASE -------------------------- */
Game_CharacterBase.prototype.willBeOnHoleTile = function(x, y){
    const terrainTag = $gameMap.terrainTag(x, y)
    const regionId = $gameMap.regionId(x, y)

    return  Plugin.getParam().holeTerrains.includes(terrainTag) || 
            Plugin.getParam().holeRegions.includes(regionId)
}

Game_CharacterBase.prototype.isOnHoleTile = function(){
    return (this.isOnHoleTerrain() || this.isOnHoleRegion())
}

Game_CharacterBase.prototype.isOnHoleTerrain = function(){
    return Plugin.getParam().holeTerrains.includes(this.terrainTag())
}

Game_CharacterBase.prototype.isOnHoleRegion = function(){
    return Plugin.getParam().holeRegions.includes(this.regionId())
}

Game_CharacterBase.prototype.isOnPlatform = function(){
    return $gameMap.getPlatformEventIds().some(id => $gameMap.event(id).pos(this._x, this._y) && $gameMap.event(id).isActivePlatform())
}

Game_CharacterBase.prototype.willBeOnPlatform = function(x, y){
    return $gameMap.getPlatformEventIds().some(id => $gameMap.event(id).pos(x, y) && $gameMap.event(id).isActivePlatform())
}

/* ------------------------------- GAME PLAYER ------------------------------ */
Alias.Game_Player_initMembers = Game_Player.prototype.initMembers
Game_Player.prototype.initMembers = function() {
    Alias.Game_Player_initMembers.call(this)
    this.initPlatformMembers()
}

Game_Player.prototype.initPlatformMembers = function() {
    this.timeOnHole = 0
    this.isFalling = false
    this.carryPlatformId = 0
    this.safePosition = {x: -1, y: -1, isValid: false}
}

Alias.Game_Player_increaseSteps = Game_Player.prototype.increaseSteps
Game_Player.prototype.increaseSteps = function(){
    Alias.Game_Player_increaseSteps.call(this)
    this.refreshSafePosition()
}

Alias.Game_Player_setPosition = Game_Player.prototype.setPosition
Game_Player.prototype.setPosition = function(x, y) {
    Alias.Game_Player_setPosition.call(this, x, y)
    this.refreshSafePosition()
}

Game_Player.prototype.setSafePosition = function(){
    this.safePosition = {x: this._x, y: this._y, isValid: true}
    $gameVariables.setValue(Plugin.getParam().varSafePosX, this._x)
    $gameVariables.setValue(Plugin.getParam().varSafePosY, this._y)
}

Game_Player.prototype.refreshSafePosition = function(){
    if(!this.isOnHoleTile()){
        this.setSafePosition()
        Plugin.fallDelay = Plugin.getParam().fallDelay[3]
        this.isFalling = false
        this.carryPlatformId = 0
    }
}

Alias.Game_Player_update = Game_Player.prototype.update
Game_Player.prototype.update = function(active) {
    Alias.Game_Player_update.call(this, active)

    if(this.canUpdatePlatformSystem()){
        this.updatePlatformSystem()
    }
}

Game_Player.prototype.canUpdatePlatformSystem = function(){
    return !this.isJumping() && this.isOnHoleTile() && !this.isFalling
}

Game_Player.prototype.updatePlatformSystem = function(){
    const platform = this.findPlatformEvent()

    if(platform){
        Plugin.fallDelay = Plugin.getParam().fallDelay[platform.moveSpeed()]
        this.storeLastPlatformEventId(platform)
        
        if(platform.isFalling()){
            this.onPlatformFall()

        }else{
            this.timeOnHole = 0
        }
        
    }else if(this.canFall()){
        this.timeOnHole = 0
        this.onHoleFall(false)

    }else{
        this.timeOnHole++
    }
}

Game_Player.prototype.findPlatformEvent = function(){
    const id = $gameMap.getPlatformEventIds().find(id => $gameMap.event(id).pos(this._x, this._y) && $gameMap.event(id).isActivePlatform())

    return $gameMap.event(id)
}

Game_Player.prototype.storeLastPlatformEventId = function(platform){
    $gameVariables.setValue(Plugin.getParam().varLastPlatformId, platform.eventId())
}

Game_Player.prototype.canFall = function(){
    return this.timeOnHole >= Plugin.fallDelay
}

Game_Player.prototype.onPlatformFall = function(){
    this.isFalling = true
    this.timeOnHole = 0
}

Game_Player.prototype.onHoleFall = function(wasJumping){
    const commonEventId = Plugin.getParam().fallCommonEvent
    this.isFalling = true
    this.timeOnHole = 0
    
    if(wasJumping){
        this.onHoleFallWhenJumping(wasJumping)

    }else{
        $gameTemp.reserveCommonEvent(commonEventId)
    }
}

Game_Player.prototype.onHoleFallWhenJumping = function(){
    //const isReserved = $gameMap._commonEvents.some(event => event._commonEventId === commonEventId)
    
    //if(!isReserved){
        $gameMap._commonEvents.push(new Game_CommonEvent(Plugin.getParam().fallCommonEvent))
    //}
}

Game_Player.prototype.goToSafePosition = function(){
    if(this.safePosition.isValid){
        this.setPosition(this.safePosition.x, this.safePosition.y)

        for(const follower of this.followers()._data){
            follower.setPosition(this.safePosition.x, this.safePosition.y)
        }

        Plugin.fallDelay = Plugin.getParam().fallDelay[3]
    }
}

Alias.Game_Player_canPass = Game_Player.prototype.canPass
Game_Player.prototype.canPass = function(x, y, d){
    const x2 = $gameMap.roundXWithDirection(x, d)
    const y2 = $gameMap.roundYWithDirection(y, d)

    if(this.willBeOnPlatform(x2, y2) || this.willBeOnHoleTile(x2, y2)){
        return true

    }else if(this.isOnPlatform() && this.isMapPassable(x2, y2, d)){
        return true
    }

    return Alias.Game_Player_canPass.call(this, x, y, d)
}

Alias.Game_Player_updateJump = Game_Player.prototype.updateJump
Game_Player.prototype.updateJump = function(){
    Alias.Game_Player_updateJump.call(this)
    this.timeOnHole = 0
}

Alias.Game_Player_updateMove = Game_Player.prototype.updateMove
Game_Player.prototype.updateMove = function(){
    const x = this._x
    const y = this._y
    const realX = this._realX
    const realY = this._realY
    Alias.Game_Player_updateMove.call(this)

    if(this.isBeingCarryByPlatform()){
        this.updateMoveOnPlatform(x, y, realX, realY)
        this.updateDirectionOnPlatform()
    }
}

Game_Player.prototype.updateMoveOnPlatform = function(x, y, realX, realY){
    this._x = x
    this._y = y
    this._realX = realX
    this._realY = realY
}

Game_Player.prototype.updateDirectionOnPlatform = function(){
    const d = this.getInputDirection()

    if(d > 0){
        this.setDirection(d)
    }
}

Game_Player.prototype.isBeingCarryByPlatform = function(){
    return this.carryPlatformId > 0
}

Game_Player.prototype.carryPlatform = function(){
    return $gameMap.event(this.carryPlatformId)
}

/* ------------------------------- GAME EVENT ------------------------------- */
Alias.Game_Event_initMembers = Game_Event.prototype.initMembers
Game_Event.prototype.initMembers = function() {
    Alias.Game_Event_initMembers.call(this)
    this.initPlatformMembers()
}

Game_Event.prototype.initPlatformMembers = function() {
    const {platformMaxHealth, platformDangerHealth} = Plugin.getParam()

    this.platformHealth = {
        max: platformMaxHealth,
        current: platformMaxHealth,
        danger: (platformDangerHealth/100) * platformMaxHealth,
    }
}

Game_Event.prototype.parseMeta_FallPlatform = function(metaString){
    const [maxHealth, dangerHealth] = this.extractPlatformHealthData(metaString)

    this.platformHealth.max = maxHealth
    this.platformHealth.danger = dangerHealth
    this.platformHealth.current = maxHealth

    return metaString
}

Game_Event.prototype.extractPlatformHealthData = function(metaString){
    const data = metaString.split(",")
    const maxHealth = Number(data[0]) || Plugin.getParam().platformMaxHealth
    const rawDanger = Number(data[1]) || Plugin.getParam().platformDangerHealth
    const dangerHealth = (rawDanger/ 100) * maxHealth
    
    return [maxHealth, dangerHealth]
}

Game_Event.prototype.parseMeta_CarryPlatform = function(metaString){
    return Eli.String.removeSpaces(metaString.toLowerCase()) === "true"
}

Alias.Game_Event_afterSetupPage = Game_Event.prototype.afterSetupPage
Game_Event.prototype.afterSetupPage = function(){
    Alias.Game_Event_afterSetupPage.call(this)
    
    if(this.isPlatform()){

        if(!($gameMap.platformEventIds.includes(this.eventId()))){
            this.initializePlatform(this.eventId())
        }

        this.setupPlatform()
    }
}

Game_Event.prototype.initializePlatform = function(eventId){
    $gameMap.platformEventIds.push(eventId)
}

Game_Event.prototype.setupPlatform = function(){
    this.setThrough(true)
    this.setMoveFrequency(6)
    this.setPriorityType(0)

    if(this.isCarryPlatform()){
        this._trigger = 1 // Player touch
    }
}

Alias.Game_Event_update = Game_Event.prototype.update
Game_Event.prototype.update = function() {
    Alias.Game_Event_update.call(this)

    if(this.isFallPlatform()){
        this.updateFallPlatform()
    }
}

Game_Event.prototype.updateFallPlatform = function(){
    if(!this.platformSelfSwitchIsOn("B")){

        if(this.hasPlayerOnPlatform()){
            this.platformHealth.current = Math.max(this.platformHealth.current - 1, 0)
    
            if(this.isFalling()){
                this.turnPlatformSelfSwitchOn("B", true)
            }

        }else{
            this.platformHealth.current = Math.min(this.platformHealth.current + 1, this.platformHealth.max)
        }

        this.turnPlatformSelfSwitchOn("A", this.platformHealth.current <= this.platformHealth.danger)
    }
}

Game_Event.prototype.platformSelfSwitchIsOn = function(key){
    return $gameSelfSwitches.value([this._mapId, this.eventId(), key])
}

Game_Event.prototype.hasPlayerOnPlatform = function(){
    return $gamePlayer.pos(this._x, this._y) && !$gamePlayer.isJumping()
}

Game_Event.prototype.isFalling = function(){
    return this.platformHealth.current <= 0
}

Game_Event.prototype.turnPlatformSelfSwitchOn = function(key, flag){
    $gameSelfSwitches.setValue([this._mapId, this.eventId(), key], flag)
}

Game_Event.prototype.isNormalPlatform = function() {
    return this.metaEli.hasOwnProperty("NormalPlatform")
}

Game_Event.prototype.isFallPlatform = function() {
    return this.metaEli.hasOwnProperty("FallPlatform")
}

Game_Event.prototype.isCarryPlatform = function() {
    return this.metaEli.hasOwnProperty("CarryPlatform")
}

Game_Event.prototype.isColliderPlatform = function() {
    return this.metaEli.hasOwnProperty("ColliderPlatform")
}

Game_Event.prototype.isPlatform = function() {
    return this.isNormalPlatform() || this.isFallPlatform() || this.isCarryPlatform()
}

Game_Event.prototype.isActivePlatform = function() {
    return  this.isPlatform() && this.isPlatformVisible()
}

Game_Event.prototype.isPlatformVisible = function() {
    return (this.characterName().length > 0 || this.tileId() > 0) && this.opacity() > Plugin.getParam().opacityThreshold
}

Alias.Game_Event_start = Game_Event.prototype.start
Game_Event.prototype.start = function() {
    Alias.Game_Event_start.call(this)

    if(this.canStartCarryPlayer()){
        this.startCarryPlayer()
    }
}

Game_Event.prototype.canStartCarryPlayer = function() {
    return this._starting && this.isCarryPlatform()
}

Game_Event.prototype.startCarryPlayer = function() {
    $gamePlayer.carryPlatformId = this.eventId()
}

Game_Event.prototype.isCollidedWithPlatform = function(x, y) {
    return $gameMap.getPlatformEventIds().some(id => $gameMap.event(id).pos(x, y) && $gameMap.event(id).isColliderPlatform())
}

Alias.Game_Event_canPass = Game_Event.prototype.canPass
Game_Event.prototype.canPass = function(x, y, d){
    if(this.isActivePlatform()){

        const x2 = $gameMap.roundXWithDirection(x, d)
        const y2 = $gameMap.roundYWithDirection(y, d)

        if(this.isCollidedWithPlatform(x2, y2)){
            return false
        }

        if(this.willBeOnHoleTile(x2, y2)){
            return true
        }

        return false

    }else{

        return Alias.Game_Event_canPass.call(this, x, y, d)
    }
}

Alias.Game_Event_updateMove = Game_Event.prototype.updateMove
Game_Event.prototype.updateMove = function(){
    Alias.Game_Event_updateMove.call(this)

    if($gamePlayer.carryPlatformId === this.eventId() && !$gamePlayer.isJumping()){
        $gamePlayer._x = this._x
        $gamePlayer._y = this._y
        $gamePlayer._realX = this._realX
        $gamePlayer._realY = this._realY
    }
}

/* ---------------------------- GAME INTERPRETER ---------------------------- */
Alias.Game_Interpreter_terminate = Game_Interpreter.prototype.terminate
Game_Interpreter.prototype.terminate = function() {
    Alias.Game_Interpreter_terminate.call(this)
    
    if(this.isCarryPlatformEvent()){
        this.clearCarryPlatform()
    }
}

Game_Interpreter.prototype.isCarryPlatformEvent = function() {
    return  $gamePlayer.carryPlatformId > 0 && 
            $gamePlayer.carryPlatformId === this._eventId
}

Game_Interpreter.prototype.clearCarryPlatform = function() {
    $gamePlayer.carryPlatformId = 0
}

Alias.Game_Interpreter_onCommonEventEnd = Game_Interpreter.prototype.onCommonEventEnd
Game_Interpreter.prototype.onCommonEventEnd = function(){
    Alias.Game_Interpreter_onCommonEventEnd.call(this)

    if(Plugin.getParam().fallCommonEvent === this._commonEventId){
        const index = $gameMap._commonEvents.findIndex(event => event._commonEventId === this._commonEventId)
        Eli.Array.removeElement($gameMap._commonEvents, index, 1)
    }
}

/* ---------------------------- GAME COMMON EVENT --------------------------- */
Alias.Game_CommonEvent_isActive = Game_CommonEvent.prototype.isActive
Game_CommonEvent.prototype.isActive = function() {
    return Alias.Game_CommonEvent_isActive.call(this) || this.isActivatedByHole()
}

Game_CommonEvent.prototype.isActivatedByHole = function() {
    return Plugin.getParam().fallCommonEvent === this._commonEventId
}

/* ----------------------------- COMPATIBILITIES ---------------------------- */

if(Imported.Eli_JumpSystem){

    Alias.Game_Player_isJumpAllowed = Game_Player.prototype.isJumpAllowed
    Game_Player.prototype.isJumpAllowed = function(){
        if(this.isTryingToJumpFromCarryPlatform()){
            return this.isJumpAllowedOnCarryPlatform()
        }else{
            return Alias.Game_Player_isJumpAllowed.call(this) && !this.isFalling
        }
    }

    Game_Player.prototype.isTryingToJumpFromCarryPlatform = function(){
        return this.isBeingCarryByPlatform() && this.carryPlatform().metaEli.CarryPlatform
    }

    Game_Player.prototype.isJumpAllowedOnCarryPlatform = function(){
        const blockSwitch = Eli.JumpSystem.isJumpDisabled()
    
        return !blockSwitch && !$gameMessage.isBusy() && !this.isJumping() && !this.isFalling
    }

    Alias.Game_Player_afterJump = Game_Player.prototype.afterJump
    Game_Player.prototype.afterJump = function() {
        Alias.Game_Player_afterJump.call(this)

        if(this.isOnHoleTile()){
            this.refreshPlatformAfterJump()
        }else{
            this.refreshSafePosition()
        }
    }

    Game_Player.prototype.refreshPlatformAfterJump = function(){
        const event = this.findPlatformEvent()
        
        if(event){
            if(!event.isCarryPlatform()){
                this.carryPlatformId = 0
            }
            
        }else{
            this.carryPlatformId = 0
            Eli.JumpSystem.setPlayerJumping(false)
            this.onHoleFall(true)
        }
    }

}

if(Imported.Eli_CharacterPoses){

    Alias.Game_Player_canUpdateWalkAndDashPose = Game_Player.prototype.canUpdateWalkAndDashPose
    Game_Player.prototype.canUpdateWalkAndDashPose = function() {
        return Alias.Game_Player_canUpdateWalkAndDashPose.call(this) && !this.isBeingCarryByPlatform()
    }

}

}