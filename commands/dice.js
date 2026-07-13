const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder().setName('dice').setDescription('Roll a 6-sided die'),
    async execute(interaction) {
        const roll = Math.floor(Math.random() * 6) + 1;
        await interaction.reply(`🎲 You rolled a **${roll}**`);
    }
};
