const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kilit')
        .setDescription('Bulunulan kanalı mesaj gönderimine kapatır.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
        try {
            await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                SendMessages: false,
            });
            await interaction.reply('Kanal başarıyla kilitlendi.');
        } catch (error) {
            console.error(error);
            await interaction.reply('Kanal kilitlenirken bir hata oluştu.');
        }
    },
};