const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Promotion = require('../models/Promotion');
const config = require('../config.js');
const generateCaseId = require('../utils/generateCaseId');
const fetch = require('node-fetch');
const PROTECTED_ROLES = [
    "1327670816141213733" // Citizens role ID
];

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
        .setName('promotion')
        .setDescription('Promote a firefighter')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Firefighter being promoted')
                .setRequired(true)
        )
        .addRoleOption(option =>
            option.setName('new_rank')
                .setDescription('Rank they are being promoted to')
                .setRequired(true)
        )
                .addStringOption(option =>
            option.setName('new_callsign')
                .setDescription('New callsign for the firefighter')
                .setRequired(true)
        )  
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addRoleOption(option =>
            option.setName('old_rank')
                .setDescription('Rank they are being promoted from')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('old_callsign')
                .setDescription('Old callsign for the firefighter')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the promotion')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('notes')
                .setDescription('Optional notes')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {

        // Prevent "Unknown interaction"
        await interaction.deferReply({ ephemeral: false });

        let webhookSent = false;

        const user = interaction.options.getUser('user');
        const member = await interaction.guild.members.fetch(user.id);
        const targetUser = member.user;

        const newRank = interaction.options.getRole('new_rank');
        const oldRank = interaction.options.getRole('old_rank');
        const reason = interaction.options.getString('reason');
        const notes = interaction.options.getString('notes') || 'None';

        const caseId = generateCaseId();
        const now = new Date();
        const formattedDate = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;

        // Remove old rank unless protected
        if (PROTECTED_ROLES.includes(oldRank.id)) {
            console.log(`Skipped removing protected role: ${oldRank.id}`);
        } else {
            await member.roles.remove(oldRank.id).catch(() => {
                console.log(`Could not remove old rank ${oldRank.name} from ${member.user.tag}`);
            });
        }

        // Add new rank
        await member.roles.add(newRank.id).catch(() => {
            console.log(`Could not add new rank ${newRank.name} to ${member.user.tag}`);
        });

        // Save promotion record
        await Promotion.create({
            caseId,
            userId: user.id,
            newRank: newRank.id,
            newCallsign: interaction.options.getString('new_callsign') || null,
            oldRank: oldRank.id,
            reason,
            notes,
            promotedBy: interaction.user.id,
            date: now
        });

        // Build embed
        const embed = new EmbedBuilder()
            .setTitle(`${config.CGFD_LOGO} Casa Grande Fire Department Promotion`)
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

        // Respond to command
        await interaction.editReply(`Success!`);

        // DM the promoted firefighter
        await targetUser.send({ embeds: [embed] }).catch(() => {
            console.log(`Could not DM ${targetUser.tag}. Their DMs may be closed.`);
        });

        // Log channel
        const logChannel = interaction.guild.channels.cache.get(config.promotionLogChannel);
        if (logChannel) {
            logChannel.send({ embeds: [embed] });
        }

        // Webhook 
        if (!webhookSent && process.env.PROMOTION_WEBHOOK_URL) {
            webhookSent = true;
            try {
                await fetch(process.env.PROMOTION_WEBHOOK_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ embeds: [embed.data] })
                });
            } catch (err) {
                console.error("Promotion webhook failed:", err);
            }
        }
    }
};
