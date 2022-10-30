import { Vec3 } from 'vec3'
import {
  goals as Goals,
} from 'mineflayer-pathfinder'
import Role, { RoleOptions } from '../Role'
import { Block } from 'prismarine-block'
import { ItemEntityData } from '../types'

export default class WildChopper extends Role {
  blacklist: Vec3[] = []
  pickupQueue: (() => Promise<void>)[] = []

  constructor(options:RoleOptions) {
    super(options)
  }



  async execute(): Promise<void> {
    let blocks = await this.findSomeLogs();
    blocks.sort((a,b)=>a.distanceTo(this.bot.mBot.entity.position) - b.distanceTo(this.bot.mBot.entity.position))
    while (true) {
      if(blocks.length == 0){
        blocks = await this.findSomeLogs();
        blocks.sort((a,b)=>a.distanceTo(this.bot.mBot.entity.position) - b.distanceTo(this.bot.mBot.entity.position))
        if(blocks.length == 0){
          break
        }
      }


      const block = this.bot.mBot.blockAt(blocks[0]!) 
      blocks = blocks.slice(1,blocks.length)
      if (!block) break

      if (this.bot.mBot.canDigBlock(block)) {
        await this.chop(block)
        continue
      }


      for (const i in this.bot.mBot.entities) {
        const entity = this.bot.mBot.entities[i];


        if (entity.type != 'object')
          continue
          

        const data = entity.metadata[10] as ItemEntityData 
        if(!data)
          continue

        const block = this.bot.mcData.blocks[data.blockId] ?? this.bot.mcData.entities[data.blockId] ?? this.bot.mcData.items[data.blockId]

        if(block.name != 'log')
          continue

        await this.bot.pickup(entity)

        
      }


      // get path
      const goal = new Goals.GoalNear(
        block.position.x,
        block.position.y,
        block.position.z,
        3
      )


      console.time('thinking')
      const path = await this.bot.getPathTo(goal)
      console.timeEnd('thinking')

      if (path.status == 'timeout') {
        console.log('timeout')
        this.blacklist.push(block.position)
        continue
      }

      try {
        console.time('walking')
        await this.bot.mBot.pathfinder.goto(goal)
        console.timeEnd('walking')
      } catch (e) {
        console.error(e)
        console.timeEnd('walking')
        this.blacklist.push(block.position)
        continue
      }

      await this.chop(block)

      blocks.sort((a,b)=>a.distanceTo(this.bot.mBot.entity.position) - b.distanceTo(this.bot.mBot.entity.position))

    }
    console.log('NO MORE LOGS TO CHOP')
  }

  chop = async (block: Block) => {
    let item
      
      item = this.bot.mBot.pathfinder.bestHarvestTool(block)

    if(item){
      try {
        await this.bot.mBot.equip(
          item,
          'hand'
        )
      } catch (e) {
        
      }
    }
    let done 
    do {
      try{
        done = false
        await this.bot.mBot.dig(block, true)
      } catch (e) {
        done = true
      }
      
    } while (done);

  }

  findSomeLogs = async (range = 128) => {
    return this.bot.mBot.findBlocks({
      matching: (x) =>
        x.name == 'log' &&
        !this.blacklist.find(y=>y.distanceTo(x.position) == 0),
      maxDistance: range,
      count: 99999
    })
  }

  override registerListeners = () => {
  }
  override removeListeners = () => {
  }

}
