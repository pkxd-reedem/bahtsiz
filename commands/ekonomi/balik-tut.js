const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const ms = require('ms');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balik-tut')
        .setDescription('Olta atıp balık tutarak para kazanırsın. (15 dakika bekleme süresi)'),
    
    async execute(interaction) {
        const user = interaction.user;
        const cooldown = 15 * 60 * 1000; // 15 dakika
        const lastFish = await db.get(`balik_cooldown_${user.id}`);

        if (lastFish !== null && cooldown - (Date.now() - lastFish) > 0) {
            const timeRemaining = ms(cooldown - (Date.now() - lastFish), { long: true });
            return interaction.reply({ content: `Balıklar biraz dinlensin! Tekrar olta atmak için **${timeRemaining}** daha beklemelisin.`, ephemeral: true });
        }

        const fishTypes = [
            { name: 'Hamsi', icon: '🐟', value: 15 },
            { name: 'Levrek', icon: '🐠', value: 30 },
            { name: 'Palamut', icon: '🐡', value: 50 },
            { name: 'Eski bir çizme', icon: '👢', value: 1 }, // Değersiz
            { name: 'Denizanası', icon: '🐙', value: 5 } // Düşük değerli
        ];
        const caught = fishTypes[Math.floor(Math.random() * fishTypes.length)];

        await db.add(`cuzdan_${user.id}`, caught.value);
        await db.set(`balik_cooldown_${user.id}`, Date.now());

        const embed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle('🎣 Olta Çekildi!')
            .setDescription(`Oltana bir **${caught.icon} ${caught.name}** takıldı!\nBunu satarak **${caught.value.toLocaleString()}** para kazandın.`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};