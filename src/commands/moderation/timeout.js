const {
  SlashCommandBuilder,
  PermissionsBitField,
  MessageFlags,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
} = require("discord.js");

const db = require("../../database/database.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Rend un utilisateur muet temporairement")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers)
    .addUserOption((option) =>
      option
        .setName("utilisateur")
        .setDescription("L'utilisateur à rendre muet")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("time")
        .setDescription("La durée du mute en jours")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(28)
    )
    .addStringOption((option) =>
      option
        .setName("raison")
        .setDescription("La raison du mute")
        .setRequired(false)
    ),
  async execute(interaction) {
    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.ModerateMembers
      )
    ) {
      await interaction.reply({
        content: `Vous devez avoir la permission \`[ModerateMembers]\` pour effectuer cette commande`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const user = interaction.options.getUser("utilisateur");
    const target = await interaction.guild.members
      .fetch(user.id)
      .catch(() => null);
    const reason =
      interaction.options.getString("raison") || "Aucune raison fournie";

    const time = interaction.options.getInteger("time");
    const timeInMs = time * 24 * 60 * 60 * 1000;

    if (!target) {
      await interaction.reply({
        content: `Cet utilisateur n'a pas été trouvé sur le serveur`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (target.id == interaction.member.id) {
      await interaction.reply({
        content: `Vous ne pouvez pas vous rendre muet vous-même`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (target.id == interaction.client.user.id) {
      await interaction.reply({
        content: `Vous ne pouvez pas mute le bot`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!target.moderatable) {
      return interaction.reply({
        content:
          "❌ Je ne peux pas mute cet utilisateur\nAssurez-vous que j'ai la permission `Modérer les membres` et que mon rôle est placé plus haut que le sien",
        flags: MessageFlags.Ephemeral,
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0xa30000)
      .setTitle("Confirmation du mute")
      .setThumbnail(target.displayAvatarURL({ size: 64 }))
      .addFields(
        { name: "User", value: target.user.toString(), inline: true },
        { name: "Raison", value: reason, inline: true },
        { name: "Durée", value: time + " jours", inline: true },
        { name: "\u200B", value: "" }
      )
      .setFooter({
        text: `Par ${interaction.member.user.username}`,
        iconURL: `${interaction.member.displayAvatarURL({ size: 64 })}`,
      });

    const confirm = new ButtonBuilder()
      .setCustomId("confirm")
      .setLabel("Mute")
      .setStyle(ButtonStyle.Success);

    const cancel = new ButtonBuilder()
      .setCustomId("cancel")
      .setLabel("Annuler")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(confirm, cancel);

    const collectorFilter = (i) => i.user.id === interaction.user.id;

    const response = await interaction.reply({
      embeds: [embed],
      components: [row],
    });

    try {
      const confirmation = await response.awaitMessageComponent({
        filter: collectorFilter,
        componentType: ComponentType.Button,
        time: 60_000,
      });

      if (confirmation.customId === "confirm") {
        try {
          const dm = await target.createDM();
          await dm.send({
            embeds: [
              new EmbedBuilder()
                .setColor(0x28282B)
                .setTitle("🔇 Vous avez été rendu muet")
                .addFields(
                  {
                    name: "Serveur",
                    value: interaction.guild.name,
                    inline: true,
                  },
                  {name: "Durée", value: time + " jours", inline: true},
                  { name: "Raison", value: reason, inline: true }
                )
                .setTimestamp(),
            ],
          });
        } catch (err) {
          await interaction.editReply({
            content: `Impossible d'envoyer un DM à ${target.user.tag}. L'utilisateur ne sera pas prévenu`,
          });
          console.log(`Impossible d'envoyer un DM à  :`, err.message);
        }

        await target.timeout(timeInMs, reason);

        db.addMute(target.id, interaction.member.id, reason, time);

        await confirmation.update({
          content: `✅ ${target.user.username} a été rendu muet avec succès`,
          embeds: [],
          components: [],
        });
      } else if (confirmation.customId === "cancel") {
        await confirmation.update({
          content: "❌ Le mute a été annulé",
          embeds: [],
          components: [],
        });
      }
    } catch (e) {
      console.error("Erreur lors de la confirmation du mute:", e);

      await interaction.editReply({
        content:
          "⌛ Temps de confirmation écoulé ou une erreur est survenue, annulation du mute",
        embeds: [],
        components: [],
      });
    }
  },
};
