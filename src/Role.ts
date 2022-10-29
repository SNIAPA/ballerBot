import Bot from "./Bot";

export default abstract class Role{
  bot:Bot
  constructor(bot:Bot){
    this.bot = bot
    
  }
  abstract execute(): Promise<void>

  abstract registerListeners : () => void
  abstract removeListeners : () => void
}
