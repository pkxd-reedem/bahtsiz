const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-olustur')
        .setDescription('Bu kanala ticket oluşturma panelini gönderir.')
        .addStringOption(option =>
            option.setName('baslik')
                .setDescription('Panel embedinin başlığı.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('aciklama')
                .setDescription('Panel embedinin açıklaması. Satır atlamak için \\n kullanın.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('buton-yazisi')
                .setDescription('Butonun üzerinde görünecek yazı.')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const config = getConfig();
        const guildConfig = config[guildId] || {};

        // Gerekli ayarların kontrolü
        if (!guildConfig.ticketSorumluRolId || !guildConfig.ticketKategoriId || !guildConfig.ticketKonulari || guildConfig.ticketKonulari.length === 0) {
            let eksikAyarlar = [];
            if (!guildConfig.ticketSorumluRolId) eksikAyarlar.push('Sorumlu rol');
            if (!guildConfig.ticketKategoriId) eksikAyarlar.push('Kanal kategorisi');
            if (!guildConfig.ticketKonulari || guildConfig.ticketKonulari.length === 0) eksikAyarlar.push('En az bir ticket konusu');
            
            return interaction.reply({ 
                content: `Ticket paneli oluşturulamadı! Lütfen önce şu ayarları yapın: **${eksikAyarlar.join(', ')}**.\\nKullanım: \`/ticket-ayarlar\``, 
                ephemeral: true 
            });
        }

        const baslik = interaction.options.getString('baslik');
        const aciklama = interaction.options.getString('aciklama').replace(/\\\\n/g, '\\n');
        const butonYazisi = interaction.options.getString('buton-yazisi');

        const embed = new EmbedBuilder()
            .setColor(0x5865F2) // Discord Blurple
            .setTitle(baslik)
            .setDescription(aciklama)
            .setFooter({ text: `${interaction.guild.name} | Destek Sistemi` });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_create')
                    .setLabel(butonYazisi)
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🎟️'),
            );
        
        try {
            await interaction.channel.send({ embeds: [embed], components: [row] });
            await interaction.reply({ content: 'Ticket paneli başarıyla bu kanala gönderildi.', ephemeral: true });
        } catch (error) {
            console.error("Ticket paneli gönderilemedi:", error);
            await interaction.reply({ content: 'Paneli gönderirken bir hata oluştu. Kanal izinlerimi kontrol edin.', ephemeral: true });
        }
    },
};