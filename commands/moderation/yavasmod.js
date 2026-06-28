const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yavasmod')
        .setDescription('Kanala yavaş mod uygular.')
        .addIntegerOption(option =>
            option.setName('saniye')
                .setDescription('Yavaş mod süresi (saniye cinsinden)')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
        const seconds = interaction.options.getInteger('saniye');

        try {
            await interaction.channel.setRateLimitPerUser(seconds);
            await interaction.reply(`Yavaş mod başarıyla ${seconds} saniye olarak ayarlandı.`);
        } catch (error) {
            console.error(error);
            await interaction.reply('Yavaş mod ayarlanırken bir hata oluştu.');
        }
    },
};