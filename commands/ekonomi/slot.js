const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slot')
        .setDescription('Slot makinesini çevirerek şansınızı deneyin.')
        .addIntegerOption(option =>
            option.setName('miktar')
                .setDescription('Oynamak istediğiniz miktar.')
                .setRequired(true)
                .setMinValue(20)),

    async execute(interaction) {
        const user = interaction.user;
        const miktar = interaction.options.getInteger('miktar');
        const balance = await db.get(`cuzdan_${user.id}`) || 0;

        if (balance < miktar) {
            return interaction.reply({ content: `Yeterli paran yok! Cüzdanındaki para: **${balance.toLocaleString()}**`, ephemeral: true });
        }

        const slots = ['🍒', '🍋', '🔔', '💰', '💎', '🍀'];
        const result = [slots[Math.floor(Math.random() * slots.length)], slots[Math.floor(Math.random() * slots.length)], slots[Math.floor(Math.random() * slots.length)]];
        const resultString = `**[ ${result.join(' | ')} ]**`;

        const embed = new EmbedBuilder()
            .setTitle('🎰 Slot Makinesi Çevriliyor...')
            .setDescription(resultString)
            .setColor('Gold');

        let winMultiplier = 0;
        let winText = '**KAYBETTİN!**';

        // Kazanma koşulları
        if (result[0] === result[1] && result[1] === result[2]) { // Hepsi aynı
            winMultiplier = result[0] === '💎' ? 10 : (result[0] === '💰' ? 7 : 4);
        } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) { // İkisi aynı
            winMultiplier = 2;
        } else if (result.includes('🍀')) { // Bir tane şans sembolü
            winMultiplier = 1; 
        }

        if (winMultiplier > 0) {
            const winAmount = miktar * winMultiplier;
            const netGain = winAmount - miktar;
            await db.add(`cuzdan_${user.id}`, netGain);
            winText = `🎉 **KAZANDIN!** 🎉\n${winMultiplier}x katı kazandın ve eline geçen net para: **${netGain.toLocaleString()}**`;
            embed.setColor('Green');
        } else {
            await db.subtract(`cuzdan_${user.id}`, miktar);
        }
        
        const newBalance = await db.get(`cuzdan_${user.id}`);
        embed.setDescription(`${resultString}\n\n${winText}`)
             .setFooter({ text: `Yeni bakiyen: ${newBalance.toLocaleString()}` });

        await interaction.reply({ embeds: [embed] });
    },
};