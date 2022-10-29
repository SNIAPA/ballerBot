import Bot from "./Bot";

export interface RoleOptions{
  bot:Bot
}

export default abstract class Role{
  bot:Bot
  constructor(options:RoleOptions){
    this.bot = options.bot
    
  }
  abstract execute(): Promise<void>

  abstract registerListeners : () => void
  abstract removeListeners : () => void
}
