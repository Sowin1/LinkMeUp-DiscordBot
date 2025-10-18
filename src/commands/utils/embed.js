const { flatten } = require("discord.js");
const {
  SlashCommandBuilder,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  MessageFlags,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Crée ou modifie un embed.")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addStringOption((option) =>
      option
        .setName("action")
        .setDescription("Que souhaitez-vous faire ?")
        .setRequired(true)
        .addChoices(
          { name: "Créer", value: "creer" },
          { name: "Modifier", value: "modifier" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("message_id")
        .setDescription(
          "L'ID du message à modifier (requis si action='Modifier')"
        )
        .setRequired(false)
    )
    .addChannelOption((option) =>
      option
        .setName("salon")
        .setDescription(
          "Le salon où envoyer ou modifier le message (défaut: salon actuel)"
        )
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),

  async execute(interaction) {
    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {
      return interaction.reply({
        content: `Vous devez avoir la permission \`[Administrator]\` pour effectuer cette commande`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const defaultColor = "#A30000";
    const action = interaction.options.getString("action");

    if (action === "creer") {
      const modal = new ModalBuilder()
        .setCustomId("embed_builder_modal_create")
        .setTitle("Créateur d'Embed");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("title_input")
            .setLabel("Titre de l'embed")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Quel titre souhaitez-vous donner à votre embed ?")
            .setMaxLength(256)
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("desc_input")
            .setLabel("Description de l'embed")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder(
              "Quelle description souhaitez-vous donner à votre embed ?"
            )
            .setMaxLength(4000)
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("color_input")
            .setLabel("Couleur ")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Ex: #FF5733 (défaut: #A30000)")
            .setMaxLength(7)
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("image_input")
            .setLabel("URL de l'Image Principale")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("https://i.imgur.com/...")
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("footer_input")
            .setLabel("Footer de l'embed")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder(`Quel footer souhaitez-vous donner à votre embed ?`)
            .setRequired(false)
        )
      );

      await interaction.showModal(modal);

      try {
        const modalSubmit = await interaction.awaitModalSubmit({
          time: 300_000,
          filter: (i) => i.user.id === interaction.user.id,
        });

        const finalEmbed = new EmbedBuilder();
        const title = modalSubmit.fields.getTextInputValue("title_input");
        const description = modalSubmit.fields.getTextInputValue("desc_input");
        const color = modalSubmit.fields.getTextInputValue("color_input");
        const image = modalSubmit.fields.getTextInputValue("image_input");
        const footer = modalSubmit.fields.getTextInputValue("footer_input");

        if (title) finalEmbed.setTitle(title);
        if (description) finalEmbed.setDescription(description);

        if (color && /^#[0-9A-F]{6}$/i.test(color)) {
          finalEmbed.setColor(color);
        } else {
          finalEmbed.setColor(defaultColor);
        }

        if (
          image &&
          (image.startsWith("http://") || image.startsWith("https://"))
        ) {
          finalEmbed.setImage(image);
        }

        const footerText = footer || `Demandé par ${interaction.user.username}`;
        finalEmbed.setFooter({
          text: footerText,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        });

        const targetChannel =
          interaction.options.getChannel("salon") || interaction.channel;

        await modalSubmit.reply({
          content: `Embed créé avec succès ! Il sera envoyé dans ${targetChannel}.`,
          flags: MessageFlags.Ephemeral,
        });

        const botPerms = targetChannel.permissionsFor(client.user);

        if (!botPerms || !botPerms.has(["ViewChannel", "SendMessages"])) {
          return interaction.reply({
            content: "Je n'ai pas accès au channel spécifié",
            flags: MessageFlags.Ephemeral,
          });
        }

        await targetChannel.send({
          embeds: [finalEmbed],
        });
      } catch (error) {
        console.error("Erreur (création embed) :", error);
        if (error.code === "InteractionCollectorError") {
        }
      }
    } else if (action === "modifier") {
      const messageId = interaction.options.getString("message_id");
      const channel =
        interaction.options.getChannel("salon") || interaction.channel;

      if (!messageId) {
        return interaction.reply({
          content:
            "❌ Pour 'modifier', vous devez fournir l'option `message_id`.",
          flags: MessageFlags.Ephemeral,
        });
      }

      let targetMessage;
      try {
        targetMessage = await channel.messages.fetch(messageId);
      } catch (e) {
        return interaction.reply({
          content: `❌ Message introuvable avec l'ID \`${messageId}\` dans le salon ${channel}.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      if (targetMessage.author.id !== interaction.client.user.id) {
        return interaction.reply({
          content:
            "❌ Je ne peux modifier que les embeds que j'ai moi-même envoyés.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const oldEmbed = targetMessage.embeds[0];
      if (!oldEmbed) {
        return interaction.reply({
          content: "❌ Ce message ne contient pas d'embed à modifier.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const modal = new ModalBuilder()
        .setCustomId(`embed_builder_modal_edit_${messageId}`)
        .setTitle("Modificateur d'Embed");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("title_input")
            .setLabel("Titre")
            .setStyle(TextInputStyle.Short)
            .setValue(oldEmbed.title || "")
            .setMaxLength(256)
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("desc_input")
            .setLabel("Description")
            .setStyle(TextInputStyle.Paragraph)
            .setValue(oldEmbed.description || "")
            .setMaxLength(4000)
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("color_input")
            .setLabel("Couleur (Hexadécimal)")
            .setStyle(TextInputStyle.Short)
            .setValue(oldEmbed.hexColor || defaultColor)
            .setMaxLength(7)
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("image_input")
            .setLabel("URL de l'Image Principale")
            .setStyle(TextInputStyle.Short)
            .setValue(oldEmbed.image?.url || "")
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("footer_input")
            .setLabel("Texte du Pied de page")
            .setStyle(TextInputStyle.Short)
            .setValue(oldEmbed.footer?.text || "")
            .setRequired(false)
        )
      );

      await interaction.showModal(modal);

      try {
        const modalSubmit = await interaction.awaitModalSubmit({
          time: 300_000,
          filter: (i) => i.user.id === interaction.user.id,
        });

        const newEmbed = new EmbedBuilder();
        const title = modalSubmit.fields.getTextInputValue("title_input");
        const description = modalSubmit.fields.getTextInputValue("desc_input");
        const color = modalSubmit.fields.getTextInputValue("color_input");
        const image = modalSubmit.fields.getTextInputValue("image_input");
        const footer = modalSubmit.fields.getTextInputValue("footer_input");

        if (title) newEmbed.setTitle(title);
        if (description) newEmbed.setDescription(description);

        if (color && /^#[0-9A-F]{6}$/i.test(color)) {
          newEmbed.setColor(color);
        } else {
          newEmbed.setColor(oldEmbed.hexColor || defaultColor);
        }

        if (
          image &&
          (image.startsWith("http://") || image.startsWith("https://"))
        ) {
          newEmbed.setImage(image);
        } else if (image) {
          if (oldEmbed.image?.url) newEmbed.setImage(oldEmbed.image.url);
        } else {
          newEmbed.setImage(null);
        }

        if (footer) {
          newEmbed.setFooter({
            text: footer,
            iconURL:
              oldEmbed.footer?.iconURL ||
              interaction.user.displayAvatarURL({ dynamic: true }),
          });
        } else {
          newEmbed.setFooter(null);
        }

        await targetMessage.edit({ embeds: [newEmbed] });

        await modalSubmit.reply({
          content: `✅ L'embed [message](${targetMessage.url}) a été modifié avec succès !`,
          flags: MessageFlags.Ephemeral,
        });
      } catch (error) {
        console.error("Erreur (modification embed) :", error);
        if (error.code === "InteractionCollectorError") {
        }
      }
    }
  },
};
