const {
  SlashCommandBuilder,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Crée et modifie un embed de manière interactive.")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        content: `Vous devez avoir la permission \`[Administrator]\` pour effectuer cette commande.`,
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setColor("#A30000")
      .setTitle("Titre de l'embed")
      .setDescription("Description de l'embed. Choisissez une option ci-dessous pour la modifier.")
      .setThumbnail("https://i.imgur.com/vnWSVCL.jpeg")
      .setFooter({
        text: `Demandé par ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    const menu = new StringSelectMenuBuilder()
      .setCustomId('embed_editor_menu')
      .setPlaceholder('Choisissez une propriété à modifier')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('Titre')
          .setDescription('Modifier le titre de l\'embed')
          .setValue('title')
          .setEmoji('✏️'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Description')
          .setDescription('Modifier la description de l\'embed')
          .setValue('description')
          .setEmoji('📜'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Couleur')
          .setDescription('Modifier la couleur de la bordure (format hexadécimal)')
          .setValue('color')
          .setEmoji('🎨'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Miniature (Thumbnail)')
          .setDescription('Modifier l\'image miniature (doit être une URL)')
          .setValue('thumbnail')
          .setEmoji('🖼️'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Image Principale')
          .setDescription('Modifier l\'image principale de l\'embed (doit être une URL)')
          .setValue('image')
          .setEmoji('🏞️'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Pied de page (Footer)')
          .setDescription('Modifier le texte du pied de page')
          .setValue('footer_text')
          .setEmoji('👣')
      );

    const row = new ActionRowBuilder().addComponents(menu);

    const initialMessage = await interaction.reply({
      embeds: [embed],
      components: [row],
      fetchReply: true,
    });

    const userFilter = (i) => i.user.id === interaction.user.id;

    const menuCollector = initialMessage.createMessageComponentCollector({
      filter: userFilter,
      componentType: ComponentType.StringSelect,
      time: 180000   
    });

    menuCollector.on('collect', async (menuInteraction) => {
      const selectedValue = menuInteraction.values[0];
      await menuInteraction.reply({
        content: `Très bien ! Veuillez envoyer le nouveau contenu pour : **${selectedValue}**.`,
        ephemeral: true
      });
      const textFilter = (msg) => msg.author.id === interaction.user.id;
      const textCollector = interaction.channel.createMessageCollector({
        filter: textFilter,
        max: 1,
        time: 60000 
      });

      textCollector.on('collect', async (msg) => {
        try {
          if (!menuInteraction.deferred && !menuInteraction.replied) {
              await menuInteraction.deferUpdate();
          }

          let updateSuccessful = true;
          let errorMessage = "";

          switch (selectedValue) {
            case 'title':
              if (msg.content.length > 256) {
                errorMessage = "Le titre ne peut pas dépasser 256 caractères.";
                updateSuccessful = false;
              } else {
                embed.setTitle(msg.content);
              }
              break;
            case 'description':
              if (msg.content.length > 4096) {
                  errorMessage = "La description ne peut pas dépasser 4096 caractères.";
                  updateSuccessful = false;
              } else {
                embed.setDescription(msg.content);
              }
              break;
            case 'color':
              if (/^#[0-9A-F]{6}$/i.test(msg.content)) {
                embed.setColor(msg.content);
              } else {
                errorMessage = "Format de couleur invalide. Utilisez un code hexadécimal comme `#FF5733`.";
                updateSuccessful = false;
              }
              break;
            case 'thumbnail':
            case 'image':
              if (msg.content.startsWith('http://') || msg.content.startsWith('https://')) {
                if (selectedValue === 'thumbnail') embed.setThumbnail(msg.content);
                if (selectedValue === 'image') embed.setImage(msg.content);
              } else {
                errorMessage = "L'URL fournie n'est pas valide. Elle doit commencer par `http://` ou `https://`.";
                updateSuccessful = false;
              }
              break;
            case 'footer_text':
              if (msg.content.length > 2048) {
                  errorMessage = "Le pied de page ne peut pas dépasser 2048 caractères.";
                  updateSuccessful = false;
              } else {
                embed.setFooter({
                  text: msg.content,
                  iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                });
              }
              break;
          }

          await msg.delete();

          if (updateSuccessful) {
            await initialMessage.edit({ embeds: [embed] });
            await menuInteraction.followUp({ content: `✅ La propriété **${selectedValue}** a été mise à jour !`, ephemeral: true });
          } else {
            await menuInteraction.followUp({ content: `❌ Erreur : ${errorMessage}`, ephemeral: true });
          }

        } catch (error) {
          console.error("Erreur lors de la mise à jour de l'embed :", error);
          await menuInteraction.followUp({ content: "Une erreur est survenue lors de la modification.", ephemeral: true });
        }
      });

      textCollector.on('end', (collected, reason) => {
        if (reason === 'time') {
          menuInteraction.followUp({ content: 'Le temps pour envoyer le texte est écoulé. Opération annulée.', ephemeral: true });
        }
      });
    });

    menuCollector.on('end', (collected, reason) => {
      if (reason === 'time') {
        const disabledRow = new ActionRowBuilder().addComponents(
          menu.setDisabled(true).setPlaceholder("Le temps pour modifier cet embed est écoulé.")
        );
        initialMessage.edit({ components: [disabledRow] }).catch(console.error);
      }
    });
  },
};