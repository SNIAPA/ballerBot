import { Vec3 } from 'vec3'
import { pathfinder, Movements, goals } from 'mineflayer-pathfinder'
import Bot from '../Bot'
import Role from '../Role'

const GoalNear = goals.GoalNear

export default class WildChopper extends Role {
  constructor(bot: Bot) {
    super(bot)

  }
  async execute(): Promise<void>{
    console.log('loaded')
    const blacklist: Vec3[] = []
    while (true) {
      const block = this.bot.mBot.findBlock({
        matching: (x) =>
          x.name.endsWith('log') &&
          !blacklist.find((y) => y.distanceTo(x.position) == 0),
        maxDistance: 100,
      })
      if (!block) break

      const pos = block.position

      if (this.bot.mBot.canDigBlock(block)) {
        try {
          await this.bot.mBot.equip(
            this.bot.mBot.pathfinder.bestHarvestTool(block)!,
            'hand'
          )
          console.log(`digging ${pos}`), await this.bot.mBot.dig(block, true)
        } catch (e) {
          console.log(`failed to dig ${pos}`)
          blacklist.push(pos)
        }
        continue
      }

      // get path
      const goal = new GoalNear(pos.x, pos.y, pos.z, 3)
      const path = this.bot.mBot.pathfinder.getPathTo(
        this.bot.mBot.pathfinder.movements,
        goal
      )
      if (path.status != 'success') {
        console.log(`cant generatoe path to ${pos}`)
        blacklist.push(pos)
        continue
      }

      try {
        this.bot.mBot.pathfinder.tickTimeout = 50
        this.bot.mBot.pathfinder.thinkTimeout = 50
        await this.bot.mBot.pathfinder.goto(goal)
      } catch (e) {
        console.log(`failed to reach ${pos}`)
        blacklist.push(pos)
      }

      // can dig
      if (!block || !this.bot.mBot.canDigBlock(block)) {
        console.log(`cant dig${pos}`)
        blacklist.push(pos)
        continue
      }
      // dig
      try {
        await this.bot.mBot.equip(
          this.bot.mBot.pathfinder.bestHarvestTool(block)!,
          'hand'
        )
        console.log(`digging ${pos}`), await this.bot.mBot.dig(block, true)
      } catch (e) {
        console.log(`failed to dig ${pos}`)
        blacklist.push(pos)
      }

      // pickup
      // currently it pickups all items in the radius bevause there is no way to get the entity name
      for (const entity in this.bot.mBot.entities) {
        const val = this.bot.mBot.entities[entity]
        if (
          val.position.distanceTo(this.bot.mBot.entity.position) > 10 ||
          val.name != 'Item' ||
          this.bot.mcData.blocks[(val.metadata[10] as any).blockId] == undefined ||
          !this.bot.mcData.blocks[(val.metadata[10] as any).blockId].name.endsWith(
            'log'
          )
        )
          continue

        const goal = new GoalNear(
          val.position.x,
          val.position.y,
          val.position.z,
          0.1
        )
        const path = this.bot.mBot.pathfinder.getPathTo(
          this.bot.mBot.pathfinder.movements,
          goal
        )
        if (path.status != 'success') {
          console.log(`cant generatoe path to ${pos}`)
          blacklist.push(pos)
          continue
        }
        try {
          console.log(
            `picking up ${
              this.bot.mcData.blocks[(val.metadata[10] as any).blockId].name
            } ${val.position}`
          )
          await this.bot.mBot.pathfinder.goto(goal)
        } catch (e) {
          console.log(`failed to pickup ${val.position}`)
        }
      }
    }
    console.log('done')
  }
}
