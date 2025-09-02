const fs = require("node:fs");
const path = require("node:path");

const { Client, Collection, GatewayIntentBits } = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, "src", "commands");
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
  const folderPath = path.join(commandsPath, folder);
  const commandFiles = fs
    .readdirSync(folderPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(folderPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[AVERTISSEMENT] La commande à ${filePath} n'a pas les propriétés "data" ou "execute".`
      );
    }
  }
}

const eventsPath = path.join(__dirname, 'src', 'events');

const loadEvents = (dir) => {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.lstatSync(filePath);
    if (stat.isDirectory()) {
      loadEvents(filePath);
    } 
    else if (file.endsWith('.js')) {
      const event = require(filePath);
      if (event.name) {
        if (event.once) {
          client.once(event.name, (...args) => event.execute(...args));
        } else {
          client.on(event.name, (...args) => event.execute(...args));
        }
        console.log(`[EVENT] L'événement ${event.name} a été chargé.`);
      } else {
        console.log(`[AVERTISSEMENT] Le fichier d'événement à ${filePath} n'a pas de propriété "name".`);
      }
    }
  }
};

loadEvents(eventsPath);

client.login(process.env.TOKEN);
