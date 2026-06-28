const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../../data/config.json');

function getConfig() {
    try {
        if (!fs.existsSync(configPath)) return {};
        const data = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(data || '{}');
    } catch (error) {
        console.error("config.json okuma hatası:", error);
        return {};
    }
}

function saveConfig(config) {
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
    } catch (error) {
        console.error("config.json yazma hatası:", error);
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-konu')
        .setDescription('Ticket konularını yönetir.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('ekle')
                .setDescription('Yeni bir ticket konusu ekler.')
                .addStringOption(option => option.setName('isim').setDescription('Konu başlığı (örn: Şikayet)').setRequired(true))
                .addStringOption(option => option.setName('emoji').setDescription('Konu emojisi (örn: 🚨)').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('kaldir')
                .setDescription('Mevcut bir ticket konusunu kaldırır.')
                .addStringOption(option => option.setName('isim').setDescription('Kaldırılacak konu başlığı').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('listele')
                .setDescription('Mevcut tüm ticket konularını listeler.')
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const config = getConfig();
        if (!config[guildId]) {
            config[guildId] = {};
        }
        if (!config[guildId].ticketKonulari) {
            config[guildId].ticketKonulari = [];
        }

        const subcommand = interaction.options.getSubcommand();
        const konular = config[guildId].ticketKonulari;

        await interaction.deferReply({ ephemeral: true });

        if (subcommand === 'ekle') {
            const isim = interaction.options.getString('isim');
            const emoji = interaction.options.getString('emoji');
            const value = isim.toLowerCase().replace(/ /g, '-').slice(0, 100);

            if (konular.find(konu => konu.label === isim || konu.value === value)) {
                return interaction.editReply({ content: `\`${isim}\` adında bir konu zaten mevcut.` });
            }
            if (konular.length >= 25) {
                return interaction.editReply({ content: 'Maksimum ticket konusu sayısına ulaşıldı (25).' });
            }

            konular.push({ label: isim, value: value, emoji: emoji });
            saveConfig(config);
            return interaction.editReply({ content: `Ticket konusu başarıyla eklendi: ${emoji} ${isim}` });

        } else if (subcommand === 'kaldir') {
            const isim = interaction.options.getString('isim');
            const initialLength = konular.length;
            config[guildId].ticketKonulari = konular.filter(konu => konu.label !== isim);

            if (config[guildId].ticketKonulari.length === initialLength) {
                return interaction.editReply({ content: `\`${isim}\` adında bir ticket konusu bulunamadı.` });
            }

            saveConfig(config);
            return interaction.editReply({ content: `\`${isim}\` konusu başarıyla kaldırıldı.` });

        } else if (subcommand === 'listele') {
            if (!konular || konular.length === 0) {
                return interaction.editReply({ content: 'Henüz ayarlanmış bir ticket konusu yok.' });
            }
            const list = konular.map((konu, index) => `${index + 1}. ${konu.emoji} ${konu.label}`).join('\n');
            return interaction.editReply({ content: `**Ticket Konuları:**\n${list}` });
        }
    },
};