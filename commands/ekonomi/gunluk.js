const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const ms = require('ms');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gunluk')
        .setDescription('24 saatte bir günlük para ödülünüzü alırsınız.'),
    
    async execute(interaction) {
        const user = interaction.user;
        const cooldown = 24 * 60 * 60 * 1000; // 24 saat (milisaniye cinsinden)
        const lastDaily = await db.get(`gunluk_cooldown_${user.id}`);

        if (lastDaily !== null && cooldown - (Date.now() - lastDaily) > 0) {
            const timeRemaining = ms(cooldown - (Date.now() - lastDaily), { long: true });
            return interaction.reply({ content: `Tekrar günlük ödül alabilmek için **${timeRemaining}** daha beklemelisin.`, ephemeral: true });
        }

        const reward = Math.floor(Math.random() * (500 - 100 + 1)) + 100; // 100 ile 500 arası rastgele ödül

        await db.add(`cuzdan_${user.id}`, reward);
        await db.set(`gunluk_cooldown_${user.id}`, Date.now());

        const embed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('💰 Günlük Ödül!')
            .setDescription(`Günlük ödül olarak **${reward.toLocaleString()}** para kazandın! Cüzdanına eklendi.`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};