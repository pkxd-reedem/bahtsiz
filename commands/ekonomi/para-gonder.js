const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('para-gonder')
        .setDescription('Başka bir kullanıcıya para gönderirsiniz.')
        .addUserOption(option =>
            option.setName('hedef')
                .setDescription('Para göndermek istediğiniz kullanıcı.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('miktar')
                .setDescription('Göndermek istediğiniz miktar.')
                .setRequired(true)
                .setMinValue(1)),

    async execute(interaction) {
        const sender = interaction.user;
        const receiver = interaction.options.getUser('hedef');
        const miktar = interaction.options.getInteger('miktar');

        if (receiver.bot) {
            return interaction.reply({ content: 'Botlara para gönderemezsin!', ephemeral: true });
        }
        if (sender.id === receiver.id) {
            return interaction.reply({ content: 'Kendine para gönderemezsin!', ephemeral: true });
        }

        const senderBalance = await db.get(`cuzdan_${sender.id}`) || 0;

        if (senderBalance < miktar) {
            return interaction.reply({ content: `Yeterli paran yok! Cüzdanındaki para: **${senderBalance.toLocaleString()}**`, ephemeral: true });
        }

        await db.subtract(`cuzdan_${sender.id}`, miktar);
        await db.add(`cuzdan_${receiver.id}`, miktar);

        const embed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle('💸 Para Transferi Başarılı')
            .setDescription(`**${receiver.username}** adlı kullanıcıya **${miktar.toLocaleString()}** para gönderdin.`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};