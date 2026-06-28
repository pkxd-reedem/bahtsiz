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
    name: Events.GuildMemberRemove,
    async execute(member) {
        if (member.user.bot) return;

        const config = getConfig();
        const guildConfig = config[member.guild.id];

        if (!guildConfig || !guildConfig.gorusuruzKanalId) return;

        const channel = member.guild.channels.cache.get(guildConfig.gorusuruzKanalId);
        if (channel) {
            // Varsayılan veya özel mesajı al
            const defaultMessage = `**{username}** aramızdan ayrıldı. Şimdi sunucuda **{memberCount}** kişiyiz.`;
            const goodbyeMessage = guildConfig.ayrilmaMesaj || defaultMessage;

            // Değişkenleri doldur
            const formattedMessage = goodbyeMessage
                .replace(/{user}/g, member.toString()) // Ayrılan üyeyi etiketlemek pek mantıklı değil ama yine de ekleyelim
                .replace(/{username}/g, member.user.username)
                .replace(/{server}/g, member.guild.name)
                .replace(/{memberCount}/g, member.guild.memberCount.toString());

            const goodbyeEmbed = new EmbedBuilder()
                .setColor(0xFF0000) // Kırmızı
                .setAuthor({ name: `${member.user.username} ayrıldı!`, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
                .setDescription(formattedMessage)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: `ID: ${member.id}` });

            channel.send({ embeds: [goodbyeEmbed] }).catch(console.error);
        }
    },
};