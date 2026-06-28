const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const ms = require('ms');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('suc-isle')
        .setDescription('Risk alarak para kazanmaya çalışırsın. Dikkatli ol, yakalanabilirsin!'),

    async execute(interaction) {
        const user = interaction.user;
        const cooldown = 300000; // 5 dakika (300,000 ms)
        const lastCrime = await db.get(`suc_cooldown_${user.id}`);

        if (lastCrime && (Date.now() - lastCrime < cooldown)) {
            const timeLeft = ms(cooldown - (Date.now() - lastCrime), { long: true });
            return interaction.reply({ content: `Tekrar suç işlemek için **${timeLeft}** beklemen gerekiyor.`, ephemeral: true });
        }

        const successChance = 0.60; // %60 başarı şansı
        const random = Math.random();

        let embed;

        if (random < successChance) {
            // Başarılı
            const amount = Math.floor(Math.random() * 1501) + 500; // 500 ile 2000 arası
            await db.add(`cuzdan_${user.id}`, amount);
            await db.set(`suc_cooldown_${user.id}`, Date.now());

            const successMessages = [
                `Sessizce bir bankayı soydun ve **${amount.toLocaleString()}** para ile kaçtın! 🏦`,
                `Usta bir hacker gibi davranarak bir şirketin hesabından **${amount.toLocaleString()}** para aktardın! 💻`,
                `Nadir bir mücevheri çalıp karaborsada **${amount.toLocaleString()}** paraya sattın! 💎`,
                `Bir sanat galerisinden değerli bir tabloyu kimse fark etmeden aşırdın ve **${amount.toLocaleString()}** kazandın! 🖼️`
            ];
            const message = successMessages[Math.floor(Math.random() * successMessages.length)];

            embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('✅ Başarılı Operasyon!')
                .setDescription(message);

        } else {
            // Başarısız
            const fine = Math.floor(Math.random() * 501) + 250; // 250 ile 750 arası ceza
            const currentBalance = await db.get(`cuzdan_${user.id}`) || 0;
            const finalFine = Math.min(fine, currentBalance); // Cüzdandaki paradan fazla ceza kesme
            
            // .subtract() -> .sub() olarak düzeltildi
            await db.sub(`cuzdan_${user.id}`, finalFine);
            await db.set(`suc_cooldown_${user.id}`, Date.now());

            const failMessages = [
                `Tam kaçarken alarm çaldı ve polisler seni enselendi! **${finalFine.toLocaleString()}** para ceza ödedin. 👮`,
                `Soygun sırasında acemi bir hata yaptın ve yakalandın. **${finalFine.toLocaleString()}** para kaybettin. 🤦`,
                `Satmaya çalıştığın çalıntı malların sahte olduğu ortaya çıktı. Üstüne bir de **${finalFine.toLocaleString()}** para ceza yedin. 👎`,
                `Kaçış arabanın lastiği patladı ve yolda kaldın. Sonuç: **${finalFine.toLocaleString()}** para ceza. 🚗`
            ];
            const message = failMessages[Math.floor(Math.random() * failMessages.length)];

            embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('❌ Yakalandın!')
                .setDescription(message);
        }

        await interaction.reply({ embeds: [embed] });
    },
};
