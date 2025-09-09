const {
  SlashCommandBuilder,
  CommandInteraction,
  AttachmentBuilder,
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

    try {
      const canvas = createCanvas(1080, 1350);
      const context = canvas.getContext("2d");

      const bgPath = path.join(__dirname, "../../../pictures/leaderboard.png");
      const bgImage = await loadImage(bgPath);
      context.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

      const rawLeaderboard = db.getLeaderboard();
      const leader = await addAvatarToList(rawLeaderboard, interaction.guild);
      await drawAvatars(context, leader);

      const buffer = canvas.toBuffer("image/png");
      const attachment = new AttachmentBuilder(buffer, {
        name: "image-generee.png",
      });

      await interaction.editReply({ files: [attachment] });
    } catch (error) {
      console.error(
        "Une erreur est survenue lors de la création de l'image:",
        error
      );
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          content:
            "Désolé, une erreur est survenue lors de la création de l'image",
        });
      } else {
        await interaction.reply({
          content:
            "Désolé, une erreur est survenue lors de la création de l'image",
          ephemeral: true,
        });
      }
    }
  },
};

async function addAvatarToList(liste, guild) {
  for (const user of liste) {
    if (!user || !user.userID) {
      console.warn(
        "Utilisateur invalide ou sans ID détecté dans la liste :",
        user
      );
      if (user) user.img = "https://i.imgur.com/AfFp7pu.png";
      continue;
    }

    try {
      const member = await guild.members.fetch({
        user: user.userID,
        force: true,
      });

      if (member && member.user) {
        user.img = member.user.displayAvatarURL({
          extension: "png",
          size: 256,
        });
      } else {
        user.img = "https://i.imgur.com/AfFp7pu.png";
      }
    } catch (error) {
      console.error(
        `Impossible de récupérer l'avatar de ${user.userID}:`,
        error
      );
      user.img = "https://i.imgur.com/AfFp7pu.png";
    }
  }
  return liste;
}

async function drawAvatars(context, leader) {
  const avatarSize = 120;
  const startX = 200;
  const startY = 200;
  const gapY = 180;

  for (let i = 0; i < leader.length; i++) {
    const user = leader[i];
    try {
      const avatarImage = await loadImage(user.img);
      const x = startX;
      const y = startY + i * gapY;

      context.save();
      context.beginPath();
      context.arc(x, y, avatarSize / 2, 0, Math.PI * 2, true);
      context.closePath();
      context.clip();

      context.drawImage(
        avatarImage,
        x - avatarSize / 2,
        y - avatarSize / 2,
        avatarSize,
        avatarSize
      );
      context.restore();

      context.beginPath();
      context.arc(x, y, avatarSize / 2, 0, Math.PI * 2, true);
      context.strokeStyle = "white";
      context.lineWidth = 6;
      context.stroke();
    } catch (error) {
      console.error(`Erreur lors du dessin de l'avatar de ${user.id}:`, error);
    }
  }
}
