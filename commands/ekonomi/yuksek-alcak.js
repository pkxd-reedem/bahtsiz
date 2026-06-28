const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

// Kart destesini ve değerlerini tanımlayalım
const suits = ['♠️', '♥️', '♦️', '♣️'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// Deste oluşturma fonksiyonu
const createDeck = () => {
    const deck = [];
    for (const suit of suits) {
        for (const value of values) {
            deck.push({ suit, value });
        }
    }
    // Desteyi karıştıralım (Fisher-Yates shuffle)
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};

// Kart değerini hesaplama (As en yüksek)
const getCardValue = (card) => {
    if (card.value === 'A') return 14;
    if (card.value === 'K') return 13;
    if (card.value === 'Q') return 12;
    if (card.value === 'J') return 11;
    return parseInt(card.value);
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yuksek-alcak')
        .setDescription('Sıradaki kartın daha yüksek mi yoksa daha alçak mı olacağını tahmin et.')
        .addIntegerOption(option =>
            option.setName('miktar')
                .setDescription('Oynamak istediğiniz bahis miktarı.')
                .setRequired(true)
                .setMinValue(10)),

    async execute(interaction) {
        const user = interaction.user;
        const miktar = interaction.options.getInteger('miktar');
        const cuzdan = await db.get(`cuzdan_${user.id}`) || 0;

        if (cuzdan < miktar) {
            return interaction.reply({ content: `Yeterli paran yok! Cüzdanındaki para: **${cuzdan.toLocaleString()}**`, ephemeral: true });
        }

        // .subtract() -> .sub() olarak düzeltildi
        await db.sub(`cuzdan_${user.id}`, miktar);

        const deck = createDeck();
        const currentCard = deck.pop();
        const nextCard = deck.pop();
        const currentValue = getCardValue(currentCard);
        const nextValue = getCardValue(nextCard);

        const embed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle('🃏 Yüksek-Alçak Oyunu 🃏')
            .setDescription(`Ortadaki kart: **${currentCard.value}${currentCard.suit}**\n\nSence sıradaki kart bundan daha mı **yüksek**, yoksa daha mı **alçak** olacak?`)
            .setFooter({ text: `Bahis: ${miktar.toLocaleString()}` });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('higher').setLabel('Yüksek ⬆️').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('lower').setLabel('Alçak ⬇️').setStyle(ButtonStyle.Danger)
        );

        const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

        const collector = message.createMessageComponentCollector({ 
            filter: i => i.user.id === user.id, 
            time: 30000, // 30 saniye
            max: 1 // Sadece bir tıklama al
        });

        collector.on('collect', async i => {
            const choice = i.customId;
            let resultText = '';
            let win = false;
            let tie = false;

            if (nextValue === currentValue) {
                tie = true;
                resultText = `İnanılmaz! İki kart da aynı geldi. Bahsin iade edildi.`;
                await db.add(`cuzdan_${user.id}`, miktar);
            } else if ((choice === 'higher' && nextValue > currentValue) || (choice === 'lower' && nextValue < currentValue)) {
                win = true;
                const winAmount = miktar * 2;
                resultText = `Tebrikler, doğru tahmin! **${winAmount.toLocaleString()}** para kazandın!`;
                await db.add(`cuzdan_${user.id}`, winAmount);
            } else {
                resultText = `Yanlış tahmin! **${miktar.toLocaleString()}** para kaybettin.`;
            }
            
            const resultEmbed = new EmbedBuilder()
                .setTitle(tie ? '🤝 Berabere!' : (win ? '🎉 Kazandın!' : '😭 Kaybettin!'))
                .setColor(tie ? 'Yellow' : (win ? 'Green' : 'Red'))
                .setDescription(`Sıradaki kart **${nextCard.value}${nextCard.suit}** geldi.\n\n${resultText}`)
                .addFields(
                    { name: 'Önceki Kart', value: `**${currentCard.value}${currentCard.suit}** (Değer: ${currentValue})`, inline: true },
                    { name: 'Yeni Kart', value: `**${nextCard.value}${nextCard.suit}** (Değer: ${nextValue})`, inline: true },
                )
                .setFooter({ text: `${user.username}` });
            
            await i.update({ embeds: [resultEmbed], components: [] }); // Butonları kaldır
        });

        collector.on('end', async (collected) => {
            if (collected.size === 0) {
                await db.add(`cuzdan_${user.id}`, miktar); // Bahsi iade et
                await interaction.editReply({
                    content: 'Süre dolduğu için oyun iptal edildi ve bahsin iade edildi.',
                    embeds: [],
                    components: []
                });
            }
        });
    },
};
