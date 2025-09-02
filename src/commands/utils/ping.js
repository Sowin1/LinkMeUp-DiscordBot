const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Affiche la latence du bot.'),
  async execute(interaction) {
    const sent = await interaction.reply({ content: 'Calcul du ping...', fetchReply: true });
    interaction.editReply(`Pong ! 🏓 La latence est de ${sent.createdTimestamp - interaction.createdTimestamp}ms.`);
  },
};