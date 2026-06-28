const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Config dosyasının yolu
const configPath = path.join(__dirname, '../../data/config.json');

// Config dosyasını okumak/oluşturmak için yardımcı fonksiyon
function getConfig() {
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, JSON.stringify({}));
    }
    const data = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(data);
}

// Config dosyasına yazmak için yardımcı fonksiyon
function saveConfig(config) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('otorol-ayarla')
        .setDescription('Yeni üyelere otomatik verilecek rolü ayarlar.')
        .addRoleOption(option =>
            option.setName('rol')
                .setDescription('Otomatik olarak verilecek rol')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const role = interaction.options.getRole('rol');
        
        if (!interaction.guild) {
             await interaction.reply({ content: 'Bu komut sadece sunucularda kullanılabilir.', ephemeral: true });
             return;
        }

        const config = getConfig();

        // Sunucuya özel ayarları güncelle
        config[interaction.guild.id] = {
            ...config[interaction.guild.id], // Mevcut diğer ayarları koru
            otorolId: role.id
        };

        saveConfig(config);

        await interaction.reply({ content: `Otorol başarıyla ${role.name} olarak ayarlandı.` });
    },
};