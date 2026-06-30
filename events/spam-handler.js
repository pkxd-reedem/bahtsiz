const { Collection, EmbedBuilder, PermissionsBitField } = require('discord.js');

// --- Ayarlar ---
const SPAM_SAYISI = 6; // Kaç mesajdan sonra spam sayılacağı
const SPAM_SURESI = 5000; // Milisaniye cinsinden (5 saniye)
const MUTE_SURESI = 10 * 60 * 1000; // Milisaniye cinsinden (10 dakika)
// ---------------

const kullaniciMesajlari = new Collection();

module.exports = (client) => {
    client.on('messageCreate', async message => {
        // Bot mesajlarını, DM'leri veya yetkili kullanıcıları yoksay
        if (message.author.bot || !message.guild) return;
        if (message.member && message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;

        const simdi = Date.now();

        // Kullanıcının mesaj geçmişini al veya oluştur
        if (!kullaniciMesajlari.has(message.author.id)) {
            kullaniciMesajlari.set(message.author.id, new Collection());
        }

        const kullaniciZamanDamgalari = kullaniciMesajlari.get(message.author.id);
        kullaniciZamanDamgalari.set(message.id, simdi);

        // Belirtilen süreden eski mesajları temizle
        const eskiMesajlar = kullaniciZamanDamgalari.filter(zaman => simdi - zaman > SPAM_SURESI);
        for (const id of eskiMesajlar.keys()) {
            kullaniciZamanDamgalari.delete(id);
        }

        // Spam kontrolü
        if (kullaniciZamanDamgalari.size >= SPAM_SAYISI) {
            console.log(`[SPAM] ${message.author.tag} spam yaptığı için susturuluyor.`);

            // Spam mesajlarını sil
            const messagesToDelete = Array.from(kullaniciZamanDamgalari.keys());
            message.channel.bulkDelete(messagesToDelete, true)
                .then(deletedMessages => {
                    console.log(`[SPAM] ${message.author.tag} kullanıcısına ait ${deletedMessages.size} spam mesajı silindi.`);
                })
                .catch(error => {
                    console.error(`[HATA] Spam mesajları silinirken bir sorun oluştu:`, error);
                });
            
            // Kullanıcının mesaj geçmişini temizle
            kullaniciMesajlari.delete(message.author.id);

            // Mute rolünü bul veya hata ver
            const muteRol = message.guild.roles.cache.find(rol => rol.name.toLowerCase() === 'muted' || rol.name.toLowerCase() === 'susturulmuş');
            if (!muteRol) {
                console.error(`[HATA] Sunucuda 'Muted' veya 'Susturulmuş' adında bir rol bulunamadı.`);
                return;
            }

            try {
                // Kullanıcıyı sustur
                await message.member.roles.add(muteRol);
                
                // Bilgilendirme mesajı oluştur
                const logEmbed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('🚨 Otomatik Spam Tespiti')
                    .setDescription(`**${message.author.tag}** adlı kullanıcı, \`#${message.channel.name}\` kanalında spam yaptığı için otomatik olarak **10 dakika** susturuldu ve mesajları silindi.`)
                    .addFields(
                        { name: 'Kullanıcı', value: message.author.toString(), inline: true },
                        { name: 'Kanal', value: message.channel.toString(), inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Otomatik Koruma Sistemi' });

                // Kanala bilgilendirme mesajı gönder
                message.channel.send({ embeds: [logEmbed] }).then(msg => {
                    setTimeout(() => msg.delete().catch(console.error), 15000); // 15 saniye sonra sil
                }).catch(console.error);

                // Yönetici yetkisi olanları bul ve DM gönder
                const yoneticiler = message.guild.members.cache.filter(m => m.permissions.has(PermissionsBitField.Flags.Administrator));
                yoneticiler.forEach(yonetici => {
                    yonetici.send({ embeds: [logEmbed] }).catch(() => 
                        console.log(`[UYARI] ${yonetici.user.tag} kullanıcısına DM gönderilemedi.`)
                    );
                });

                // Kullanıcının susturmasını kaldır
                setTimeout(async () => {
                    if (message.member.roles.cache.has(muteRol.id)) {
                        await message.member.roles.remove(muteRol);
                        console.log(`[SPAM] ${message.author.tag} kullanıcısının susturması kaldırıldı.`);
                    }
                }, MUTE_SURESI);

            } catch (error) {
                console.error(`[HATA] Kullanıcı susturulurken bir sorun oluştu:`, error);
            }
        }
    });
};
