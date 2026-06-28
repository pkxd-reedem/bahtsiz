const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Belirtilen üyeyi sunucudan yasaklar.')
        .addUserOption(option =>
            option.setName('hedef')
                .setDescription('Yasaklanacak üye')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('sebep')
                .setDescription('Yasaklama sebebi'))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const target = interaction.options.getMember('hedef');
        const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi.';

        if (!target) {
            return interaction.reply({ content: 'Kullanıcı bulunamadı.', ephemeral: true });
        }

        // --- GÜVENLİK KONTROLLERİ ---
        if (target.id === interaction.user.id) {
            return interaction.reply({ content: 'Kendini yasaklayamazsın.', ephemeral: true });
        }

        if (target.user.bot) {
            return interaction.reply({ content: 'Botları yasaklayamazsın.', ephemeral: true });
        }

        if (target.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.reply({ content: 'Kendinle aynı veya daha yüksek rütbedeki birini yasaklayamazsın.', ephemeral: true });
        }

        if (!target.bannable) {
            return interaction.reply({ content: 'Bu üyeyi yasaklamak için yeterli yetkim yok. (Rolüm bu kullanıcının rolünden daha aşağıda olabilir)', ephemeral: true });
        }
        // --- GÜVENLİK KONTROLLERİ SONU ---

        try {
            await target.ban({ reason: `Yasaklayan: ${interaction.user.tag} | Sebep: ${reason}` });

            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Kullanıcı Yasaklandı')
                .setDescription(`${target.user.tag} sunucudan yasaklandı.`)
                .addFields(
                    { name: 'Yasaklanan Kullanıcı', value: target.toString(), inline: true },
                    { name: 'Yasaklayan Yetkili', value: interaction.user.toString(), inline: true },
                    { name: 'Sebep', value: reason }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Ban komutunda hata:', error);
            await interaction.reply({ content: 'Kullanıcı yasaklanırken bir hata oluştu.', ephemeral: true });
        }
    },
};