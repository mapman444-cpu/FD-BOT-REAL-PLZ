const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const Promotion = require('../models/Promotion');
const Demotion = require('../models/Demotion');
const Infraction = require('../models/Infraction');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('history')
    .setDescription('View a user\'s full case history.')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to view history for')
        .setRequired(true)
    ),

  async execute(interaction) { 
    const target = interaction.options.getUser('user');

    const [promotions, demotions, infractions] = await Promise.all([
      Promotion.find({ userId: target.id }),
      Demotion.find({ userId: target.id }),
      Infraction.find({ userId: target.id })
    ]);

    const allCases = [
      ...promotions.map(c => ({ ...c._doc, type: 'Promotion' })),
      ...demotions.map(c => ({ ...c._doc, type: 'Demotion' })),
      ...infractions.map(c => ({ ...c._doc, type: 'Infraction' }))
    ];

    if (!allCases.length) {
      return interaction.reply({
        content: 'No history found for this user.',
        ephemeral: true
      });
    }

    allCases.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Format each case
    const formatted = allCases.map(entry => {
      const date = new Date(entry.date).toLocaleString();

      const header = entry.voided
        ? `❌ **VOIDED — ${entry.type} — ${date}**`
        : `**${entry.type} — ${date}**`;

      const details = [
        `Case ID: ${entry.caseId}`,
        entry.type !== 'Infraction' ? `Old Rank: <@&${entry.oldRank}>` : null,
        entry.type !== 'Infraction' ? `New Rank: <@&${entry.newRank}>` : null,
        entry.type === 'Infraction' ? `Punishment: ${entry.punishment}` : null,
        `Reason: ${entry.reason}`,
        `Notes: ${entry.notes || 'None'}`
      ].filter(Boolean).join('\n');

      return `${header}\n${details}`;
    });

    // Pagination (3 cases per page)
    const pages = [];
    for (let i = 0; i < formatted.length; i += 3) {
      pages.push(formatted.slice(i, i + 3).join('\n\n'));
    }

    let page = 0;

    const embed = new EmbedBuilder()
      .setTitle(`${target.tag} — Case History`)
      .setDescription(pages[page])
      .setColor('#2b2d31')
      .setFooter({ text: `Page ${page + 1} of ${pages.length}` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('prev')
        .setLabel('Previous')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),

      new ButtonBuilder()
        .setCustomId('next')
        .setLabel('Next')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(pages.length === 1)
    );

    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true
    });

    const collector = interaction.channel.createMessageComponentCollector({
      time: 60000
    });

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: 'This is not your action.', ephemeral: true });
      }

      if (i.customId === 'next') page++;
      if (i.customId === 'prev') page--;

      const newEmbed = new EmbedBuilder()
        .setTitle(`${target.tag} — Case History`)
        .setDescription(pages[page])
        .setColor('#2b2d31')
        .setFooter({ text: `Page ${page + 1} of ${pages.length}` });

      const newRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('prev')
          .setLabel('Previous')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === 0),

        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('Next')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === pages.length - 1)
      );

      await i.update({
        embeds: [newEmbed],
        components: [newRow]
      });
    });

    collector.on('end', async () => {
      await interaction.editReply({
        components: []
      });
    });
  }
};

