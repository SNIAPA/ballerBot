import { Vec3 } from 'vec3'
import { pathfinder, Movements, goals } from 'mineflayer-pathfinder'
import Bot from '../Bot'

const GoalNear = goals.GoalNear

export default class WildChopper {

  constructor(bot: Bot) {

    bot.mBot.on('spawn', async () => {
      console.log('loaded')
      const blacklist: Vec3[] = []
      while (true) {


        const block = bot.mBot.findBlock({
          matching: (x) =>
            x.name.endsWith('log') &&
            !blacklist.find((y) => y.distanceTo(x.position) == 0),
          maxDistance: 100,
        })
        if (!block) break

        const pos = block.position

        if (bot.mBot.canDigBlock(block)) {
          try {
            await bot.mBot.equip(bot.mBot.pathfinder.bestHarvestTool(block)!, "hand")
            console.log(`digging ${pos}`),
              await bot.mBot.dig(block, true)
          } catch (e) {
            console.log(`failed to dig ${pos}`)
            blacklist.push(pos)
          }
          continue
        }


        // get path
        const goal = new GoalNear(pos.x, pos.y, pos.z, 3)
        const path = bot.mBot.pathfinder.getPathTo(bot.mBot.pathfinder.movements, goal)
        if (path.status != 'success') {
          console.log(`cant generatoe path to ${pos}`)
          blacklist.push(pos)
          continue
        }

        try {
          bot.mBot.pathfinder.tickTimeout = 50
          bot.mBot.pathfinder.thinkTimeout = 50
          await bot.mBot.pathfinder.goto(goal)
        } catch (e) {
          console.log(`failed to reach ${pos}`)
          blacklist.push(pos)
        }

        // can dig
        if (!block || !bot.mBot.canDigBlock(block)) {
          console.log(`cant dig${pos}`)
          blacklist.push(pos)
          continue
        }
        // dig
        try {
          await bot.mBot.equip(bot.mBot.pathfinder.bestHarvestTool(block)!, "hand")
          console.log(`digging ${pos}`),
            await bot.mBot.dig(block, true)
        } catch (e) {
          console.log(`failed to dig ${pos}`)
          blacklist.push(pos)
        }

        // pickup
        // currently it pickups all items in the radius bevause there is no way to get the entity name
        for (const entity in bot.mBot.entities) {
          const val = bot.mBot.entities[entity]
          if (
            val.position.distanceTo(bot.mBot.entity.position) > 10 ||
            val.name != "Item" ||
            bot. mcData.blocks[(val.metadata[10] as any).blockId] == undefined ||
            !bot.mcData.blocks[(val.metadata[10] as any).blockId].name.endsWith('log')
          )
            continue

          const goal = new GoalNear(val.position.x, val.position.y, val.position.z, 0.1)
          const path = bot.mBot.pathfinder.getPathTo(bot.mBot.pathfinder.movements, goal)
          if (path.status != 'success') {
            console.log(`cant generatoe path to ${pos}`)
            blacklist.push(pos)
            continue
          }
          try {
            console.log(`picking up ${bot.mcData.blocks[(val.metadata[10] as any).blockId].name} ${val.position}`)
            await bot.mBot.pathfinder.goto(goal)
          } catch (e) {
            console.log(`failed to pickup ${val.position}`)
          }
        }
      }
      console.log('done')
    })
 }

}
