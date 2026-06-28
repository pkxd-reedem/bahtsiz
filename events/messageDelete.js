const { Events, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../data/config.json');

function getConfig() {
    if (!fs.existsSync(configPath)) return {};
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

module.exports = {
    name: Events.MessageDelete,
    async execute(message) {
        // Botun kendi mesajlarını, DM'leri veya sistem mesajlarını loglama
        if (!message.guild || !message.author || message.author.bot) return;

        const config = getConfig();
        const guildConfig = config[message.guild.id];

        if (!guildConfig || !guildConfig.mesajLogKanalId) return;

        const logChannel = message.guild.channels.cache.get(guildConfig.mesajLogKanalId);
        if (!logChannel) return;

        // Audit logdan kimin sildiğini bulmaya çalış
        const fetchedLogs = await message.guild.fetchAuditLogs({
            limit: 1,
            type: 72, // MESSAGE_DELETE
        });
        const deletionLog = fetchedLogs.entries.first();
        
        let executor = "Bilinmiyor";
        // Silme logu varsa ve logdaki hedef silinen mesajın yazarıyla aynıysa, silen kişiyi logdan al
        if (deletionLog) {
            const { executor: logExecutor, target } = deletionLog;
            if (target.id === message.author.id) {
                executor = logExecutor.tag;
            } else {
                // Bazen log gecikir ve başka bir silme işlemini yakalar.
                // Bu yüzden mesajın kendisi tarafından silindiğini varsayıyoruz.
                executor = message.author.tag;
            }
        } else {
             // Log bulunamadıysa, mesaj sahibi tarafından silinmiş olabilir.
             executor = message.author.tag;
        }

        const logEmbed = new EmbedBuilder()
            .setColor(0xFF470F) // Kırmızı/Turuncu
            .setTitle('Mesaj Silindi')
            .setDescription(`**Mesaj Sahibi:** ${message.author.tag}\\n**Kanal:** ${message.channel}`)
            .addFields(
                { name: 'Silinen Mesaj', value: message.content ? `\`\`\`\\n${message.content}\\n\`\`\`` : '*İçerik alınamadı (embed veya dosya olabilir)*' },
                { name: 'Silen Kişi', value: executor, inline: true },
                { name: 'Mesaj ID', value: message.id, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Mesaj Log' });

        logChannel.send({ embeds: [logEmbed] }).catch(console.error);
    },
};