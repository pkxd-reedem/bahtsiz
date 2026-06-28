const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
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
        .setName('ticket-ayarlar')
        .setDescription('Ticket için sorumlu rolü ve kanal kategorisini ayarlar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addRoleOption(option =>
            option.setName('sorumlu-rol')
                .setDescription('Ticket oluşturulduğunda pinglenecek yetkili rolü.')
                .setRequired(false) // Zorunlu değil, sadece bunu güncelleyebilirsin
        )
        .addChannelOption(option =>
            option.setName('kanal-kategorisi')
                .setDescription('Ticket kanallarının oluşturulacağı kategori.')
                .addChannelTypes(ChannelType.GuildCategory)
                .setRequired(false) // Zorunlu değil, sadece bunu güncelleyebilirsin
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const config = getConfig();
        if (!config[guildId]) {
            config[guildId] = {};
        }

        const rol = interaction.options.getRole('sorumlu-rol');
        const kategori = interaction.options.getChannel('kanal-kategorisi');

        if (!rol && !kategori) {
            return interaction.reply({ content: 'Lütfen ayarlamak için en az bir seçenek belirtin (sorumlu-rol veya kanal-kategorisi).', ephemeral: true });
        }

        let replies = [];

        if (rol) {
            config[guildId].ticketSorumluRolId = rol.id;
            replies.push(`Ticket sorumlusu rol başarıyla ${rol} olarak ayarlandı.`);
        }

        if (kategori) {
            config[guildId].ticketKategoriId = kategori.id;
            replies.push(`Ticket kanallarının oluşturulacağı kategori başarıyla ${kategori} olarak ayarlandı.`);
        }

        saveConfig(config);

        await interaction.reply({ 
            content: replies.join('\n'), 
            ephemeral: true 
        });
    },
};