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
    return deck;
};

// Kart değerini hesaplama fonksiyonu
const getCardValue = (card) => {
    if (['J', 'Q', 'K'].includes(card.value)) {
        return 10;
    }
    if (card.value === 'A') {
        return 11; // 'As' başlangıçta 11, gerekirse 1'e düşürülecek
    }
    return parseInt(card.value);
};

// Elin toplam değerini hesaplama fonksiyonu
const getHandValue = (hand) => {
    let value = 0;
    let aceCount = 0;
    for (const card of hand) {
        value += getCardValue(card);
        if (card.value === 'A') {
            aceCount++;
        }
    }
    // Eğer toplam değer 21'i aşarsa ve elde As varsa, As'ı 1 olarak say
    while (value > 21 && aceCount > 0) {
        value -= 10;
        aceCount--;
    }
    return value;
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blackjack')
        .setDescription('Blackjack (21) oyunu oynarsın.')
        .addIntegerOption(option =>
            option.setName('miktar')
                .setDescription('Oynamak istediğiniz bahis miktarı.')
                .setRequired(true)
                .setMinValue(10)), // Minimum bahis
    
    async execute(interaction) {
        const user = interaction.user;
        const miktar = interaction.options.getInteger('miktar');
        const cuzdan = await db.get(`cuzdan_${user.id}`) || 0;

        if (cuzdan < miktar) {
            return interaction.reply({ content: `Yeterli paran yok! Cüzdanındaki para: **${cuzdan.toLocaleString()}**`, ephemeral: true });
        }

        // Oyunu başlat ve parayı hesaptan düş -> .subtract() -> .sub() olarak düzeltildi
        await db.sub(`cuzdan_${user.id}`, miktar);

        let deck = createDeck();
        // Desteyi karıştıralım (Fisher-Yates shuffle)
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        let playerHand = [deck.pop(), deck.pop()];
        let dealerHand = [deck.pop(), deck.pop()];
        
        let playerValue = getHandValue(playerHand);
        let dealerValue = getHandValue(dealerHand);

        const createEmbed = (showDealerCard = false, gameEnded = false, resultText = '') => {
            const playerHandString = playerHand.map(c => `**${c.value}${c.suit}**`).join(', ');
            const dealerHandString = showDealerCard 
                ? dealerHand.map(c => `**${c.value}${c.suit}**`).join(', ')
                : `**${dealerHand[0].value}${dealerHand[0].suit}**, **?**`;

            const embed = new EmbedBuilder()
                .setColor(gameEnded ? (resultText.includes('Kazandın') ? 'Green' : 'Red') : 'Blue')
                .setTitle('🃏 Blackjack Masası')
                .addFields(
                    { name: `Senin Elin (${getHandValue(playerHand)})`, value: playerHandString, inline: true },
                    { name: `Botun Eli (${showDealerCard ? getHandValue(dealerHand) : '?'})`, value: dealerHandString, inline: true }
                )
                .setFooter({ text: `Bahis: ${miktar.toLocaleString()}` });

            if (gameEnded) {
                embed.setDescription(`**${resultText}**`);
            }

            return embed;
        };

        const createButtons = (gameEnded = false) => {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('hit')
                    .setLabel('Kart Çek')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(gameEnded),
                new ButtonBuilder()
                    .setCustomId('stand')
                    .setLabel('Dur')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(gameEnded)
            );
        };
        
        // Oyuncu anında Blackjack yaparsa
        if (playerValue === 21) {
            const winAmount = Math.floor(miktar * 2.5); // Blackjack bonusu
            await db.add(`cuzdan_${user.id}`, winAmount);
            const finalEmbed = createEmbed(true, true, `BLACKJACK! 👑 Anında kazandın ve ${winAmount.toLocaleString()} para aldın!`);
            return interaction.reply({ embeds: [finalEmbed], components: [createButtons(true)] });
        }


        const message = await interaction.reply({ 
            embeds: [createEmbed()], 
            components: [createButtons()],
            fetchReply: true 
        });

        const collector = message.createMessageComponentCollector({ 
            filter: i => i.user.id === user.id, 
            time: 60000 // 60 saniye
        });

        collector.on('collect', async i => {
            await i.deferUpdate();

            if (i.customId === 'hit') {
                playerHand.push(deck.pop());
                playerValue = getHandValue(playerHand);

                if (playerValue > 21) { // Oyuncu bust oldu
                    collector.stop();
                    const finalEmbed = createEmbed(true, true, `Kaybettin! 😭 Elin 21'i geçti ve ${miktar.toLocaleString()} para kaybettin.`);
                    await i.editReply({ embeds: [finalEmbed], components: [createButtons(true)] });
                    return;
                }
                
                await i.editReply({ embeds: [createEmbed()], components: [createButtons(playerValue === 21)] });
                 if (playerValue === 21) {
                    collector.stop('stand'); // Otomatik olarak dur
                }


            } else if (i.customId === 'stand') {
                collector.stop(); // Oyuncunun sırası bitti
            }
        });

        collector.on('end', async (collected, reason) => {
            // Zaman aşımı veya manuel durdurma sonrası
            if (reason === 'time') {
                 await db.add(`cuzdan_${user.id}`, miktar); // Bahsi iade et
                 await interaction.editReply({ content: 'Zaman aşımı! Bahsin iade edildi.', embeds: [], components: []});
                 return;
            }
             if (playerValue > 21) return; // Zaten kaybettiyse bir şey yapma


            // Botun sırası
            while (getHandValue(dealerHand) < 17) {
                dealerHand.push(deck.pop());
            }

            dealerValue = getHandValue(dealerHand);
            playerValue = getHandValue(playerHand);

            let resultText = '';
            
            if (dealerValue > 21 || playerValue > dealerValue) {
                const winAmount = miktar * 2;
                await db.add(`cuzdan_${user.id}`, winAmount);
                resultText = `Kazandın! 🎉 ${winAmount.toLocaleString()} para hesabına geçti.`;
            } else if (dealerValue === playerValue) {
                 await db.add(`cuzdan_${user.id}`, miktar);
                 resultText = `Berabere! 🤝 Bahsin iade edildi.`;
            } else {
                resultText = `Kaybettin! 😭 Bot kazandı ve ${miktar.toLocaleString()} para kaybettin.`;
            }
            
            const finalEmbed = createEmbed(true, true, resultText);
            await interaction.editReply({ embeds: [finalEmbed], components: [createButtons(true)] });
        });
    },
};
