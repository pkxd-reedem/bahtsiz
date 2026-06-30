const { Collection, EmbedBuilder, PermissionsBitField } = require('discord.js');

// --- Ayarlar ---
const SPAM_SAYISI = 6; // Kaç mesajdan sonra spam sayılacağı
const SPAM_SURESI = 5000; // Milisaniye cinsinden (5 saniye)
const MUTE_SURESI = 10 * 60 * 1000; // Milisaniye cinsinden (10 dakika)
const MESAJ_SILME_SURESI = 30000; // Son kaç saniyelik mesajların silineceği (30 saniye)
// ---------------

const kullaniciMesajlari = new Collection();

module.exports = (client) => {
    client.on('messageCreate', async message => {
        if (message.author.bot || !message.guild) return;
        if (message.member && message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;

        const simdi = Date.now();
        if (!kullaniciMesajlari.has(message.author.id)) {
            kullaniciMesajlari.set(message.author.id, new Collection());
        }
        const kullaniciZamanDamgalari = kullaniciMesajlari.get(message.author.id);
        kullaniciZamanDamgalari.set(message.id, simdi);

        const eskiMesajlar = kullaniciZamanDamgalari.filter(zaman => simdi - zaman > SPAM_SURESI);
        for (const id of eskiMesajlar.keys()) {
            kullaniciZamanDamgalari.delete(id);
        }

        if (kullaniciZamanDamgalari.size >= SPAM_SAYISI) {
            console.log(`[SPAM] ${message.author.tag} spam yaptığı için susturma işlemi başlatıldı.`);
            
            // Mesajları silme işlemi
            try {
                const fetchedMessages = await message.channel.messages.fetch({ limit: 100 });
                const userMessagesToDelete = fetchedMessages.filter(m => 
                    m.author.id === message.author.id && 
                    (simdi - m.createdTimestamp) < MESAJ_SILME_SURESI
                );

                if (userMessagesToDelete.size > 0) {
                    await message.channel.bulkDelete(userMessagesToDelete, true);
                    console.log(`[SPAM] ${message.author.tag} kullanıcısına ait ${userMessagesToDelete.size} mesaj silindi.`);
                }
            } catch (error) {
                console.error('[HATA] Mesajlar silinirken bir hata oluştu. Muhtemelen "Mesajları Yönet" yetkim yok veya 14 günden eski mesajları silmeye çalışıyorum.');
            }

            // Spam listesini temizle
            kullaniciMesajlari.delete(message.author.id);

            // Mute rolünü bul
            const muteRol = message.guild.roles.cache.find(rol => rol.name.toLowerCase() === 'muted' || rol.name.toLowerCase() === 'susturulmuş');
            if (!muteRol) {
                console.error("[HATA] Sunucuda 'Muted' veya 'Susturulmuş' adında bir rol bulunamadı. Lütfen bu isimde bir rol oluşturun.");
                return;
            }

            // ---- Mute İşlemi ve Detaylı Kontrol ----
            try {
                // 1. Botun yetkisi var mı?
                if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
                    console.error('[HATA] Botun "Rolleri Yönet" yetkisi yok. Lütfen bota bu yetkiyi verin.');
                    return;
                }

                // 2. Rol hiyerarşisi uygun mu?
                if (muteRol.position >= message.guild.members.me.roles.highest.position) {
                    console.error(`[HATA] 'Muted' rolü (${muteRol.name}) botun en yüksek rolünden (${message.guild.members.me.roles.highest.name}) daha yüksek veya aynı seviyede. Bot bu rolü veremez. Lütfen botun rolünü 'Muted' rolünün üzerine taşıyın.`);
                    return;
                }
                
                // 3. Kullanıcı zaten muteli mi diye kontrol et
                if(message.member.roles.cache.has(muteRol.id)) {
                    console.log(`[BİLGİ] ${message.author.tag} zaten susturulmuş.`);
                    return;
                }

                // Kullanıcıyı sustur
                await message.member.roles.add(muteRol);
                console.log(`[BAŞARI] ${message.author.tag} başarıyla susturuldu.`);

                // Bilgilendirme mesajı
                const logEmbed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('🚨 Otomatik Spam Tespiti')
                    .setDescription(`**${message.author.tag}** adlı kullanıcı, spam yaptığı için **10 dakika** susturuldu ve son mesajları silindi.`)
                    .addFields(
                        { name: 'Kullanıcı', value: message.author.toString(), inline: true },
                        { name: 'Kanal', value: message.channel.toString(), inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Otomatik Koruma Sistemi' });

                message.channel.send({ embeds: [logEmbed] }).then(msg => {
                    setTimeout(() => msg.delete().catch(console.error), 15000);
                }).catch(console.error);

                // Mute süresini başlat
                setTimeout(async () => {
                    // Tekrar kontrol et, belki mute manuel kaldırılmıştır
                    if (message.member && message.member.roles.cache.has(muteRol.id)) {
                        await message.member.roles.remove(muteRol).catch(console.error);
                        console.log(`[SPAM] ${message.author.tag} kullanıcısının susturması kaldırıldı.`);
                    }
                }, MUTE_SURESI);

            } catch (error) {
                console.error(`[HATA] Kullanıcı susturulurken beklenmedik bir hata oluştu:`, error);
            }
        }
    });
};
