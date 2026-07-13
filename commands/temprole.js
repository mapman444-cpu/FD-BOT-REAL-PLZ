const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('temprole')
        .setDescription('Temporarily give a role to a user.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to give the role to')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Role to give temporarily')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Duration amount')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('unit')
                .setDescription('Time unit')
                .setRequired(true)
                .addChoices(
                    { name: 'seconds', value: 'seconds' },
                    { name: 'minutes', value: 'minutes' },
                    { name: 'hours', value: 'hours' },
                    { name: 'days', value: 'days' },
                    { name: 'weeks', value: 'weeks' },
                )
        ),

    async execute(interaction) {
        const member = interaction.options.getMember('user');
        const role = interaction.options.getRole('role');
        const duration = interaction.options.getInteger('duration');
        const unit = interaction.options.getString('unit');

        const multipliers = {
            seconds: 1,
            minutes: 60,
            hours: 60 * 60,
            days: 60 * 60 * 24,
            weeks: 60 * 60 * 24 * 7
        };

        const durationMs = duration * multipliers[unit] * 1000;

        await member.roles.add(role);
        await interaction.reply({
            content: `Added **${role.name}** to ${member} for ${duration} ${unit}.`,
            ephemeral: true
        });

        setTimeout(async () => {
            await member.roles.remove(role).catch(() => {});
        }, durationMs);
    }
};
