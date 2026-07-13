const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js');

const Promotion = require('../models/Promotion');
const Demotion = require('../models/Demotion');
const Infraction = require('../models/Infraction');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('void')
    .setDescription('Void a case and optionally reverse the roles.')
    .addStringOption(option =>
      option.setName('case_id')
        .setDescription('The Case ID to void')
        .setRequired(true)
    ),

  async execute(interaction) {
    const caseId = interaction.options.getString('case_id');

    // Find case in any collection
    let caseData =
      await Promotion.findOne({ caseId }) ||
      await Demotion.findOne({ caseId }) ||
      await Infraction.findOne({ caseId });

    if (!caseData) {
      return interaction.reply({
        content: `No case found with the ID **${caseId}**.`,
        ephemeral: true
      });
    }

    const caseType =
      caseData instanceof Promotion ? 'Promotion' :
      caseData instanceof Demotion ? 'Demotion' :
      'Infraction';

    const canReverse = caseType !== 'Infraction';

    // Buttons
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('void_yes')
        .setLabel(canReverse ? 'Void + Reverse Roles' : 'Void Case')
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId('void_no')
        .setLabel('Void Only')
        .setStyle(ButtonStyle.Danger)
    );

    // Initial reply
    await interaction.reply({
      content: canReverse
        ? `Case **${caseId}** found (**${caseType}**). Would you like to reverse the roles?`
        : `Case **${caseId}** found (**Infraction**). This case cannot reverse roles. Void only?`,
      components: [row],
      ephemeral: true
    });

    // Collector for buttons
    const collector = interaction.channel.createMessageComponentCollector({
      time: 15000
    });

    collector.on('collect', async i => {
      // Only the command user can press the buttons
      if (i.user.id !== interaction.user.id) {
        return i.reply({
          content: 'This is not your action.',
          ephemeral: true
        });
      }

      let reversed = false;

      if (i.customId === 'void_yes') {
        if (canReverse) {
          const guild = interaction.guild;
          const member = await guild.members.fetch(caseData.userId);

          // Reverse roles
          await member.roles.add(caseData.oldRank);
          await member.roles.remove(caseData.newRank);

          reversed = true;
        }

        caseData.voided = true;
        caseData.voidReason = reversed ? 'Roles reversed' : 'Voided with reversal option';
        await caseData.save();

        await i.update({
          content: reversed
            ? `Case **${caseId}** has been voided and roles have been reversed.`
            : `Case **${caseId}** has been voided.`,
          components: []
        });

        collector.stop();
      }

      if (i.customId === 'void_no') {
        caseData.voided = true;
        caseData.voidReason = 'Voided without reversal';
        await caseData.save();

        await i.update({
          content: `Case **${caseId}** has been voided.`,
          components: []
        });

        collector.stop();
      }
    });

    // Timeout handler
    collector.on('end', async collected => {
      if (collected.size === 0) {
        // Prevent double reply crash
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: 'Timed out — no selection made.',
            ephemeral: true
          });
        } else {
          await interaction.followUp({
            content: 'Timed out — no selection made.',
            ephemeral: true
          });
        }
      }
    });
  }
};
