const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('para-yatir')
        .setDescription('Cüzdanınızdaki parayı bankaya yatırırsınız.')
        .addStringOption(option =>
            option.setName('miktar')
                .setDescription('Yatırmak istediğiniz miktar (veya "hepsi").')
                .setRequired(true)),

    async execute(interaction) {
        const user = interaction.user;
        const miktarInput = interaction.options.getString('miktar');
        const cuzdan = await db.get(`cuzdan_${user.id}`) || 0;

        let miktar;
        if (miktarInput.toLowerCase() === 'hepsi') {
            miktar = cuzdan;
        } else {
            miktar = parseInt(miktarInput);
            if (isNaN(miktar) || miktar <= 0) {
                return interaction.reply({ content: 'Lütfen geçerli bir sayı girin.', ephemeral: true });
            }
        }

        if (cuzdan < miktar) {
            return interaction.reply({ content: `Cüzdanında o kadar para yok! Olan para: **${cuzdan.toLocaleString()}**`, ephemeral: true });
        }

        await db.subtract(`cuzdan_${user.id}`, miktar);
        await db.add(`banka_${user.id}`, miktar);

        const embed = new EmbedBuilder()
            .setColor('DarkBlue')
            .setTitle('🏦 Banka İşlemi Başarılı')
            .setDescription(`**${miktar.toLocaleString()}** para bankaya yatırıldı.`)
            .addFields(
                { name: 'Yeni Cüzdan Bakiyesi', value: `${(cuzdan - miktar).toLocaleString()}` },
                { name: 'Yeni Banka Bakiyesi', value: `${(await db.get(`banka_${user.id}`)).toLocaleString()}` }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};