import mineflayer from 'mineflayer'
import minecraftData from 'minecraft-data'
const radar = require('mineflayer-radar')(mineflayer)
const cmd = require('mineflayer-cmd')
import { pathfinder, Movements, goals } from 'mineflayer-pathfinder'
import { Vec3 } from 'vec3'

const GoalNear = goals.GoalNear

const options = {
  host: 'pcr.events',
  port: 25565,
  username: 'ßαɬɬҽɾ',

}

const bot = mineflayer.createBot(options)

radar(bot, {
  host: 'localhost',
  port: '36012',
})

bot.on('spawn', async () => {
  const mcData = minecraftData(bot.version)
  const defaultMove = new Movements(bot, mcData)
  bot.loadPlugin(pathfinder)
  bot.pathfinder.setMovements(defaultMove)

  console.log('loaded')
  const blacklist: Vec3[] = []
  while (true) {
    const block = bot.findBlock({
      matching: (x) =>
        x.name.endsWith('log') &&
        !blacklist.find((y) => y.distanceTo(x.position) == 0),
      maxDistance: 100,
    })
    if (!block) continue
    const pos = block.position

    // get path
    const goal = new GoalNear(pos.x, pos.y, pos.z, 1)

    try {
      await bot.pathfinder.goto(new GoalNear(pos.x, pos.y, pos.z, 3))
    } catch (e) {
      console.log(`couldnt get to ${pos}`)
      blacklist.push(pos)
    }

    // can dig
    if (!block || !bot.canDigBlock(block)) {
      console.log(`cant dig${pos}`)
      blacklist.push(pos)
      continue
    }
    // dig
    try {
      await bot.dig(block, true)
      console.log(`digging ${pos}`)
    } catch (e) {
      console.log(`failed to dig ${pos}`)
      blacklist.push(pos)
    }
    await new Promise(r => setTimeout(r, 20));

    // pickup
    // currently it pickups all items in the radius bevause there is no way to get the entity name
    for (const entity in bot.entities) {
      const val = bot.entities[entity]
      if (
        val.position.distanceTo(block.position) > 10 ||
        val.name != "Item" || 
        mcData.blocks[(val.metadata[10] as any).blockId].name.endsWith('log')
      )
        continue

      try {
        console.log(`picking up ${mcData.blocks[(val.metadata[10] as any).blockId].name} ${val.position}`)
        await bot.pathfinder.goto(
          new GoalNear(val.position.x, val.position.y, val.position.z, 1)
        )
      } catch (e) {
        console.log(`failed to pickup ${val.position}`)
      }
    }
    console.log('done')
  }
})
