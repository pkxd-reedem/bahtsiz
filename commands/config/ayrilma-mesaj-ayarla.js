const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../../data/config.json');

function getConfig() {
    try {
        if (!fs.existsSync(configPath)) {
            return {};
        }
        const data = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(data || '{}');
    } catch (error) {
        console.error("config.json okunurken hata oluştu:", error);
        return {};
    }
}

function saveConfig(config) {
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
    } catch (error) {
        console.error("config.json yazılırken hata oluştu:", error);
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ayrilma-mesaj-ayarla')
        .setDescription('Sunucudan ayrılanlar için veda mesajını ayarlar.')
        .addStringOption(option =>
            option.setName('mesaj')
                .setDescription('Değişkenler: {user}, {username}, {server}, {memberCount}')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: 'Bu komut yalnızca sunucularda kullanılabilir.', ephemeral: true });
        }

        const message = interaction.options.getString('mesaj');
        const guildId = interaction.guild.id;

        const config = getConfig();
        if (!config[guildId]) {
            config[guildId] = {};
        }

        config[guildId].ayrilmaMesaj = message;
        saveConfig(config);

        await interaction.reply({ content: `Ayrılma mesajı başarıyla ayarlandı:\n>>> ${message}` });
    },
};