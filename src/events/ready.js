const { Events } = require("discord.js");

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    const timestamp = new Date().toISOString();
    console.log(`✅ Prêt ! Connecté en tant que ${client.user.tag} à ${timestamp}`);
  },
};
