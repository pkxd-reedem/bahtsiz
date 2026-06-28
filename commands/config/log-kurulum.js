const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../../data/config.json');

function getConfig() {
    if (!fs.existsSync(configPath)) {
        return {};
    }
    const data = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(data || '{}');
}

function saveConfig(config) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('log-kurulum')
        .setDescription('Gerekli tüm log kanallarını otomatik olarak oluşturur ve ayarlar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: 'Bu komut sadece sunucularda kullanılabilir.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const config = getConfig();
        const guildId = interaction.guild.id;

        if (config[guildId] && config[guildId].logKategoriId) {
            const existingCategory = interaction.guild.channels.cache.get(config[guildId].logKategoriId);
            if (existingCategory) {
                return interaction.editReply({ content: `Log sistemi zaten kurulu. Kategori: ${existingCategory}` });
            }
        }

        try {
            const category = await interaction.guild.channels.create({
                name: '📜│LOGLAR',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id, // @everyone rolü
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: interaction.client.user.id, // Botun kendisi
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                    },
                ],
            });

            const cezaLogKanali = await interaction.guild.channels.create({
                name: 'ceza-logları',
                type: ChannelType.GuildText,
                parent: category.id,
            });

            const mesajLogKanali = await interaction.guild.channels.create({
                name: 'mesaj-logları',
                type: ChannelType.GuildText,
                parent: category.id,
            });

            const eklentiLogKanali = await interaction.guild.channels.create({
                name: 'eklenti-logları',
                type: ChannelType.GuildText,
                parent: category.id,
            });

            const ticketLogKanali = await interaction.guild.channels.create({
                name: 'ticket-logları',
                type: ChannelType.GuildText,
                parent: category.id,
            });

            if (!config[guildId]) {
                config[guildId] = {};
            }

            config[guildId].logKategoriId = category.id;
            config[guildId].cezaLogKanalId = cezaLogKanali.id;
            config[guildId].mesajLogKanalId = mesajLogKanali.id;
            config[guildId].eklentiLogKanalId = eklentiLogKanali.id;
            config[guildId].ticketLogKanalId = ticketLogKanali.id;

            saveConfig(config);

            await interaction.editReply(
                `✅ Log sistemi başarıyla kuruldu!\n` +
                `- Kategori: ${category}\n` +
                `- Kanallar: ${cezaLogKanali}, ${mesajLogKanali}, ${eklentiLogKanali}, ${ticketLogKanali}`
            );

        } catch (error) {
            console.error('Log kurulumu sırasında hata oluştu:', error);
            await interaction.editReply({ content: 'Log kanalları oluşturulurken bir hata oluştu. Lütfen botun \'Kanalları Yönet\' yetkisine sahip olduğundan emin olun.' });
        }
    },
};