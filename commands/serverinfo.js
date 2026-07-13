const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Show detailed server info'),

    async execute(interaction) {
        const guild = interaction.guild;

        const embed = new EmbedBuilder()
            .setTitle(`📊 Server Info: ${guild.name}`)
            .setColor('Blue')
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                { name: '👑 Owner', value: `<@${guild.ownerId}>`, inline: true },
                { name: '🆔 Server ID', value: guild.id.toString(), inline: true },
                { name: '📅 Created On', value: guild.createdAt.toDateString(), inline: true },
                { name: '👥 Members', value: guild.memberCount.toString(), inline: true },
                { name: '🚀 Boost Level', value: guild.premiumTier.toString(), inline: true },
                { name: '💎 Boosts', value: guild.premiumSubscriptionCount?.toString() || '0', inline: true },
                { name: '📁 Channels', value: guild.channels.cache.size.toString(), inline: true },
                { name: '🎭 Roles', value: guild.roles.cache.size.toString(), inline: true },
                { name: '😄 Emojis', value: guild.emojis.cache.size.toString(), inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
