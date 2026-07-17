const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Demotion = require('../models/Demotion');
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
        .setName('demotion')
        .setDescription('Demote a firefighter')
        .addUserOption(option =>
            option.setName('firefighter')
                .setDescription('Firefighter being demoted')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('old_rank')
                .setDescription('Rank they are being demoted from')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('old_callsign')
                .setDescription('Old callsign for the firefighter')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('new_rank')
                .setDescription('Rank they are being demoted to')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('new_callsign')
                .setDescription('New callsign for the firefighter (if applicable)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the demotion')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('notes')
                .setDescription('Optional notes')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        if (!shouldProcessInteraction(interaction)) {
            return;
        }

        let webhookSent = false;
        await interaction.deferReply({ ephemeral: false });

        const targetUser = interaction.options.getUser('firefighter');
        const member = await interaction.guild.members.fetch(targetUser.id);

        const newRank = interaction.options.getRole('new_rank');
        const oldRank = interaction.options.getRole('old_rank');
        const reason = interaction.options.getString('reason');
        const notes = interaction.options.getString('notes') || 'None';

        const caseId = generateCaseId();

        const date = new Date();
        const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;

        await member.roles.remove(oldRank.id).catch(() => {});

        const rolesToRemove = member.roles.cache.filter(role => role.position > newRank.position);

        for (const role of rolesToRemove.values()) {
            await member.roles.remove(role.id).catch(() => {});
        }

        // Add new rank
        await member.roles.add(newRank.id).catch(() => {});

        // Log in database
        await Demotion.create({
            caseId,
            userId: targetUser.id,
            oldRank: oldRank.id,
            newRank: newRank.id,
            reason,
            notes,
            demotedBy: interaction.user.id,
            date: new Date()
        });

        // Build embed
        const embed = new EmbedBuilder()
            .setTitle(`${config.CGFD_LOGO} Casa Grande Fire Department Demotion`)
            .setColor('#FF0000')
            .setThumbnail(targetUser.displayAvatarURL({ size: 1024 }))
            .addFields(
                { name: 'Firefighter', value: `${targetUser}` },
                { name: 'Old Rank', value: `<@&${oldRank.id}>` },
                { name: 'Old Callsign', value: interaction.options.getString('old_callsign') || 'Not specified' },
                { name: 'New Rank', value: `<@&${newRank.id}>` },
                { name: 'New Callsign', value: interaction.options.getString('new_callsign') || 'Not specified' },
                { name: 'Reason', value: reason },
                { name: 'Notes', value: notes },
                { name: 'Case ID', value: caseId }
            )
            .setFooter({ text: `Date: ${formattedDate}` });

        // Edit the deferred reply
        await interaction.editReply('Success.');

        // Log channel
        const logChannel = interaction.guild.channels.cache.get(config.demotionLogChannel);
        if (logChannel) logChannel.send({ embeds: [embed] });

        // DM user
        await targetUser.send({ embeds: [embed] }).catch(() => {
            console.log(`Could not DM ${targetUser.tag}. Their DMs may be closed.`);
        });

        // Webhook
       if (!webhookSent && process.env.DEMOTION_WEBHOOK_URL) {
    webhookSent = true;
    try {
        await fetch(process.env.DEMOTION_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ embeds: [embed.data] })
        });
    } catch (err) {
        console.error("Demotion webhook failed:", err);
    }
}
    }
};
