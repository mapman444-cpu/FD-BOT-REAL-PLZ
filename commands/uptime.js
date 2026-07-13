const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const date = new Date();
const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uptime')
        .setDescription('Shows how long the bot has been online.'),

    async execute(interaction) { 
        const totalSeconds = Math.floor(process.uptime());

        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const embed = new EmbedBuilder()
            .setTitle('⏱ Casa Grande Fire Department Bot Uptime')
            .setColor('#9b0c0c')
            .addFields(
                { name: 'Days', value: `${days}`, inline: true },
                { name: 'Hours', value: `${hours}`, inline: true },
                { name: 'Minutes', value: `${minutes}`, inline: true },
                { name: 'Seconds', value: `${seconds}`, inline: true }
            )
            .setFooter({ text: `Date: ${formattedDate}` })
 
        await interaction.reply({ embeds: [embed] });
    }
};
