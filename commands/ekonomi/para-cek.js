const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('para-cek')
        .setDescription('Bankadan cüzdanınıza para çekersiniz.')
        .addStringOption(option =>
            option.setName('miktar')
                .setDescription('Çekmek istediğiniz miktar (veya "hepsi").')
                .setRequired(true)),

    async execute(interaction) {
        const user = interaction.user;
        const miktarInput = interaction.options.getString('miktar');
        const banka = await db.get(`banka_${user.id}`) || 0;

        let miktar;
        if (miktarInput.toLowerCase() === 'hepsi') {
            miktar = banka;
        } else {
            miktar = parseInt(miktarInput);
            if (isNaN(miktar) || miktar <= 0) {
                return interaction.reply({ content: 'Lütfen geçerli bir sayı girin.', ephemeral: true });
            }
        }

        if (banka < miktar) {
            return interaction.reply({ content: `Bankada o kadar para yok! Olan para: **${banka.toLocaleString()}**`, ephemeral: true });
        }

        await db.subtract(`banka_${user.id}`, miktar);
        await db.add(`cuzdan_${user.id}`, miktar);

        const embed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle('💸 Banka İşlemi Başarılı')
            .setDescription(`**${miktar.toLocaleString()}** para bankadan çekildi.`)
            .addFields(
                { name: 'Yeni Cüzdan Bakiyesi', value: `${(await db.get(`cuzdan_${user.id}`)).toLocaleString()}` },
                { name: 'Yeni Banka Bakiyesi', value: `${(banka - miktar).toLocaleString()}` }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};