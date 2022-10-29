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

export default class WildChopper extends Role {
  blacklist: Vec3[] = []
  pickupQueue: (() => Promise<void>)[] = []

  constructor(bot: Bot) {
    super(bot)
  }



  async execute(): Promise<void> {
    while (true) {
      const block = await this.findNextLog()
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

    }
    console.log('NO MORE LOGS TO CHOP')
  }

  chop = async (block: Block) => {
    const item = this.bot.mBot.pathfinder.bestHarvestTool(block)

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

  }

  findNextLog = async () => {
    return this.bot.mBot.findBlock({
      matching: (x) =>
        x.name.endsWith('log') &&
        !this.blacklist.find((y) => y.distanceTo(x.position) == 0),
      maxDistance: 1000,
    })
  }

  override registerListeners = () => {
  }
  override removeListeners = () => {
  }

}
