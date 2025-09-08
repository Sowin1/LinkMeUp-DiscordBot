const { Events } = require("discord.js");
const config = require("../../../config.js");
const db = require("../../database/database.js");
const DISBOARD_ID = "302050872383242240";

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
    if (
      message.author.id === DISBOARD_ID &&
      message.interaction &&
      message.interaction.commandName === "bump" &&
      message.embeds.length > 0
    ) {
      const bumper = message.interaction.user;
      let bumperInDB = db.getUser(bumper.id);
      if (!bumperInDB) {
        db.setUser(bumper.id, 0, 0);
        bumperInDB = db.getUser(bumper.id);
      }
      const newXp = bumperInDB.xp + 20;
      db.setUser(bumper.id, newXp, bumperInDB.level);
      let updatedBumperData = db.getUser(bumper.id);
      let xpNeededForNextLevel = calculateXpForLevel(updatedBumperData.level);
      while (updatedBumperData.xp >= xpNeededForNextLevel) {
        const newLevel = updatedBumperData.level + 1;
        db.setUser(bumper.id, updatedBumperData.xp, newLevel);
        await message.channel.send(
          `🎉 Bravo ${bumper}, tu as atteint le niveau **${newLevel}** !`
        );
        const guildMember = message.guild.members.cache.get(bumper.id);
        if (guildMember) givingRole(guildMember, newLevel);
        updatedBumperData = db.getUser(bumper.id);
        xpNeededForNextLevel = calculateXpForLevel(updatedBumperData.level);
      }
      return;
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
      givingRole(message.member, newLevel);
      updatedUserData = db.getUser(user);
      xpNeededForNextLevel = calculateXpForLevel(updatedUserData.level);
    }
  },
};

function calculateXp(charCount) {
  const minXp = 10;
  const maxXp = 25;

  const bonusXpRange = maxXp - minXp;

  const lengthScore = charCount / (charCount + config.AVERAGE_CHARS);

  const xpGained = minXp + bonusXpRange * lengthScore;

  return Math.round(xpGained);
}

function calculateXpForLevel(level) {
  return 5 * Math.pow(level, 2) + 50 * level + 100;
}

function givingRole(member, level) {
  const levelRoleMap = {
    1: config.level1,
    5: config.level5,
    10: config.level10,
    15: config.level15,
    20: config.level20,
    25: config.level25,
    30: config.level30,
    35: config.level35,
    40: config.level40,
  };
  if (levelRoleMap[level]) {
    member.roles.add(levelRoleMap[level]);
  }
}
