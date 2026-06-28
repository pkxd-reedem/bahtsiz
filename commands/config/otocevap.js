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
        .setName('otocevap')
        .setDescription('Otomatik cevapları yönetir.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('ekle')
                .setDescription('Yeni bir otomatik cevap ekler.')
                .addStringOption(option => option.setName('tetikleyici').setDescription('Cevabı tetikleyecek kelime veya cümle.').setRequired(true))
                .addStringOption(option => option.setName('cevap').setDescription('Botun vereceği cevap.').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('kaldir')
                .setDescription('Bir otomatik cevabı kaldırır.')
                .addStringOption(option => option.setName('tetikleyici').setDescription('Kaldırılacak cevabın tetikleyicisi.').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('listele')
                .setDescription('Tüm otomatik cevapları listeler.')
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const config = getConfig();
        if (!config[guildId]) config[guildId] = {};
        if (!config[guildId].otoCevaplar) config[guildId].otoCevaplar = [];

        const subcommand = interaction.options.getSubcommand();
        const otoCevaplar = config[guildId].otoCevaplar;

        await interaction.deferReply({ ephemeral: true });

        if (subcommand === 'ekle') {
            const tetikleyici = interaction.options.getString('tetikleyici').toLowerCase();
            const cevap = interaction.options.getString('cevap');

            if (otoCevaplar.find(oc => oc.tetikleyici === tetikleyici)) {
                return interaction.editReply({ content: `\`${tetikleyici}\` için zaten bir oto cevap mevcut.` });
            }

            otoCevaplar.push({ tetikleyici, cevap });
            saveConfig(config);
            return interaction.editReply({ content: `Oto cevap eklendi: \`${tetikleyici}\` -> \`${cevap}\`` });

        } else if (subcommand === 'kaldir') {
            const tetikleyici = interaction.options.getString('tetikleyici').toLowerCase();
            const initialLength = otoCevaplar.length;
            config[guildId].otoCevaplar = otoCevaplar.filter(oc => oc.tetikleyici !== tetikleyici);

            if (config[guildId].otoCevaplar.length === initialLength) {
                return interaction.editReply({ content: `\`${tetikleyici}\` için bir oto cevap bulunamadı.` });
            }

            saveConfig(config);
            return interaction.editReply({ content: `\`${tetikleyici}\` oto cevabı kaldırıldı.` });

        } else if (subcommand === 'listele') {
            if (otoCevaplar.length === 0) {
                return interaction.editReply({ content: 'Henüz ayarlanmış bir oto cevap yok.' });
            }
            const list = otoCevaplar.map((oc, i) => `${i + 1}. \`${oc.tetikleyici}\` -> \`${oc.cevap}\``).join('\\n');
            return interaction.editReply({ content: `**Oto Cevap Listesi:**\\n${list}` });
        }
    },
};