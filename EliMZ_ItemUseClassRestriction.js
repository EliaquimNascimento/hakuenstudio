//=============================================================================
// EliMZ_ItemUseClassRestriction.js
//=============================================================================

/*:
@target MZ

@plugindesc ♦1.0.0♦ Restrict item targets by actor class.
@author Hakuen Studio
@url https://www.reddit.com/r/RPGMaker/comments/1tpsygk/how_to_limit_learn_skill_items_to_specific/

@help

♦ FEATURES

● Restricts which actor classes can be targeted by specific items.

♦ HOW TO USE

Add this note tag to the item note box:

<ItemUseClasses: 1, 2, 3>

Only actors whose current class id is listed in the note tag can be valid
targets for that item.

Examples:

<ItemUseClasses: 4>
The item can only target actors whose current class id is 4.

<ItemUseClasses: 4, 7>
The item can only target actors whose current class id is 4 or 7.

If the item does not have the note tag, it keeps the default RPG Maker MZ
behavior.

This plugin does not teach skills by itself. Use the default item effect
Learn Skill, or any other item effect you want. The plugin only controls
whether the selected actor class is a valid target for the item.

♦ NOTE TAG

<ItemUseClasses: classId, classId, classId>

Use class database ids only.
*/

"use strict"

var Eli = Eli || {}
var Imported = Imported || {}
Imported.Eli_ItemUseClassRestriction = true

Eli.ItemUseClassRestriction = {

	hasItemUseClassRestriction(item){
		return DataManager.isItem(item) && this.getItemUseClassIds(item).length > 0
	},

	getItemUseClassIds(item){
		if(!item.eliItemUseClassIds){
			item.eliItemUseClassIds = this.parseClassIds(item.meta.ItemUseClasses || "")
		}

		return item.eliItemUseClassIds
	},

	parseClassIds(rawValue){
		return rawValue.split(",").map(text => Number(text)).filter(id => id > 0)
	},

	canTargetUseItem(target, item){
		if(!this.hasItemUseClassRestriction(item)){
			return true
		}else if(!target.isActor()){
			return false
		}else{
			return this.getItemUseClassIds(item).includes(target.currentClass().id)
		}
	},

}

{

const Plugin = Eli.ItemUseClassRestriction
const Alias = {}

Alias.Scene_ItemBase_itemTargetActors = Scene_ItemBase.prototype.itemTargetActors
Scene_ItemBase.prototype.itemTargetActors = function(){
	const targets = Alias.Scene_ItemBase_itemTargetActors.call(this)
	const item = this.item()

	if(Plugin.hasItemUseClassRestriction(item)){
		return targets.filter(target => Plugin.canTargetUseItem(target, item))
	}else{
		return targets
	}
}

}
