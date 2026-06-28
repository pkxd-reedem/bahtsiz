const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('para-sil')
        .setDescription('[Yönetici] Belirtilen kullanıcıdan para siler.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Parası silinecek kullanıcı.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('miktar')
                .setDescription('Silinecek para miktarı.')
                .setRequired(true)
                .setMinValue(1)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('kullanıcı');
        const miktar = interaction.options.getInteger('miktar');
        const balance = await db.get(`cuzdan_${targetUser.id}`) || 0;

        const actualAmount = Math.min(miktar, balance);

        await db.subtract(`cuzdan_${targetUser.id}`, actualAmount);

        const embed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('🗑️ Para Silindi')
            .setDescription(`**${actualAmount.toLocaleString()}** para, ${targetUser.username} adlı kullanıcının cüzdanından başarıyla silindi.`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};