const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('temizle')
        .setDescription('Belirtilen sayıda mesajı siler.')
        .addIntegerOption(option =>
            option.setName('sayi')
                .setDescription('Silinecek mesaj sayısı (1-100)')
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .setDMPermission(false),
    async execute(interaction) {
        const amount = interaction.options.getInteger('sayi');

        await interaction.deferReply({ ephemeral: true });

        try {
            const { size } = await interaction.channel.bulkDelete(amount, true);
            await interaction.editReply(`${size} adet mesaj başarıyla silindi.`);
        } catch (error) {
            console.error(error);
            await interaction.editReply(`Mesajlar silinirken bir hata oluştu.`);
        }
    },
};