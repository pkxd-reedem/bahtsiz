const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { marketItems } = require('../../config/market-items.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('market')
        .setDescription('Sunucu marketinde satılan ürünleri ve fiyatlarını gösterir.'),

    async execute(interaction) {
        if (!marketItems || marketItems.length === 0) {
            return interaction.reply({ content: 'Markette şu an hiç ürün yok!', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('🛒 Sunucu Marketi')
            .setDescription('Aşağıdaki ürünleri satın alabilirsiniz. ID kullanarak alım yapın.')
            .setColor('Aqua');

        marketItems.forEach(item => {
            embed.addFields({
                name: `${item.icon} ${item.name} - **${item.price.toLocaleString()}** para`,
                value: `ID: \`${item.id}\`
${item.description}`
            });
        });

        await interaction.reply({ embeds: [embed] });
    },
};