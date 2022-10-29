import Bot from "./Bot";

export default abstract class Role{
  bot:Bot
  constructor(bot:Bot){
    this.bot = bot
    
    this.registerListeners()
  }
  abstract execute(): Promise<void>

  registerListeners = () => {}
  removeListeners = () => {}
}
