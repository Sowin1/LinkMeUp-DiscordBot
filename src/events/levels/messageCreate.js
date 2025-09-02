const { Events } = require("discord.js");
const config = require("../../../config.js");

module.exports = {
  name: Events.MessageCreate,
  once: false,

  async execute(message) {
    if (
      message.author.bot ||
      config.ignoredCategories.includes(message.channel.parentId) ||
      config.ignoredChannels.includes(message.channel.id)
    ) {
      return;
    }

    
  },
};
