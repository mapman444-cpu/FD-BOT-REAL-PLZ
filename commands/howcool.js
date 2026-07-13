const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder().setName('howcool')
                .setDescription('Check your coolness level'),
    async execute(interaction) {
        const percent = Math.floor(Math.random() * 101);
        await interaction.reply(`😎 Coolness level: **${percent}%**`);
    }
};
