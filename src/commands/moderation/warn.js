const {
  SlashCommandBuilder,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags,
} = require("discord.js");

const db = require("../../database/database.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("avertir")
    .setDescription("Avertir un utilisateur")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
    .addUserOption((option) =>
      option
        .setName("utilisateur")
        .setDescription("L'utilisateur à avertir")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("raison")
        .setDescription("La raison de l'avertissement")
        .setRequired(false)
    ),

  async execute(interaction) {
    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.ManageMessages
      )
    ) {
      await interaction.reply({
        content: `Vous devez avoir la permission \`[ManageMessages]\` pour effectuer cette commande`,
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

    if (!target) {
      await interaction.reply({
        content: `Cet utilisateur n'a pas été trouvé sur le serveur`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (target.id == interaction.member.id) {
      await interaction.reply({
        content: `Vous ne pouvez pas vous avertir vous-mêmes`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (target.id == interaction.client.user.id) {
      await interaction.reply({
        content: `Vous ne pouvez pas avertir le bot`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xfdee00)
      .setTitle("Confirmation de l'avertissement")
      .setThumbnail(target.displayAvatarURL({ size: 64 }))
      .addFields(
        { name: "User", value: target.user.toString(), inline: true },
        { name: "Raison", value: reason, inline: true },
        { name: "\u200B", value: "" }
      )
      .setFooter({
        text: `Par ${interaction.member.user.username}`,
        iconURL: `${interaction.member.displayAvatarURL({ size: 64 })}`,
      });

    const confirm = new ButtonBuilder()
      .setCustomId("confirm")
      .setLabel("Avertir")
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
                .setColor(0xfaa81a)
                .setTitle("⚠️ Vous avez été avertie")
                .addFields(
                  {
                    name: "Serveur",
                    value: interaction.guild.name,
                    inline: true,
                  },
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

        await confirmation.update({
          content: `✅ ${target.user.username} a été avertie avec succès`,
          embeds: [],
          components: [],
        });

        db.addWarn(target.id, interaction.member.id, reason);
      } else if (confirmation.customId === "cancel") {
        await confirmation.update({
          content: "❌ L'avertissement a été annulé",
          embeds: [],
          components: [],
        });
      }
    } catch (e) {
      console.error("Erreur du collecteur (warn):", e);
      await interaction.editReply({
        content:
          "⌛ Temps de confirmation écoulé, annulation de l'avertissement",
        embeds: [],
        components: [],
      });
    }
  },
};
