const { SlashCommandBuilder } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dog')
        .setDescription('Get a random dog picture!'),

    async execute(interaction) {
        const res = await fetch("https://api.thedogapi.com/v1/images/search");
        const data = await res.json();
        const url = data[0].url;

        await interaction.reply(url);
    }
};
