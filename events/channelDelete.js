const { Events, EmbedBuilder, AuditLogEvent } = require('discord.js');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../data/config.json');

function getConfig() {
    if (!fs.existsSync(configPath)) return {};
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

module.exports = {
    name: Events.ChannelDelete,
    async execute(channel) {
        if (!channel.guild) return;

        const config = getConfig();
        const guildConfig = config[channel.guild.id];

        if (!guildConfig || !guildConfig.eklentiLogKanalId) return;

        const logChannel = channel.guild.channels.cache.get(guildConfig.eklentiLogKanalId);
        if (!logChannel) return;

        await new Promise(resolve => setTimeout(resolve, 1000));

        const fetchedLogs = await channel.guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.ChannelDelete,
        });
        const log = fetchedLogs.entries.first();

        let executor = 'Bilinmiyor';
        if (log && log.target.id === channel.id) {
            executor = log.executor.tag;
        }

        const logEmbed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('Kanal Silindi')
            .addFields(
                { name: 'Kanal Adı', value: channel.name, inline: true },
                { name: 'Kanal ID', value: channel.id, inline: true },
                { name: 'Silen Kişi', value: executor, inline: true },
                { name: 'Kanal Türü', value: `${channel.type}`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Eklenti Log' });

        logChannel.send({ embeds: [logEmbed] }).catch(console.error);
    },
};