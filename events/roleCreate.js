const { Events, EmbedBuilder, AuditLogEvent } = require('discord.js');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../data/config.json');

function getConfig() {
    if (!fs.existsSync(configPath)) return {};
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

module.exports = {
    name: Events.RoleCreate,
    async execute(role) {
        if (!role.guild) return;

        const config = getConfig();
        const guildConfig = config[role.guild.id];

        if (!guildConfig || !guildConfig.eklentiLogKanalId) return;

        const logChannel = role.guild.channels.cache.get(guildConfig.eklentiLogKanalId);
        if (!logChannel) return;

        await new Promise(resolve => setTimeout(resolve, 1000));

        const fetchedLogs = await role.guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.RoleCreate,
        });
        const log = fetchedLogs.entries.first();

        let executor = 'Bilinmiyor';
        if (log && log.target.id === role.id) {
            executor = log.executor.tag;
        }

        const logEmbed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('Rol Oluşturuldu')
            .addFields(
                { name: 'Rol Adı', value: role.name, inline: true },
                { name: 'Rol ID', value: role.id, inline: true },
                { name: 'Oluşturan', value: executor, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Eklenti Log' });

        logChannel.send({ embeds: [logEmbed] }).catch(console.error);
    },
};