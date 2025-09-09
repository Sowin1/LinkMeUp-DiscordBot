const {
  SlashCommandBuilder,
  PermissionsBitField,
  MessageFlags,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sondage")
    .setDescription("Crée un sondage avec une question et des options")
    .addStringOption((option) =>
      option
        .setName("sujet")
        .setDescription("Le sujet du sondage")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),

  async execute(interaction) {
    const member = interaction.member;
    if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      await interaction.reply({
        content: `Vous devez avoir la permission \`[ManageMessages]\` pour effectuer cette commande`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const topic = interaction.options.getString("sujet") || "Undefined";
    const embed = {
      color: 0x03b894,
      title: "Nouveaux sondages",
      description: topic,
      thumbnail: { url: `${interaction.guild.iconURL({size: 64,})}` },
      footer: {
        text: `Sondage créé par ${interaction.user.displayName}`,
        icon_url: `${interaction.user.displayAvatarURL()}`,
      },
    };

    await interaction.reply({ embeds: [embed] });
  },
};
