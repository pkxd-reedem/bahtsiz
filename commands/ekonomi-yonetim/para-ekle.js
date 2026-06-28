const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('para-ekle')
        .setDescription('[Yönetici] Belirtilen kullanıcıya para ekler.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Sadece adminler kullanabilir
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Para eklenecek kullanıcı.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('miktar')
                .setDescription('Eklenecek para miktarı.')
                .setRequired(true)
                .setMinValue(1)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('kullanıcı');
        const miktar = interaction.options.getInteger('miktar');

        // Kullanıcının cüzdanına belirtilen miktarı ekle
        await db.add(`cuzdan_${targetUser.id}`, miktar);

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('✅ Para Eklendi')
            .setDescription(`**${miktar.toLocaleString()}** para, ${targetUser.username} adlı kullanıcının cüzdanına başarıyla eklendi.`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};