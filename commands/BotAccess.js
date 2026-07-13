const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const BotAccess = require('../models/BotAccess');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botaccess')
        .setDescription('Manage bot access')
        .addSubcommand(sub =>
            sub.setName('addrole')
               .setDescription('Allow a role to use bot commands')
               .addRoleOption(o => o.setName('role').setDescription('Role').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('removerole')
               .setDescription('Remove bot access from a role')
               .addRoleOption(o => o.setName('role').setDescription('Role').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('list')
               .setDescription('List all roles with bot access')
        )
        .addSubcommand(sub =>
            sub.setName('clear')
               .setDescription('Remove ALL bot access roles')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {

        // Roles allowed to use this command
        const ALLOWED_ROLES = [
            '1521322792522485840', // MAP perms
        ];

        const hasRole = ALLOWED_ROLES.some(roleId =>
            interaction.member.roles.cache.has(roleId)
        );

        if (!hasRole) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                flags: 64
            });
        }

        const sub = interaction.options.getSubcommand();

        if (sub === 'addrole') {
            const role = interaction.options.getRole('role');

            await BotAccess.findOneAndUpdate(
                { roleId: role.id },
                { roleId: role.id },
                { upsert: true }
            );

            return interaction.reply({
                content: `🟢 Role **${role.name}** now has bot access.`,
                flags: 64
            });
        }

      
        if (sub === 'removerole') {
            const role = interaction.options.getRole('role');

            await BotAccess.deleteOne({ roleId: role.id });

            return interaction.reply({
                content: `🔴 Role **${role.name}** no longer has bot access.`,
                flags: 64
            });
        }

     
        if (sub === 'list') {
            const roles = await BotAccess.find();

            if (roles.length === 0) {
                return interaction.reply({
                    content: 'There are **no roles** with bot access.',
                    flags: 64
                });
            }

            const embed = new EmbedBuilder()
                .setTitle('Bot Access Roles')
                .setColor('#2b6cb0')
                .setTimestamp();

            roles.forEach(r => {
                embed.addFields({
                    name: 'Role',
                    value: `<@&${r.roleId}>`,
                    inline: false
                });
            });

            return interaction.reply({ embeds: [embed] });
        }

      
        if (sub === 'clear') {
            await BotAccess.deleteMany({});

            return interaction.reply({
                content: '⚠️ All bot access roles have been **removed**.',
                flags: 64
            });
        }
    }
};
