const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
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
        .setName('tepki-rol-kur')
        .setDescription('Bulunan kanala bir tepki-rol mesajı gönderir.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addRoleOption(option =>
            option.setName('rol')
                .setDescription('Tepkiye tıklandığında verilecek rol.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('emoji')
                .setDescription('Tepki için kullanılacak emoji.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('mesaj')
                .setDescription('Panelde görünecek açıklama mesajı.')
                .setRequired(true)),

    async execute(interaction) {
        const rol = interaction.options.getRole('rol');
        const emoji = interaction.options.getString('emoji');
        const mesaj = interaction.options.getString('mesaj');

        await interaction.deferReply({ ephemeral: true });

        // Botun rolü, verilecek rolden daha yüksek olmalı
        if (rol.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.editReply({ content: 'Bu rolü yönetme yetkim yok. Lütfen rol hiyerarşisinde botun rolünü bu rolün üzerine taşıyın.' });
        }

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`${rol.name} Rolünü Al`)
            .setDescription(`${mesaj}\n\nRolü almak veya bırakmak için aşağıdaki ${emoji} emojisine tıklayın.`)
            .setFooter({ text: interaction.guild.name });
        
        try {
            const sentMessage = await interaction.channel.send({ embeds: [embed] });
            await sentMessage.react(emoji);

            const config = getConfig();
            const guildId = interaction.guild.id;
            if (!config.tepkiRoller) config.tepkiRoller = [];

            // Aynı mesaj için birden fazla tepki-rol olabileceği için array olarak tutuyoruz
            config.tepkiRoller.push({
                messageId: sentMessage.id,
                guildId: guildId,
                emoji: emoji,
                roleId: rol.id
            });
            saveConfig(config);

            await interaction.editReply({ content: 'Tepki-rol mesajı başarıyla oluşturuldu!' });
        } catch (error) {
            console.error('Tepki-rol mesajı oluşturulamadı veya emoji eklenemedi:', error);
            await interaction.editReply({ content: 'Mesaj gönderilirken veya emojiye tepki verilirken bir hata oluştu. Lütfen emojinin doğru olduğundan ve izinlerimden emin olun.' });
        }
    },
};