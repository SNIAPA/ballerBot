import { Vec3 } from 'vec3'
import {
  ComputedPath,
  pathfinder,
  Movements,
  goals as Goals,
} from 'mineflayer-pathfinder'
import Bot from '../Bot'
import Role from '../Role'
import { Block } from 'prismarine-block'
import { Entity } from 'prismarine-entity'
import { ItemEntityData } from '../types'

export default class WildChopper extends Role {
  blacklist: Vec3[] = []
  pickupQueue: (() => Promise<void>)[] = []

  constructor(bot: Bot) {
    super(bot)
  }



  async execute(): Promise<void> {
    let blocks = await this.findSomeLogs();
    while (true) {
      if(blocks.length == 0){
        blocks = await this.findSomeLogs();
        if(blocks.length == 0)
          break
      }else{
        blocks.sort((a,b)=>a.distanceTo(this.bot.mBot.entity.position) - b.distanceTo(this.bot.mBot.entity.position))

      }

      const block = this.bot.mBot.blockAt(blocks.pop()!) 
      if (!block) break

      if (this.bot.mBot.canDigBlock(block)) {
        await this.chop(block)
        continue
      }

      // get path
      const goal = new Goals.GoalNear(
        block.position.x,
        block.position.y,
        block.position.z,
        4
      )

      const path = await this.bot.getPathTo(goal)

      if (path.status == 'timeout') {
        this.blacklist.push(block.position)
        continue
      }

      try {
        await this.bot.mBot.pathfinder.goto(goal)
        this.bot.mBot.pathfinder.goal
      } catch (e) {
        this.blacklist.push(block.position)
        continue
      }

      await this.chop(block)

      for (const i in this.bot.mBot.entities) {
        const entity = this.bot.mBot.entities[i];


        if (entity.type != 'object')
          continue
          

        const data = entity.metadata[10] as ItemEntityData 
        if(!data)
          continue

        const block = this.bot.mcData.blocks[data.blockId]

        if(block.name != 'log')
          continue

        await this.bot.pickup(entity,true)

        
      }

    }
    console.log('NO MORE LOGS TO CHOP')
  }

  chop = async (block: Block) => {
    let item
    try {
      
    item = this.bot.mBot.pathfinder.bestHarvestTool(block)
    } catch (e) {
      
    }

    if(item)
      await this.bot.mBot.equip(
        item,
        'hand'
      )
    let done 
    do {
      try{
        done = false
        await this.bot.mBot.dig(block, true)
      } catch (e) {
        done = true
      }
      
    } while (done);

    console.log(`dug ${block.position}`)
  }

  findSomeLogs = async (range = 1000) => {
    return this.bot.mBot.findBlocks({
      matching: (x) =>
        x.name.endsWith('log') &&
        !this.blacklist.find((y) => y.distanceTo(x.position) == 0),
      maxDistance: range,
    })
  }

  override registerListeners = () => {
  }
  override removeListeners = () => {
  }

}
