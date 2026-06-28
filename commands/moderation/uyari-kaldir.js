const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const uyarilarPath = path.join(__dirname, '../../data/uyarilar.json');
const configPath = path.join(__dirname, '../../data/config.json');

function getUyarilar() {
    if (!fs.existsSync(uyarilarPath)) return [];
    return JSON.parse(fs.readFileSync(uyarilarPath, 'utf-8'));
}

function saveUyarilar(uyarilar) {
    fs.writeFileSync(uyarilarPath, JSON.stringify(uyarilar, null, 2));
}

function getConfig() {
    if (!fs.existsSync(configPath)) return {};
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uyari-kaldir')
        .setDescription("Bir kullanıcının uyarısını ID ile kaldırır.")
        .addStringOption(option => option.setName('uyari-id').setDescription("Kaldırılacak uyarının ID'si").setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
        const uyariId = interaction.options.getString('uyari-id');
        
        let uyarilar = getUyarilar();
        const uyariIndex = uyarilar.findIndex(uyari => uyari.id === uyariId && uyari.guildId === interaction.guild.id);

        if (uyariIndex === -1) {
            return interaction.reply({ content: `Bu sunucuda \`${uyariId}\` ID'li bir uyarı bulunamadı.`, ephemeral: true });
        }
        
        const [kaldirilanUyari] = uyarilar.splice(uyariIndex, 1);
        saveUyarilar(uyarilar);

        await interaction.reply({ content: `✅ \`${kaldirilanUyari.userTag}\` kullanıcısının \`${uyariId}\` ID'li uyarısı başarıyla kaldırıldı.` });

        // --- Ceza Log Gönderme --- 
        const config = getConfig();
        const guildConfig = config[interaction.guild.id];

        if (guildConfig && guildConfig.cezaLogKanalId) {
            const logChannel = interaction.guild.channels.cache.get(guildConfig.cezaLogKanalId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor(0x00FF00) // Yeşil
                    .setTitle('Uyarı Kaldırıldı')
                    .addFields(
                        { name: 'Kullanıcı', value: `${kaldirilanUyari.userTag} (${kaldirilanUyari.userId})`, inline: true },
                        { name: 'Yetkili', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                        { name: 'Kaldırılan Uyarı ID', value: uyariId, inline: true },
                        { name: 'Kaldırılan Uyarının Sebebi', value: kaldirilanUyari.reason }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Ceza Log' });

                logChannel.send({ embeds: [logEmbed] }).catch(console.error);
            }
        }
    },
};