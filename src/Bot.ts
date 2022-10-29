import MinecraftData from 'minecraft-data'
import {Bot as SBot, createBot} from 'mineflayer'
import minecraftData from 'minecraft-data'
import mineflayer from 'mineflayer'
const radar = require('mineflayer-radar')(mineflayer)
import cmd from 'mineflayer-cmd'
import { pathfinder, Movements, Pathfinder } from 'mineflayer-pathfinder'

export default class Bot{
  mBot: SBot
  mcData: MinecraftData.IndexedData

  constructor() {


    const options = {
      host: 'pcr.events',
      port: 25565,
      username: 'BALLER_BOT',
      version:"1.8.9"

    }

    

    this.mBot = createBot(options)

    this.mcData = minecraftData(this.mBot.version)
    this.mBot.loadPlugin(pathfinder)
    
    this.mBot.pathfinder.setMovements(new Movements(this.mBot, this.mcData))
    

    
  }

}

