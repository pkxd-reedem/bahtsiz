const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
        .setName('uyar')
        .setDescription('Bir kullanıcıyı uyarır.')
        .addUserOption(option => option.setName('kullanici').setDescription('Uyarılacak kullanıcı').setRequired(true))
        .addStringOption(option => option.setName('sebep').setDescription('Uyarı sebebi').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
        const target = interaction.options.getUser('kullanici');
        const reason = interaction.options.getString('sebep');
        const moderator = interaction.user;

        const uyariId = crypto.randomBytes(4).toString('hex'); // 8 karakterli ID

        const newUyari = {
            id: uyariId,
            userId: target.id,
            userTag: target.tag,
            moderatorId: moderator.id,
            moderatorTag: moderator.tag,
            reason: reason,
            timestamp: new Date().toISOString(),
            guildId: interaction.guild.id
        };

        const uyarilar = getUyarilar();
        uyarilar.push(newUyari);
        saveUyarilar(uyarilar);

        await interaction.reply({ content: `✅ ${target.tag} kullanıcısı, \"${reason}\" sebebiyle uyarıldı. (Uyarı ID: ${uyariId})` });

        // --- Ceza Log Gönderme --- 
        const config = getConfig();
        const guildConfig = config[interaction.guild.id];

        if (guildConfig && guildConfig.cezaLogKanalId) {
            const logChannel = interaction.guild.channels.cache.get(guildConfig.cezaLogKanalId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor(0xFFB000) // Turuncu
                    .setTitle('Kullanıcı Uyarıldı')
                    .addFields(
                        { name: 'Kullanıcı', value: `${target.tag} (${target.id})`, inline: true },
                        { name: 'Yetkili', value: `${moderator.tag} (${moderator.id})`, inline: true },
                        { name: 'Uyarı ID', value: uyariId, inline: true },
                        { name: 'Sebep', value: reason }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Ceza Log' });

                logChannel.send({ embeds: [logEmbed] }).catch(console.error);
            }
        }
    },
};