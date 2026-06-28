const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const ms = require('ms');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('calis')
        .setDescription('Çalışarak para kazanırsın. (1 saat bekleme süresi)'),
    
    async execute(interaction) {
        const user = interaction.user;
        const cooldown = 60 * 60 * 1000; // 1 saat
        const lastWork = await db.get(`calis_cooldown_${user.id}`);

        if (lastWork !== null && cooldown - (Date.now() - lastWork) > 0) {
            const timeRemaining = ms(cooldown - (Date.now() - lastWork), { long: true });
            return interaction.reply({ content: `Dinlenme zamanı! Tekrar çalışabilmek için **${timeRemaining}** daha beklemelisin.`, ephemeral: true });
        }

        const jobs = ["Yazılımcı", "Garson", "Taksici", "Aşçı", "Doktor", "Öğretmen"];
        const job = jobs[Math.floor(Math.random() * jobs.length)];
        const earnings = Math.floor(Math.random() * (300 - 50 + 1)) + 50; // 50-300 arası

        await db.add(`cuzdan_${user.id}`, earnings);
        await db.set(`calis_cooldown_${user.id}`, Date.now());

        const embed = new EmbedBuilder()
            .setColor('Orange')
            .setTitle('💼 İş Günü Tamamlandı!')
            .setDescription(`**${job}** olarak çalıştın ve **${earnings.toLocaleString()}** para kazandın!`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};