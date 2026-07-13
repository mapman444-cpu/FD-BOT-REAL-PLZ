const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Create a poll')
        .addStringOption(o =>
            o.setName('question')
             .setDescription('Poll question')
             .setRequired(true)),

    async execute(interaction) {
        const question = interaction.options.getString('question');

        const message = await interaction.reply({
            content: `📊 **Poll:** ${question}\n👍 = Yes\n👎 = No`,
            fetchReply: true
        });

        await message.react('👍');
        await message.react('👎');
    }
};
