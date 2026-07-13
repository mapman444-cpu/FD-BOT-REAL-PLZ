const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check the bot latency.'),

    async execute(interaction) {
        const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });

        const embed = new EmbedBuilder()
            .setTitle( 'Casa Grande Fire Department Bot Response Time')
            .setColor('#9b0c0c')
            .addFields(
                { name: 'Websocket Latency', value: `${interaction.client.ws.ping}ms` },
                { name: 'Round Trip Latency', value: `${sent.createdTimestamp - interaction.createdTimestamp}ms` }
            )
            .setTimestamp(); 
 
        await interaction.editReply({ content: '', embeds: [embed] });
    }
};
