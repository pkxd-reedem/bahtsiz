
const { EmbedBuilder, ActivityType } = require('discord.js');

// Belirli aralıklarla çalışacak olan durum kontrol fonksiyonu
async function checkMemberStatus(client) {
    const requiredRoleId = '1513241732748153073';
    const requiredStatus = '/bahtsiz';
    
    // Botun tüm sunucularını dolaş
    for (const guild of client.guilds.cache.values()) {
        try {
            const members = await guild.members.fetch();

            for (const member of members.values()) {
                // Botları ve gerekli role sahip olmayanları atla
                if (member.user.bot || !member.roles.cache.has(requiredRoleId)) {
                    continue;
                }

                const customStatus = member.presence?.activities.find(activity => activity.type === ActivityType.Custom);

                // Durumu kontrol et ve uyumsuzsa DM gönder
                if (!customStatus || !customStatus.state || !customStatus.state.includes(requiredStatus)) {
                    try {
                        const dmChannel = await member.createDM();
                        const embed = new EmbedBuilder()
                            .setColor('Orange')
                            .setTitle('👋 Merhaba!')
                            .setDescription(`Sunucumuzda daha iyi bir deneyim için durumunuza **${requiredStatus}** yazmanızı rica ediyoruz. Teşekkürler!`);
                        
                        await dmChannel.send({ embeds: [embed] });
                        console.log(`Durum uyarısı gönderildi: ${member.user.tag}`);
                    } catch (dmError) {
                        // Kullanıcının DM'leri kapalıysa veya bir hata oluşursa logla
                        if (dmError.code === 50007) {
                            console.log(`DM gönderilemedi (DM'ler kapalı): ${member.user.tag}`);
                        } else {
                            console.error(`DM gönderirken bir hata oluştu: ${member.user.tag}`, dmError);
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`Sunucu üyeleri kontrol edilirken bir hata oluştu: ${guild.name}`, error);
        }
    }
}

module.exports = (client) => {
    // Bot hazır olduğunda ve sonrasında her 15 dakikada bir kontrol et
    client.once('ready', () => {
        // Botu yormamak için ilk çalıştırmayı biraz geciktirelim
        setTimeout(() => checkMemberStatus(client), 5 * 60 * 1000); // 5 dakika sonra
        setInterval(() => checkMemberStatus(client), 15 * 60 * 1000); // Sonrasında her 15 dakikada bir
    });
};
