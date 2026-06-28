const { Events, EmbedBuilder, AuditLogEvent } = require('discord.js');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../data/config.json');

function getConfig() {
    if (!fs.existsSync(configPath)) return {};
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

module.exports = {
    name: Events.ChannelCreate,
    async execute(channel) {
        if (!channel.guild) return;

        const config = getConfig();
        const guildConfig = config[channel.guild.id];

        if (!guildConfig || !guildConfig.eklentiLogKanalId) return;

        const logChannel = channel.guild.channels.cache.get(guildConfig.eklentiLogKanalId);
        if (!logChannel) return;

        // Audit log'un yazılması için kısa bir gecikme
        await new Promise(resolve => setTimeout(resolve, 1000));

        const fetchedLogs = await channel.guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.ChannelCreate,
        });
        const log = fetchedLogs.entries.first();
        
        let executor = 'Bilinmiyor';
        // Logun doğru olup olmadığını kontrol et
        if (log && log.target.id === channel.id) {
            executor = log.executor.tag;
        }

        const logEmbed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('Kanal Oluşturuldu')
            .addFields(
                { name: 'Kanal Adı', value: channel.name, inline: true },
                { name: 'Kanal ID', value: channel.id, inline: true },
                { name: 'Oluşturan', value: executor, inline: true },
                { name: 'Kanal Türü', value: `${channel.type}`, inline: true } 
            )
            .setTimestamp()
            .setFooter({ text: 'Eklenti Log' });

        logChannel.send({ embeds: [logEmbed] }).catch(console.error);
    },
};