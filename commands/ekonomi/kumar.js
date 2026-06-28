const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kumar')
        .setDescription('Belirttiğiniz miktarla kumar oynarsınız. %50 Şans!')
        .addIntegerOption(option =>
            option.setName('miktar')
                .setDescription('Oynamak istediğiniz miktar.')
                .setRequired(true)
                .setMinValue(10)),

    async execute(interaction) {
        const user = interaction.user;
        const miktar = interaction.options.getInteger('miktar');
        const balance = await db.get(`cuzdan_${user.id}`) || 0;

        if (balance < miktar) {
            return interaction.reply({ content: `Yeterli paran yok! Cüzdanındaki para: **${balance.toLocaleString()}**`, ephemeral: true });
        }

        const isWin = Math.random() < 0.5; // %50 şans

        const embed = new EmbedBuilder()
            .setTitle('🎰 Kumar Makinesi Döndü!');

        if (isWin) {
            const winAmount = miktar * 2;
            await db.add(`cuzdan_${user.id}`, miktar); // Yatırılanı geri verip üstüne eklemek yerine direk yatırılanı ekliyoruz (miktar*2 - miktar)
            embed.setColor('Green')
                 .setDescription(`🎉 **KAZANDIN!** 🎉\n\nYatırdığın parayı ikiye katladın ve **${winAmount.toLocaleString()}** para kazandın!`);
        } else {
            await db.subtract(`cuzdan_${user.id}`, miktar);
            embed.setColor('Red')
                 .setDescription(`😭 **KAYBETTİN!** 😭\n\nYatırdığın **${miktar.toLocaleString()}** parayı kaybettin. Bol şans bir dahaki sefere!`);
        }

        const newBalance = await db.get(`cuzdan_${user.id}`);
        embed.setFooter({ text: `Yeni bakiyen: ${newBalance.toLocaleString()}` });

        await interaction.reply({ embeds: [embed] });
    },
};