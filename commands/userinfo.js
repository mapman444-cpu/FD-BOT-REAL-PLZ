const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const BotAccess = require('../models/BotAccess'); // MongoDB model

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Show detailed info about a user')
        .addUserOption(o =>
            o.setName('user')
             .setDescription('User to view')
             .setRequired(false)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        const member = interaction.guild.members.cache.get(user.id);

        // Fetch full user object (needed for banner)
        const fullUser = await interaction.client.users.fetch(user.id, { force: true });

        // Check bot access
        const access = await BotAccess.findOne({ userId: user.id });
        const botAccess = access ? '🟢 Allowed' : '🔴 Not Allowed';

        const embed = new EmbedBuilder()
            .setTitle(`👤 User Info: ${user.username}`)
            .setColor(0x00A2E8)
            .setThumbnail(user.displayAvatarURL({ size: 1024 }))
            .addFields(
                { name: ' Username', value: `${user.tag}`, inline: true },
                { name: ' User ID', value: `${user.id}`, inline: true },
                { name: ' Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
                { name: ' Joined Server', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'N/A', inline: true },
                { name: ' Bot Access', value: botAccess, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
