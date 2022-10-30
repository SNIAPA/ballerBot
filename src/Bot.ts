import MinecraftData from 'minecraft-data'
import { Vec3 } from 'vec3'
import {Bot as SBot, BotOptions, createBot} from 'mineflayer'
import minecraftData from 'minecraft-data'
import mineflayer from 'mineflayer'
const radar = require('mineflayer-radar')(mineflayer)
import cmd from 'mineflayer-cmd'
import { ComputedPath ,pathfinder, Movements, goals as Goals, Pathfinder } from 'mineflayer-pathfinder'
import Role, { RoleOptions } from './Role'
import WildChopper from './roles/WildChopper'
import { Entity } from 'prismarine-entity'
import BotError from './exceptions'
import LogFarmer from './roles/LogFarmer'

type RoleName = "WILD_CHOPPER" | "LOG_FARMER"




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
      case "WILD_CHOPPER":
        selectedRole = new WildChopper({bot:this})
        break;
      case "LOG_FARMER":
        selectedRole = new LogFarmer({bot:this, chestLocation:new Vec3(261, 121, 192), bedLocation:new Vec3(263, 121, 196)})
        break
    }
    this.role = selectedRole
    this.role.registerListeners()
  }

  async setSpawn(bedLocation: Vec3) {
    try { 
      await this.mBot.pathfinder.goto(new Goals.GoalNear(bedLocation.x, bedLocation.y, bedLocation.z, 1))
      await this.mBot.sleep(this.mBot.blockAt(bedLocation)!)}  catch { }
  }

  findByUsername(username:string) {
    var target = this.mBot.players[username]
    if(target){
      return(target)
    } else {
        return
    }
  }

  printLocation(username:string){
    var target = this.findByUsername(username)
    if (target){
      this.mBot.chat(`${username} is at X: ${Math.round(target.entity.position.x)} Y: ${Math.round(target.entity.position.y)} Z: ${Math.round(target.entity.position.z)}`)
    }
    
  }

  async gotoPlayer(username:string){
    var target = this.findByUsername(username)
    if(target ){
      try {
        this.mBot.pathfinder.goto(new Goals.GoalNear(target.entity.position.x, target.entity.position.y, target.entity.position.z, 0))
      } catch{
        console.log("Can't go to " + username)
      }
    } else {
        console.log("Can't find " + username)
    }
  }

  followPlayer(username:string) {
    var target = this.findByUsername(username)

    if (target) {
        try{
          this.mBot.pathfinder.stop()
          this.mBot.pathfinder.setGoal(new Goals.GoalFollow(target.entity, 2), true)
          console.log("Following " + username)
        } catch{
          console.log("Can't follow " + username)
      }
    } else {
      console.log("I cant see " + username)
    }
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

  pickup = async (entity: Entity, comeBack = false) => {
    const startingLocation = this.mBot.entity.position;
    const goal = new Goals.GoalNear(
      entity.position.x,
      entity.position.y,
      entity.position.z,
      0.4   
    )
    const path = await this.getPathTo(goal)

    if (path.status == 'timeout') {
      console.log(`path ${path.status} ${entity.position}`)
      return
    }
    await this.mBot.pathfinder.goto(goal)
    if (comeBack) {
      
      const goal = new Goals.GoalBlock(startingLocation.x,startingLocation.y,startingLocation.z)

      await this.mBot.pathfinder.goto(goal)

    }
  }


}
