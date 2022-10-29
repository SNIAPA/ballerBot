import Bot from "./Bot";

export interface RoleOptions{
  bot:Bot
}

export default abstract class Role{
  bot:Bot
  constructor(options:RoleOptions){
    this.bot = options.bot
    
    this.registerListeners()
  }
  abstract execute(): Promise<void>

  registerListeners = () => {}
  removeListeners = () => {}
}
