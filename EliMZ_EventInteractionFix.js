//==========================================================================
// EliMZ_EventInteractionFix.js
//==========================================================================

/*:
@target MZ
@base EliMZ_Book

@plugindesc ♦1.0.0♦ Changes player interaction with moving map events.
@author Hakuen Studio
@url https://www.reddit.com/r/RPGMaker/comments/1u6vtbg/npc_glide_issue/

@param interactionMode
@text Interaction Mode
@type select
@option Block Moving Events
@option Queue Interaction
@default Block Moving Events
@desc Selects how player interaction works when a matching event is still moving.

@param blockMoveSpeedLimit
@text Block Move Speed Limit
@type string
@min 0
@max 6
@default 0
@desc Used by Block Moving Events mode. 0 affects all speeds. Any other value affects equal or lower move speed.

@help
♦ TERMS OF USE
https://www.hakuenstudio.com/terms-of-use-5-0-0

This plugin changes how player interaction behaves when a map event
is still moving between tiles.

♦ MODES

Block Moving Events:
The player action does not start events while they are moving.

Queue Interaction:
The player action waits for the event to finish moving, then starts it if the
player is still on the same tile and facing the same direction.

♦ BLOCK MOVE SPEED LIMIT

This parameter is used only when Interaction Mode is Block Moving Events.

0 = Affects events with any move speed.
1-6 = Affects events with this move speed or lower.

Example:
If the value is 2, only events with move speed 2 or lower are affected.

*/

"use strict"

var Eli = Eli || {}
var Imported = Imported || {}
Imported.Eli_EventInteractionFix = true

if(!Imported.Eli_Book && !window.eliErrorTriggered){
	window.eliErrorTriggered = true
	if(confirm(`All EliMZ plugins need the core plugin EliMZ_Book. Click OK to download it and install somewhere above all other EliMZ plugins.`)){
		window.location.href = "https://hakuenstudio.itch.io/eli-book-rpg-maker-mv-mz"
	}
	SceneManager.exit()
}

Eli.EventInteractionFix = {

	parameters: null,
	pendingInteraction: null,
	playerInteraction: null,
	lastInteractionDelayedFrame: -1,

	Parameters: class Parameters{

		constructor(parameters){
			this.interactionMode = parameters.interactionMode
			this.blockMoveSpeedLimit = Number(parameters.blockMoveSpeedLimit || 0)
		}
	},

	initialize(){
		Eli.VersionManager.register("EliMZ_EventInteractionFix", "1.0.0")
		this.initParameters()
		this.initPluginCommands()
	},

	initParameters(){
		const parameters = PluginManager.parameters("EliMZ_EventInteractionFix")
		this.parameters = new this.Parameters(parameters)
	},

	initPluginCommands(){
		const commands = []
		Eli.PluginManager.registerCommands(this, commands, "EliMZ_EventInteractionFix")
	},

	getParam(){
		return this.parameters
	},

	isBlockMode(){
		return this.getParam().interactionMode === "Block Moving Events"
	},

	isQueueMode(){
		return this.getParam().interactionMode === "Queue Interaction"
	},

	beginPlayerInteraction(x, y, triggers, normal){
		this.clearLastInteractionDelayed()
		this.playerInteraction = {
			x: x,
			y: y,
			triggers: triggers,
			normal: normal
		}
	},

	endPlayerInteraction(){
		this.playerInteraction = null
	},

	isPlayerInteractionActive(){
		return !!this.playerInteraction
	},

	processEventStart(event, originalStartMethod){
		if(this.shouldHoldEventStart(event)){
			this.holdEventStart(event)
		}else{
			originalStartMethod.call(event)
		}
	},

	shouldHoldEventStart(event){
		if(this.isPlayerInteractionActive() && this.isEventInMotion(event)){
			if(this.isBlockMode()){
				return this.isEventMoveSpeedAffected(event)
			}else if(this.isQueueMode()){
				return true
			}else{
				return false
			}
		}else{
			return false
		}
	},

	holdEventStart(event){
		const interaction = this.playerInteraction

		if(interaction){
			this.markLastInteractionDelayed()

			if(this.isQueueMode()){
				this.setPendingInteraction(event, interaction.x, interaction.y, interaction.triggers, interaction.normal)
			}else if(this.isBlockMode()){
				this.clearPendingInteraction()
			}
		}
	},

	isEventInMotion(event){
		return event.isMoving() || event.isJumping()
	},

	isEventMoveSpeedAffected(event){
		const speedLimit = this.getParam().blockMoveSpeedLimit

		if(speedLimit === 0){
			return true
		}else{
			return event.moveSpeed() <= speedLimit
		}
	},

	setPendingInteraction(event, x, y, triggers, normal){
		this.pendingInteraction = {
			mapId: $gameMap.mapId(),
			eventId: event.eventId(),
			x: x,
			y: y,
			triggers: triggers.clone(),
			normal: normal,
			playerX: $gamePlayer.x,
			playerY: $gamePlayer.y,
			playerDirection: $gamePlayer.direction()
		}
	},

	clearPendingInteraction(){
		this.pendingInteraction = null
	},

	updatePendingInteraction(){
		if(this.pendingInteraction){
			if(this.canKeepPendingInteraction()){
				if(this.canStartPendingInteraction()){
					this.startPendingInteraction()
				}
			}else{
				this.clearPendingInteraction()
			}
		}
	},

	canKeepPendingInteraction(){
		const pending = this.pendingInteraction

		if(pending){
			return this.isPendingInteractionStillValid(pending)
		}else{
			return false
		}
	},

	isPendingInteractionStillValid(pending){
		const event = $gameMap.event(pending.eventId)

		return (
			this.isQueueMode() &&
			!$gameMap.isEventRunning() &&
			pending.mapId === $gameMap.mapId() &&
			event &&
			this.isPendingPlayerStillInPlace(pending) &&
			this.canStartMapEvent(event, pending.triggers, pending.normal)
		)
	},

	canStartPendingInteraction(){
		const pending = this.pendingInteraction

		if(pending){
			return this.isPendingInteractionReady(pending)
		}else{
			return false
		}
	},

	isPendingInteractionReady(pending){
		const event = $gameMap.event(pending.eventId)

		return event && event.pos(pending.x, pending.y) && !this.isEventInMotion(event)
	},

	canStartMapEvent(event, triggers, normal){
		return event.isTriggerIn(triggers) && event.isNormalPriority() === normal
	},

	isPendingPlayerStillInPlace(pending){
		const player = $gamePlayer
		return (
			player.x === pending.playerX &&
			player.y === pending.playerY &&
			player.direction() === pending.playerDirection &&
			player.canStartLocalEvents()
		)
	},

	startPendingInteraction(){
		const pending = this.pendingInteraction

		if(pending){
			const event = $gameMap.event(pending.eventId)
			event.start()
			this.clearPendingInteraction()
		}
	},

	markLastInteractionDelayed(){
		this.lastInteractionDelayedFrame = Graphics.frameCount
	},

	clearLastInteractionDelayed(){
		this.lastInteractionDelayedFrame = -1
	},

	wasLastInteractionDelayed(){
		return this.lastInteractionDelayedFrame === Graphics.frameCount
	},
}

{

const Plugin = Eli.EventInteractionFix
const Alias = {}

Plugin.initialize()

/* -------------------------------- GAME MAP -------------------------------- */

Alias.Game_Map_setup = Game_Map.prototype.setup
Game_Map.prototype.setup = function(mapId){
	Alias.Game_Map_setup.call(this, mapId)
	Plugin.clearPendingInteraction()
	Plugin.clearLastInteractionDelayed()
}

Alias.Game_Map_update = Game_Map.prototype.update
Game_Map.prototype.update = function(sceneActive){
	Alias.Game_Map_update.call(this, sceneActive)
	Plugin.updatePendingInteraction()
}

Alias.Game_Map_isAnyEventStarting = Game_Map.prototype.isAnyEventStarting
Game_Map.prototype.isAnyEventStarting = function(){
	if(Alias.Game_Map_isAnyEventStarting.call(this)){
		return true
	}else{
		return Plugin.wasLastInteractionDelayed()
	}
}

Alias.Game_Map_setupStartingEvent = Game_Map.prototype.setupStartingEvent
Game_Map.prototype.setupStartingEvent = function(){
	if(Alias.Game_Map_setupStartingEvent.call(this)){
		Plugin.clearLastInteractionDelayed()
		return true
	}else if(Plugin.wasLastInteractionDelayed()){
		Plugin.clearLastInteractionDelayed()
		return true
	}else{
		return false
	}
}

/* ------------------------------- GAME PLAYER ------------------------------ */

Alias.Game_Player_startMapEvent = Game_Player.prototype.startMapEvent
Game_Player.prototype.startMapEvent = function(x, y, triggers, normal){
	Plugin.beginPlayerInteraction(x, y, triggers, normal)
	Alias.Game_Player_startMapEvent.call(this, x, y, triggers, normal)
	Plugin.endPlayerInteraction()
}

/* ------------------------------- GAME EVENT ------------------------------- */

Alias.Game_Event_start = Game_Event.prototype.start
Game_Event.prototype.start = function(){
	if(Plugin.isPlayerInteractionActive()){
		Plugin.processEventStart(this, Alias.Game_Event_start)
	}else{
		Alias.Game_Event_start.call(this)
	}
}

}