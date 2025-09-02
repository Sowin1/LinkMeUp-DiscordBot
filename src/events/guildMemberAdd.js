
const { Events } = require("discord.js");
const config = require("../../config.js");
    
module.exports = {
  name: Events.GuildMemberAdd,
  once: false,
  
  async execute(member) {
    const channel = member.guild.channels.cache.get(config.welcomeChannelId);
    if (!channel) {
      console.log(`Channel introuvable ${channel}`);
      return
    }
    try {
      await channel.send(`Bienvenue ! ${member}`);
    } catch (error) {
      console.error("Erreur lors de l'envoi du message de bienvenue :", error);
    }
  },
};
