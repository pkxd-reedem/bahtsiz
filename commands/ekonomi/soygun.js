const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const ms = require('ms');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('soygun')
        .setDescription('Başka bir kullanıcıdan para çalmayı denersiniz. Dikkat, yakalanabilirsin!')
        .addUserOption(option =>
            option.setName('hedef')
                .setDescription('Soymak istediğiniz kişi.')
                .setRequired(true)),

    async execute(interaction) {
        const robber = interaction.user;
        const victim = interaction.options.getUser('hedef');
        const cooldown = 5 * 60 * 1000; // 5 dakika

        const lastRob = await db.get(`soygun_cooldown_${robber.id}`);
        if (lastRob !== null && cooldown - (Date.now() - lastRob) > 0) {
            const timeRemaining = ms(cooldown - (Date.now() - lastRob), { long: true });
            return interaction.reply({ content: `Biraz dinlenmelisin. Tekrar soygun yapabilmek için **${timeRemaining}** daha beklemelisin.`, ephemeral: true });
        }

        if (victim.bot || victim.id === robber.id) {
            return interaction.reply({ content: 'Geçerli bir hedef seçmelisin.', ephemeral: true });
        }

        const victimBalance = await db.get(`cuzdan_${victim.id}`) || 0;
        if (victimBalance < 100) {
            return interaction.reply({ content: 'Bu kişinin cüzdanında çalınmaya değer bir şey yok (En az 100 para olmalı).', ephemeral: true });
        }

        await db.set(`soygun_cooldown_${robber.id}`, Date.now());

        const successChance = 0.40; // %40 başarı şansı
        const isSuccess = Math.random() < successChance;

        if (isSuccess) {
            const stolenAmount = Math.floor(victimBalance * (Math.random() * 0.3 + 0.1)); // %10 ila %40 arası çal
            await db.add(`cuzdan_${robber.id}`, stolenAmount);
            await db.subtract(`cuzdan_${victim.id}`, stolenAmount);
            
            const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('✅ Başarılı Soygun!')
                .setDescription(`Sessizce **${victim.username}** adlı kullanıcının cüzdanından **${stolenAmount.toLocaleString()}** para çaldın!`);
            await interaction.reply({ embeds: [embed] });

        } else {
            const fine = Math.floor((await db.get(`cuzdan_${robber.id}`) || 0) * 0.2); // Yakalanma cezası, cüzdanın %20'si
            await db.subtract(`cuzdan_${robber.id}`, fine);

            const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('🚨 YAKALANDIN!')
                .setDescription(`**${victim.username}** adlı kullanıcıyı soymaya çalışırken yakalandın ve **${fine.toLocaleString()}** para cezası ödedin!`);
            await interaction.reply({ embeds: [embed] });
        }
    },
};