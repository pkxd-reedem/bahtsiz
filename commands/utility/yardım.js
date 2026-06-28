const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yardım')
        .setDescription('Botun tüm komutlarını listeler.'),

    async execute(interaction) {
        try {
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle(`${interaction.client.user.username} - Komut Menüsü`)
                .setDescription('İşte kullanabileceğin tüm komutlar aşağıda listelenmiştir:')
                .setTimestamp()
                .setFooter({ text: `${interaction.user.tag} tarafından istendi.` });

            embed.addFields(
                {
                    name: '🔹 Ekonomi',
                    value: '`/bakiye`\n`/balik-tut`\n`/blackjack`\n`/calis`\n`/envanter`\n`/gunluk`\n`/kumar`\n`/lider-tablosu`\n`/market`\n`/para-cek`\n`/para-gonder`\n`/para-yatir`\n`/rulet`\n`/satin-al`\n`/slot`\n`/soygun`\n`/suc-isle`\n`/yuksek-alcak`\n`/zar-at`',
                    inline: true
                },
                {
                    name: '🔹 Moderasyon',
                    value: '`/ban`\n`/kick`\n`/kilit-ac`\n`/kilit`\n`/mute`\n`/sicil`\n`/temizle`\n`/unban`\n`/unmute`\n`/uyar`\n`/uyari-kaldir`\n`/yavasmod`',
                    inline: true
                },
                {
                    name: '🔹 Kullanıcı & Sunucu',
                    value: '`/avatar`\n`/kullanici-bilgi`\n`/ping`\n`/sunucu-bilgi`\n`/oylama`\n`/embed-olustur`\n`/yardım`',
                    inline: true
                },
                {
                    name: '🔹 Kurulum & Ayar (Yönetici)',
                    value: '`/ayarlari-goster`\n`/ayrilma-mesaj-ayarla`\n`/gorusuruz-kanal-ayarla`\n`/hosgeldin-kanal-ayarla`\n`/hosgeldin-mesaj-ayarla`\n`/log-kurulum`\n`/otocevap`\n`/otorol-ayarla`\n`/tepki-rol-kur`\n`/ticket-ayarlar`\n`/ticket-konu`\n`/ticket-olustur`\n`/durum-kanal`',
                    inline: false
                }
            );

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error("Manuel yardım komutunda bir hata oluştu:", error);
            await interaction.reply({ content: 'Komut listesini gösterirken beklenmedik bir hata oluştu.', ephemeral: true });
        }
    },
};
