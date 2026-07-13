const mongoStates = {
      0: "🔴 Disconnected",
      1: "🟢 Connected",
      2: "🟡 Connecting",
      3: "🟠 Disconnecting"
    };
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const os = require('os');
const mongoose = require('mongoose');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botinfo')
        .setDescription('Show detailed bot information'),

    async execute(interaction) {

        const client = interaction.client;

        const embed = new EmbedBuilder()
            .setTitle('Bot Information')
            .setColor(0x00A2E8)
            .addFields(
                {
                    name: '📡 Ping',
                    value: `${client.ws.ping}ms`,
                    inline: true
                },
                {
                    name: ' ↑ Uptime',
                    value: `<t:${Math.floor(Date.now() / 1000 - client.uptime / 1000)}:R>`,
                    inline: true
                },
                {
                    name: ' 🌐Servers',
                    value: `${client.guilds.cache.size}`,
                    inline: true
                },
                {
                    name: ' 👥Users',
                    value: `${client.users.cache.size}`,
                    inline: true
                },
                {
                    name: ' 🖥️Node.js',
                    value: process.version,
                    inline: true
                },
                {
                    name: ' ⚫Discord.js',
                    value: require('discord.js').version,
                    inline: true
                },
                {
                    name: ' 📇Memory Usage',
                    value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
                    inline: true
                },
                {
                    name: ' ⚪MongoDB Status',
                    value: mongoStates[mongoose.connection.readyState],
                    inline: true
                },
                {
                    name: ' Developer',
                    value: 'MAPman444',
                    inline: true
                }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
