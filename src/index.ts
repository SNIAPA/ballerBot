import Bot from "./Bot";


const options = {
  host: 'pcr.events',
  port: 25565,
  username: 'BALLER_BOT',
  version:"1.8.9"

}

const bot = new Bot(options)

bot.setRole("LOG_FARMER")


