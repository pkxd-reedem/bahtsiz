const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../../data/config.json');

function getConfig() {
    if (!fs.existsSync(configPath)) {
        return {};
    }
    const data = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(data || '{}');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ayarlari-goster')
        .setDescription('Mevcut sunucu ayarlarını gösterir.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: 'Bu komut yalnızca sunucularda kullanılabilir.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const config = getConfig();
        const guildId = interaction.guild.id;
        const guildConfig = config[guildId] || {};

        const embed = new EmbedBuilder()
            .setTitle(`${interaction.guild.name} Sunucu Ayarları`)
            .setColor('#0099ff')
            .setTimestamp();

        let description = '**Genel Ayarlar:**\n';
        const otorolId = guildConfig.otorolId;
        if (otorolId) {
            const role = interaction.guild.roles.cache.get(otorolId);
            description += `Otorol: ${role ? role : `Rol bulunamadı (${otorolId})`}\n`;
        } else {
            description += 'Otorol: Ayarlanmamış\n';
        }

        description += '\n**Log Kanalları:**\n';
        const logChannels = {
            'Ceza Log': guildConfig.cezaLogKanalId,
            'Mesaj Log': guildConfig.mesajLogKanalId,
            'Eklenti Log': guildConfig.eklentiLogKanalId,
            'Ticket Log': guildConfig.ticketLogKanalId,
        };

        let hasLogChannels = false;
        for (const [name, id] of Object.entries(logChannels)) {
            if (id) {
                const channel = interaction.guild.channels.cache.get(id);
                description += `${name}: ${channel ? channel : `Kanal bulunamadı (${id})`}\n`;
                hasLogChannels = true;
            } 
        }

        if (!hasLogChannels) {
             description += 'Log kanalları ayarlanmamış.\n';
        }

        embed.setDescription(description);

        await interaction.editReply({ embeds: [embed] });
    },
};