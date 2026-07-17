const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Infraction = require('../models/Infraction');
const config = require('../config.js');
const generateCaseId = require('../utils/generateCaseId');
const fetch = require('node-fetch');

const RECENT_INTERACTIONS = new Set();
const INTERACTION_DEDUP_WINDOW_MS = 10000;

function shouldProcessInteraction(interaction) {
    const now = Date.now();

    for (const [key, timestamp] of RECENT_INTERACTIONS.entries()) {
        if (now - timestamp > INTERACTION_DEDUP_WINDOW_MS) {
            RECENT_INTERACTIONS.delete(key);
        }
    }

    if (RECENT_INTERACTIONS.has(interaction.id)) {
        return false;
    }

    RECENT_INTERACTIONS.add(interaction.id);
    return true;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('infraction')
        .setDescription('Issue an infraction to a firefighter')
        .addUserOption(option =>
            option.setName('firefighter')
                .setDescription('Firefighter receiving the infraction')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('punishment')
                .setDescription('Select the punishment')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the infraction')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('notes')
                .setDescription('Optional notes')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {

        // Prevent "Unknown interaction"
        await interaction.deferReply({ ephemeral: true });

        let webhookSent = false;

        const targetUser = interaction.options.getUser('firefighter');
        const punishmentRole = interaction.options.getRole('punishment');
        const reason = interaction.options.getString('reason');
        const notes = interaction.options.getString('notes') || 'None';

        const caseId = generateCaseId();

        const date = new Date();
        const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;

        const member = await interaction.guild.members.fetch(targetUser.id);

        // Apply punishment role
        await member.roles.add(punishmentRole.id).catch(() => {
            console.log(`Could not add punishment role to ${member.user.tag}`);
        });

        // Save to database
        await Infraction.create({
            caseId,
            userId: targetUser.id,
            punishmentRole: punishmentRole.id,
            reason,
            notes,
            issuedBy: interaction.user.id,
            date: new Date()
        });

        // Build embed
        const embed = new EmbedBuilder()
            .setTitle(`${config.CGFD_LOGO} Casa Grande Fire Department Infraction`)
            .setThumbnail(targetUser.displayAvatarURL({ size: 1024 }))
            .addFields(
                { name: 'Firefighter', value: `${targetUser}` },
                { name: 'Punishment', value: `<@&${punishmentRole.id}>` },
                { name: 'Reason', value: reason },
                { name: 'Notes', value: notes },
                { name: 'Issued By', value: `${interaction.user}` },
                { name: 'Case ID', value: caseId }
            )
            .setFooter({ text: `Date: ${formattedDate}` });

        // Respond to command
        await interaction.editReply({
            content: `Firefighter has successfully been infracted.`,
        });

        // DM firefighter
        await targetUser.send({ embeds: [embed] }).catch(() => {
            console.log(`Could not DM ${targetUser.tag}. Their DMs may be closed.`);
        });

        // Log channel
        const logChannel = interaction.guild.channels.cache.get(config.infractionLogChannel);
        if (logChannel) {
            logChannel.send({ embeds: [embed] });
        }

        // Webhook 
        if (!webhookSent && process.env.INFRACTION_WEBHOOK_URL) {
            webhookSent = true;
            try {
                await fetch(process.env.INFRACTION_WEBHOOK_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ embeds: [embed.data] })
                });
            } catch (err) {
                console.error("Infraction webhook failed:", err);
            }
        }
    }
};
