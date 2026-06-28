const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

const diceEmojis = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('zar-at')
        .setDescription('Bot ile zar atışırsın, yüksek atan kazanır.')
        .addIntegerOption(option =>
            option.setName('miktar')
                .setDescription('Oynamak istediğiniz bahis miktarı.')
                .setRequired(true)
                .setMinValue(5)),

    async execute(interaction) {
        const user = interaction.user;
        const miktar = interaction.options.getInteger('miktar');
        const cuzdan = await db.get(`cuzdan_${user.id}`) || 0;

        if (cuzdan < miktar) {
            return interaction.reply({ content: `Yeterli paran yok! Cüzdanındaki para: **${cuzdan.toLocaleString()}**`, ephemeral: true });
        }

        const playerDie1 = Math.floor(Math.random() * 6) + 1;
        const playerDie2 = Math.floor(Math.random() * 6) + 1;
        const playerTotal = playerDie1 + playerDie2;

        const dealerDie1 = Math.floor(Math.random() * 6) + 1;
        const dealerDie2 = Math.floor(Math.random() * 6) + 1;
        const dealerTotal = dealerDie1 + dealerDie2;

        const embed = new EmbedBuilder()
            .setTitle('🎲 Zar Atma')
            .addFields(
                {
                    name: `Senin Zarların (${playerTotal})`,
                    value: `${diceEmojis[playerDie1 - 1]} + ${diceEmojis[playerDie2 - 1]}`,
                    inline: true
                },
                {
                    name: `Botun Zarları (${dealerTotal})`,
                    value: `${diceEmojis[dealerDie1 - 1]} + ${diceEmojis[dealerDie2 - 1]}`,
                    inline: true
                },
            )
            .setFooter({ text: `Bahis: ${miktar.toLocaleString()}` });

        if (playerTotal > dealerTotal) {
            await db.add(`cuzdan_${user.id}`, miktar);
            embed.setColor('Green').setDescription(`**Kazandın!** Yüksek attın ve **${miktar.toLocaleString()}** para kazandın!`);
        } else if (dealerTotal > playerTotal) {
            // .subtract() -> .sub() olarak düzeltildi
            await db.sub(`cuzdan_${user.id}`, miktar);
            embed.setColor('Red').setDescription(`**Kaybettin!** Bot daha yüksek attı ve **${miktar.toLocaleString()}** para kaybettin.`);
        } else {
            embed.setColor('Yellow').setDescription(`**Berabere!** Zarlar eşit geldi, bahsin iade edildi.`);
        }

        await interaction.reply({ embeds: [embed] });
    },
};
