const {
  SlashCommandBuilder,
  PermissionsBitField,
  MessageFlags,
  EmbedBuilder,
} = require("discord.js");

const db = require("../../database/database.js");

const sanctionEmojis = {
  warn: "⚠️",
  mute: "🔇",
  ban: "🚫",
  kick: "👢",
  default: "⚫",
};

const sanctionColors = {
  warn: 0xfaa81a,
  mute: 0x5865f2,
  ban: 0xed4245,
  kick: 0xeb8922,
  default: 0xa30000,
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("historique")
    .setDescription("Affiche l'historique d'un membre")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers)
    .addUserOption((option) =>
      option
        .setName("utilisateur")
        .setDescription("L'utilisateur verifier")
        .setRequired(true)
    )
    .addBooleanOption((option) =>
      option
        .setName("afficher")
        .setDescription("afficher publiquement l'historique")
        .setRequired(false)
    ),
  async execute(interaction) {
    const display = interaction.options.getBoolean("afficher") || false;
    const user = interaction.options.getUser("utilisateur");

    const criminalRecord = db.getSanctions(user.id);
    const sanctionsNb = criminalRecord.length;

    if (sanctionsNb === 0) {
      return interaction.reply({
        content: "Cet utilisateur n'a commis aucune infraction",
        flags: MessageFlags.Ephemeral,
      });
    }

    const sanctionsToDisplay = criminalRecord.slice(0, 10);

    const fieldPromises = sanctionsToDisplay.map(async (sanction, index) => {
      let moderatorTag = "ID Inconnu";
      try {
        const moderator = await interaction.client.users.fetch(
          sanction.moderatorID
        );
        moderatorTag = moderator.tag;
      } catch (e) {
        console.log("Impossible de fetch le modérateur", sanction.moderatorID);
      }

      const sanctionDate = Math.floor(sanction.createdAt / 1000);

      const fieldValue = [
        `**Raison :** ${sanction.reason || "Aucune raison spécifiée"}`,
        `**Modérateur :** ${moderatorTag}`,
        `**Date :** <t:${sanctionDate}:R>`,
        `**ID :** \`${sanction.sanctionID}\``,
      ].join("\n");

      const emoji = sanctionEmojis[sanction.type] || sanctionEmojis.default;
      const typeName =
        sanction.type.charAt(0).toUpperCase() + sanction.type.slice(1);
      const name = `${emoji} ${typeName} #${index + 1}`;

      return {
        name: name,
        value: fieldValue,
        inline: false,
      };
    });
    const embedFields = await Promise.all(fieldPromises);

    const embed = new EmbedBuilder()
      .setColor(
        sanctionColors[criminalRecord[0].type] || sanctionColors.default
      )
      .setTitle(`Casier judiciaire de \`${user.username}\``)
      .setDescription(
        `Affichage des ${sanctionsToDisplay.length} sanctions les plus récentes sur un total de ${sanctionsNb}`
      )
      .addFields(embedFields)
      .setThumbnail(user.displayAvatarURL());

    if (sanctionsNb > 10) {
      embed.setFooter({
        text: "Cet utilisateur a plus de 10 sanctions. Demandez au développeur pour la liste complète.",
      });
    }
    if (!display) {
      interaction.reply({
        flags: MessageFlags.Ephemeral,
        embeds: [embed],
      });
    } else {
      interaction.reply({
        embeds: [embed],
      });
    }
  },
};
