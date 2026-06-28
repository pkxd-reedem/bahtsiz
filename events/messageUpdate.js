const { Events, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../data/config.json');

function getConfig() {
    if (!fs.existsSync(configPath)) return {};
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

module.exports = {
    name: Events.MessageUpdate,
    async execute(oldMessage, newMessage) {
        // Botları, DM'leri veya içerik değişmemişse (örn. embed yüklenmesi) loglama
        if (!newMessage.guild || !newMessage.author || newMessage.author.bot || oldMessage.content === newMessage.content) return;

        const config = getConfig();
        const guildConfig = config[newMessage.guild.id];

        if (!guildConfig || !guildConfig.mesajLogKanalId) return;

        const logChannel = newMessage.guild.channels.cache.get(guildConfig.mesajLogKanalId);
        if (!logChannel) return;

        const logEmbed = new EmbedBuilder()
            .setColor(0x0099FF) // Mavi
            .setTitle('Mesaj Düzenlendi')
            .setDescription(`**Mesaj Sahibi:** ${newMessage.author.tag}\\n**Kanal:** ${newMessage.channel}`)
            .addFields(
                { name: 'Eski Mesaj', value: oldMessage.content ? `\`\`\`\\n${oldMessage.content}\\n\`\`\`` : '*İçerik alınamadı*' },
                { name: 'Yeni Mesaj', value: newMessage.content ? `\`\`\`\\n${newMessage.content}\\n\`\`\`` : '*İerik alınamadı*' },
                { name: 'Mesaj Linki', value: `[Mesaja Git](${newMessage.url})` }
            )
            .setTimestamp()
            .setFooter({ text: 'Mesaj Log' });

        logChannel.send({ embeds: [logEmbed] }).catch(console.error);
    },
};