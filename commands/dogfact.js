const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dogfact')
        .setDescription('Get a random dog fact!'),

    async execute(interaction) {
        const facts = [
            "Dogs can learn over 100 words and gestures.",
            "A dog's sense of smell is 40 times stronger than ours.",
            "Dogs dream just like humans.",
            "Some dogs can understand up to 250 words."
        ];

        const fact = facts[Math.floor(Math.random() * facts.length)];
        await interaction.reply(`🐶 **Dog Fact:** ${fact}`);
    }
};
