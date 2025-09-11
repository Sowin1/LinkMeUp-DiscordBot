const { SlashCommandBuilder } = require("discord.js");
const db = require("../../database/database.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Affiche le niveau de l'utilisateur")
    .addUserOption((option) =>
      option
        .setName("membre")
        .setDescription("Le membre dont tu veux voir le niveau")
        .setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser("membre") || interaction.user;

    const userData = db.getUser(user.id);

    if (!userData) {
      return interaction.reply({
        content: "Utilisateur non trouvé dans la base de données",
        flags: MessageFlags.Ephemeral,
      });
    }

    interaction.reply({
      content: `🎖️ ${user} est au niveau **${userData.level}** avec **${userData.xp}** XP`,
    });
  },
};
