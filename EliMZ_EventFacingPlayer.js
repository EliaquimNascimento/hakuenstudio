//==========================================================================
// EliMZ_EventFacingPlayer.js
//==========================================================================

/*:
@target MZ
@base EliMZ_Book

@plugindesc ♦1.0.0♦ Checks if an event is facing the player.
@author Hakuen Studio
@url https://www.reddit.com/r/RPGMaker/comments/1rpgyvv/how_to_make_event_trigger_when_it_is_facing_the/

@help
↑↑↑ HOW TO USE / HELP FILE ABOVE ↑↑↑

★★★★★ → Rate the plugin! Please, is very important to me ^^
https://hakuenstudio.itch.io/XXXXXXXXXXXXXXXXXXXXXXXX/rate?source=game

♦ TERMS OF USE
https://www.hakuenstudio.com/terms-of-use-5-0-0

♦ DOWNLOAD
https://hakuenstudio.itch.io/XXXXXXXXXXXXXXXXXXXXXXXX

♦ SUPPORT
https://hakuenstudio.itch.io/XXXXXXXXXXXXXXXXXXXXXXXX/community

♦ FEATURES
- Checks if event is facing the player within a line of sight
- Start a map event with plugin commands

♦ PLUGIN COMMAND: Check Event Facing Player
- Use this to check if a given event is facing the player.
- The result can be stored on a regular switch or in a self switch.

♦ PLUGIN COMMAND: Start Map Event
- Use this to start a Map event.

To be used on conditional branches:

♦ SCRIPT CALL: $gameMap.eventIsFacingPlayer(eventId, lineOfSight)
- Replace eventId with the id of the event you want to check.
- You can also use "this.eventId()" to point out to the current event.

♦ SCRIPT CALL: this.eventIsFacingPlayer(lineOfSight)
- This is the same as above, but it will assume the event is the current one.

@command cmd_checkEventFacingPlayer
@text Check Event Facing Player
@desc Checks if an event is facing the player.

    @arg eventId
    @text Event Id
    @type text
    @desc The event id. Set 0 to use the current event. Can use \v[id]
    @default 0

    @arg lineOfSight
    @text Line of Sight
    @type text
    @desc How far, in tiles, the event can see the player. Can use \v[id]
    @default 3

    @arg switch
    @text Switch Id
    @type text
    @desc This switch will be set to true if the event is seeing the player.
    @default 0

    @arg selfSwitch
    @text Self Switch
    @type select
    @option A
    @option B
    @option C
    @option D
    @option NONE
    @desc This self switch will be set to true if the event is seeing the player.
    @default NONE

@command cmd_startEvent
@text Start Map Event
@desc Checks if an event is facing the player.

    @arg eventId
    @text Event Id
    @type text
    @desc The event id. Set 0 to use the current event. Can use \v[id]
    @default 0

*/

"use strict"

var Eli = Eli || {}
var Imported = Imported || {}
Imported.Eli_EventFacingPlayer = true

if(!Imported.Eli_Book && !window.eliErrorTriggered){
    window.eliErrorTriggered = true
    if(confirm(`All EliMZ plugins need the core plugin EliMZ_Book. Click OK to download it and install somewhere above all other EliMZ plugins.`)){
        window.location.href = "https://hakuenstudio.itch.io/eli-book-rpg-maker-mv-mz"
    }
    SceneManager.exit()
}

Eli.EventFacingPlayer = {

    Parameters: class Parameters{
        constructor(parameters){
            
        }
    },

    initialize(){
        Eli.VersionManager.register("EliMZ_EventFacingPlayer", "1.0.0")
        this.initParameters()
        this.initPluginCommands()
    },

    initParameters(){
        const parameters = PluginManager.parameters("EliMZ_EventFacingPlayer")
        this.parameters = new this.Parameters(parameters)
    },

    initPluginCommands(){
        const commands = ["cmd_checkEventFacingPlayer", "cmd_startEvent"]
        Eli.PluginManager.registerCommands(this, commands, "EliMZ_EventFacingPlayer")
    },

    getParam(){
        return this.parameters
    },

    cmd_checkEventFacingPlayer(args){
        const eventId = Number(Eli.Utils.convertEscapeVariablesOnly(args.eventId)) || Eli.PluginManager.currentEventId
        const lineOfSight = Number(Eli.Utils.convertEscapeVariablesOnly(args.lineOfSight)) || 0
        const switchId = Number(args.switchId)
        const selfSwitchId = args.selfSwitchId
        const playerIsSpotted = $gameMap.eventIsFacingPlayer(eventId, lineOfSight)

        $gameSwitches.setValue(switchId, playerIsSpotted)

        if(selfSwitchId !== "NONE"){
            const key = [$gameMap.mapId(), eventId, selfSwitchId]
            $gameSelfSwitches.setValue(key, playerIsSpotted)
        }
    },

    cmd_startEvent(args){
        const eventId = Number(Eli.Utils.convertEscapeVariablesOnly(args.eventId)) || Eli.PluginManager.currentEventId
        const event = $gameMap.event(eventId)

        if(event){
            event.start()
        }
    },
    
}

{

const Plugin = Eli.EventFacingPlayer
const Alias = {}

Plugin.initialize()

/* -------------------------------- GAME MAP -------------------------------- */
Game_Map.prototype.eventIsFacingPlayer = function(id, sight) {
    const eventId = id
    const event = $gameMap.event(eventId)

    if(!event) return false

    const playerX = $gamePlayer.x
    const playerY = $gamePlayer.y
    const eventX = event.x
    const eventY = event.y
    const evDir = event.direction()
    const distanceX = Math.abs(this.deltaX(eventX, playerX))
    const distanceY = Math.abs(this.deltaY(eventY, playerY))

    if(evDir === 2 && playerY > eventY && playerX === eventX){
        return distanceY <= sight

    }else if(evDir === 8 && playerY < eventY && playerX === eventX){
        return distanceY <= sight

    } else if(evDir === 4 && playerX < eventX && playerY === eventY){
        return distanceX <= sight

    }else if(evDir === 6 && playerX > eventX && playerY === eventY){
        return distanceX <= sight
    }else{
        return false
    }
}

/* ---------------------------- GAME INTERPRETER ---------------------------- */
Game_Interpreter.prototype.eventIsFacingPlayer = function(sight){
    return $gameMap.eventIsFacingPlayer(this.eventId(), sight)
}

}