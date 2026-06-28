const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const { marketItems } = require('../../config/market-items.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('envanter')
        .setDescription('Sahip olduğunuz ürünleri gösterir.')
        .addUserOption(option => 
            option.setName('kullanıcı')
                  .setDescription('Envanterini görmek istediğiniz kullanıcı.')
        ), 

    async execute(interaction) {
        const targetUser = interaction.options.getUser('kullanıcı') || interaction.user;
        const userInventoryIds = await db.get(`envanter_${targetUser.id}`) || [];

        if (userInventoryIds.length === 0) {
            const desc = targetUser.id === interaction.user.id ? 'Henüz hiç ürünün yok.' : `${targetUser.username} adlı kullanıcının hiç ürünü yok.`;
            return interaction.reply({ content: desc, ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle(`🎒 ${targetUser.username} Envanteri`)
            .setColor('Orange');

        const itemCounts = userInventoryIds.reduce((acc, id) => {
            acc[id] = (acc[id] || 0) + 1;
            return acc;
        }, {});

        let description = '';
        for (const itemId in itemCounts) {
            const itemDetails = marketItems.find(i => i.id === itemId);
            if (itemDetails) {
                description += `${itemDetails.icon} **${itemDetails.name}** - Adet: ${itemCounts[itemId]}
`;
            }
        }

        embed.setDescription(description.trim());

        await interaction.reply({ embeds: [embed] });
    },
};