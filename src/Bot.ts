import MinecraftData from 'minecraft-data'
import { Bot as SBot, BotOptions, createBot } from 'mineflayer'
import minecraftData from 'minecraft-data'
import mineflayer from 'mineflayer'
const radar = require('mineflayer-radar')(mineflayer)
import cmd from 'mineflayer-cmd'
import {
  ComputedPath,
  pathfinder,
  Movements,
  goals as Goals,
  Pathfinder,
} from 'mineflayer-pathfinder'
import Role from './Role'
import WildChopper from './roles/WildChopper'
import { Entity } from 'prismarine-entity'
import BotError from './exceptions'

type RoleName = 'WILD_CHOPPER'

type Action = (bot: Bot) => Promise<void>


export default class Bot {
  mBot: SBot
  mcData: MinecraftData.IndexedData
  role?: Role
  actionQueue: Action[] = []

  constructor(options: BotOptions) {
    this.mBot = createBot(options)
    this.mcData = minecraftData(this.mBot.version)
    this.mBot.loadPlugin(pathfinder)
    this.mBot.pathfinder.setMovements(new Movements(this.mBot, this.mcData))

    this.mBot.on('spawn', () => {
      if (this.role) {
        this.role.execute()
      }
    })
    this.mBot.on('login', () => {
      console.log(`${this.mBot.username} is up`)
    })
  }

  setRole = (role: RoleName) => {
    if (this.role != null) this.role.removeListeners()

    let selectedRole
    switch (role) {
      case 'WILD_CHOPPER':
        selectedRole = new WildChopper(this)
        break
    }
    this.role = selectedRole
    this.role.registerListeners()
  }

  getPathTo = async (goal: Goals.Goal, timeout = 5000) => {
    const path = this.mBot.pathfinder.getPathFromTo(
      this.mBot.pathfinder.movements,
      this.mBot.entity.position,
      goal,
      { timeout }
    )
    let result
    do result = path.next()
    while (result.value.result.status == 'partial')
    return result.value.result as ComputedPath
  }

  pickup = async (entity: Entity) => {
    const goal = new Goals.GoalNear(
      entity.position.x,
      entity.position.y,
      entity.position.z,
      0.4
    )
    await this.mBot.pathfinder.goto(goal)
  }
}
