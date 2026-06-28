const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Belirtilen kullanıcının yasağını kaldırır.')
        .addStringOption(option =>
            option.setName('hedef-id')
                .setDescription('Yasağı kaldırılacak kullanıcının ID\'si')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('sebep')
                .setDescription('Yasak kaldırma sebebi'))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const targetId = interaction.options.getString('hedef-id');
        const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi.';

        // --- GÜVENLİK KONTROLLERİ ---
        if (targetId === interaction.user.id) {
            return interaction.reply({ content: 'Kendinin yasağını kaldıramazsın.', ephemeral: true });
        }

        if (targetId === interaction.client.user.id) {
            return interaction.reply({ content: 'Benim yasağımı zaten kaldıramazsın, çünkü hiç yasaklanmadım! 😎', ephemeral: true });
        }
        // --- GÜVENLİK KONTROLLERİ SONU ---

        try {
            const bannedUsers = await interaction.guild.bans.fetch();
            const targetUser = bannedUsers.get(targetId);

            if (!targetUser) {
                return interaction.reply({ content: 'Bu kullanıcı yasaklı değil veya yanlış ID girdiniz.', ephemeral: true });
            }

            await interaction.guild.bans.remove(targetId, `Yasağı Kaldıran: ${interaction.user.tag} | Sebep: ${reason}`);

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('Yasak Kaldırıldı')
                .setDescription(`${targetUser.user.tag} kullanıcısının yasağı kaldırıldı.`)
                .addFields(
                    { name: 'Kullanıcı', value: targetUser.user.tag, inline: true },
                    { name: 'Yetkili', value: interaction.user.toString(), inline: true },
                    { name: 'Sebep', value: reason }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Unban komutunda hata:', error);
            if (error.code === 50013) { // Missing Permissions
                 await interaction.reply({ content: 'Kullanıcıların yasağını kaldırmak için yeterli yetkim yok.', ephemeral: true });
            } else {
                 await interaction.reply({ content: 'Kullanıcının yasağı kaldırılırken bir hata oluştu.', ephemeral: true });
            }
        }
    },
};