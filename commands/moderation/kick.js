const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Belirtilen üyeyi sunucudan atar.')
        .addUserOption(option =>
            option.setName('hedef')
                .setDescription('Atılacak üye')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('sebep')
                .setDescription('Atma sebebi'))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        const target = interaction.options.getMember('hedef');
        const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi.';

        if (!target) {
            return interaction.reply({ content: 'Kullanıcı bulunamadı.', ephemeral: true });
        }

        // --- GÜVENLİK KONTROLLERİ ---
        if (target.id === interaction.user.id) {
            return interaction.reply({ content: 'Kendini atamazsın.', ephemeral: true });
        }

        if (target.user.bot) {
            return interaction.reply({ content: 'Botları atamazsın.', ephemeral: true });
        }

        if (target.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.reply({ content: 'Kendinle aynı veya daha yüksek rütbedeki birini atamazsın.', ephemeral: true });
        }

        if (!target.kickable) {
            return interaction.reply({ content: 'Bu üyeyi atmak için yeterli yetkim yok. (Rolüm bu kullanıcının rolünden daha aşağıda olabilir)', ephemeral: true });
        }
        // --- GÜVENLİK KONTROLLERİ SONU ---

        try {
            await target.kick({ reason: `Atan: ${interaction.user.tag} | Sebep: ${reason}` });

            const embed = new EmbedBuilder()
                .setColor('#ffa500')
                .setTitle('Kullanıcı Atıldı')
                .setDescription(`${target.user.tag} sunucudan atıldı.`)
                .addFields(
                    { name: 'Atılan Kullanıcı', value: target.toString(), inline: true },
                    { name: 'Atan Yetkili', value: interaction.user.toString(), inline: true },
                    { name: 'Sebep', value: reason }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Kick komutunda hata:', error);
            await interaction.reply({ content: 'Kullanıcı atılırken bir hata oluştu.', ephemeral: true });
        }
    },
};