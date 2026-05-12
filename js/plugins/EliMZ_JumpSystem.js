//============================================================================
// Eli_JumpSystem.js
//============================================================================

/*:
@target MZ
@base EliMZ_Book
@orderAfter DotMoveSystem

@plugindesc ♦2.5.0♦ Adds a jump system to the player when a button is triggered.
@author Hakuen Studio
@url https://hakuenstudio.itch.io/eli-jump-system-for-rpg-maker-mv/rate?source=game

@help
★★★★★ Rate the plugin by clicking on the url! 
Please, is very important to me ^^

● Terms of Use
https://www.hakuenstudio.com/terms-of-use-5-0-0
============================================================================
Features
============================================================================

● Add a jump button!
● Can choose a sound to play when jumping.
● Can use a variable value to define how far the player will jump.
● Can set up the conditions that allow the player to jump or not, through 
a list of possible ones in plugin parameters.
● Add impulse feature that changes the jump distance if the player is 
walking or dashing!
● Can block Jump with the region, event note tag, or switch!
● Can use a variable value to define a plus value to the jump height/peak.
● Turn on a switch when the player is jumping.
● Script calls to Jump Forward, Jump into coordinates, and jump on a 
character
● Works with normal directions and diagonals!
● Compatible with DotMoveSystem.js(Pixel Movement)​ from unagi ootoro!

============================================================================
How to use
============================================================================

https://docs.google.com/document/d/181r3H7AUV-1Y2MTeAijGSatS0FbMDiJmQfGoEVEcbK4/edit?usp=sharing

============================================================================

@param jumpButtonCode
@text Keyboard Button
@type select
@option none @option a @option b @option c @option d @option e @option f @option g @option h @option i @option j @option k @option l @option m @option n @option o @option p @option q @option r @option s @option t @option u @option v @option w @option x @option y @option z @option 0 @option 1 @option 2 @option 3 @option 4 @option 5 @option 6 @option 7 @option 8 @option 9 @option backspace @option tab @option enter @option shift @option ctrl @option alt @option pausebreak @option capslock @option esc @option space @option pageup @option pagedown @option end @option home @option leftarrow @option uparrow @option rightarrow @option downarrow @option insert @option delete @option leftwindowkey @option rightwindowkey @option selectkey @option numpad0 @option numpad1 @option numpad2 @option numpad3 @option numpad4 @option numpad5 @option numpad6 @option numpad7 @option numpad8 @option numpad9 @option multiply @option add @option subtract @option decimalpoint @option divide @option f1 @option f2 @option f3 @option f4 @option f5 @option f6 @option f7 @option f8 @option f9 @option f10 @option f11 @option f12 @option numlock @option scrolllock @option semicolon @option equalsign @option comma @option dash @option period @option forwardslash @option graveaccent @option openbracket @option backslash @option closebracket @option singlequote
@desc Add here the keyboard button. Default is space.
@default space

@param jumpButtonCodeGamepad
@text Game pad button
@type select
@option none @option a @option b @option x @option y @option lb @option rb @option lt @option rt @option select @option start @option l3 @option r3 @option up @option down @option left @option right 
@desc Choose the gamepad button. Put none to not use.
Default is none.
@default l3

@param overwrite
@text Overwrite keys
@type boolean
@desc Set to true if you want to overwrite the default keys.
@default true

@param jumpVariable
@text Jump Distance
@type variable
@desc This variable will determine how much tiles the player will be able to jump forward.
@default 0

@param jumpPeakVariable
@text Jump Height/Peak
@type variable
@desc This variable will determine a plus value for the jump height/peak.
@default 0

@param jumpCondition
@text Jump check
@type select
@desc This will determine what function the plugin will use to check if the player is able to jump.
@option Can jump
@value canJump
@option Can jump only to same regions
@value canJumpSameRegion
@option Can jump only to higher Regions
@value canJumpHigherRegion
@option Can jump only to lower Regions
@value canJumpLowerRegion
@option Can jump only to same terrain tag
@value canJumpSameTerrain
@option Can jump only to higher terrain tag
@value canJumpHigherTerrain
@option Can jump only to lower terrain tag
@value canJumpLowerTerrain
@default canJump

@param enableDiagonalJump
@text Enable Diagonal Jump
@type boolean
@desc Set to true if you want to enable diagonal jump.
@default false

@param blockRegion
@text Block Jump Regions
@type text
@desc Set regions that will prevent the player to jump over it. Separate each one with a comma.
@default 10

@param blockSwitch
@text Disable Jump Switch
@type switch
@desc Turn this switch on to prevent the player from jump
@default 0

@param isJumpingSwitch
@text Jump Switch
@type switch
@desc This switch will turn on automatically when player is jumping.
@default 0

@param priorityZindex
@text Jumping Z-Index
@type text
@desc When the character is jumping, it will have this z index value.
@default 1.4

@param impulse
@text Impulse Switch
@type switch
@desc If this switch is on, the jump value can raise if the player is dashing or walking.
@default 0

@param walkPlus
@text Walk impulse
@type variable
@desc Set a variable to hold the value to add to the jump distance when player is walking.
@default 0
@parent impulse

@param dashPlus
@text Dash impulse
@type variable
@desc Set a variable to hold the value to add to the jump distance when player is dashing.
@default 0
@parent impulse

@param jumpSound
@text Jump Se
@type file
@dir audio/se/
@require 1
@desc Add here a sound effect for your jump.
@default

@param jumpPan
@text JumpSound Pan
@type number
@min -100
@max 100
@desc The pan number -100 to 100.
@default 0
@parent jumpSound

@param jumpPitch
@text JumpSound Pitch
@type number
@min -50
@max 150
@desc The pan number -50 to 150.
@default 100
@parent jumpSound

@command cmd_jumpForward
@text Jump Forward
@desc Makes the character jump forward

    @arg charId
    @text Character Id
    @type text
    @desc 0 For this event, -1 For player, -2 First follower, "Ship", "Boat", "Airship" or an event Id.
    @default 0

    @arg distance
    @text Distance
    @type text
    @desc The number of tiles that the character will jump forward. Can use \v[id] or formulas.
    @default 2

    @arg jumpPeak
    @text Jump Peak
    @type text
    @desc Change the jump peak value. Only works for events and vehicles.
    @default 0

@command cmd_jumpToCoordinates
@text Jump To Coordinates
@desc Makes the character jump to a specific coordinate.

    @arg charId
    @text Character Id
    @type text
    @desc 0 For this event, -1 For player, -2 First follower, "Ship", "Boat", "Airship" or an event Id.
    @default 0

    @arg coordinates
    @text Coordinates
    @type text
    @desc Separate each one with a comma. Can use \v[id] or formulas.
    @default x, y

    @arg jumpPeak
    @text Jump Peak
    @type text
    @desc Change the jump peak value. Only works for events and vehicles.
    @default 0

@command cmd_jumpToCharacter
@text Jump To Character
@desc Makes the a character jump to other character position.

    @arg jumperCharId
    @text Jumper Character Id
    @type text
    @desc 0 For this event, -1 For player, -2 First follower, "Ship", "Boat", "Airship" or an event Id.
    @default 0

    @arg targetCharId
    @text Target Character Id
    @type text
    @desc -1 For player, -2 First follower, "Ship", "Boat", "Airship" or an event Id.
    @default 1

    @arg jumpPeak
    @text Jump Peak
    @type text
    @desc Change the jump peak value. Only works for events and vehicles.
    @default 0

@command cmd_eventBlockJump
@text Event Block Jump
@desc Make the events block player jump.

    @arg ids
    @text Event ids
    @type text
    @desc The event ids. You can use multiple operators. 0 = This event.
    @default 0

    @arg block
    @text Block Jump
    @type select
    @option true
    @option false
    @option toggle
    @desc Set to true if you want this event to block the player's jump.
    @default true

*/

"use strict"

var Eli = Eli || {}
var Imported = Imported || {}
Imported.Eli_JumpSystem = true

/* ========================================================================== */
/*                                   PLUGIN                                   */
/* ========================================================================== */
Eli.JumpSystem = {

    Parameters: class {
        constructor(parameters){
            this.keyboardCode = parameters.jumpButtonCode
            this.gamepadCode = parameters.jumpButtonCodeGamepad
            this.condition = parameters.jumpCondition
            this.seFilename = parameters.jumpSound
            this.overwrite = parameters.overwrite === "true"
            this.enableDiagonalJump = parameters.enableDiagonalJump === "true"
            this.distanceVariable = Number(parameters.jumpVariable)
            this.peakVariable = Number(parameters.jumpPeakVariable)
            this.blockSwitch = Number(parameters.blockSwitch)
            this.isJumpingSwitch = Number(parameters.isJumpingSwitch)
            this.priorityZIndex = Number(parameters.priorityZIndex) || 1.4
            this.impulse = Number(parameters.impulse)
            this.walkPlus = Number(parameters.walkPlus)
            this.dashPlus = Number(parameters.dashPlus)
            this.pitch = Number(parameters.jumpPitch)
            this.pan = Number(parameters.jumpPan)
            this.blockRegion = Eli.PluginManager.createIdList(parameters.blockRegion)
        }
    },
    
    button: 'jump',

    initialize(){
        this.initParameters()
        this.initPluginCommands()
        this.initButtons()
    },

    initParameters(){
        const parameters = PluginManager.parameters(Eli.PluginManager.getPluginName())
        this.parameters = new this.Parameters(parameters)
    },

    initPluginCommands(){
        const commands = ['cmd_jumpForward', 'cmd_jumpToCoordinates', 'cmd_jumpToCharacter', "cmd_eventBlockJump"]
        Eli.PluginManager.registerCommands(this, commands)
    },

    initButtons(){
        if(this.parameters.keyboardCode !== "none"){
            this.setKeyboardButton()
        }

        if(this.parameters.gamepadCode !== "none"){
            this.setGamepadButton()
        }
    },

    setKeyboardButton(){
        const keyName = this.parameters.keyboardCode.toLowerCase()
        const keyCode = Eli.KeyCodes.keyboard[keyName]

        if(this.parameters.overwrite){
            Input.keyMapper[keyCode] = this.button

        }else if(!Eli.KeyCodes.isDefaultKeyboard(keyCode)){
            Input.keyMapper[keyCode] = this.button

        }else{
            this.button = Input.keyMapper[keyCode]
        }
    },

    setGamepadButton(){
        const keyName = this.parameters.gamepadCode.toLowerCase()
        const keyCode = Eli.KeyCodes.gamepad[keyName]

        if(this.parameters.overwrite){
            Input.gamepadMapper[keyCode] = this.button

        }else if(!Eli.KeyCodes.isDefaultGamepad(keyCode)){
            Input.gamepadMapper[keyCode] = this.button

        }else{
            this.button = Input.gamepadMapper[keyCode]
        }
    },

    getButton(){
        return this.button
    },

    getParam(){
        return this.parameters
    },

    cmd_jumpForward(args){
        const ids = Eli.PluginManager.createIdList(args.charId)
        const distance = new Function(`return ${Eli.Utils.convertEscapeVariablesOnly(args.distance)}`)
        const jumpPeak = Number(args.jumpPeak)

        for(const id of ids){
            const character = Eli.Utils.getMapCharacter(id)
            
            if(this.isEventOrVehicle(character)){
                character.setPlusJumpPeak(jumpPeak)
            }
    
            character.jumpForward(distance.bind(character)())
        }
    },

    cmd_jumpToCoordinates(args){
        const ids = Eli.PluginManager.createIdList(args.charId)
        const coordinates = Eli.Utils.convertEscapeVariablesOnly(args.coordinates).split(",")
        const x = new Function(`return ${coordinates[0]}`)
        const y = new Function(`return ${coordinates[1]}`)
        const jumpPeak = Number(args.jumpPeak)

        for(const id of ids){
            const character = Eli.Utils.getMapCharacter(id || Eli.PluginManager.currentEventId)

            if(this.isEventOrVehicle(character)){
                character.setPlusJumpPeak(jumpPeak)
            }
    
            character.jumpTo(x.bind(character)(), y.bind(character)())
        }
    },

    cmd_jumpToCharacter(args){
        const ids = Eli.PluginManager.createIdList(args.jumperCharId)
        const jumpPeak = Number(args.jumpPeak)

        for(const id of ids){
            const character = Eli.Utils.getMapCharacter(id || Eli.PluginManager.currentEventId)

            if(this.isEventOrVehicle(character)){
                character.setPlusJumpPeak(jumpPeak)
            }
    
            character.jumpToCharacter(args.targetCharId)
        }
    },

    cmd_eventBlockJump(args){
        const ids = Eli.PluginManager.createIdList(args.ids)

        for(const id of ids){
            const event = $gameMap.event(id || Eli.PluginManager.currentEventId)

            if(event){
                const flag = args.block === "toggle" ? !event.blockJump : args.block === "true"
                event.blockJump = flag
            }
        }
    },

    isEventOrVehicle(character){
        return  character instanceof Game_Event || character instanceof Game_Vehicle
    },
    // Variables
    getPlayerJumpDistance(){
        const id = this.getParam().distanceVariable
        return $gameVariables.value(id)
    },
    
    getPlayerJumpPeak(){
        const id = this.getParam().peakVariable
        return $gameVariables.value(id)
    },
    
    getPlayerWalkJumpPlus(){
        const id = this.getParam().walkPlus
        return $gameVariables.value(id)
    },
    
    getPlayerDashJumpPlus(){
        const id = this.getParam().dashPlus
        return $gameVariables.value(id)
    },
    // Switches
    isJumpSwitchEnabled(){
        const id = this.getParam().isJumpingSwitch
        return $gameSwitches.value(id)
    },
    
    setPlayerJumping(value){
        const id = this.getParam().isJumpingSwitch
        $gameSwitches.setValue(id, value)
    },
    
    isJumpDisabled(){
        const id = this.getParam().blockSwitch
        return $gameSwitches.value(id)
    },
    
    playerHasJumpImpulse(){
        const id = this.getParam().impulse
        return $gameSwitches.value(id)
    },

}

{

const Plugin = Eli.JumpSystem
const Alias = {}

Plugin.initialize()

/* ------------------------------ SOUND MANAGER ----------------------------- */
SoundManager.playJump = function(){
    const jumpSound = {
        name: Plugin.getParam().seFilename,
        pan: Plugin.getParam().pan,
        pitch: Plugin.getParam().pitch,
        volume: ConfigManager.seVolume
    }
    AudioManager.playSe(jumpSound)
}

/* ----------------------------- CHARACTER BASE ----------------------------- */
Alias.Game_CharacterBase_initMembers = Game_CharacterBase.prototype.initMembers
Game_CharacterBase.prototype.initMembers = function() {
    Alias.Game_CharacterBase_initMembers.call(this)
    this.initJumpMembers()
}

Game_CharacterBase.prototype.initJumpMembers = function() {
    this._plusJumpPeak = 0
}

Game_CharacterBase.prototype.beforeJump = function() {
    this._x = this._x.clamp(0, $gameMap.width()-1)
    this._y = this._y.clamp(0, $gameMap.height()-1)
    this.setPriorityType(Plugin.getParam().priorityZIndex)
    this._jumpPeak += this._plusJumpPeak
    this._jumpCount = this._jumpPeak * 2
}

Game_CharacterBase.prototype.afterJump = function() {
    this.setPriorityType(1)
}

Alias.Game_CharacterBase_jump = Game_CharacterBase.prototype.jump
Game_CharacterBase.prototype.jump = function(xPlus, yPlus){
    Alias.Game_CharacterBase_jump.call(this, xPlus, yPlus)
    this.beforeJump()
}

Game_CharacterBase.prototype.jumpTo = function(x, y){
    const plusX = x - this.x
    const plusY = y - this.y

    this.jump(plusX, plusY)
}

Game_CharacterBase.prototype.jumpToCharacter = function(charId){
    const character = Eli.Utils.getMapCharacter(charId)

    this.jumpTo(character.x, character.y)
}

Alias.Game_CharacterBase_updateJump = Game_CharacterBase.prototype.updateJump;
Game_CharacterBase.prototype.updateJump = function(){
    Alias.Game_CharacterBase_updateJump.call(this)

    if(!this.isJumping()){
        this.afterJump()
    }
}

Game_CharacterBase.prototype.canJump = function(x, y){
    return this.canPass(x, y)
}

Game_CharacterBase.prototype.isMapLandable = function(x, y){
    return $gameMap.isPassable(x, y, this.direction())
}

Game_CharacterBase.prototype.canJumpSameRegion = function(x, y){
    return this.canJump(x, y) && this.regionId() === $gameMap.regionId(x, y)
}

Game_CharacterBase.prototype.canJumpHigherRegion = function(x, y){
    return this.canJump(x, y) && this.regionId() <= $gameMap.regionId(x, y)
}

Game_CharacterBase.prototype.canJumpLowerRegion = function(x, y){
    return this.canJump(x, y) && this.regionId() >= $gameMap.regionId(x, y)
}

Game_CharacterBase.prototype.canJumpSameTerrain = function(x, y){
    return this.canJump(x, y) && this.terrainTag() === $gameMap.terrainTag(x, y)
}

Game_CharacterBase.prototype.canJumpHigherTerrain = function(x, y){
    return this.canJump(x, y) && this.terrainTag() <= $gameMap.terrainTag(x, y)
}

Game_CharacterBase.prototype.canJumpLowerTerrain = function(x, y){
    return this.canJump(x, y) && this.terrainTag() >= $gameMap.terrainTag(x, y)
}

Game_CharacterBase.prototype.jumpForward = function(value){
    const jumpDest = this.calculateJumpCoordinates(value)
    SoundManager.playJump()

    this.jump(jumpDest.x, jumpDest.y)
}

Game_CharacterBase.prototype.getJumpImpulse = function(){
    return 0
}

Game_CharacterBase.prototype.calculateJumpCoordinates = function(value){
    const jumpCheck = Plugin.getParam().condition
    const impulse = this.getJumpImpulse()
    const maxDistance = value + impulse
    let finalX = 0, finalY = 0
    
    for(let i = 0; i <= maxDistance; i++){
        const distance = this.calculateJumpDistance(i)
        const [destX, destY] = this.makeJumpDestinations(distance)
        const canJump = this[jumpCheck](destX, destY)

        if(this.hasFoundJumpBlockers(destX, destY)){
            break
        }else if(canJump){
            finalX = distance.x
            finalY = distance.y
        }

    }

    return {x: finalX, y: finalY}
}

Game_CharacterBase.prototype.makeJumpDestinations = function(distance){
    return [
        this.x + distance.x,
        this.y + distance.y,
    ]
}

Game_CharacterBase.prototype.hasFoundJumpBlockers = function(x, y){
    return  !this.isThrough() && 
            (this.isCollidedWithJumpBlockRegion(x, y) || this.isCollidedWithEventBlockJump(x, y))
}

Game_CharacterBase.prototype.isCollidedWithJumpBlockRegion = function(x, y){
    return Plugin.getParam().blockRegion.includes($gameMap.regionId(x, y))
}

Game_CharacterBase.prototype.isCollidedWithEventBlockJump = function(x, y){
    return $gameMap.events().some(event => event.posNt(x, y) && event.canBlockJump())
}

Game_CharacterBase.prototype.makeJumpDistanceTable = function(value){
    return {
        1: [-value, value   ], // Down Left
        2: [0,      value   ], // Down
        3: [value,  value   ], // Down Right

        4: [-value, 0       ], // Left
        6: [value,  0       ], // Right

        7: [-value, -value  ], // Up Left
        8: [0,      -value  ], // Up
        9: [value,  -value  ], // Up Right
    }
}

Game_CharacterBase.prototype.calculateJumpDistance = function(value){
    const distanceTable = this.makeJumpDistanceTable(value)
    const distance = {
        x: distanceTable[this.direction()][0], 
        y: distanceTable[this.direction()][1]
    }

    return distance
}

Game_CharacterBase.prototype.setPlusJumpPeak = function(value){
    this._plusJumpPeak = value
}

/* ------------------------------- GAME PLAYER ------------------------------ */
// Overwrite from the Character Base
Game_Player.prototype.calculateJumpDistance = function(value){
    const distanceTable = this.makeJumpDistanceTable(value)
    const direction = {
        "true": Input.dir8 || this.direction(),
        "false": this.direction(),
    }[Plugin.getParam().enableDiagonalJump]

    const distance = {
        x: distanceTable[direction][0], 
        y: distanceTable[direction][1]
    }

    return distance
}

Alias.Game_Player_moveByInput = Game_Player.prototype.moveByInput
Game_Player.prototype.moveByInput = function(){
    if(!this.isJumping()){
        Alias.Game_Player_moveByInput.call(this)
    }
}

// this.isFalling is from Jump platform
Alias.Game_Player_canJump = Game_Player.prototype.canJump
Game_Player.prototype.canJump = function(x, y){
    return !this.isFalling && Alias.Game_Player_canJump.call(this, x, y)
}

Alias.Game_Player_beforeJump = Game_Player.prototype.beforeJump
Game_Player.prototype.beforeJump = function() {
    Alias.Game_Player_beforeJump.call(this)
    Plugin.setPlayerJumping(true)
}

Alias.Game_Player_afterJump = Game_Player.prototype.afterJump
Game_Player.prototype.afterJump = function() {
    Alias.Game_Player_afterJump.call(this)
    setTimeout(() => {
        if(!this.isJumping()){
            Plugin.setPlayerJumping(false)
        }
    }, 500)
}

Alias.Game_Player_update = Game_Player.prototype.update
Game_Player.prototype.update = function(sceneActive){
    Alias.Game_Player_update.call(this, sceneActive)

    if(this.canUpdateJumpByButton()){
        this.updateJumpByButton()
    }
}

Game_Player.prototype.canUpdateJumpByButton = function(){
    return this.isJumpButtonPressed()
}

Game_Player.prototype.isJumpButtonPressed = function(){
    return Input.isTriggered(Plugin.getButton())
}

Game_Player.prototype.updateJumpByButton = function(){
    this.setPlusJumpPeak(Plugin.getPlayerJumpPeak())

    if(this.isJumpAllowed()){
        this.jumpForward(this.jumpValue())
    }
}

Game_Player.prototype.isJumpAllowed = function(){
    const blockSwitch = Plugin.isJumpDisabled()

    return !blockSwitch && this.canMove() && !this.isJumping()
}

Game_Player.prototype.jumpValue = function(){
    return Plugin.getPlayerJumpDistance()
}

Game_Player.prototype.getJumpImpulse = function(){
    if(Plugin.playerHasJumpImpulse()){
        return this.getJumpImpulseType()
    }else{
        return 0
    }
}

Game_Player.prototype.getJumpImpulseType = function(){
    if(this.isDashing()){
        return Plugin.getPlayerDashJumpPlus()

    }else if(!this.checkStop(0)){
        return Plugin.getPlayerWalkJumpPlus()
    }else{
        return 0
    }
}

/* ------------------------------ GAME FOLLOWER ----------------------------- */
Alias.Game_Follower_update = Game_Follower.prototype.update
Game_Follower.prototype.update = function() {
    Alias.Game_Follower_update.call(this)
    this.setPlusJumpPeak(Plugin.getPlayerJumpPeak()) 
}

/* ------------------------------- GAME EVENT ------------------------------- */
Alias.Game_Event_initJumpMembers = Game_Event.prototype.initJumpMembers
Game_Event.prototype.initJumpMembers = function() {
    Alias.Game_Event_initJumpMembers.call(this)
    this.blockJump = false
}

Game_Event.prototype.parseMeta_BlockJump = function(value){
    return true
}

Alias.Game_Event_canIterateList = Game_Event.prototype.canIterateList
Game_Event.prototype.canIterateList = function(){
    return Alias.Game_Event_canIterateList.call(this) || this.metaEli.hasOwnProperty("IterateList")
}

Alias.Game_Event_onListIteration = Game_Event.prototype.onListIteration
Game_Event.prototype.onListIteration = function(index){
    const aliasIndex = Alias.Game_Event_onListIteration.call(this, index)
    this.checkForUnblockJumpComment(aliasIndex)

    return aliasIndex
}

Game_Event.prototype.checkForUnblockJumpComment = function(index){
    const cmd = this.list()[index]

    if(this.canUnblockJumpByComment(cmd)){
        this.blockJump = false
    }
}

Game_Event.prototype.canUnblockJumpByComment = function(cmd){
    const isCommentCmd = cmd && (cmd.code === 108 || cmd.code === 408)
    return isCommentCmd && cmd.parameters[0].toLowerCase().includes("<unblockjump>")
}

Alias.Game_Event_afterSetupPage = Game_Event.prototype.afterSetupPage
Game_Event.prototype.afterSetupPage = function() {
    Alias.Game_Event_afterSetupPage.call(this)

    if(this.metaEli.hasOwnProperty("BlockJump")){
        this.blockJump = true
    }
}

Game_Event.prototype.canBlockJump = function(){
    return this.blockJump 
}

}