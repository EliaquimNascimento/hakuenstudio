//==========================================================================
// EliMZ_CapParameters.js
//==========================================================================

/*:
@target MZ
@base EliMZ_Book

@plugindesc ♦1.0.0♦ Set a cap value for the regular parameters.
@author Hakuen Studio
@url https://www.reddit.com/r/RPGMaker/comments/1rvniyo/need_help_mz/

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

Cap regular parameter values.

@param atk
@text Attack
@type number
@desc Cap this parameter to this value. Set -1 to not cap.
@default -1

@param def
@text Defense
@type number
@desc Cap this parameter to this value. Set -1 to not cap.
@default -1

@param mat
@text Magic Attack
@type number
@desc Cap this parameter to this value. Set -1 to not cap.
@default -1

@param mdf
@text Magic Defense
@type number
@desc Cap this parameter to this value. Set -1 to not cap.
@default -1

@param agi
@text Agility
@type number
@desc Cap this parameter to this value. Set -1 to not cap.
@default -1

@param luk
@text Luck
@type number
@desc Cap this parameter to this value. Set -1 to not cap.
@default -1


*/

"use strict"

var Eli = Eli || {}
var Imported = Imported || {}
Imported.Eli_CapParameters = true

if(!Imported.Eli_Book && !window.eliErrorTriggered){
    window.eliErrorTriggered = true
    if(confirm(`All EliMZ plugins need the core plugin EliMZ_Book. Click OK to download it and install somewhere above all other EliMZ plugins.`)){
        window.location.href = "https://hakuenstudio.itch.io/eli-book-rpg-maker-mv-mz"
    }
    SceneManager.exit()
}

Eli.CapParameters = {

    table: {
        2:"atk",
        3:"def",
        4:"mat",
        5:"mdf",
        6:"agi",
        7:"luk",
    },

    Parameters: class Parameters{
        constructor(parameters){
            this.atk = Number(parameters.atk)
            this.def = Number(parameters.def)
            this.mat = Number(parameters.mat)
            this.mdf = Number(parameters.mdf)
            this.agi = Number(parameters.agi)
            this.luk = Number(parameters.luk)
        }
    },

    initialize(){
        Eli.VersionManager.register("EliMZ_CapParameters", "1.0.0")
        this.initParameters()
        this.initPluginCommands()
    },

    initParameters(){
        const parameters = PluginManager.parameters("EliMZ_CapParameters")
        this.parameters = new this.Parameters(parameters)
    },

    initPluginCommands(){
        const commands = []
        Eli.PluginManager.registerCommands(this, commands, "EliMZ_CapParameters")
    },

    getParam(){
        return this.parameters
    },

    getSavedData(){
        return $eliData.CapParameters
    },

    getParamCapValue(paramId){
        const paramName = this.table[paramId]
        return this.getParam()[paramName]
    },
    
}

{

const Plugin = Eli.CapParameters
const Alias = {}

Plugin.initialize()

/* ---------------------------- GAME BATTLER BASE --------------------------- */
Alias.Game_BattlerBase_param = Game_BattlerBase.prototype.param
Game_BattlerBase.prototype.param = function(paramId) {
    const value = Alias.Game_BattlerBase_param.call(this, paramId)
    const maxValue = Plugin.getParamCapValue(paramId)

    if(maxValue > -1){
        return value > maxValue ? maxValue : value
    }else{
        return value
    }
}

}