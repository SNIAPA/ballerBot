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
      const path = await this.bot.getPathTo(goal, 300)

      if (path.status == 'timeout') {
        this.blacklist.push(block.position)
        console.log(`path ${path.status}`)
        continue
      }

      await this.bot.mBot.pathfinder.goto(goal)
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
    await this.bot.mBot.dig(block, true)
  }

  findNextLog = async () => {
    return this.bot.mBot.findBlock({
      matching: (x) =>
        x.name.endsWith('log') &&
        !this.blacklist.find((y) => y.distanceTo(x.position) == 0),
      maxDistance: 1000,
    })
  }

  onEntityDrop = async (e: Entity) => {
    console.log(e.name)
    return
    if (
      e.position.distanceTo(this.bot.mBot.entity.position) > 10 ||
      e.name != 'Item' ||
      this.bot.mcData.blocks[(e.metadata[10] as any).blockId] == undefined ||
      !this.bot.mcData.blocks[(e.metadata[10] as any).blockId].name.endsWith(
        'log'
      )
    )
      await this.bot.pickup(e)
  }

  override registerListeners = () => {
    console.log('loadListeners')
    this.bot.mBot.on("itemDrop",this.onEntityDrop)
  }
  override removeListeners = () => {
    this.bot.mBot.removeListener("itemDrop",this.onEntityDrop)
  }

}
