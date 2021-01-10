const { BOT_PREFIX, LOG_CHANNEL_ID } = process.env
const { Collection,Client,MessageEmbed } = require('discord.js')
const config = require('./../../../Config/config.js');
const cooldowns = new Collection();
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

module.exports = async (message,client) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(BOT_PREFIX)})\\s*`);
  if (!prefixRegex.test(message.content)) return;

  const [, matchedPrefix] = message.content.match(prefixRegex);

  const [commandN,...args] = message.content.slice(matchedPrefix.length).split(' ');
  const commandName = commandN;

  const command =
    client.commands.get(commandName) ||
    client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName));

  if (!command) return;
  
  if(command.disabled) return;
  
  if(command.ownerOnly) {
    if(!config.owners.includes(message.author.id)) return;
  }


  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || 1) * 1000;
  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
       message.reply(new MessageEmbed()
      .setColor("RED")
      .setTitle("COOLDOWN")
      .setDescription(`\`${command.name}\`を使用するには、あと ${timeLeft.toFixed(1)} 秒待ってください`)
      .setTimestamp()
      );
  if(LOG_CHANNEL_ID){
    client.channels.cache.get(LOG_CHANNEL_ID).send(
    new MessageEmbed()      
    .setColor("RED")
      .setTitle("COOLDOWN")
      .setDescription(`\`${command.name}\`コマンドの連投`)
      .addField("コマンド使用者:",`${message.author.tag}`)
      .addField("コマンド使用場所:",`${message.channel}`)
      .setTimestamp()).catch(console.error);
      return
    }else{
      return
    }
    }
  }

  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

  try {
    command.execute(message, args, client);
  } catch (error) {
    console.error(error);
    message.reply(
    new MessageEmbed()      
    .setColor("RED")
      .setTitle("ERROR:warning:")
      .setDescription(`\`${command.name}\`コマンド実行時にエラーが発生しました`)
      .setTimestamp()).catch(console.error);
    if(LOG_CHANNEL_ID){
    client.channels.cache.get(LOG_CHANNEL_ID).send(
    new MessageEmbed()      
    .setColor("RED")
      .setTitle("ERROR:warning:")
      .setDescription(`\`${command.name}\`コマンド実行時にエラーが発生しました`)
      .addField("コマンド使用者:",`${message.author.tag}`)
      .addField("コマンド使用場所:",`${message.channel}`)
      .setTimestamp()).catch(console.error);
    }
  }
};
