const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lider-tablosu')
        .setDescription('Sunucunun en zengin kullanıcılarını listeler.'),

    async execute(interaction) {
        // Tüm cüzdan verilerini çek
        const allData = await db.all();
        const moneyData = allData.filter(i => i.id.startsWith('cuzdan_'));

        if (moneyData.length === 0) {
            return interaction.reply({ content: 'Listelenecek kimse yok, sunucu henüz çok fakir!', ephemeral: true });
        }

        // Kullanıcıları paralarına göre sırala
        const sortedData = moneyData.sort((a, b) => b.value - a.value).slice(0, 10); // İlk 10 kişiyi al

        const embed = new EmbedBuilder()
            .setColor('Gold')
            .setTitle(`🏆 ${interaction.guild.name} Zenginlik Lider Tablosu`)
            .setTimestamp();

        let description = '';
        for (let i = 0; i < sortedData.length; i++) {
            const userId = sortedData[i].id.split('_')[1];
            const user = await interaction.client.users.fetch(userId).catch(() => null);
            const username = user ? user.username : 'Bilinmeyen Kullanıcı';
            const amount = sortedData[i].value;
            description += `${i + 1}. **${username}** - ${amount.toLocaleString()} para\n`;
        }
        embed.setDescription(description);

        await interaction.reply({ embeds: [embed] });
    },
};