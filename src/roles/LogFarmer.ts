import { Vec3 } from 'vec3'
import { goals } from "mineflayer-pathfinder"
import Bot from '../Bot'
import Role, { RoleOptions } from '../Role'
import minecraftData from "minecraft-data"
import { Options } from 'discord.js'

export interface LogFarmerOptions extends RoleOptions{
    chestLocation:Vec3
}

export default class LogFarmer extends Role {

    chestLocation:Vec3
    constructor(options:LogFarmerOptions) {
        super(options)
        this.chestLocation = options.chestLocation
    }

    mcData = minecraftData(this.bot.mBot.version)

    async execute() {
        try {
            // deposit all items except axe then pick up 64 saplings
            await this.deposit(this.chestLocation)
            // harvest wood and attempt to pick up all items and replant
            try {
                while (1) {
                    const toHarvest = this.bot.mBot.findBlock({
                        maxDistance: 40,
                        matching: x => x.name.endsWith("log")
                    })
                    
                    if (toHarvest) {
                        const goal = new goals.GoalNear(toHarvest.position.x, toHarvest.position.y, toHarvest.position.z, 4)
                        await this.bot.mBot.pathfinder.goto(goal)
                        try{if (this.bot.mBot.pathfinder.bestHarvestTool(toHarvest)) this.bot.mBot.equip(this.bot.mBot.pathfinder.bestHarvestTool(toHarvest)!, "hand")}catch{}
                        console.log("breaking log")
                        await this.bot.mBot.dig(toHarvest)
                        const harvestNext = this.bot.mBot.findBlock({
                            maxDistance: 3,
                            matching: x => x.name.endsWith("log")
                        })
                        if(harvestNext){
                            if(this.bot.mBot.canDigBlock(harvestNext)){ console.log("breaking log"), await this.bot.mBot.dig(harvestNext)}
                        }
                        try {
                            await this.pickUpItems(3)
                            await this.replant(2)
                        } catch { }

                    } else {
                        console.log("Couldn't break log")
                        break
                    }
                }
            } catch (err) {
                console.log(err)
            }
            // pick up missed items
            console.log("attempting to pick up all items")
            try {
                await this.pickUpItems(40)
            } catch (err) {
                console.log(err)
            }
            // replant missed plants
            let saplingCount = this.bot.mBot.inventory.findInventoryItem(this.mcData.itemsByName.sapling.id, null, false)?.count
            while((saplingCount) && (saplingCount > 0)){
                await this.replant(40)
            }
        } catch (e) {
            console.log(e)
            console.log("=== CRASH ===")
        }
        console.log("done")
        setTimeout(this.execute, 500)
    }

    // method for depositing items in inventory except axe and then pick up 64 saplings
    private async deposit(chestLocation:Vec3) {
        await this.bot.mBot.pathfinder.goto(new goals.GoalNear(chestLocation.x, chestLocation.y, chestLocation.z, 1))
        let chest = await this.bot.mBot.openContainer(this.bot.mBot.blockAt(chestLocation)!)
        let n = this.bot.mBot.inventory.slots.length + 1
        console.log("starting deposit...")
        while (n > 0) {
            let slot = this.bot.mBot.inventory.slots[n]
            if (slot && !slot.name.includes("axe")) {
                console.log(`deposited  ${slot.count} ${slot.name}`)
                try {await chest.deposit(slot.type, null, slot.count) } catch (err) { }
            }
            n = n - 1
        }
        setTimeout(() => {
            chest.close()
        }, 500);
        console.log("done depositing")
        n = chest.slots.length
        while (n > 0) {
            if (chest.slots[n] && chest.slots[n].name == "sapling") {
                try { await chest.withdraw(chest.slots[n].type, null, 64) } catch (err) { }
                console.log("withdrew 64 saplings")
                break
            }
            n = n - 1
        }
    }

    async pickUpItems(distance: number) {
        for (var n in this.bot.mBot.entities) {
            var val = this.bot.mBot.entities[n]
            try {
                if (val && val.name == "Item" && val.position.distanceTo(this.bot.mBot.entity.position) < distance) {
                    try {
                        console.log(`picking up ${val.position}`)
                        await this.bot.mBot.pathfinder.goto(
                            new goals.GoalNear(val.position.x, this.bot.mBot.entity.position.y, val.position.z, 0.5)
                        )
                    } catch (e) {
                        console.log(`failed to pickup ${val.position}`)
                    }
                }
            } catch (e) { console.log(e) }
        }
    }

    // method to equip sapling then place on valid block
    async replant(distance: number) {
        const toReplant = this.bot.mBot.findBlock({
            point: this.bot.mBot.entity.position,
            matching: x => ((x.name.includes("grass") || x.name.includes("dirt")) && this.bot.mBot.blockAt(x!.position.offset(0, 1, 0))!.name.includes("air")),
            maxDistance: distance
        })
        if (toReplant) {
            let saplingCount = this.bot.mBot.inventory.findInventoryItem(this.mcData.itemsByName.sapling.id, null, false)?.count
            if((saplingCount) && (saplingCount > 0)){
                console.log("replanting")
                await this.bot.mBot.pathfinder.goto(new goals.GoalNear(toReplant.position.x, toReplant.position.y, toReplant.position.z, 4))
                try{await this.bot.mBot.equip(this.mcData.itemsByName.sapling.id, 'hand')} catch{}
                await this.bot.mBot.placeBlock(toReplant, new Vec3(0, 1, 0))
            } else{
                console.log("No saplings, skipping replant")
                return true
            }
            
        }
    }
    
    override registerListeners = () => {
    }
    override removeListeners = () => {
    }
}
