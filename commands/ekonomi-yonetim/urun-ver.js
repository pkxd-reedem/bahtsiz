const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const { marketItems } = require('../../config/market-items.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('urun-ver')
        .setDescription('[Yönetici] Bir kullanıcıya marketten bir ürün verir.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option => 
            option.setName('hedef')
                .setDescription('Ürünü alacak kullanıcı.')
                .setRequired(true))
        .addStringOption(option => {
            option.setName('ürün_id')
                .setDescription('Verilecek ürünün IDsi.')
                .setRequired(true);
            // Market itemlerini seçenek olarak ekle
            marketItems.forEach(item => option.addChoices({ name: `${item.icon} ${item.name}`, value: item.id }));
            return option;
        }),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('hedef');
        const itemId = interaction.options.getString('ürün_id');

        const item = marketItems.find(i => i.id === itemId);
        if (!item) {
            return interaction.reply({ content: 'Geçersiz ürün IDsi.', ephemeral: true });
        }

        await db.push(`envanter_${targetUser.id}`, item.id);

        const embed = new EmbedBuilder()
            .setColor('Purple')
            .setTitle('🎁 Ürün Verildi!')
            .setDescription(`**${targetUser.username}** adlı kullanıcıya **${item.icon} ${item.name}** ürünü başarıyla verildi.`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};