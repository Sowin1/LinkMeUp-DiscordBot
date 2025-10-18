const {
  SlashCommandBuilder,
  CommandInteraction,
  AttachmentBuilder,
  EmbedBuilder,
} = require("discord.js");
const { createCanvas, loadImage } = require("canvas");
const db = require("../../database/database.js");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("leaderboard"),

  async execute(interaction) {
    await interaction.deferReply();
    const leaderboard = db.getLeaderboard();

    const fieldPromises = leaderboard.map(async (user, index) => {
      let userName;
      try {
        const member = await interaction.guild.members.fetch(user.userID);
        userName = member.user.username;
      } catch (error) {
        console.log(
          `Impossible de trouver l'utilisateur ${user.userID}, il a peut-être quitté`
        );
        userName = "Utilisateur Inconnu";
      }

      return {
        name: `${index + 1} **${userName}**`,
        value: `Niveau ${user.level} (${user.xp} XP)`,
        inline: false,
      };
    });

    const fields = await Promise.all(fieldPromises);

    const embed = new EmbedBuilder()
      .setColor(0xd15eff)
      .setTitle("Classement du serveur")
      .setDescription(":military_medal: **Top 10 des personnes**")
      .setThumbnail(interaction.guild.iconURL())
      .addFields(fields)
      .setFooter({
        text: `Demandé par ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    await interaction.editReply({
      embeds: [embed],
    });
  },
};
