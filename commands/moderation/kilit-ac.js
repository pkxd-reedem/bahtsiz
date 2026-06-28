const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kilit-ac')
        .setDescription('Kanal kilidini açar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
        try {
            await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                SendMessages: true,
            });
            await interaction.reply('Kanal kilidi başarıyla açıldı.');
        } catch (error) {
            console.error(error);
            await interaction.reply('Kanal kilidi açılırken bir hata oluştu.');
        }
    },
};