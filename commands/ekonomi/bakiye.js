const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB(); // Veritabanını başlat

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bakiye')
        .setDescription('Cüzdanınızdaki ve bankadaki para miktarını gösterir.')
        .addUserOption(option => 
            option.setName('kullanıcı')
                .setDescription('Bakiyesini görmek istediğiniz kullanıcı.')
                .setRequired(false)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('kullanıcı') || interaction.user;

        // Veritabanından cüzdan ve banka bakiyelerini çekiyoruz. Eğer kayıt yoksa 0 olarak varsayıyoruz.
        const cuzdan = await db.get(`cuzdan_${targetUser.id}`) || 0;
        const banka = await db.get(`banka_${targetUser.id}`) || 0;
        const toplam = cuzdan + banka;

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle(`${targetUser.username} Adlı Kullanıcının Bakiyesi`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '💸 Cüzdan', value: `**${cuzdan.toLocaleString()}** para`, inline: true },
                { name: '🏦 Banka', value: `**${banka.toLocaleString()}** para`, inline: true },
                { name: '💰 Toplam', value: `**${toplam.toLocaleString()}** para`, inline: true },
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};