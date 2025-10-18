const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("Affiche les informations du bot"),
  async execute(interaction) {
    const { client } = interaction;

    const formatUptime = () => {
      const totalSeconds = Math.floor(client.uptime / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      return `${days}j ${hours}h ${minutes}m`;
    };

    const embed = new EmbedBuilder()
      .setColor("#3B82F6")
      .setTitle("🔹 LinkMeUp Bot - Informations")
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .setDescription(`Développé avec ❤️ par <@375933463255056384>\n`)
      .addFields(
        { name: "📦 Version", value: "v0.6", inline: true },
        { name: "🕒 Uptime", value: formatUptime(), inline: true },
        {
          name: "💾 Mémoire",
          value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(
            1
          )} MB`,
          inline: true,
        },
        {
          name: "👥 Utilisateurs",
          value: `${interaction.guild.memberCount}`,
          inline: true,
        },
        {
          name: "⚙️ Environnement",
          value: `Node.js ${process.version}`,
          inline: true,
        },
        {
          name: "⭐ Soutenir le bot",
          value:
            "[ Donne une étoile sur GitHub](https://github.com/Sowin1/LinkMeUp-DiscordBot) c’est rapide et ça aide beaucoup ❤️",
          inline: false,
        }
      )
      .setFooter({
        text: `Demandé par ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
