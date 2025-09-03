const { Events } = require("discord.js");
const config = require("../../../config.js");
const db = require("../../database/database.js");

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

    const user = message.author.id;
    let userInDB = db.getUser(user);

    if (!userInDB) {
      db.setUser(user, 0, 0);
      userInDB = db.getUser(user);
    }

    const lastMessageTime = userInDB.lastMessageTimestamp || 0;
    const currentTime = Date.now();
    const timeDiff = currentTime - lastMessageTime;

    if (timeDiff < config.COOLDOWN * 1000) {
      return;
    }

    const mentionRegex = /<(@!?|@&|#|a?:.+?:)\d+>/g;

    let userMessage = message.content;

    userMessage = userMessage.replace(mentionRegex, "");
    userMessage = userMessage.replaceAll(" ", "");
    const nbCharMessager = userMessage.length;

    const xpToAdd = calculateXp(nbCharMessager);

    const newXp = userInDB.xp + xpToAdd;

    db.setUser(user, newXp, userInDB.level);

    let updatedUserData = db.getUser(user);
    let xpNeededForNextLevel = calculateXpForLevel(updatedUserData.level);

    while (updatedUserData.xp >= xpNeededForNextLevel) {
      const newLevel = updatedUserData.level + 1;
      db.setUser(user, updatedUserData.xp, newLevel);
      await message.channel.send(
        `🎉 Bravo ${message.author}, tu as atteint le niveau **${newLevel}** !`
      );
      updatedUserData = db.getUser(user);
      xpNeededForNextLevel = calculateXpForLevel(updatedUserData.level);
    }
  },
};

function calculateXp(charCount) {
  const minXp = 10;
  const maxXp = 20;

  const bonusXpRange = maxXp - minXp;

  const lengthScore = charCount / (charCount + config.AVERAGE_CHARS);

  const xpGained = minXp + bonusXpRange * lengthScore;

  return Math.round(xpGained);
}

function calculateXpForLevel(level) {
  return 5 * Math.pow(level, 2) + 50 * level + 100;
}