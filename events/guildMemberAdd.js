const { Events, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../data/config.json');

function getConfig() {
    if (!fs.existsSync(configPath)) {
        return {};
    }
    const data = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(data || '{}');
}

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        if (member.user.bot) return; // Botları es geç

        const config = getConfig();
        const guildConfig = config[member.guild.id];

        if (!guildConfig) return; // Bu sunucu için ayar yapılmamışsa çık

        // --- Hoş Geldin Mesajı --- 
        if (guildConfig.hosgeldinKanalId) {
            const channel = member.guild.channels.cache.get(guildConfig.hosgeldinKanalId);
            if (channel) {
                // Varsayılan veya özel mesajı al
                const defaultMessage = `Aramıza hoş geldin {user}! Seninle birlikte {memberCount} kişi olduk.`;
                const welcomeMessage = guildConfig.hosgeldinMesaj || defaultMessage;

                // Değişkenleri doldur
                const formattedMessage = welcomeMessage
                    .replace(/{user}/g, member.toString()) // Üyeyi etiketler: @KullanıcıAdı
                    .replace(/{username}/g, member.user.username)
                    .replace(/{server}/g, member.guild.name)
                    .replace(/{memberCount}/g, member.guild.memberCount.toString());

                const welcomeEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setAuthor({ name: `${member.user.username} katıldı!`, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
                    .setDescription(formattedMessage)
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                    .setTimestamp()
                    .setFooter({ text: `ID: ${member.id}` });
                
                channel.send({ embeds: [welcomeEmbed] }).catch(console.error);
            }
        }

        // --- Otorol Verme --- 
        if (guildConfig.otorolId) {
            const role = member.guild.roles.cache.get(guildConfig.otorolId);
            if (role) {
                if (role.position < member.guild.members.me.roles.highest.position) {
                     member.roles.add(role).catch(console.error);
                } else {
                    console.log(`Otorol (${role.name}) verilemedi çünkü rolümden daha yüksek.`);
                }
            }
        }
    },
};