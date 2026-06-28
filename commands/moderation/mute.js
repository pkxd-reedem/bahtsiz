const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const ms = require('ms');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Belirtilen üyeyi belirtilen süre boyunca susturur.')
        .addUserOption(option =>
            option.setName('hedef')
                .setDescription('Susturulacak üye')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('süre')
                .setDescription('Susturma süresi (örn: 10m, 1h, 1d)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('sebep')
                .setDescription('Susturma sebebi'))
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),

    async execute(interaction) {
        const target = interaction.options.getMember('hedef');
        const durationStr = interaction.options.getString('süre');
        const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi.';

        if (!target) {
            return interaction.reply({ content: 'Kullanıcı bulunamadı.', ephemeral: true });
        }

        // --- GÜVENLİK KONTROLLERİ ---
        if (target.id === interaction.user.id) {
            return interaction.reply({ content: 'Kendini susturamazsın.', ephemeral: true });
        }

        if (target.user.bot) {
            return interaction.reply({ content: 'Botları susturamazsın.', ephemeral: true });
        }

        if (target.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.reply({ content: 'Kendinle aynı veya daha yüksek rütbedeki birini susturamazsın.', ephemeral: true });
        }

        if (!target.moderatable) {
            return interaction.reply({ content: 'Bu üyeyi susturmak için yeterli yetkim yok. (Rolüm bu kullanıcının rolünden daha aşağıda olabilir)', ephemeral: true });
        }
        // --- GÜVENLİK KONTROLLERİ SONU ---

        const durationMs = ms(durationStr);
        if (!durationMs) {
            return interaction.reply({ content: 'Geçersiz süre formatı. Lütfen `10m`, `1h`, `1d` gibi bir format kullanın.', ephemeral: true });
        }
        // Discord API limiti 28 gün
        if (durationMs > 2419200000) { 
            return interaction.reply({ content: 'Susturma süresi 28 günden fazla olamaz.', ephemeral: true });
        }

        try {
            await target.timeout(durationMs, `Susturan: ${interaction.user.tag} | Sebep: ${reason}`);

            const embed = new EmbedBuilder()
                .setColor('#ffff00')
                .setTitle('Kullanıcı Susturuldu')
                .setDescription(`${target.user.tag} başarıyla susturuldu.`)
                .addFields(
                    { name: 'Susturulan Kullanıcı', value: target.toString(), inline: true },
                    { name: 'Susturan Yetkili', value: interaction.user.toString(), inline: true },
                    { name: 'Süre', value: durationStr, inline: true },
                    { name: 'Sebep', value: reason }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Mute komutunda hata:', error);
            await interaction.reply({ content: 'Kullanıcı susturulurken bir hata oluştu.', ephemeral: true });
        }
    },
};