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

export default class WildChopper extends Role {
  blacklist: Vec3[] = []

  constructor(bot: Bot) {
    super(bot)
  }

  chop = async (block: Block) => {
    let repeat
    do {
      repeat = false
      try {
        await this.bot.mBot.equip(
          this.bot.mBot.pathfinder.bestHarvestTool(block)!,
          'hand'
        )
        await this.bot.mBot.dig(block, true)
      } catch (e) {
        repeat = true
      }
    } while (repeat)
  }

  findNextLog = async () => {
    return this.bot.mBot.findBlock({
      matching: (x) =>
        x.name.endsWith('log') &&
        !this.blacklist.find((y) => y.distanceTo(x.position) == 0),
      maxDistance: 1000,
    })
  }

  pickupLogsAround = async () => {
    for (const entity in this.bot.mBot.entities) {
      const val = this.bot.mBot.entities[entity]
      if (
        val.position.distanceTo(this.bot.mBot.entity.position) > 10 ||
        val.name != 'Item' ||
        this.bot.mcData.blocks[(val.metadata[10] as any).blockId] ==
          undefined ||
        !this.bot.mcData.blocks[
          (val.metadata[10] as any).blockId
        ].name.endsWith('log')
      )
        continue

      await this.bot.pickup(val)
    }
  }

  async execute(): Promise<void> {
    while (true) {
      const block = await this.findNextLog()
      if (!block) break

      // get path
      const goal = new Goals.GoalNear(
        block.position.x,
        block.position.y,
        block.position.z,
        4
      )
      const path = await this.bot.getPathTo(goal,100)

      if (path.status == 'timeout') {
        this.blacklist.push(block.position)
        console.log(`path ${path.status}`)
        continue
      }

      await this.bot.mBot.pathfinder.goto(goal)

      await this.chop(block)

      await  this.pickupLogsAround()
    }
    console.log('NO MORE LOGS TO CHOP')
  }
}
