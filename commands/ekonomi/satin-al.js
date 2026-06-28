const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const { marketItems } = require('../../config/market-items.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('satin-al')
        .setDescription('Marketten bir ürün satın alırsınız.')
        .addStringOption(option =>
            option.setName('ürün_id')
                .setDescription('Satın almak istediğiniz ürünün IDsi.')
                .setRequired(true)),

    async execute(interaction) {
        const user = interaction.user;
        const itemId = interaction.options.getString('ürün_id');

        const item = marketItems.find(i => i.id === itemId);

        if (!item) {
            return interaction.reply({ content: 'Bu ID ile bir ürün bulunamadı. Lütfen `/market` komutu ile IDleri kontrol et.', ephemeral: true });
        }

        const balance = await db.get(`cuzdan_${user.id}`) || 0;

        if (balance < item.price) {
            return interaction.reply({ 
                content: `Bu ürünü almak için yeterli paran yok!\nGerekli: **${item.price.toLocaleString()}**\nSendeki: **${balance.toLocaleString()}**`, 
                ephemeral: true 
            });
        }

        // Hata düzeltildi: .subtract() -> .sub()
        await db.sub(`cuzdan_${user.id}`, item.price);
        await db.push(`envanter_${user.id}`, item.id);

        const embed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('🛒 Satın Alım Başarılı!')
            .setDescription(`**${item.name}** ürününü **${item.price.toLocaleString()}** paraya satın aldın!`)
            .setFooter({ text: `Envanterini görmek için /envanter kullan.` });

        await interaction.reply({ embeds: [embed] });
    },
};
