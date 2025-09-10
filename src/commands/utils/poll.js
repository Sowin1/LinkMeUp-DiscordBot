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
    .addStringOption((option) =>
      option
        .setName("reponse1")
        .setDescription("La première réponse possible")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("reponse2")
        .setDescription("La deuxième réponse possible")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("reponse3")
        .setDescription("La troisième réponse possible")
        .setRequired(false)
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

    const response1 = interaction.options.getString("reponse1") || null;
    const response2 = interaction.options.getString("reponse2") || null;
    const response3 = interaction.options.getString("reponse3") || null;

    const topic = interaction.options.getString("sujet") || "Undefined";
    const embed = new EmbedBuilder()
      .setColor(0x03b894)
      .setTitle("📊 Nouveau sondage")
      .setDescription(topic)
      .setThumbnail(interaction.guild.iconURL({ size: 64 }))
      .setFooter({
        text: `Sondage créé par ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL(),
      });

    embed.fields = [];
    if (response1) {
      embed.fields.push({
        name: "1️⃣ Option 1",
        value: response1,
        inline: true,
      });
    }
    if (response2) {
      embed.fields.push({
        name: "2️⃣ Option 2",
        value: response2,
        inline: true,
      });
    }
    if (response3) {
      embed.fields.push({
        name: "3️⃣ Option 3",
        value: response3,
        inline: true,
      });
    }

    const pollMessage = await interaction.reply({
      embeds: [embed],
      fetchReply: true,
    });

    if (response1 != null || response2 != null || response3 != null) {
      if (response1) pollMessage.react("1️⃣");
      if (response2) pollMessage.react("2️⃣");
      if (response3) pollMessage.react("3️⃣");
    } else {
      pollMessage.react("✅");
      pollMessage.react("❌");
    }
  },
};
