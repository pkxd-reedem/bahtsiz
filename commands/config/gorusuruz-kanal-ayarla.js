const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../../data/config.json');

function getConfig() {
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, JSON.stringify({}));
    }
    const data = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(data);
}

function saveConfig(config) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gorusuruz-kanal-ayarla')
        .setDescription('Görüşürüz mesajlarının gönderileceği kanalı ayarlar.')
        .addChannelOption(option =>
            option.setName('kanal')
                .setDescription('Görüşürüz kanalı')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const channel = interaction.options.getChannel('kanal');
        
        if (!interaction.guild) {
             await interaction.reply({ content: 'Bu komut sadece sunucularda kullanılabilir.', ephemeral: true });
             return;
        }

        const config = getConfig();

        config[interaction.guild.id] = {
            ...config[interaction.guild.id],
            gorusuruzKanalId: channel.id
        };

        saveConfig(config);

        await interaction.reply({ content: `Görüşürüz kanalı başarıyla #${channel.name} olarak ayarlandı.` });
    },
};