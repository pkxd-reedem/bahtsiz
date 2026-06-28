const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Belirtilen kullanıcının susturmasını kaldırır.')
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Susturması kaldırılacak kullanıcı')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers)
        .setDMPermission(false),
    async execute(interaction) {
        const user = interaction.options.getUser('kullanici');

        await interaction.deferReply();

        try {
            const member = await interaction.guild.members.fetch(user.id);
            await member.timeout(null); // Timeout'u kaldırmak için null kullanılır
            await interaction.editReply(`${user.tag} kullanıcısının susturması başarıyla kaldırıldı.`);
        } catch (error) {
            console.error(error);
            await interaction.editReply(`Kullanıcının susturması kaldırılırken bir hata oluştu.`);
        }
    },
};