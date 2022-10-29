import MinecraftData from 'minecraft-data'
import {Bot as SBot, BotOptions, createBot} from 'mineflayer'
import minecraftData from 'minecraft-data'
import mineflayer from 'mineflayer'
const radar = require('mineflayer-radar')(mineflayer)
import cmd from 'mineflayer-cmd'
import { pathfinder, Movements, Pathfinder } from 'mineflayer-pathfinder'
import Role from './Role'
import WildChopper from './roles/WildChopper'

type RoleName = "WILD_CHOPPER"




export default class Bot{
  mBot: SBot
  mcData: MinecraftData.IndexedData
  role?: Role

  constructor(options:BotOptions) {

    this.mBot = createBot(options)
    this.mcData = minecraftData(this.mBot.version)
    this.mBot.loadPlugin(pathfinder)
    this.mBot.pathfinder.setMovements(new Movements(this.mBot, this.mcData))
    
    this.mBot.on("spawn",()=>{
      if (this.role) {
        this.role.execute()
      }
    })    
  }

  setRole = (role:RoleName)=>{
    let selectedRole 
    switch (role) {
      case "WILD_CHOPPER":
        selectedRole = new WildChopper(this)
        break;
    }
    this.role = selectedRole
  }

}

