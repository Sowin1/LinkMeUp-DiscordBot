const { Events } = require("discord.js");
const config = require("../../config.js");

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,

  async execute(member) {
    const channel = member.guild.channels.cache.get(config.welcomeChannelId);
    if (!channel) {
      console.log(`Channel introuvable ${channel}`);
      return;
    }
    try {
      await channel.send(
        `👋  Bienvenue ${member} ! \n Ravi de t’avoir avec nous. \n N’hésite pas à aller voir le salon <#1369292347518750740> et de te présenter dans <#1377290806515470397> ! \n Au plaisir de collaborer avec toi 🤝`
      );
    } catch (error) {
      console.error("Erreur lors de l'envoi du message de bienvenue :", error);
    }
  },
};
