import MinecraftData from 'minecraft-data'
import { Bot as SBot, BotOptions, createBot } from 'mineflayer'
import minecraftData from 'minecraft-data'
import {
  ComputedPath,
  pathfinder,
  Movements,
  goals as Goals,
} from 'mineflayer-pathfinder'
import Role from './Role'
import WildChopper from './roles/WildChopper'
import { Entity } from 'prismarine-entity'

type RoleName = 'WILD_CHOPPER'



export default class Bot {
  mBot: SBot
  mcData: MinecraftData.IndexedData
  role?: Role

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

  getPathTo = async (goal: Goals.Goal ) => {
    const path = this.mBot.pathfinder.getPathFromTo(
      this.mBot.pathfinder.movements,
      this.mBot.entity.position,
      goal,
      {tickTimeout:1000}
    )
    let result
    do result = path.next()
    while (result.value.result.status == 'partial')
    return result.value.result as ComputedPath
  }

  pickup = async (entity: Entity) => {
    const goal = new Goals.GoalXZ(
      entity.position.x,
      entity.position.z,
    )
    const path = await this.getPathTo(goal)

    if (path.status == 'timeout') {
      console.log(`path ${path.status} ${entity.position}`)
      return
    }
    await this.mBot.pathfinder.goto(goal)
  }
}
