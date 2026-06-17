require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'config.json');

function loadConfig() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading config:', e);
  }
  return {};
}

function saveConfig(config) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(config, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving config:', e);
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once('ready', async () => {
  console.log(`✅ Bot is ready! Logged in as ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName('setroom')
      .setDescription('حدد الروم التي سيتم إرسال رسائلها كـ DM لجميع الأعضاء')
      .addChannelOption(option =>
        option.setName('channel')
          .setDescription('الروم المخصصة للإعلانات')
          .setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .toJSON(),

    new SlashCommandBuilder()
      .setName('showroom')
      .setDescription('اعرض الروم المحددة حالياً للإعلانات')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .toJSON(),

    new SlashCommandBuilder()
      .setName('clearroom')
      .setDescription('إلغاء تحديد روم الإعلانات')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .toJSON(),
  ];

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    const guildId = process.env.GUILD_ID;
    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(client.user.id, guildId), { body: commands });
      console.log(`✅ Slash commands registered for guild ${guildId}`);
    } else {
      await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
      console.log('✅ Slash commands registered globally');
    }
  } catch (error) {
    console.error('Error registering commands:', error);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const config = loadConfig();
  const guildId = interaction.guildId;

  if (interaction.commandName === 'setroom') {
    const channel = interaction.options.getChannel('channel');

    if (!channel.isTextBased()) {
      return interaction.reply({ content: '❌ يجب أن تكون الروم نصية.', ephemeral: true });
    }

    if (!config[guildId]) config[guildId] = {};
    config[guildId].announceChannelId = channel.id;
    config[guildId].announceChannelName = channel.name;
    saveConfig(config);

    await interaction.reply({
      content: `✅ تم تحديد <#${channel.id}> كروم الإعلانات. كل رسالة تُكتب فيها ستُرسل كـ DM لجميع الأعضاء.`,
      ephemeral: true
    });
  }

  else if (interaction.commandName === 'showroom') {
    const channelId = config[guildId]?.announceChannelId;
    if (!channelId) {
      return interaction.reply({ content: '❌ لم يتم تحديد روم بعد. استخدم `/setroom` أولاً.', ephemeral: true });
    }
    await interaction.reply({
      content: `📢 روم الإعلانات الحالية: <#${channelId}>`,
      ephemeral: true
    });
  }

  else if (interaction.commandName === 'clearroom') {
    if (config[guildId]) {
      delete config[guildId].announceChannelId;
      delete config[guildId].announceChannelName;
      saveConfig(config);
    }
    await interaction.reply({ content: '✅ تم إلغاء تحديد روم الإعلانات.', ephemeral: true });
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const config = loadConfig();
  const guildId = message.guild.id;
  const announceChannelId = config[guildId]?.announceChannelId;

  if (!announceChannelId) return;
  if (message.channel.id !== announceChannelId) return;

  const guild = message.guild;

  try {
    await guild.members.fetch();
  } catch (e) {
    console.error('Could not fetch members:', e);
    return;
  }

  const members = guild.members.cache.filter(m => !m.user.bot);

  let successCount = 0;
  let failCount = 0;

  for (const [, member] of members) {
    try {
      // Build the message content — replace (منشن) with the member's mention
      let content = message.content.replace(/\(منشن\)/g, `<@${member.user.id}>`);

      // Build message payload
      const dmPayload = {
        content: content || undefined,
      };

      // Forward attachments
      if (message.attachments.size > 0) {
        dmPayload.files = message.attachments.map(a => a.url);
      }

      // Forward embeds if any
      if (message.embeds.length > 0) {
        dmPayload.embeds = message.embeds;
      }

      // Forward stickers
      if (message.stickers.size > 0) {
        const stickerList = message.stickers.map(s => `[ملصق: ${s.name}]`).join(' ');
        dmPayload.content = (dmPayload.content ? dmPayload.content + '\n' : '') + stickerList;
      }

      // Handle custom guild emojis — they are already embedded in the message content
      // as <:name:id> or <a:name:id> format which Discord renders correctly in DMs
      // as long as the bot shares the server with the member (which it does).

      await member.send(dmPayload);
      successCount++;
    } catch (err) {
      // User may have DMs disabled
      failCount++;
      if (err.code !== 50007) {
        console.error(`Failed to DM ${member.user.tag}:`, err.message);
      }
    }
  }

  console.log(`📨 Message sent: ${successCount} succeeded, ${failCount} failed (DMs disabled)`);

  // React to the original message to confirm sending
  try {
    await message.react('✅');
  } catch (e) {
    // ignore
  }
});

client.login(process.env.DISCORD_TOKEN);
