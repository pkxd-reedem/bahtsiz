const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

// Rulet tekerleği sayıları ve renkleri
const numbers = {
    0: 'green',
    1: 'red', 2: 'black', 3: 'red', 4: 'black', 5: 'red', 6: 'black', 7: 'red', 8: 'black', 9: 'red',
    10: 'black', 11: 'black', 12: 'red', 13: 'black', 14: 'red', 15: 'black', 16: 'red', 17: 'black', 18: 'red',
    19: 'red', 20: 'black', 21: 'red', 22: 'black', 23: 'red', 24: 'black', 25: 'red', 26: 'black', 27: 'red',
    28: 'black', 29: 'black', 30: 'red', 31: 'black', 32: 'red', 33: 'black', 34: 'red', 35: 'black', 36: 'red'
};
const numberEmojis = { 'red': '🔴', 'black': '⚫', 'green': '🟢' };

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rulet')
        .setDescription('Rulet oynarsın. Bir sayıya veya renge bahis yapabilirsin.')
        .addStringOption(option => 
            option.setName('tur')
                .setDescription('Bahis yapmak istediğin tür.')
                .setRequired(true)
                .addChoices(
                    { name: 'Siyah', value: 'black' },
                    { name: 'Kırmızı', value: 'red' },
                    { name: 'Sayı', value: 'number' },
                ))
        .addIntegerOption(option =>
            option.setName('miktar')
                .setDescription('Oynamak istediğiniz bahis miktarı.')
                .setRequired(true)
                .setMinValue(10))
        .addIntegerOption(option =>
            option.setName('sayi')
                .setDescription('Eğer sayıya oynuyorsan bir sayı seç (0-36).')
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(36)),

    async execute(interaction) {
        const user = interaction.user;
        const type = interaction.options.getString('tur');
        const miktar = interaction.options.getInteger('miktar');
        const sayi = interaction.options.getInteger('sayi');
        const cuzdan = await db.get(`cuzdan_${user.id}`) || 0;

        if (type === 'number' && sayi === null) {
            return interaction.reply({ content: 'Bahis türünü "Sayı" olarak seçtiysen bir sayı da belirtmelisin!', ephemeral: true });
        }

        if (cuzdan < miktar) {
            return interaction.reply({ content: `Yeterli paran yok! Cüzdanındaki para: **${cuzdan.toLocaleString()}**`, ephemeral: true });
        }

        // .subtract() -> .sub() olarak düzeltildi
        await db.sub(`cuzdan_${user.id}`, miktar);

        const winningNumber = Math.floor(Math.random() * 37);
        const winningColor = numbers[winningNumber];

        let resultText = '';
        let win = false;
        let payout = 0;

        if (type === 'number') {
            if (winningNumber === sayi) {
                win = true;
                payout = miktar * 36;
                resultText = `İNANILMAZ! 🎯 Top tam da seçtiğin sayı olan **${winningNumber}** üzerinde durdu! **${payout.toLocaleString()}** para kazandın!`;
            } else {
                resultText = `Kaybettin. 꽝 Top **${winningNumber}** sayısında durdu.`;
            }
        } else { // Renk bahsi
            if (winningColor === type) {
                win = true;
                payout = miktar * 2;
                resultText = `Harika! 🎨 Top **${winningColor === 'red' ? 'Kırmızı' : 'Siyah'}** renkte durdu! **${payout.toLocaleString()}** para kazandın!`;
            } else {
                 resultText = `Kaybettin. 꽝 Top **${numberEmojis[winningColor]} ${winningNumber}** üzerinde durdu.`;
                 if (winningColor === 'green') {
                     resultText += ` Yeşil renk geldiği için tüm renk bahisleri kaybeder.`
                 }
            }
        }

        if (win) {
            await db.add(`cuzdan_${user.id}`, payout);
        }
        
        const embed = new EmbedBuilder()
            .setTitle('🎰 Rulet Masası')
            .setDescription(`Top dönüyor... ve **${numberEmojis[winningColor]} ${winningNumber}** sayısında duruyor!`)
            .addFields({ name: 'Sonuç', value: resultText })
            .setColor(win ? 'Green' : 'Red')
            .setFooter({ text: `${user.username} | Bahis: ${miktar.toLocaleString()}`});

        await interaction.reply({ embeds: [embed] });
    },
};
